import rootReducer, { _forTesting as subReducers } from './reducers';
import makeInitialState from './makeInitialState';
import ActionTypes from './actions/ActionTypes';
import splitActionTypes from './testutils/splitActionTypes';

it('returns initialState if called with undefined', () => {
  const noopAction = { type: '@@test/unused-action-type' };
  expect(rootReducer(undefined, noopAction))
    .toEqual(makeInitialState());
});

describe('changedTasks', () => {
  const [ relevantActionTypes, irrelevantActionTypes ] = splitActionTypes([
    ActionTypes.FETCH_ALL_TASKS_SUCCESS,
    ActionTypes.FETCH_TASK_SUCCESS,
    ActionTypes.CREATE_TASK_SUCCESS,
    ActionTypes.UPDATE_TASK_SUCCESS,
    ActionTypes.DELETE_TASK_SUCCESS,
  ]);
  const task1 = { id: '1' };
  const task2 = { id: '2' };
  const task3 = { id: '3' };
  const initialTasksById = { '1': task1, '2': task2, '3': task3 };

  it("returns the same tasksById object on actions that don't change tasks", () => {
    for (const causeReturnInput of irrelevantActionTypes) {
      const resultTasksById = subReducers.changedTasks(
        initialTasksById, { type: causeReturnInput });
      expect(resultTasksById).toBe(initialTasksById);
    }
  });

  function expectResultTasksByIdChanged(action, expectedResultTasksById) {
    const resultTasksById = subReducers.changedTasks(initialTasksById, action);
    expect(resultTasksById).not.toBe(initialTasksById);
    expect(resultTasksById).toEqual(expectedResultTasksById);
  }

  it('returns a new object with the specified task deleted', () => {
    const action = {
      type: ActionTypes.DELETE_TASK_SUCCESS,
      payload: { taskId: '2' }
    };
    const expected = { '1': task1, '3': task3 };
    expectResultTasksByIdChanged(action, expected)
  });

  [
    ActionTypes.CREATE_TASK_SUCCESS,
    ActionTypes.UPDATE_TASK_SUCCESS,
    ActionTypes.FETCH_TASK_SUCCESS,
  ].forEach(type => {
    it(`returns a new object with the specified task updated (${ type })`, () => {
      const replacedTask = { id: '2', name: 'new name' };
      const action = {
        type: type,
        payload: { task: replacedTask },
      };
      const expected = {
        '1': task1,
        '2': replacedTask,
        '3': task3,
      };
      expectResultTasksByIdChanged(action, expected);
    });
  });

  it('returns a new object with all tasks replaced on FETCH_ALL_TASKS_SUCCESS', () => {
    const newTasksArray = [ { id: '4' }, { id: '5' } ];
    const action = {
      type: ActionTypes.FETCH_ALL_TASKS_SUCCESS,
      payload: { tasks: newTasksArray },
    };
    const expected = {
      '4': { id: '4' },
      '5': { id: '5' },
    };
    expectResultTasksByIdChanged(action, expected);
  });
});

describe('computeOrderedByDue', () => {
  const allActionTypes = new Set(Object.values(ActionTypes));
  const [ relevantActionTypes, irrelevantActionTypes ] = splitActionTypes([
    ActionTypes.DELETE_TASK_SUCCESS,
    ActionTypes.CREATE_TASK_SUCCESS,
    ActionTypes.UPDATE_TASK_SUCCESS,
    ActionTypes.FETCH_TASK_SUCCESS,
    ActionTypes.FETCH_ALL_TASKS_SUCCESS,
  ]);

  it('updates the order on task change actions', () => {
    const tasksUpdatedState = {
      ...makeInitialState(),
      tasksById: {
        '1': { due: 9 },
        '2': { due: 5 },
        '3': { due: 14 },
      },
    };
    const expectedOrdered = [ '2', '1', '3' ];
    for (const causeUpdateOrdered of relevantActionTypes) {
      const resultState = subReducers.computeOrderedByDue(
        tasksUpdatedState, { type: causeUpdateOrdered });
      expect(resultState.tasksOrderedByDue).toEqual(expectedOrdered);
    }
  });

  it("returns the same order array on actions that don't change tasks", () => {
    const initialState = makeInitialState();
    const originalOrdered = initialState.tasksOrderedByDue;

    for (const causeSameOrdered of irrelevantActionTypes) {
      const resultState = subReducers.computeOrderedByDue(
        initialState, { type: causeSameOrdered });
      expect(resultState.tasksOrderedByDue).toBe(originalOrdered);
    }

  });
});
