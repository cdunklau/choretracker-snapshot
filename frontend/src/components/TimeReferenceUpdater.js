import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import timeActions from '../actions/timeActions';

class TimeReferenceUpdaterImplementation extends React.Component {
  componentDidMount() {
    // TODO: Make this longer
    this.timerID = setInterval(() => {
      console.log('updating time reference');
      this.props.updateTimeReference();
    }, this.props.intervalSeconds * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  render() {
    return null;
  }
}
TimeReferenceUpdaterImplementation.propTypes = {
  updateTimeReference: PropTypes.func.isRequired,
  intervalSeconds: PropTypes.number,  // seconds of delay
}
TimeReferenceUpdaterImplementation.defaultProps = {
  intervalSeconds: 10,
}

const TimeReferenceUpdater = connect(
  null,
  function mapDispatchToProps(dispatch) {
    return {
      updateTimeReference: () => { dispatch(timeActions.updateTimeReference()) },
    };
  }
)(TimeReferenceUpdaterImplementation);

export default TimeReferenceUpdater;
