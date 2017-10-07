import React from 'react';
import PropTypes from 'prop-types';

class LineEditor extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.valueChanged(event.target.value);
  }

  render() {
    return (
      <input
        type="text"
        className="LineEditor"
        value={ this.props.value } 
        onChange={ this.handleChange }
        />
    );
  }
}
LineEditor.propTypes = {
  valueChanged: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default LineEditor;
