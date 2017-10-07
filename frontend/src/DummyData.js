import moment from 'moment';
import { serializeDateTime } from './TimeUtil.js';


const now = moment();

function todayOffsetString(offset) {
  // FIXME: This should be converted to UTC first
  return serializeDateTime(
    now.clone().add(moment.duration(offset, 'days'))
  );
}

function genCrappyUUID() {
  // IMPORTANT: DON'T ACTUALLY USE THIS FOR ANYTHING REAL
  function getRandomInt(numBits) {
    const value = Math.floor(Math.random() * Math.pow(2, numBits));
    return value;
  }
  function formatHexGroup(n, width) {
    let stringRep = n.toString(16);
    if (stringRep.length === width) {
      return stringRep;
    } else if (stringRep.length < width) {
      const padLength = width - stringRep.length;
      return Array(padLength + 1).join('0') + stringRep;
    } else {
      // Truncate front
      return stringRep.slice(stringRep.length - width);
    }
  }
  const components = [
    formatHexGroup(getRandomInt(32), 8),
    formatHexGroup(getRandomInt(16), 4),
    formatHexGroup(0x1000 + getRandomInt(12), 4),
    formatHexGroup(0xA000 + getRandomInt(14), 4),
    formatHexGroup(getRandomInt(48), 12)
  ];
  return components.join('-');
}

class DummyDatabase {
  /* A fake database to be used by the dummy API client. Holds the
   * "server" state.
   */
  constructor() {
    this._tasks = new Map();
    this._tasksOrder = [];
    this.getAllTasks = this.getAllTasks.bind(this);
    this.getTask = this.getTask.bind(this);
    this.createTask = this.createTask.bind(this);
    this.updateTask = this.updateTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
  }

  getAllTasks() {
    // Simulate GET /tasks
    const tasks = this._tasksOrder.map((taskId) => {
      return this.getTask(taskId);
    });
    return tasks;
  }

  getTask(taskId) {
    // Simulate GET /tasks/:id
    const task = this._tasks.get(taskId);
    if (task === undefined) {
      return undefined;
    } else {
      return {...task};  // shallow copy
    }
  }

  createTask(taskData) {
    // Simulate POST /tasks
    const newId = genCrappyUUID();
    if (this._tasks.has(newId)) {
      throw new Error('Duplicate ID!');
    }
    const newTask = {
      id: newId,
      name: taskData.name,
      due: taskData.due,
      description: taskData.description
    };
    this._tasksOrder.push(newId);
    this._tasks.set(newId, newTask);
    return newTask;
  }

  updateTask(taskId, taskData) {
    // Simulate PUT /tasks/:id
    const task = this._tasks.get(taskId);
    if (task === undefined) {
      return false;
    } else {
      task.name = taskData.name;
      task.due = taskData.due;
      task.description = taskData.description;
      return true;
    }
  }

  deleteTask(taskId) {
    // Simulate DELETE /tasks/:id
    if (this._tasks.has(taskId)) {
      this._tasks.delete(taskId);
      this._tasksOrder.splice(this._tasksOrder.indexOf(taskId), 1);
      return true;
    } else {
      return false;
    }
  }
}

function genDatabase() {
  const db = new DummyDatabase();
  db.createTask({
    name: 'Clean Kitchen',
    due: todayOffsetString(-4),
    description: '- Wash dishes\n- Wipe down surfaces\n- Sweep and mop'
  });
  db.createTask({
    name: 'Change Car Oil',
    due: todayOffsetString(30),
    description: ''
  });
  db.createTask({
    name: 'Clean Bathroom',
    due: todayOffsetString(2),
    description: 'Make sure to get under the toilet'
  });
  return db;
}

export { genDatabase, genCrappyUUID };
