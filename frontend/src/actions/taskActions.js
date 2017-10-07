import { genCrappyUUID } from '../DummyData';
import ActionTypes from './ActionTypes';

function createTask(taskData) {
  const newTask = {
    id: genCrappyUUID(),
    name: taskData.name,
    due: taskData.due,
    description: taskData.description,
  };
  return {
    type: ActionTypes.CREATE_TASK,
    payload: { task: newTask },
  };
}

function updateTask(taskId, taskData) {
  return {
    type: ActionTypes.UPDATE_TASK,
    payload: {
      taskId: taskId,
      task: {
        name: taskData.name,
        due: taskData.due,
        description: taskData.description,
      }
    }
  }
}

function deleteTask(taskId) {
  return {
    type: ActionTypes.DELETE_TASK,
    payload: { taskId: taskId },
  };
}

export default {
  createTask,
  updateTask,
  deleteTask,
}
