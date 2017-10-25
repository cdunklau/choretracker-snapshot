import client from './client';

import {
  patchApiClient, unpatchApiClient,
  ensureApiClientPatched, ensureApiClientUnpatched,
  resetPatchDB
} from '../testutils/monkeypatchApiClient';

afterAll(() => {
  ensureApiClientUnpatched();
});

describe('fetchFromSpec requires', () => {
  beforeEach(() => {
    ensureApiClientPatched();
  });

  function expectSpecToThrow(spec, argForToThrow) {
    return expect(() => client.fetchFromSpec(spec)).toThrow(argForToThrow);
  }

  it('spec.path to be an array', () => {
    expectSpecToThrow(
      { path: 'not an array' },
      'RequestProcessingSpec.path must be an array but got string'
    );
  });

  it('spec.method to be one of the four supported HTTP methods', () => {
    ['OPTIONS', 'HEAD', 'PATCH'].forEach(method => {
      expectSpecToThrow(
        { path: [], method: method },
        `RequestProcessingSpec.method value "${ method }" is invalid`
      );
    });
  });

  it('spec.send to be a plain object for POST or PUT', () => {
    ['PUT', 'POST'].forEach(method => {
      const spec = { path: [], method: method, send: undefined };
      expectSpecToThrow(
        spec,
        'RequestProcessingSpec.send required for POST or PUT'
      );
      [ ['an array'], 1, 'a string', /a regexp/ ].forEach(badSendValue => {
        expectSpecToThrow(
          { ...spec, send: badSendValue },
          'RequestProcessingSpec.send must be a plain object for POST or PUT'
        );
      });
    });
  });

  it('spec.send to be undefined for GET and DELETE', () => {
    ['GET', 'DELETE'].forEach(method => {
      expectSpecToThrow(
        { path: [], method: method, send: {} },
        'A body (RequestProcessingSpec.send) with GET or DELETE '
        + 'is not supported (got "[object Object]")'
      );
    });
  });

  it('spec.receive to be either null or a function', () => {
    [ 'not a function', [], {} ].forEach(badReceive => {
      expectSpecToThrow(
        { path: [], method: 'GET', receive: badReceive },
        'RequestProcessingSpec.receive must be null or a function but got '
        + typeof badReceive
      );
    });
  });

  it('spec.expectStatus to be an int within the range of normal HTTP codes', () => {
    [ 0, 1, 199, 600, 601, 1000, 200.1, '200' ].forEach(badExpectStatus => {
      expectSpecToThrow(
        { path: [], method: 'GET', receive: null, expectStatus: badExpectStatus },
        `Invalid expectStatus "${ badExpectStatus }"`
      );
    });
  });

  it('all keys in spec to be known', () => {
    expectSpecToThrow(
      { path: [], method: 'GET', receive: null, unknownProp: 1 },
      `Input RequestProcessingSpec has unknown properties: unknownProp`
    );
  });
});

describe('fetchFromSpec', () => {
  beforeAll(() => {
    // Remove the _doFetchDecodingJSON stub so we can actually test the full
    // request/response processing (using the fetch mock).
    ensureApiClientUnpatched();
  });

  afterAll(() => {
    ensureApiClientPatched();
  });

  beforeEach(() => {
    fetch.resetMocks();
  });

  function passthrough(value) {
    return value;
  };

  function getSingleFetchMockCallArgs() {
    expect(fetch).toHaveBeenCalledTimes(1);
    const call = fetch.mock.calls[0];
    expect(call.length).toBe(2);
    return call;
  };

  it('joins the path components into a url starting with /apis/', () => {
    const spec = { path: ['tasks', '1'], method: 'GET', receive: null };
    fetch.mockResponse('', { status: 200 });
    return client.fetchFromSpec(spec).then(() => {
      const [ url, fetchInit ] = getSingleFetchMockCallArgs();
      expect(url).toEqual('/apis/tasks/1');
    });
  });

  it('does not attempt to decode the response body if `receive` is null', () => {
    const spec = { path: [], method: 'GET', receive: null };
    fetch.mockResponse('clearly not json', { status: 200 });
    return client.fetchFromSpec(spec).then(resolvedValue => {
      expect(resolvedValue).toBe(null);
    });
  });

  it('decodes the response body if `receive` is a function', () => {
    const spec = { path: [], method: 'GET', receive: passthrough };
    fetch.mockResponse('{"data":{"prop":"value"}}', { status: 200 });
    return client.fetchFromSpec(spec).then(decoded => {
      expect(decoded).toEqual({ prop: 'value' });
    });
  });

  it('uses the `receive` function to process the response body', () => {
    function removeProp(jsonStructure) {
      const { prop: omit, ...rest } = jsonStructure;
      return rest;
    }
    const spec = { path: [], method: 'GET', receive: removeProp };
    fetch.mockResponse(
      '{"data":{"prop":"should be omitted","other":"retained"}}',
      { status: 200 }
    );
    return client.fetchFromSpec(spec).then(decoded => {
      expect(decoded).toEqual({ other: 'retained' });
    });
  });

  it('expects the response code to be 200 if no expectStatus is given', () => {
    const spec = { path: [], method: 'GET', receive: null };
    const promises = [201, 400, 401, 403, 500, 501].map(responseStatus => {
      fetch.mockResponse('', { status: responseStatus });
      return client.fetchFromSpec(spec).catch(error => {
        expect(error.message).toEqual(
          `Expected response code 200 but received ${ responseStatus }`
        );
      });
    });
  });

  it('ensures the response code is equal to `expectStatus`', () => {
    const spec = { path: [], method: 'GET', receive: null, expectStatus: 201 };
    const promises = [200, 400, 401, 403, 500, 501].map(responseStatus => {
      fetch.mockResponse('', { status: responseStatus });
      return client.fetchFromSpec(spec).catch(error => {
        expect(error.message).toEqual(
          `Expected response code 201 but received ${ responseStatus }`
        );
      });
    });
    return Promise.all(promises);
  });

  ['POST', 'PUT'].forEach(method => {
    it(`sends ${ method } with the provided structure and JSON header`, () => {
      fetch.mockResponse('', { status: 200 });
      const data = { foo: 1 };
      const spec = { path: [], method: method, send: data, receive: null };
      return client.fetchFromSpec(spec).then(() => {
        const [ url, requestInit ] = getSingleFetchMockCallArgs();
        const requestContentType = requestInit.headers.get('Content-Type');
        expect(requestContentType).toEqual('application/json');
        const requestBody = requestInit.body;
        expect(requestBody).toEqual('{"foo":1}');
      });
    });
  });
});
