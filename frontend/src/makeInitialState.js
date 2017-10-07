// For now just use in-browser state entirely, don't try to add
// the complexities of async
import moment from 'moment';
import { genDatabase } from './DummyData';

export default function makeInitialState() {
  const db = genDatabase()
  const tasks = db.getAllTasks()
  const tasksById = {};
  const now = moment();
  tasks.forEach((task) => {
    task.due = moment(task.due);
    tasksById[task.id] = task;
  });
  return {
    tasksById: tasksById,
    tasksOrderedByDue: [],
    lastTaskAction: {},
    // A notification has id and message properties
    notifications: [],
    timeReference: now,
    router: undefined,  // taken care of by routerReducer
  };
};
