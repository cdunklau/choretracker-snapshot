/* Pure functions for transforming objects */

/*
 * Shallow clone `originalObj` (object) omitting property named `propName`
 * (string).
 */
function shallowCloneOmitting(originalObj, propName) {
  const {[propName]: omitted, ...result} = originalObj;
  return result;
}

/*
 * Shallow clone `originalObj` (object) replacing (or creating) property
 * named `propName` (string).
 */
function shallowCloneReplacing(originalObj, propName, propValue) {
  return {...originalObj, [propName]: propValue};
}

/*
 * Create an object by calling `makePropertyNameAndValue` on each element of
 * `items` (array) to provide a property name and value. `makeKeyAndValue`
 * needs to return a two-item array of [<string>, <any>].
 */
function objectFromArray(items, makePropertyNameAndValue) {
  const obj = {};
  items.forEach(item => {
    const [key, value] = makePropertyNameAndValue(item);
    obj[key] = value;
  });
  return obj;
}

export {
  shallowCloneOmitting,
  shallowCloneReplacing,
  objectFromArray,
};
