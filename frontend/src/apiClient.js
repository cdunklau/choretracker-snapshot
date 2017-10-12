import { serializeTask, deserializeTask } from './serializers';

class ApiClient {
  constructor(baseUrl = '/api/') {
    this.baseUrl = baseUrl;
    this.baseHeaders = new Headers();
    this.baseHeaders.append('Accept', 'application/json');
    this.fetchAllTasks = this.fetchAllTasks.bind(this);
    this.fetchTask = this.fetchTask.bind(this);
    this.createTask = this.createTask.bind(this);
    this.updateTask = this.updateTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
  }

  _fetchJSON(endpointPathComponents, method = 'GET', bodyStructure = null) {
    const url = this.baseUrl + endpointPathComponents.join('/');
    const init = {
      method: method,
      headers: this.baseHeaders,
    };
    if (bodyStructure !== null) {
      if (method === 'GET' || method === 'DELETE') {
        throw new TypeError('Sending body with GET or DELETE is not supported');
      }
      init.body = JSON.stringify(bodyStructure);
      init.headers = new Headers(this.baseHeaders);
      init.headers.append('Content-Type', 'application/json');
    }
    // TODO: Check status code
    return fetch(url, init).then(response => response.json());
  }

  fetchAllTasks() {
    return this._fetchJSON(['tasks']).then(
      taskStructureArray => taskStructureArray.map(deserializeTask)
    );
  }

  fetchTask(taskId) {
    return this._fetchJSON(['tasks', taskId]).then(deserializeTask);
  }

  createTask(taskFields) {
    const taskStructure = serializeTask(taskFields);
    return this._fetchJSON(['tasks'], 'POST', taskStructure)
      .then(deserializeTask);
  }

  updateTask(taskId, taskFields) {
    // TODO: Do some validation (maybe?)
    const taskStructure = serializeTask(taskFields);
    return this._fetchJSON(['tasks', taskId], 'PUT', taskStructure)
      .then(deserializeTask);
  }

  deleteTask(taskId) {
    return this._fetchJSON(['tasks', taskId], 'DELETE');
  }
}

export default new ApiClient();
