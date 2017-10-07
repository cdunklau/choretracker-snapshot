import moment from 'moment';

import ActionTypes from './ActionTypes';

function updateTimeReference() {
  const now = moment();
  return {
    type: ActionTypes.UPDATE_TIME_REFERENCE,
    payload: now,
  };
}

export default {
  updateTimeReference,
};
