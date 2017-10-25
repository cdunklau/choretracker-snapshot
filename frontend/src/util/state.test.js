import {
  composeMappableReducers, symmetricStateMapSpec, composeReducers
} from './state';

describe('The reducer returned by composeMappableReducers', () => {

  it('returns initialState directly in the trivial case', () => {
    const initialState = {};
    const reducer = composeMappableReducers([], initialState);
    expect(reducer()).toBe(initialState);
  });

  it('returns initialState directly if all the subreducers do', () => {
    const initialState = {};
    const reducer = composeMappableReducers([
      { from: null, via: (state, action) => state, to: null },
      symmetricStateMapSpec(null, (state, action) => state),
    ], initialState);
    expect(reducer()).toBe(initialState);
  });

  it('rejects specs with "from" without "to"', () => {
    function whateverReducer(whatever, action) { return whatever; }
    const badSpecs = [
      { from: 'foo', via: whateverReducer },
      { from: 'foo', via: whateverReducer, to: null },
      { from: 'foo', via: whateverReducer, to: undefined },
    ];
    badSpecs.forEach(spec => {
      expect(() => { composeMappableReducers([ spec ], {}) })
        .toThrow(
          'Invalid mapSpec at index 0: must provide "to" if "from" is defined'
        );
    });
  });

  it('rejects specs without a "via" function', () => {
    const badSpecs = [
      { from: 'foo', to: 'foo' },
      { from: null, to: null },
      { from: 'foo', to: 'foo' },
      { from: null, to: null },
    ];
    badSpecs.forEach(spec => {
      expect(() => {
        composeMappableReducers([ spec ], {});
      }).toThrow(/property "via" is not a function/);
    });
  });

  it('properly applies specific-key input/output reducers', () => {
    const initialState = { adding: 0, doubling: 1 };
    const addAction = { type: 'add' };
    const doubleAction = { type: 'double' };
    const bothAction = { type: 'both' };
    function addReducer(number, action) {
      if (action.type === 'add' || action.type === 'both') {
        return number + 1;
      } else {
        return number;
      }
    }
    function doubleReducer(number, action) {
      if (action.type === 'double' || action.type === 'both') {
        return number * 2;
      } else {
        return number;
      }
    }
    const reducer = composeMappableReducers([
      symmetricStateMapSpec('adding', addReducer),
      symmetricStateMapSpec('doubling', doubleReducer),
    ], initialState);
    const firstResult = reducer(undefined, addAction);
    expect(firstResult).toEqual({ adding: 1, doubling: 1 });
    const secondResult = reducer(firstResult, doubleAction);
    expect(secondResult).toEqual({ adding: 1, doubling: 2 });
    const thirdResult = reducer(secondResult, bothAction);
    expect(thirdResult).toEqual({ adding: 2, doubling: 4 });
  });

  it('properly applies specific-key output reducers', () => {
    const initialState = { first: 0, second: 0, result: 0 };
    function createSetAction(firstValue, secondValue) {
      return { type: 'set', payload: [ firstValue, secondValue ] };
    }
    const addAction = { type: 'add' };
    const subtractAction = { type: 'subtract' };
    function setReducer(state, action) {
      if (action.type === 'set') {
        const [ firstValue, secondValue ] = action.payload;
        return { ...state, first: firstValue, second: secondValue };
      } else {
        return state;
      }
    }
    // This is the specific-key output reducer
    function calcResultReducer(state, action) {
      switch (action.type) {
        case 'add':
          return state.first + state.second;
        case 'subtract':
          return state.first - state.second;
        default:
          return state.result;
      }
    }
    const reducer = composeMappableReducers([
      symmetricStateMapSpec(null, setReducer),
      { from: null, via: calcResultReducer, to: 'result' },
    ], initialState);

    const actionsAndExpectedResultStates = [
      [ createSetAction(1, 2), { first: 1, second: 2, result: 0 } ],
      [ addAction, { first: 1, second: 2, result: 3 } ],
      [ subtractAction, { first: 1, second: 2, result: -1 } ],
    ];

    let lastState = initialState;
    for (const [ action, expectedResult ] of actionsAndExpectedResultStates) {
      const result = reducer(lastState, action);
      expect(result).toEqual(expectedResult);
      lastState = result;
    }
  });

  it('chains state updates in order for whole-state reducers', () => {
    const initialState = { letters: []};
    function makeLetterAppenderReducer(letter) {
      return (state, action) => ({ letters: [ ...state.letters, letter ] });
    }
    let reducer = composeMappableReducers([
      symmetricStateMapSpec(null, makeLetterAppenderReducer('a')),
      symmetricStateMapSpec(null, makeLetterAppenderReducer('b')),
      symmetricStateMapSpec(null, makeLetterAppenderReducer('c')),
    ], initialState);

    expect(reducer()).toEqual({ letters: ['a', 'b', 'c'] });
    expect(reducer(reducer())).toEqual({
      letters: ['a', 'b', 'c', 'a', 'b', 'c']
    });
  });

  it('chains state updates in order for specific-key reducers', () => {
    const initialState = { numbers: [] };
    function makeAppenderReducer(value) {
      return (values, action) => [ ...values, value ];
    }
    let reducer = composeMappableReducers([
      symmetricStateMapSpec('numbers', makeAppenderReducer(1)),
      symmetricStateMapSpec('numbers', makeAppenderReducer(2)),
      symmetricStateMapSpec('numbers', makeAppenderReducer(3)),
    ], initialState);

    expect(reducer()).toEqual({ numbers: [1, 2, 3] });
    expect(reducer(reducer())).toEqual({ numbers: [1, 2, 3, 1, 2, 3] });
  });

});

describe('symmetricStateMapSpec', () => {
  it('requires stateKey to be a string, null, or undefined', () => {
    const reducer = (state, action) => ({});
    [(() => null), {}, /regexp/].forEach(badStateKey => {
      expect(() => {
        symmetricStateMapSpec(badStateKey, reducer);
      }).toThrow('stateKey must be a string, null, or undefined');
    });
  });

  it('requires viaReducer to be a function', () => {
    expect(() => {
      symmetricStateMapSpec('foo', 'badViaReducer');
    }).toThrow('viaReducer is not a function');
  });
});
