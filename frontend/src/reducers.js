import { routerReducer } from 'react-router-redux';

import { combineMappableReducers, symmetricStateMapSpec } from './util/state';
import ActionTypes from './actions/ActionTypes';
import {
  shallowCloneOmitting, shallowCloneReplacing, objectFromArray
} from './util/transform';
import makeInitialState from './makeInitialState';

const initialState = makeInitialState();

const rootReducer = combineMappableReducers([
  symmetricStateMapSpec('tasksById', changedTasks),
  {
    from: 'tasksById',
    via: computeOrderedByDue,
    to: 'tasksOrderedByDue',
  },
  symmetricStateMapSpec('notifications', computeNotifications),
  symmetricStateMapSpec('timeReference', updateTimeReference),
  symmetricStateMapSpec('router', routerReducer),
], initialState);

function computeOrderedByDue(tasksById) {
  // TODO: Reduce this churn by only triggering on relevant action types.
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
    case ActionTypes.DELETE_TASK_SUCCESS:
      return shallowCloneOmitting(tasksById, action.payload.taskId);
    case ActionTypes.CREATE_TASK_SUCCESS:
    case ActionTypes.UPDATE_TASK_SUCCESS:
    case ActionTypes.FETCH_TASK_SUCCESS:
      return shallowCloneReplacing(
        tasksById, action.payload.task.id, action.payload.task);
    // TODO: Figure out what to do with initial request and failure case
    case ActionTypes.FETCH_ALL_TASKS_SUCCESS:
      return objectFromArray(action.payload.tasks, (item) => [ item.id, item ]);
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
