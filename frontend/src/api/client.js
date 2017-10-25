import { Methods } from './common';
import { setDifference } from '../util/setOperations';

const validSpecProperties = new Set([
  'path', 'method', 'send', 'receive', 'expectStatus',
]);

class ApiClient {
  constructor(baseUrl = '/apis/') {
    this._baseUrl = baseUrl;
    this._baseHeaders = new Headers();
    this._baseHeaders.append('Accept', 'application/json');
    this.fetchFromSpec = this.fetchFromSpec.bind(this);
    this._createFetchArgs = this._createFetchArgs.bind(this);
    this._doFetchDecodingJSON = this._doFetchDecodingJSON.bind(this);
  }

  /*
   *  Perform an API call and return a Promise that resolves to the
   *  processed JSON response body (if the spec provides it) or null.
   *
   *  Input argument is a RequestProcessingSpec object, with the following
   *  properties:
   * 
   *  `RequestProcessingSpec.path` (array of strings):
   *      Components of the URL path relative to base API endpoint.
   *      `['foo', 'bar']` will result in a request to '/apis/foo/bar'
   *      assuming baseUrl is set to the default.
   *
   *  `RequestProcessingSpec.method` (string):
   *      The HTTP method, an enum member of `Methods` from './common'.
   *
   *  `RequestProcessingSpec.send` (object):
   *      JSON-serializable object used to create request body, forbidden
   *      with GET and DELETE, required with POST and PUT.
   * 
   *  `RequestProcessingSpec.receive` (function (jsonObject) => domainObject):
   *      The response's JSON content will be hit with this in order to
   *      produce the returned Promise's resolving value. Should be a pure
   *      function. Can be null, in that case the response body will be
   *      ignored (and the returned Promise will resolve to null).
   *
   *  `RequestProcessingSpec.expectStatus` (integral number):
   *      The expected HTTP status code for the response. Optional, defaults
   *      to 200.
   * 
   */
  fetchFromSpec(processingSpec) {
    const unknownSpecProps = setDifference(
      new Set(Object.keys(processingSpec)),
      validSpecProperties
    );
    if (unknownSpecProps.size > 0) {
      const unknowns = Array.from(unknownSpecProps).join(', ');
      throw new TypeError(
        `Input RequestProcessingSpec has unknown properties: ${ unknowns }`
      );
    }

    const fetchArgs = this._createFetchArgs(processingSpec);

    if (
        processingSpec.receive !== null
        && typeof processingSpec.receive !== 'function'
    ) {
      throw new TypeError(
        'RequestProcessingSpec.receive must be null or a function but got '
        + typeof processingSpec.receive
      );
    }

    let expectedStatus =
      typeof processingSpec.expectStatus === 'undefined'
      ? 200
      : processingSpec.expectStatus;
    if ( ! isValidHttpStatusCode(expectedStatus) ) {
      throw new TypeError(`Invalid expectStatus "${ expectedStatus }"`);
    }

    function addResponseCheckers(responsePromise) {
      // TODO: Check for other errors
      return responsePromise.then(response => {
        if (response.status !== expectedStatus) {
          return Promise.reject(new Error(
            `Expected response code ${ expectedStatus } `
            + `but received ${ response.status }`
          ));
        } else {
          return response;
        }
      });
    }

    function addResponseProcessors(responsePromise) {
      if (processingSpec.receive === null) {
        return responsePromise.then(ignored => null);
      } else {
        // TODO: Add a check for the response structure having the
        //       correct shape.
        return responsePromise
          .then(response => response.json())
          .then(responseStructure => responseStructure.data)
          .then(processingSpec.receive);
      }
    }

    return this._doFetchDecodingJSON(
      processingSpec, fetchArgs, addResponseCheckers, addResponseProcessors);
  }

  _createFetchArgs(spec) {
    if ( ! Array.isArray(spec.path) ) {
      throw new TypeError(
        'RequestProcessingSpec.path must be an array but got '
        + typeof spec.path
      );
    }
    const url = this._baseUrl + spec.path.join('/');
    const init = {
      method: spec.method,
      headers: new Headers(this._baseHeaders),
    };
    if (spec.method === Methods.POST || spec.method === Methods.PUT) {
      if (typeof spec.send === 'undefined') {
        throw new TypeError(
          'RequestProcessingSpec.send required for POST or PUT');
      } else if (Object.getPrototypeOf(spec.send) !== Object.prototype) {
        throw new TypeError(
          'RequestProcessingSpec.send must be a plain object for POST or PUT'
        );
      }
      init.body = JSON.stringify(spec.send);
      init.headers.append('Content-Type', 'application/json');
    } else if (spec.method === Methods.GET || spec.method === Methods.DELETE) {
      if (typeof spec.send !== 'undefined') {
        throw new TypeError(
          'A body (RequestProcessingSpec.send) with GET or DELETE '
          + `is not supported (got "${ spec.send }")`);
      }
    } else {
        throw new TypeError(
          `RequestProcessingSpec.method value "${ spec.method }" is invalid`);
    }
    return [ url, init ];
  }

  // This is a method for stubbing in tests.
  _doFetchDecodingJSON(
      spec, fetchArgs, addResponseCheckers, addResponseProcessors
  ) {
    let p = fetch( ...fetchArgs );
    p = addResponseCheckers(p);
    p = addResponseProcessors(p);
    return p;
  }
}

function isValidHttpStatusCode(code) {
  return (
    typeof code === 'number'
    && Math.floor(code) === code
    && code >= 200
    && code < 600
  );
}

export default new ApiClient();
