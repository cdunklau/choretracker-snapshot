import React from 'react';
import { Link } from 'react-router-dom';

import taskRedirector from './taskRedirector';
import { ConnectedDateTimeDisplay } from './DateTimeDisplay';
import MultilineParagraphs from './MultilineParagraphs';
import { TaskType } from '../types';

function TaskDetails({ task }) {
  let description = task.description.trim();
  if (description.length === 0) {
      description = '*No description for this task.*';
  }
  return (
    <div className="TaskDetails">
      <Link to={ `/tasks/${ task.id }/edit` }>Edit</Link>
      <h2>{ task.name }</h2>
      <p>
        <em>Due on <ConnectedDateTimeDisplay value={ task.due } /></em>
      </p>
      {/* TODO: Refactor this to render Markdown */}
      <MultilineParagraphs text={ description } />
    </div>
  );
}
TaskDetails.propTypes = {
  task: TaskType.isRequired,
};

const RedirectingTaskDetails = taskRedirector(TaskDetails);

export { TaskDetails, RedirectingTaskDetails };
