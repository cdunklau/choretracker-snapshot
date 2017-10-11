import { shallowCloneOmitting, shallowCloneReplacing } from './transform';


describe('shallowCloneOmitting', function() {
  const obj = {a: 1, b: 2};
  const result = shallowCloneOmitting(obj, 'a');

  it('returns an object without the property it was told to omit', function() {
    expect(result).toEqual({b: 2});
  });
  it('returns a new object', function() {
    expect(result).not.toBe(obj);
  });
  it('does not mutate the original', function() {
    expect(obj).toEqual({a: 1, b: 2});
  });
});

describe('shallowCloneReplacing', function() {
  const obj = {a: 1, b: 2};
  const result = shallowCloneReplacing(obj, 'a', 100);

  it('returns an object with the value it was told to replace', function() {
    expect(result).toEqual({a: 100, b: 2});
  });
  it('returns a new object', function() {
    expect(result).not.toBe(obj);
  });
  it('does not mutate the original', function() {
    expect(obj).toEqual({a: 1, b: 2});
  });
});
