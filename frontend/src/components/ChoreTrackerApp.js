import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { TaskCreator, RedirectingTaskEditor } from './TaskEditor';
import { RedirectingTaskDetails } from './TaskDetails';
import TaskList from './TaskList';
import Notifications from './Notifications';
import NavBar from './NavBar';
import TimeReferenceUpdater from './TimeReferenceUpdater';
import ApiWrangler from './ApiWrangler';
import TasksDueStatusSummary from './TasksDueStatusSummary';
import { intIdPattern } from '../constants';

import logo from '../logo.svg';
import './ChoreTrackerApp.css';


const routes = [
  {
    doc: 'overview',
    pattern: '/',
    name: 'overview',
  },
  {
    doc: 'view all Tasks',
    pattern: '/tasks',
    name: 'view-all-tasks',
  },
  {
    doc: 'create new Task',
    pattern: '/tasks/new',
    name: 'create-task',
  },
  {
    doc: 'view specific Task',
    pattern: '/tasks/{taskId}',
    name: 'view-task',
  },
  {
    doc: 'edit existing Task',
    pattern: '/tasks/{taskId}/edit',
    name: 'edit-task',
  },
  /*
  {
    pattern: '/task-groups',
    doc: 'view all TaskGroups'
  },
  {
    pattern: '/task-groups/create',
    doc: 'create new TaskGroup'
  },
  {
    pattern: '/task-groups/{taskGroupId}',
    doc: 'view existing TaskGroup'
  },
  {
    pattern: '/task-groups/{taskGroupId}/edit',
    doc: "edit existing TaskGroup's metadata"
  }
  */
];

function ChoreTrackerApp(props) {
  return (
    <div className="ChoreTrackerApp">
      <ApiWrangler />
      <TimeReferenceUpdater intervalSeconds={ 10 } />

      <header className="ChoreTrackerApp-header">
        <img src={ logo } className="App-logo" alt="logo" />
        <h2>Welcome to React</h2>
      </header>

      <NavBar/>

      <TasksDueStatusSummary />

      <Notifications/>

      <Switch>
        <Route exact path="/tasks" component={ TaskList } />
        <Route exact path="/tasks/new" component={ TaskCreator } />
        <Route
          exact path={ `/tasks/:taskId(${ intIdPattern })` }
          component={ RedirectingTaskDetails } />
        <Route
          exact path={ `/tasks/:taskId(${ intIdPattern })/edit` }
          component={ RedirectingTaskEditor } />
        { /* TODO: Add a NotFound component */ }
      </Switch>
    </div>
  );
}
ChoreTrackerApp.propTypes = {};

export default ChoreTrackerApp;
