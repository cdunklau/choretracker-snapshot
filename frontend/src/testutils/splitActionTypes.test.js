import ActionTypes from '../actions/ActionTypes';
import splitActionTypes from './splitActionTypes';

it('errors if an unknown action type is provided', () => {
  const unknownType = '@@test/unknown-action-type';
  expect(() => {
    splitActionTypes([
      ActionTypes.SHOW_NOTIFICATION,
      unknownType,
    ]);
  }).toThrow('Unknown action types given: ' + unknownType);
});

it('returns an array of two sets, the input and the remaining types', () => {
  const providedTypes = [
    ActionTypes.SHOW_NOTIFICATION,
    ActionTypes.FETCH_ALL_TASKS_SUCCESS,
  ];
  const expectedInteresting = new Set(providedTypes);
  const expectedUninteresting = new Set(Object.values(ActionTypes));
  providedTypes.forEach(type => { expectedUninteresting.delete(type) });
  expect(splitActionTypes(providedTypes))
    .toEqual([ expectedInteresting, expectedUninteresting ]);
});
