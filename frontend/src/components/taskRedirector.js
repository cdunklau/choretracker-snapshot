import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import notificationActions from '../actions/notificationActions';
import taskActions from '../actions/taskActions';


function getComponentDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function taskRedirector(TaskComponent) {
  class Wrapped extends React.Component {
    componentDidMount() {
      if (typeof this.props.task === 'undefined') {
        this.props.taskNotFound();
        // TODO: Figure out why I returned here
        return;
      }
    }

    render() {
      if (typeof this.props.task === 'undefined') {
        return null;
      }
      const { task, taskNotFound, ...restProps } = this.props;
      return <TaskComponent task={ this.props.task } { ...restProps } />
    }
  }

  Wrapped.displayName = `TaskRedirector(${
    getComponentDisplayName(TaskComponent)
  })`;

  return connect(
    function mapStateToProps(state, ownProps) {
      const task = state.tasksById[ownProps.match.params.taskId];
      return { task };
    },
    function mapDispatchToProps(outerDispatch, ownProps) {
      return {
        taskNotFound: () => outerDispatch(dispatch => {
          // TODO:
          //
          // Do this better. If the request takes a long time and then
          // fails, it may result in a spurious redirection if the user
          // already went somewhere else.
          //
          // Maybe it's best to have a component dedicated to requesting
          // the task data directly, and another dedicated to redirecting
          // if the task doesn't exist.
          //
          // What are the things we need to do and check to see if the task
          // exists? All of:
          //
          // 1. It's in the store (thus in the wrapped task component's props).
          // 2. An API request directly for the ID was successful.
          //
          // We could just used another component to trigger the API request
          // and redirect if it fails?
          //
          const taskId = ownProps.match.params.taskId;
          dispatch(taskActions.fetchTask(taskId)).then(
            passthrough => passthrough,
            error => {
              dispatch(notificationActions.showErrorNotification(
                `Unknown task id ${ ownProps.match.params.taskId }`
              ));
              dispatch(push('/tasks'));
            },
          );
        }),
      };
    }
  )(Wrapped);
};

export default taskRedirector;
