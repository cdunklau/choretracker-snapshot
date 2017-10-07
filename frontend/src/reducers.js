import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import ActionTypes from './actions/ActionTypes';
import { shallowCloneOmitting, shallowCloneReplacing } from './utils';
import makeInitialState from './makeInitialState';

const initialState = makeInitialState();

function rootReducer(state = initialState, action) {
  const tasksById = changedTasks(state.tasksById, action);
  const tasksOrderedByDue = computeOrderedByDue(tasksById);
  const notifications = computeNotifications(state.notifications, action);
  const timeReference = updateTimeReference(state.timeReference, action);
  const router = routerReducer(state.router);
  return {
    ...state,
    tasksOrderedByDue,
    tasksById,
    notifications,
    timeReference,
    router,
  };
}

function computeOrderedByDue(tasksById) {
  return Object.keys(tasksById)
    .sort((id1, id2) => compareTaskByDue(tasksById, id1, id2));
}

function compareTaskByDue(tasksById, id1, id2) {
  const t1 = tasksById[id1];
  const t2 = tasksById[id2];
  if (t1.due < t2.due) {
    return -1;
  } else if (t1.due === t2.due) {
    return 0;
  } else {
    return 1;
  }
}

function changedTasks(tasksById, action) {
  switch (action.type) {
    case ActionTypes.CREATE_TASK:
      const newTask = action.payload.task;
      return shallowCloneReplacing(tasksById, newTask.id, newTask);
    case ActionTypes.UPDATE_TASK:
      // TODO: Don't clone so damn much
      return shallowCloneReplacing(
        tasksById, action.payload.taskId,
        shallowCloneReplacing(action.payload.task, 'id', action.payload.taskId),
      );
    case ActionTypes.DELETE_TASK:
      return shallowCloneOmitting(tasksById, action.payload.taskId);
    default:
      return tasksById;
  }
}

function computeNotifications(notifications, action) {
  if (action.type === ActionTypes.SHOW_NOTIFICATION) {
    return [ { ...action.payload.notification } ].concat(notifications);
  } else if (action.type === ActionTypes.HIDE_NOTIFICATION) {
    return notifications.filter(n => n.id !== action.payload.notification.id);
  } else {
    return notifications;
  }
}

function updateTimeReference(timeReference, action) {
  if (action.type === ActionTypes.UPDATE_TIME_REFERENCE) {
    return action.payload;
  } else {
    return timeReference;
  }
}

export { rootReducer };
