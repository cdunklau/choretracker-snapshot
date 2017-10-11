import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { TaskType } from '../types';
import { getDueClass, getDueCategory } from '../dueCategorization';

import './TaskList.css';

function TaskListEntry({ task, timeReference }) {
  const dueClass = getDueClass(task.due, timeReference);
  return (
    <li className={ dueClass }>
      <span className="status">&nbsp;</span>{ task.name }
      <span className="nav">
        <Link to={ `/tasks/${ task.id }` }>Details</Link>
      </span>
    </li>
  );
}
TaskListEntry.propTypes = {
  task: TaskType.isRequired,
  timeReference: PropTypes.number.isRequired,
};

function TaskListGroup({ tasks, timeReference }) {
  return (
    <ul className="TaskListGroup">
      {tasks.map(task => (
        <TaskListEntry
          task={ task }
          timeReference={ timeReference }
          key={ task.id } />
      ))}
    </ul>
  );
}
TaskListGroup.propTypes = {
  tasks: PropTypes.arrayOf(TaskType).isRequired,
  timeReference: PropTypes.number.isRequired,
}

function TaskListImplementation({ sortedTasks, timeReference }) {
  return (
    <div className="TaskList">
      <TaskListGroup
        tasks={ sortedTasks }
        timeReference={ timeReference } />
    </div>
  );
}
TaskListImplementation.propTypes = {
  sortedTasks: PropTypes.arrayOf(TaskType).isRequired,
  timeReference: PropTypes.number.isRequired,
}

const TaskList = connect(function mapStateToProps(state, ownProps) {
  return {
    timeReference: state.timeReference,
    sortedTasks: state.tasksOrderedByDue.map(taskId => state.tasksById[taskId]),
  };
})(TaskListImplementation);

export default TaskList;
