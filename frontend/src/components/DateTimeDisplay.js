import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

function DateTimeDisplay({ value }) {
  const m = moment.unix(value);
  return (
    <span className="DateTimeDisplay">
      { m.format('LL') } at { m.format('LT') } (
        { m.fromNow() }
      )
    </span>
  );
}
DateTimeDisplay.propTypes = {
  value: PropTypes.number.isRequired,
};

export default DateTimeDisplay
