import moment from 'moment';

function formatDate(d) {
  return d.format('YYYY-MM-DD');
}

const isoDateTimeRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g;

function makeValidDateTime(stringVal) {
  // Returns a valid Moment from a full datetime string, or null
  // if the string value is invalid
  if (stringVal.match(isoDateTimeRegex) !== null) {
    const dateTime = moment(stringVal);
    if (dateTime.isValid()) {
      return dateTime;
    }
  }
  return null;
}

function serializeDateTime(momentDateTime) {
  return momentDateTime.format('YYYY-MM-DDTHH:mm:ss');
}

export { serializeDateTime, makeValidDateTime };
