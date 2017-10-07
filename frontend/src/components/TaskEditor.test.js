import React from 'react';
import ReactDOM from 'react-dom';
import TaskEditor from './TaskEditor';


function makeRenderer(element) {
  const div = document.createElement('div');
  return () => { ReactDOM.render(element, div); };
}

it(
  'throws when a task is provided without requestSave and requestDelete props',
  () => {
    expect(makeRenderer(<TaskEditor task={ {} } />)).toThrowError(TypeError);
  }
);

it(
  'throws when a no task is provided without a requestCreate prop',
  () => {
    expect(makeRenderer(<TaskEditor />)).toThrowError(TypeError);
  }
);
