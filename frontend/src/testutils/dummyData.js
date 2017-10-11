import moment from 'moment';
import { nowUnix } from '../util/time';

function todayOffsetUnix(offset) {
  return moment().add(moment.duration(offset, 'days')).unix();
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
    this._nextTaskIdInt = 1;
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
      return null;
    } else {
      return {...task};  // shallow copy
    }
  }

  createTask(taskData) {
    // Simulate POST /tasks
    const newId = this._nextTaskIdInt.toString();
    this._nextTaskIdInt++;
    if (this._tasks.has(newId)) {
      throw new Error('Duplicate ID!');
    }
    const now = nowUnix();
    const newTask = {
      id: newId,
      name: taskData.name,
      due: taskData.due,
      description: taskData.description,
      created: now,
      modified: now,
    };
    this._tasksOrder.push(newId);
    this._tasks.set(newId, newTask);
    return { ...newTask };  // Shallow copy
  }

  updateTask(taskId, taskData) {
    // Simulate PUT /tasks/:id
    const task = this._tasks.get(taskId);
    if (task === undefined) {
      return null;
    } else {
      task.name = taskData.name;
      task.due = taskData.due;
      task.description = taskData.description;
      task.modified = nowUnix();
      return { ...task };  // Shallow copy
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
    due: todayOffsetUnix(-4),
    description: '- Wash dishes\n- Wipe down surfaces\n- Sweep and mop'
  });
  db.createTask({
    name: 'Change Car Oil',
    due: todayOffsetUnix(30),
    description: ''
  });
  db.createTask({
    name: 'Clean Bathroom',
    due: todayOffsetUnix(2),
    description: 'Make sure to get under the toilet'
  });
  // TODO: Add recurring tasks once that's implemented.
  return db;
}

export { genDatabase, genCrappyUUID, DummyDatabase };
