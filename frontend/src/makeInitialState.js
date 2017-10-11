import { nowUnix } from './util/time';

export default function makeInitialState() {
  const now = nowUnix();
  return {
    tasksById: {},
    tasksOrderedByDue: [],
    lastTaskAction: {},
    // A notification has id and message properties
    notifications: [],
    timeReference: now,
    router: undefined,  // taken care of by routerReducer
  };
};
