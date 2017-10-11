import { push } from 'react-router-redux';

import ActionTypes from './ActionTypes';
import apiClient from '../apiClient';
import notificationActions from './notificationActions';

function fetchAllTasks() {
  return dispatch => {
    console.log('Fetching all tasks');
    dispatch({
      type: ActionTypes.FETCH_ALL_TASKS_REQUEST,
    });

    return apiClient.fetchAllTasks().then(
      tasks => dispatch({
        type: ActionTypes.FETCH_ALL_TASKS_SUCCESS,
        payload: { tasks: tasks },
      }),
      error => {
        console.log('Error fetching all tasks', error);
        const dispatched = dispatch({
          type: ActionTypes.FETCH_ALL_TASKS_FAILURE,
          error: error,
        });
        dispatch(notificationActions.showErrorNotification(
          'Failed to fetch all tasks'
        ));
        return dispatched;
      },
    );
  }
}

function fetchTask(taskId) {
  return dispatch => {
    console.log('Fetching task', taskId);
    dispatch({
      type: ActionTypes.FETCH_TASK_REQUEST,
      payload: { taskId: taskId },
    });

    return apiClient.fetchTask(taskId).then(
      task => dispatch({
        type: ActionTypes.FETCH_TASK_SUCCESS,
        payload: { task: task },
      }),
      error => {
        console.log(`Error fetching task ${ taskId }:`, error);
        const dispatched = dispatch({
          type: ActionTypes.FETCH_TASK_FAILURE,
          error: error,
          taskId: taskId,
        });
        dispatch(notificationActions.showErrorNotification(
          `Failed to fetch task ${ taskId }: ${ error }`
        ));
        return dispatched;
      },
    );
  }
}

function createTask(taskData) {
  return (dispatch) => {
    const newTaskFields = {
      name: taskData.name,
      due: taskData.due,
      description: taskData.description,
    };
    dispatch({
      type: ActionTypes.CREATE_TASK_REQUEST,
      payload: { task: { ...newTaskFields } },
    });

    return apiClient.createTask(newTaskFields).then(
      createdTask => {
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
      error => {
        console.log('Error creating new task', error);
        const dispatched = dispatch({
          type: ActionTypes.CREATE_TASK_FAILURE,
          error: error,
          payload: { task: newTaskFields },
        });
        dispatch(notificationActions.showErrorNotification(
          'Failed to create new task'
        ));
        return dispatched;
      },
    );
  };
}

function updateTask(taskId, taskData) {
  return dispatch => {
    const updatedTaskFields = {
      name: taskData.name,
      due: taskData.due,
      description: taskData.description,
    };
    dispatch({
      type: ActionTypes.UPDATE_TASK_REQUEST,
      payload: { taskId: taskId, task: { ...updatedTaskFields } },
    });

    return apiClient.updateTask(taskId, updatedTaskFields).then(
      updatedTask => {
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
      error => {
        console.log(`Error updating task ${ taskId }:`, error);
        const dispatched = dispatch({
          type: ActionTypes.UPDATE_TASK_FAILURE,
          error: error,
          payload: { taskId: taskId, task: updatedTaskFields },
        });
        dispatch(notificationActions.showErrorNotification(
          `Failed to update task ${ taskId }`
        ));
        return dispatched;
      },
    );
  };
}

function deleteTask(taskId) {
  return dispatch => {
    dispatch({
      type: ActionTypes.DELETE_TASK_REQUEST,
      payload: { taskId: taskId },
    });

    return apiClient.deleteTask(taskId).then(
      ignored => {
        dispatch({
          type: ActionTypes.DELETE_TASK_SUCCESS,
          payload: { taskId: taskId },
        });
        dispatch(notificationActions.showInfoNotification(`Deleted task ${taskId}`));
        dispatch(push('/tasks'));
      },
      error => {
        console.log(`Error deleting task ${ taskId }:`, error);
        const dispatched = dispatch({
          type: ActionTypes.DELETE_TASK_FAILURE,
          error: error,
          payload: { taskId: taskId },
        });
        dispatch(notificationActions.showErrorNotification(
          `Failed to delete task ${ taskId }: ${ error }`
        ));
        return dispatched;
      },
    );
  };
}

export default {
  fetchAllTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
}
