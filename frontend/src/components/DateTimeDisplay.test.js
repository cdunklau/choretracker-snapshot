import React from 'react';
import moment from 'moment';
import { mount } from 'enzyme';

import { DateTimeDisplay } from './DateTimeDisplay';
import {
  firstUnix, firstLocalString, oneHourBeforeFirstUnix,
  secondUnix, secondLocalString, oneHourBeforeSecondUnix,
} from '../testutils/time';

describe('DateTimeDisplay', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <DateTimeDisplay
        value={ firstUnix }
        timeReference={ oneHourBeforeFirstUnix } />
    );
  });
  afterEach(() => {
    wrapper.unmount();
  });

  function expectNewPropsToShow(newProps, toFormat, expectedDiffString) {
    const expectedText = [
      toFormat.format('LL'), 'at', toFormat.format('LT'), expectedDiffString,
    ].join(' ');
    wrapper.setProps(newProps);
    expect(wrapper.find('span').text()).toBe(expectedText);
  }

  it('displays the updated date, time, and humanized difference when props sent', () => {
    expectNewPropsToShow(
      { value: firstUnix, timeReference: oneHourBeforeFirstUnix },
      moment.unix(firstUnix),
      '(an hour ago)'
    );
    expectNewPropsToShow(
      { timeReference: oneHourBeforeSecondUnix },
      moment.unix(firstUnix),
      '(in 30 minutes)'
    );
    expectNewPropsToShow(
      { value: secondUnix },
      moment.unix(secondUnix),
      '(an hour ago)'
    );
  });
});
