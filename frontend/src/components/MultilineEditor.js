import React from 'react';
import PropTypes from 'prop-types';

class MultilineEditor extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.valueChanged(event.target.value);
  }

  render() {
    return (
      <textarea
        rows="10"
        className="MultilineEditor"
        value={ this.props.value } 
        onChange={ this.handleChange }
        />
    );
  }
}
MultilineEditor.propTypes = {
  valueChanged: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default MultilineEditor
