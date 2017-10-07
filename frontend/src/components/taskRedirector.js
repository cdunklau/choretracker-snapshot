import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import notificationActions from '../actions/notificationActions';
import { getComponentDisplayName } from '../utils';

function taskRedirector(TaskComponent) {
  class Wrapped extends React.Component {
    componentDidMount() {
      if (typeof this.props.task === 'undefined') {
        this.props.taskNotFound();
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
    function mapDispatchToProps(dispatch, ownProps) {
      return {
        taskNotFound: () => {
          dispatch(notificationActions.showErrorNotification(
            `Unknown task id ${ ownProps.match.params.taskId }`
          ));
          dispatch(push('/tasks'));
        },
      };
    }
  )(Wrapped);
};

export default taskRedirector;
