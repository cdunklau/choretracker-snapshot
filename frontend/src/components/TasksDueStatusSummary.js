import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { TaskType } from '../types';
import {
  getDueCategory, DueCategoryNames, DueCategoryClasses
} from '../dueCategorization';
import { shallowCloneReplacing } from '../util/transform';

import './TasksDueStatusSummary.css';

const categories = [
  DueCategoryNames.OVERDUE,
  DueCategoryNames.DUE_SOON,
  DueCategoryNames.DUE_LATER,
];

const initialCounts = {};
categories.forEach(catName => {
  initialCounts[catName] = 0;
});

function countByDueCategory(tasks, timeReference) {
  return tasks.reduce((counts, task) => {
    const category = getDueCategory(task.due, timeReference);
    return shallowCloneReplacing(counts, category, counts[category] + 1);
  }, initialCounts);
}

function TasksDueStatusSummaryImplementation({ tasksById, timeReference }) {
  const dueCategoryCounts = countByDueCategory(
    Object.values(tasksById), timeReference);
  const listElements = categories
    .map(catName =>
      [ catName, dueCategoryCounts[catName], DueCategoryClasses[catName] ])
    .map(([ catName, count, className ]) => (
      <li className={ className } key={ catName }>{ count }</li>
    ));
  return (
    <div className="TasksDueStatusSummary">
      <ul>{ listElements }</ul>
    </div>
  );
}
TasksDueStatusSummaryImplementation.propTypes = {
  tasksById: PropTypes.objectOf(TaskType).isRequired,
  timeReference: PropTypes.number.isRequired,
};

const TasksDueStatusSummary = connect(function mapStateToProps(state) {
  return {
    timeReference: state.timeReference,
    tasksById: state.tasksById,
  }
})(TasksDueStatusSummaryImplementation);

export default TasksDueStatusSummary;
