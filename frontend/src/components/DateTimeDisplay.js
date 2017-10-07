import React from 'react';

function DateTimeDisplay({ value }) {
  return (
    <span className="DateTimeDisplay">
      { value.format('LL') } at { value.format('LT') } (
        { value.fromNow() }
      )
    </span>
  );
}
// TODO: Add PropTypes

export default DateTimeDisplay
