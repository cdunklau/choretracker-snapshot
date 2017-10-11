import { nowUnix } from '../util/time';
import ActionTypes from './ActionTypes';

function updateTimeReference() {
  const now = nowUnix();
  return {
    type: ActionTypes.UPDATE_TIME_REFERENCE,
    payload: now,
  };
}

export default {
  updateTimeReference,
};
