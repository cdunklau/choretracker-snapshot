import React from 'react';
import PropTypes from 'prop-types';

function MultilineParagraphs({ text }) {
  const paragraphs = text.split('\n').map(function(pText, index) {
    return (
      <p key={ index }>{ pText }</p>
    );
  });
  return (
    <div className="MultilineParagraphs">{ paragraphs }</div>
  );
}
MultilineParagraphs.propTypes = {
  text: PropTypes.string.isRequired,
};

export default MultilineParagraphs;
