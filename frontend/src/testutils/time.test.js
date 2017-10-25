import moment from 'moment';

import {
  firstUnix, firstLocalString,
  secondUnix, secondLocalString,
} from './time';


it('our test values are what we expect', () => {
  const firstISOStringUTC = '2017-03-14T01:05:09Z';
  const secondISOStringUTC = '2017-03-14T02:35:09Z';  // 1 hour 30 min later

  const firstUnixToIso = moment.unix(firstUnix).utc().format();
  expect(firstUnixToIso).toBe(firstISOStringUTC);

  const secondUnixToIso = moment.unix(secondUnix).utc().format();
  expect(secondUnixToIso).toBe(secondISOStringUTC);
})
