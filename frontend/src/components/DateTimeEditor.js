import React from 'react';

import { unixToISO8601, makeValidUnixTime } from '../util/time.js';

class DateTimeEditor extends React.Component {
  // TODO: Set a state and style this to point out invalid entry,
  //       and figure out how to prevent create/save when invalid.
  constructor(props) {
    super(props);

    const dateTimeString = unixToISO8601(this.props.value);
    this.state = {
      initialDate: this.props.value,
      dateTimeString: dateTimeString,
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const newDateTimeString = event.target.value;
    this.setState({
      dateTimeString: newDateTimeString
    });
    const newDateTime = makeValidUnixTime(newDateTimeString);
    if (newDateTime !== null) {
      this.props.dateTimeChanged(newDateTime);
    } else {
      // TODO: Update state to provoke rerender with error indication.
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
// TODO: Add propTypes

export default DateTimeEditor;
