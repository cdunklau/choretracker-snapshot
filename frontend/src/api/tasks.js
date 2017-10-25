import {
  serializeTask, deserializeTask, deserializeTaskArray
} from './serializers';
import { Methods } from './common';

function all() {
  return {
    path: ['tasks'],
    method: Methods.GET,
    receive: deserializeTaskArray,
  };
}

function single(taskId) {
  return {
    path: ['tasks', taskId],
    method: Methods.GET,
    receive: deserializeTask,
  };
}

function create(taskFields) {
  return {
    path: ['tasks'],
    method: Methods.POST,
    send: serializeTask(taskFields),
    expectStatus: 201,
    receive: deserializeTask,
  };
}

function update(taskId, taskFields) {
  return {
    path: ['tasks', taskId],
    method: Methods.PUT,
    send: serializeTask(taskFields),
    receive: deserializeTask
  };
}

function remove(taskId) {
  return {
    path: ['tasks', taskId],
    method: Methods.DELETE,
    receive: null,
  };
}

export default { all, single, create, update, remove };
