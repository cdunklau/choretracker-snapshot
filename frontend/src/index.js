import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import thunk from 'redux-thunk';

import './index.css';
import ChoreTrackerApp from './components/ChoreTrackerApp';
import registerServiceWorker from './registerServiceWorker';
import { rootReducer } from './reducers';

import { patchApiClient } from './testutils/monkeypatchApiClient';

const history = createHistory();

const store = createStore(
  rootReducer,
  applyMiddleware(thunk, routerMiddleware(history)),
);

patchApiClient();

ReactDOM.render(
  (
    <Provider store={ store }>
      <ConnectedRouter history={ history }>
        <ChoreTrackerApp />
      </ConnectedRouter>
    </Provider>
  ),
  document.getElementById('root'));
registerServiceWorker();
