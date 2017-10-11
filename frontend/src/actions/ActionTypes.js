import mirrorKeys from '../util/mirrorKeys';

/* Actions:
 *  User creates a new Task
 *  User saves edits to an existing Task
 *  User deletes a Task
 *  (Server actions come from websocket update or frontend poll)
 *  Server sends a new Task
 *  Server sends edits to an existing Task
 *  Server sends removal of a Task
 */

const ActionTypes = mirrorKeys({
  // start notificationActions
  SHOW_NOTIFICATION: null,
  HIDE_NOTIFICATION: null,
  // end notificationActions

  // start timeActions
  UPDATE_TIME_REFERENCE: null,
  // end timeActions

  // start taskActions
  FETCH_ALL_TASKS_REQUEST: null,
  FETCH_ALL_TASKS_SUCCESS: null,
  FETCH_ALL_TASKS_FAILURE: null,

  FETCH_TASK_REQUEST: null,
  FETCH_TASK_SUCCESS: null,
  FETCH_TASK_FAILURE: null,

  CREATE_TASK_REQUEST: null,
  CREATE_TASK_SUCCESS: null,
  CREATE_TASK_FAILURE: null,

  UPDATE_TASK_REQUEST: null,
  UPDATE_TASK_SUCCESS: null,
  UPDATE_TASK_FAILURE: null,

  DELETE_TASK_REQUEST: null,
  DELETE_TASK_SUCCESS: null,
  DELETE_TASK_FAILURE: null,
  // end taskActions
});

export default ActionTypes;
