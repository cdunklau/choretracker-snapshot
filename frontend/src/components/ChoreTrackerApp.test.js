import React from 'react';
import ReactDOM from 'react-dom';
import ChoreTrackerApp from './ChoreTrackerApp';
import pathToRegexp from 'path-to-regexp';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ChoreTrackerApp />, div);
});
