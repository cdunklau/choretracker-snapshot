// TODO: Name this better once I figure out what it's real job should be.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import taskActions from '../actions/taskActions';

class ApiWranglerImplementation extends React.Component {
  componentDidMount() {
    this.props.fetchAllTasks();
  }

  render() {
    return null;
  }
}
ApiWranglerImplementation.propTypes = {
  fetchAllTasks: PropTypes.func.isRequired,
};

const ApiWrangler = connect(
  null,
  function mapDispatchToProps(dispatch) {
    return {
      fetchAllTasks: () => dispatch(taskActions.fetchAllTasks()),
    };
  }
)(ApiWranglerImplementation);

export default ApiWrangler;
