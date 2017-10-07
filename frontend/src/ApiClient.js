import moment from 'moment';
import { genDatabase } from './DummyData';
import { serializeDateTime } from './TimeUtil';


function makeDelayedPromise(delayMilliseconds, resolveValue, rejectValue) {
  if (delayMilliseconds === undefined) {
    delayMilliseconds = 250;
  }
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      if (rejectValue === undefined) {
        resolve(resolveValue);
      } else {
        reject(rejectValue)
      }
    }, delayMilliseconds);
  });
}

function resolvingAfter(delayMilliseconds, resolvingTo) {
  return makeDelayedPromise(delayMilliseconds, resolvingTo);
}

function rejectingAfter(delayMilliseconds, rejectingWith) {
  return makeDelayedPromise(delayMilliseconds, null, rejectingWith);
}

class DummyAPIClient {
  constructor() {
    this._db = genDatabase();
    this.getAllTasks = this.getAllTasks.bind(this);
    this.getTask = this.getTask.bind(this);
    this.updateTask = this.updateTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
  }

  getAllTasks() {
    const tasks = this._db.getAllTasks();
    tasks.forEach(function(task) {
      task.due = moment(task.due);
    });
    return resolvingAfter(500, tasks);
  }

  getTask(taskId) {
    const task = this._db.getTask(taskId);
    if (task === null) {
      return rejectingAfter(150, `No such task with id ${taskId}`);
    } else {
      task.due = moment(task.due);
      return resolvingAfter(250, task);
    }
  }

  createTask(taskFields) {
    const newTask = this._db.createTask({
      name: taskFields.name,
      due: serializeDateTime(taskFields.due),
      description: taskFields.description
    });
    return resolvingAfter(250, this.getTask(newTask.id));
  }

  updateTask(taskId, taskFields) {
    // TODO: Do some validation (maybe?)
    const updated  = {
      name: taskFields.name,
      due: serializeDateTime(taskFields.due),
      description: taskFields.description
    }
    if (this._db.updateTask(taskId, updated)) {
      return resolvingAfter(250, null);
    } else {
      return rejectingAfter(150, `Failed to update task ${taskId}`);
    }
  }

  deleteTask(taskId) {
    if (this._db.deleteTask(taskId)) {
      return resolvingAfter(250, null);
    } else {
      return rejectingAfter(150, `Failed to delete task ${taskId}`);
    }
  }
}

export { DummyAPIClient };
