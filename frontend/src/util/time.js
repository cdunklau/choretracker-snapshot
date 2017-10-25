import moment from 'moment';

const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/g;

function makeValidUnixTime(isoTimestamp) {
  // Returns a valid Moment from a full datetime string, or null
  // if the string value is invalid
  if (isoTimestamp.match(isoDateTimeRegex) !== null) {
    const dateTime = moment(isoTimestamp);
    if (dateTime.isValid()) {
      return dateTime.unix();
    }
  }
  return null;
}

const momentISO8601FormatString = 'YYYY-MM-DDTHH:mm:ss';

// Number -> String
function unixToISO8601(unixTimestampSeconds) {
  return moment.unix(unixTimestampSeconds).format(momentISO8601FormatString);
}

// String -> Number
function iso8601ToUnix(isoTimestamp) {
  return moment(isoTimestamp).unix();
}

function nowUnix() {
  return moment().unix();
}

export {
  makeValidUnixTime,
  momentISO8601FormatString,
  unixToISO8601,
  iso8601ToUnix,
  nowUnix
};
