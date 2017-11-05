import mirrorKeys from '../util/mirrorKeys';


const ActionTypes = mirrorKeys({
  // start userActions
  CHECK_ALREADY_LOGGED_IN_REQUEST: null,
  CHECK_ALREADY_LOGGED_IN_SUCCESS: null,
  CHECK_ALREADY_LOGGED_IN_FAILURE: null,

  LOGIN_GOOGLE_SIGN_IN_REQUEST: null,
  LOGIN_GOOGLE_SIGN_IN_SUCCESS: null,
  LOGIN_GOOGLE_SIGN_IN_FAILURE: null,

  CHECK_USER_PROFILE_EXISTS_REQUEST: null,
  CHECK_USER_PROFILE_EXISTS_SUCCESS: null,
  CHECK_USER_PROFILE_EXISTS_FAILURE: null,

  UPDATE_USER_PROFILE_REQUEST: null,
  UPDATE_USER_PROFILE_SUCCESS: null,
  UPDATE_USER_PROFILE_FAILURE: null,
  // end userActions

  // start notificationActions
  SHOW_NOTIFICATION: null,
  HIDE_NOTIFICATION: null,
  // end notificationActions

  // start timeActions
  UPDATE_TIME_REFERENCE: null,
  // end timeActions

  // start taskGroupActions
  FETCH_ALL_TASK_GROUPS_REQUEST: null,
  FETCH_ALL_TASK_GROUPS_SUCCESS: null,
  FETCH_ALL_TASK_GROUPS_FAILURE: null,

  FETCH_TASK_GROUP_REQUEST: null,
  FETCH_TASK_GROUP_SUCCESS: null,
  FETCH_TASK_GROUP_FAILURE: null,

  CREATE_TASK_GROUP_REQUEST: null,
  CREATE_TASK_GROUP_SUCCESS: null,
  CREATE_TASK_GROUP_FAILURE: null,

  UPDATE_TASK_GROUP_REQUEST: null,
  UPDATE_TASK_GROUP_SUCCESS: null,
  UPDATE_TASK_GROUP_FAILURE: null,

  DELETE_TASK_GROUP_REQUEST: null,
  DELETE_TASK_GROUP_SUCCESS: null,
  DELETE_TASK_GROUP_FAILURE: null,
  // end taskGroupActions

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
