import { mirrorKeys } from '../utils';

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
  CREATE_TASK: null,
  UPDATE_TASK: null,
  DELETE_TASK: null,
  SHOW_NOTIFICATION: null,
  HIDE_NOTIFICATION: null,
  UPDATE_TIME_REFERENCE: null,
});

export default ActionTypes;
