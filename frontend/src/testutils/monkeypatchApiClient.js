import realApiClient from '../apiClient';
import { intIdOnly } from '../constants';
import { genDatabase } from './dummyData';

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

function fetchJSONMonkeypatch(
    endpointPathComponents, method = 'GET', bodyStructure = null
) {
  if (bodyStructure !== null) {
    if (method === 'GET' || method === 'DELETE') {
      throw new TypeError('Sending body with GET or DELETE is not supported');
    }
  }
  const responseDataReturner = getResponseDataReturner(
    endpointPathComponents, method);
  // TODO: Update this to use the delayed promises.
  if (responseDataReturner === null) {
    return Promise.reject(
      `Endpoint path ${ endpointPathComponents.join('/') } returned 404`
    )
  } else {
    return Promise.resolve(responseDataReturner(bodyStructure));
  }
}

function getResponseDataReturner(endpointPathComponents, method) {
  const compStack = endpointPathComponents.slice().reverse();
  const first = compStack.pop();
  if (first === 'tasks') {
    const taskId = compStack.pop();
    if (taskId === undefined) {
      if (method === 'GET') {
        return db.getAllTasks;
      } else if (method === 'POST' ) {
        return bodyStructure => db.createTask(bodyStructure);
      }
    } else if (intIdOnly.test(taskId) && compStack.length === 0) {
      const task = db.getTask(taskId);
      if (task === null) {
        // No such task
        return null;
      } else if (method === 'GET') {
        return () => task;
      } else if (method === 'PUT') {
        return bodyStructure => db.updateTask(taskId, bodyStructure);
      } else if (method === 'DELETE') {
        return () => {
          db.deleteTask(taskId);
          return {};
        };
      }
    }
  }
  return null;
}

let real_fetchJSON = null;
let db = null;
let patched = false;

function patchApiClient() {
  if ( patched ) {
    throw new Error('Already patched');
  }
  real_fetchJSON = realApiClient._fetchJSON;
  realApiClient._fetchJSON = fetchJSONMonkeypatch;
  db = genDatabase();
  patched = true;
}

function unpatchApiClient() {
  if ( ! patched ) {
    throw new Error('Not patched yet');
  }
  realApiClient._fetchJSON = real_fetchJSON;
  patched = false;
}

function resetPatchDB() {
  if ( ! patched ) {
    throw new Error('Must patch before resetting db');
  }
  db = genDatabase();
}

export { patchApiClient, unpatchApiClient, resetPatchDB };
