function createArrayDeserializer(deserializer) {
  return structures => structures.map(deserializer);
}


/* Task model:
 *
 *  Field Name      | Frontend Type   | API Type
 * -----------------+-----------------+------------------
 *  id              |   string        |   number (int)
 *  taskGroup       |   string        |   number (int)
 *  name            |   string        |   string
 *  description     |   string        |   string
 *  due             |   number (int)  |   number (int)
 *  created         |   number (int)  |   number (int)
 *  modified        |   number (int)  |   number (int)
 *
 */
function serializeTask(taskModel) {
  return {
    id: Number.parseInt(taskModel.id, 10),
    taskGroup: Number.parseInt(taskModel.taskGroup, 10),
    name: taskModel.name,
    description: taskModel.description,
    due: taskModel.due,
    // Omit created and modified
  }
}

function deserializeTask(taskFromApi) {
  return {
    id: taskFromApi.id.toString(),
    taskGroup: taskFromApi.taskGroup.toString(),
    name: taskFromApi.name,
    description: taskFromApi.description,
    due: taskFromApi.due,
    created: taskFromApi.created,
    modified: taskFromApi.modified,
  }
}

const deserializeTaskArray = createArrayDeserializer(deserializeTask);


export { serializeTask, deserializeTask, deserializeTaskArray };
