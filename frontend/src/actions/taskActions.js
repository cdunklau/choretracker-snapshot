import { push } from 'react-router-redux';

import ActionTypes from './ActionTypes';
import apiClient from '../api/client';
import tasksApi from '../api/tasks';
import notificationActions from './notificationActions';

// TODO: Decide what the promises should resolve to.

function makePrepThenFetchThunk({ before, makeSpec, succeeded, failed }) {
  return dispatch => {
    before(dispatch);
    const spec = makeSpec();
    return apiClient.fetchFromSpec(spec).then(
      resolvedTo => succeeded(dispatch, resolvedTo),
      error => failed(dispatch, error)
    );
  }
}

function fetchAllTasks() {
  return makePrepThenFetchThunk({
    before: dispatch => {
      console.log('Fetching all tasks');
      dispatch({
        type: ActionTypes.FETCH_ALL_TASKS_REQUEST,
      });
    },

    makeSpec: tasksApi.all,

    succeeded: (dispatch, tasks) => {
      dispatch({
        type: ActionTypes.FETCH_ALL_TASKS_SUCCESS,
        payload: { tasks: tasks },
      });
    },

    failed: (dispatch, error) => {
      console.log('Error fetching all tasks:', error);
      dispatch({
        type: ActionTypes.FETCH_ALL_TASKS_FAILURE,
        error: error,
      });
      dispatch(notificationActions.showErrorNotification(
        'Failed to fetch all tasks'
      ));
      return Promise.reject(error);
    }
  });
}

function fetchTask(taskId) {
  return makePrepThenFetchThunk({
    before: (dispatch) => {
      console.log('Fetching task', taskId);
      dispatch({
        type: ActionTypes.FETCH_TASK_REQUEST,
        payload: { taskId: taskId },
      });
    },

    makeSpec: () => tasksApi.single(taskId),

    succeeded: (dispatch, task) => {
      return dispatch({
        type: ActionTypes.FETCH_TASK_SUCCESS,
        payload: { task: task },
      });
    },

    failed: (dispatch, error) => {
      console.log(`Error fetching task ${ taskId }:`, error);
      dispatch({
        type: ActionTypes.FETCH_TASK_FAILURE,
        error: error,
        taskId: taskId,
      });
      dispatch(notificationActions.showErrorNotification(
        `Failed to fetch task ${ taskId }: ${ error }`
      ));
      return Promise.reject(error);
    },
  });
}

function createTask(taskData) {

  const newTaskFields = {
    // TODO: Change this to use the selected group once we implement that
    taskGroup: '1',
    name: taskData.name,
    due: taskData.due,
    description: taskData.description,
  };

  return makePrepThenFetchThunk({

    before: dispatch => {
      dispatch({
        type: ActionTypes.CREATE_TASK_REQUEST,
        payload: { task: { ...newTaskFields } },
      });
    },

    makeSpec: () => tasksApi.create(newTaskFields),

    succeeded: (dispatch, createdTask) => {
      dispatch({
        type: ActionTypes.CREATE_TASK_SUCCESS,
        payload: { task: createdTask },
      });
      dispatch(notificationActions.showInfoNotification(
        'Created new task'
      ));
      dispatch(push('/tasks/' + createdTask.id));
      return createdTask.id;
    },

    failed: (dispatch, error) => {
      console.log('Error creating new task', error);
      dispatch({
        type: ActionTypes.CREATE_TASK_FAILURE,
        error: error,
        payload: { task: newTaskFields },
      });
      dispatch(notificationActions.showErrorNotification(
        'Failed to create new task'
      ));
      return Promise.reject(error);
    },
  });
}

function updateTask(taskId, taskData) {
  const updatedTaskFields = {
    taskGroup: taskData.taskGroup,
    name: taskData.name,
    due: taskData.due,
    description: taskData.description,
  };

  return makePrepThenFetchThunk({

    before: dispatch => {
      dispatch({
        type: ActionTypes.UPDATE_TASK_REQUEST,
        payload: { taskId: taskId, task: { ...updatedTaskFields } },
      });
    },

    makeSpec: () => tasksApi.update(taskId, updatedTaskFields),

    succeeded: (dispatch, updatedTask) => {
      dispatch({
        type: ActionTypes.UPDATE_TASK_SUCCESS,
        payload: { task: updatedTask },
      });
      dispatch(notificationActions.showInfoNotification(
        `Updated task ${ updatedTask.id }`
      ));
      dispatch(push('/tasks/' + updatedTask.id));
      return updatedTask.id;
    },

    failed: (dispatch, error) => {
      console.log(`Error updating task ${ taskId }:`, error);
      dispatch({
        type: ActionTypes.UPDATE_TASK_FAILURE,
        error: error,
        payload: { taskId: taskId, task: updatedTaskFields },
      });
      dispatch(notificationActions.showErrorNotification(
        `Failed to update task ${ taskId }`
      ));
      return Promise.reject(error);
    },
  });
}

function deleteTask(taskId) {
  return makePrepThenFetchThunk({
    before: dispatch => {
      dispatch({
        type: ActionTypes.DELETE_TASK_REQUEST,
        payload: { taskId: taskId },
      });
    },

    makeSpec: () => tasksApi.remove(taskId),

    succeeded: (dispatch, ignored) => {
      dispatch({
        type: ActionTypes.DELETE_TASK_SUCCESS,
        payload: { taskId: taskId },
      });
      dispatch(notificationActions.showInfoNotification(`Deleted task ${taskId}`));
      dispatch(push('/tasks'));
    },

    failed: (dispatch, error) => {
      console.log(`Error deleting task ${ taskId }:`, error);
      dispatch({
        type: ActionTypes.DELETE_TASK_FAILURE,
        error: error,
        payload: { taskId: taskId },
      });
      dispatch(notificationActions.showErrorNotification(
        `Failed to delete task ${ taskId }: ${ error }`
      ));
      return Promise.reject(error);
    },
  });
}

export default {
  fetchAllTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
}
