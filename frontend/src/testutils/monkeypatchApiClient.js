import realApiClient from '../api/client';
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

function doFetchDecodingJSONMonkeypatch(processingSpec) {
  const responseDataReturner = getResponseDataReturner(
    processingSpec.path, processingSpec.method);
  if (responseDataReturner === null) {
    return rejectingAfter(150, new Error(
      `Endpoint path ${ processingSpec.path.join('/') } returned 404`
    ));
  } else {
    return resolvingAfter(200, responseDataReturner(processingSpec.send));
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

let real_doFetchDecodingJSON = null;
let db = null;
let patched = false;

function patchApiClient(fixtureName) {
  if ( patched ) {
    throw new Error('Already patched');
  }
  real_doFetchDecodingJSON = realApiClient._doFetchDecodingJSON;
  realApiClient._doFetchDecodingJSON = doFetchDecodingJSONMonkeypatch;
  patched = true;
  resetPatchDB(fixtureName);
}

function unpatchApiClient() {
  if ( ! patched ) {
    throw new Error('Not patched yet');
  }
  realApiClient._doFetchDecodingJSON = real_doFetchDecodingJSON;
  patched = false;
}

function resetPatchDB(fixtureName) {
  if ( ! patched ) {
    throw new Error('Must patch before resetting db');
  }
  db = genDatabase(fixtureName);
}

function ensureApiClientPatched(fixtureName) {
  if ( ! patched ) {
    patchApiClient(fixtureName);
  }
}

function ensureApiClientUnpatched() {
  if ( patched ) {
    unpatchApiClient();
  }
}

export {
  patchApiClient, unpatchApiClient,
  ensureApiClientPatched, ensureApiClientUnpatched,
  resetPatchDB
};
