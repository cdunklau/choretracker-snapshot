import { nowUnix } from './util/time';

export default function makeInitialState() {
  const now = nowUnix();
  return {
    tasksById: {},
    tasksOrderedByDue: [],
    // TODO: Do I need lastTaskAction???
    lastTaskAction: {},
    // A notification has id and message properties
    notifications: [],
    timeReference: now,
  };
};
