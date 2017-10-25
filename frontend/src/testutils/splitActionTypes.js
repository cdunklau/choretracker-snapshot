import ActionTypes from '../actions/ActionTypes';
import { setDifference } from '../util/setOperations';

function splitActionTypes(interestingTypesArray) {
  const allActionTypes = new Set(Object.values(ActionTypes));
  const interestingTypes = new Set(interestingTypesArray);
  const unknownTypes = setDifference(interestingTypes, allActionTypes);
  if (unknownTypes.size > 0) {
    throw new TypeError(
      'Unknown action types given: ' + Array.from(unknownTypes).join(', ')
    );
  }
  const uninterestingTypes = setDifference(allActionTypes, interestingTypes);
  return [ interestingTypes, uninterestingTypes ];
}

export default splitActionTypes;
