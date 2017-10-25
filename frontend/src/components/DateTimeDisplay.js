import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';

function DateTimeDisplay({ value, timeReference }) {
  const m = moment.unix(value);
  return (
    <span className="DateTimeDisplay">
      {
        m.format('LL')
      } at {
        m.format('LT')
      } ({
        m.to(moment.unix(timeReference))
      })
    </span>
  );
}
DateTimeDisplay.propTypes = {
  value: PropTypes.number.isRequired,
  timeReference: PropTypes.number.isRequired,
};

const ConnectedDateTimeDisplay = connect(function mapStateToProps(state) {
  return {
    timeReference: state.timeReference,
  };
})(DateTimeDisplay);

export { DateTimeDisplay, ConnectedDateTimeDisplay };
