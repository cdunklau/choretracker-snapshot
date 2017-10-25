import React from 'react';
import PropTypes from 'prop-types';

import { unixToISO8601, makeValidUnixTime } from '../util/time.js';

class DateTimeEditor extends React.Component {
  // TODO: Set a state and style this to point out invalid entry,
  //       and figure out how to prevent create/save when invalid.
  constructor(props) {
    super(props);

    const dateTimeString = unixToISO8601(this.props.value);
    this.state = {
      // TODO: Remove initialDate, we don't use it, and it's in props anyway.
      initialDate: this.props.value,
      dateTimeString: dateTimeString,
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.props.onValid(this.props.value);
  };

  handleChange(event) {
    const newDateTimeString = event.target.value;
    this.setState({
      dateTimeString: newDateTimeString
    });
    const newDateTime = makeValidUnixTime(newDateTimeString);
    if (newDateTime === null) {
      this.props.onInvalid('Invalid date/time');
    } else {
      this.props.onValid(newDateTime);
    }
  }

  render() {
    return (
      <input
        type="datetime-local"
        value={ this.state.dateTimeString }
        onChange={ this.handleChange } />
    );
  }
}
DateTimeEditor.propTypes = {
  // Unix timestamp
  value: PropTypes.number.isRequired,
  onValid: PropTypes.func.isRequired,
  onInvalid: PropTypes.func.isRequired,
};

export default DateTimeEditor;
