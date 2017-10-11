import React from 'react';
import mirrorKeys from '../util/mirrorKeys';

function pascalCaseify(s) {
  const words = s.trim().split(/\s+/);
  const toJoin = words.map((word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return toJoin.join('');
}

const ButtonTypes = mirrorKeys({
  EDIT: null,
  RESET: null,
  CREATE: null,
  SAVE: null,
  DELETE: null
});

const _ButtonSettings = {};
for (let buttonType in ButtonTypes) {
  if (ButtonTypes.hasOwnProperty(buttonType)) {
    _ButtonSettings[buttonType] = {
      label: pascalCaseify(buttonType),
      className: pascalCaseify(buttonType + ' Button')
    };
  }
};


class Button extends React.Component {
  constructor(props) {
    super(props);
    this.buttonClicked = this.buttonClicked.bind(this)
  }

  buttonClicked(e) {
    this.props.onButtonClick(e);
  }

  render() {
    const settings = _ButtonSettings[this.props.type];
    const label = this.props.label ? this.props.label : settings.label;
    const opts = {
      className:
        this.props.className ? this.props.className : settings.className,
      onClick: this.buttonClicked
    };
    if (this.props.disabled) {
      opts.disabled = true;
    }
    return (
      <button {...opts}>{ label }</button>
    );
  }
}

export {
  Button,
  ButtonTypes
};
