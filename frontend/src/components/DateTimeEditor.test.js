import React from 'react';
import { mount } from 'enzyme';
import moment from 'moment';

import { momentISO8601FormatString } from '../util/time';
import DateTimeEditor from './DateTimeEditor';
import {
  firstUnix, firstLocalString,
  secondUnix, secondLocalString
} from '../testutils/time';


describe('DateTimeEditor', () => {

  const onValid = jest.fn();
  const onInvalid = jest.fn();

  let wrapper;

  beforeEach(() => {
    onValid.mockReset();
    onInvalid.mockReset();

    wrapper = mount(
      <DateTimeEditor
        value={ firstUnix } onValid={ onValid } onInvalid={ onInvalid } />
    );
  });
  afterEach(() => {
    wrapper.unmount();
  });

  it('renders the datetime in ISO format local time', () => {
    // TODO:
    // Figure out how to deal with the fact that this should
    // display the *local* time, not UTC. And how to test it.
    // For now, just assume moment does the right thing.
    const displayedValue = wrapper.find('input').props().value;
    expect(displayedValue).toBe(firstLocalString);
  });

  it('updates the datetime when changed by the user', () => {
    wrapper.find('input').simulate(
      'change',
      { target: { value: secondLocalString } }
    );
    const displayedValue = wrapper.find('input').props().value;
    expect(displayedValue).toBe(secondLocalString);
  });

  it('calls onValue with the initial value before any changes', () => {
    expect(onValid).toHaveBeenCalledTimes(1);
    const [ onValidArg ] = onValid.mock.calls[0];
    expect(onValidArg).toBe(firstUnix);
  });

  it('calls onValid with a unix timestamp representing the valid input', () => {
    wrapper.find('input').simulate(
      'change',
      { target: { value: secondLocalString } }
    );
    expect(onValid).toHaveBeenCalledTimes(2);
    const [ [ firstOnValidArg ], [ secondOnValidArg ] ] = onValid.mock.calls;
    expect(firstOnValidArg).toBe(firstUnix);  // Because of init
    expect(secondOnValidArg).toBe(secondUnix);
  });

  const invalidValuesWithReasons = [
    [ 'not valid', 'is not a time string' ],
    [ '2017-10-15T15:30:19Z', 'has UTC zone marker' ],
    [ '2017-10-15T15:30:19+02:00',  'has local zone offset' ],
    [ '2017-10-15T15:30', 'has no seconds' ],  // Should we care about this?
    [ '10-15T15:30:19', 'has no year' ],
  ];
  invalidValuesWithReasons.forEach(([ invalidValue, whyInvalid ]) => {
    const testName = `calls onInvalid if value ${ whyInvalid }`;

    it(testName, () => {
      wrapper.find('input').simulate(
        'change',
        { target: { value: invalidValue } }
      );
      expect(onInvalid).toHaveBeenCalledTimes(1);
      const [ onInvalidArg ] = onInvalid.mock.calls[0];
      expect(onInvalidArg).toBe('Invalid date/time');
    });
  });
});
