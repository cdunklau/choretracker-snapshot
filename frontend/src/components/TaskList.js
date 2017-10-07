import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { TaskType } from '../types';
import taskUtils from '../taskUtils';

import './TaskList.css';

function TaskListEntry({ task, timeReference }) {
  const dueClass = taskUtils.getDueClass(task.due, timeReference);
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
  timeReference: PropTypes.object.isRequired,
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
  timeReference: PropTypes.object.isRequired,
}

class TimeCategorizedTaskListGroup extends React.Component {
  render() {
    return (
      <div className="TimeCategorizedTaskListGroup">
        <h2>{ this.props.category.label }</h2>
        <TaskListGroup tasks={ this.props.tasks } />
      </div>
    );
  }
}

const TIME_CATEGORIES = [
  {
    label: 'Past due (from more than 30 days ago)',
    minOffset: -31,
    maxOffset: -9999
  },
  {
    label: 'Past due (from 7-30 days ago)',
    minOffset: -7,
    maxOffset: -30
  },
  {
    label: 'Past due (less than 7 days ago)',
    minOffset: -1,
    maxOffset: -6
  },
  {
    label: 'Due today',
    minOffset: 0,
    maxOffset: 0
  },
  {
    label: 'Due tomorrow',
    minOffset: 1,
    maxOffset: 1
  },
  {
    label: 'Due within 7 days',
    minOffset: 2,
    maxOffset: 6
  },
  {
    label: 'Due in 7-30 days',
    minOffset: 7,
    maxOffset: 30
  },
  {
    label: 'Due in more than 30 days',
    minOffset: 31,
    maxOffset: 9999
  }
];

class TimeCategorizedTaskList extends React.Component {
  render() {
    return '';
  }
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
  timeReference: PropTypes.object.isRequired,
}

const TaskList = connect(function mapStateToProps(state, ownProps) {
  return {
    timeReference: state.timeReference,
    sortedTasks: state.tasksOrderedByDue.map(taskId => state.tasksById[taskId]),
  };
})(TaskListImplementation);

export { TaskList, TaskListGroup, TaskListEntry };
