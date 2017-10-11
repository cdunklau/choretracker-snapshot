import { shallowCloneReplacing } from './transform';

/*
 * Create a reducer from an array of "StateMapSpec" objects and the initial
 * state object.
 *
 * This functionality is a superset of redux.combineReducers:
 *
 *    combineReducers({ foo: fooReducer, bar: barReducer})
 *
 * is equivalent to:
 *
 *    combineMappableReducers([
 *      {from: 'foo', via: fooReducer, to: 'foo'},
 *      {from: 'bar', via: barReducer, to: 'bar'},
 *    ], { foo: [], bar: {} })
 *
 * ...except that combineReducers doesn't deal with initial state.
 *
 * Using the helper, the above can be simplified to:
 *
 *    combineMappableReducers([
 *      symmetricStateMapSpec('foo', fooReducer),
 *      symmetricStateMapSpec('bar', barReducer),
 *    ], { foo: [], bar: {} })
 *
 * A StateMapSpec is an object containing at least a "via" property (a reducer
 * function), and optionally either or both "from" and "to" properties (which
 * describe the state key used as the input to "via" and the output state key
 * to overwrite).
 *
 * `StateMapSpec.from` is the name of the state property which will be passed
 * to the provided reducer (`StateMapSpec.via`). If `from` is null or
 * undefined, `via` will be called with the entire state object.
 *
 * `StateMapSpec.to` is the name of the state property which will be replaced by
 * the result of `StateMapSpec.via`. If it is null or undefined, `via`'s result
 * will be used as the new state (and used to produce the input of the
 * next StateMapSpec's `via` reducer).
 */
function combineMappableReducers(stateMapSpecs, initialState) {
  stateMapSpecs.forEach(function validateMapSpec(mapSpec, index) {
    if (typeof mapSpec.via !== 'function') {
      throw new TypeError(
        `Invalid mapSpec at index ${ index }: property "via" is not a function`);
    }
  });
  return function mainReducer(state = initialState, action) {
    for (const mapSpec of stateMapSpecs) {
      let input;
      if (mapSpec.from === null || mapSpec.from === undefined) {
        // Whole state is the input
        input = state;
      } else {
        // Just a subkey
        input = state[mapSpec.from];
      }

      const result = mapSpec.via(input, action);

      if (mapSpec.to === null || mapSpec.to === undefined) {
        // Output is the whole next state
        state = result;
      } else {
        // Just a subkey to update
        state = shallowCloneReplacing(state, mapSpec.to, result);
      }
    }
    return state;
  };
}

function symmetricStateMapSpec(stateKey, viaReducer) {
  if (typeof stateKey !== 'string') {
    throw new TypeError('stateKey is not a string');
  }
  if (typeof viaReducer !== 'function') {
    throw new TypeError('viaReducer is not a function');
  }
  return {
    from: stateKey,
    via: viaReducer,
    to: stateKey,
  };
}

export { combineMappableReducers, symmetricStateMapSpec };
