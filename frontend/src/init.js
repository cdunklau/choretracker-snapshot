import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import {
  ConnectedRouter, routerMiddleware, routerReducer
} from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import thunk from 'redux-thunk';

import { composeMappableReducers, symmetricStateMapSpec } from './util/state';
import './index.css';
import ChoreTrackerApp from './components/ChoreTrackerApp';
import registerServiceWorker from './registerServiceWorker';
import rootReducer from './reducers';

import { patchApiClient } from './testutils/monkeypatchApiClient';

function runApp(mockApiClient = false) {
  const history = createHistory();

  const logActions = store => next => action => {
    console.log('dispatching', action);
    const result = next(action);
    console.log('next state', store.getState());
    return result;
  };

  const logEverything = false;
  const middlewares = [
    thunk,
    routerMiddleware(history),
    ...(logEverything ? [ logActions ] : []),
  ];

  const store = createStore(
    // Combine our root reducer with the router reducer here
    // since routerReducer isn't ours.
    composeMappableReducers([
      symmetricStateMapSpec(null, rootReducer),
      symmetricStateMapSpec('router', routerReducer),
    ]),
    applyMiddleware(...middlewares),
  );

  if (mockApiClient) {
    patchApiClient();
  }

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
}

export { runApp };
