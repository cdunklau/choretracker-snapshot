import moment from 'moment';
import { momentISO8601FormatString } from '../util/time';

function makeValues(initial) {
  if ( ! moment.isMoment(initial)) {
    throw new TypeError('initial must be a Moment');
  }
  const unix = initial.unix();
  const localString = initial.format(momentISO8601FormatString);
  const oneHourBeforeUnix = initial.clone().subtract(1, 'hours').unix();
  return [ unix, localString, oneHourBeforeUnix ];
}

const first = moment('2017-03-14T01:05:09Z');

const [
  firstUnix,
  firstLocalString,
  oneHourBeforeFirstUnix,
] = makeValues(first);

const second = first.clone().add({ hours: 1, minutes: 30 });
const [
  secondUnix,
  secondLocalString,
  oneHourBeforeSecondUnix,
] = makeValues(second);

export {
  firstUnix, firstLocalString, oneHourBeforeFirstUnix,
  secondUnix, secondLocalString, oneHourBeforeSecondUnix,
};
