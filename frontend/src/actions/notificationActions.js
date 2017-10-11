import ActionTypes from './ActionTypes';
import mirrorKeys from '../util/mirrorKeys';

const Levels = mirrorKeys({
  INFO: null,
  ERROR: null,
});

function showNotification(message, level) {
  return (dispatch, getState) => {
    const newId = getState().notifications.reduce(
      (maxYet, n) => Math.max(maxYet, n.id),
      0
    ) + 1;
    const notification = {
      message: message,
      id: newId,
      level: level,
    };
    if (level === Levels.ERROR) {
      console.log(`${ level } notification: ${ message }`);
    }
    dispatch({
      type: ActionTypes.SHOW_NOTIFICATION,
      payload: { notification },
    });
    // TODO: Ensure this doesn't blow up if user dismissed the notification
    setTimeout(function() {
      dispatch({
        type: ActionTypes.HIDE_NOTIFICATION,
        payload: { notification: { id: newId } },
      });
    }, 3000);
  }
}

function showInfoNotification(message) {
  return showNotification(message, Levels.INFO);
}

function showErrorNotification(message) {
  return showNotification(message, Levels.ERROR);
}

export { Levels };

export default {
  showInfoNotification,
  showErrorNotification,
};
