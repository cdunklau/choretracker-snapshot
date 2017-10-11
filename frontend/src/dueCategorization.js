/* Task due timestamp categorization */
import moment from 'moment';

import mirrorKeys from './util/mirrorKeys';

const DueCategoryNames = mirrorKeys({
  OVERDUE: null,
  DUE_SOON: null,
  DUE_LATER: null,
});

/* Maps DueCategoryNames members to HTML class values. */
const DueCategoryClasses = {
  [DueCategoryNames.OVERDUE]: 'overdue',
  [DueCategoryNames.DUE_SOON]: 'duesoon',
  [DueCategoryNames.DUE_LATER]: 'duelater',
};


/* Parameters:
 *    due (number):
 *      Due datetime of the class (unix timestamp)
 *    reference (number):
 *      Time reference to determine difference (unix timestamp)
 * Returns (string): The DueCategoryClasses member as calculated
 */
function getDueClass(due, reference) {
  return DueCategoryClasses[getDueCategory(due, reference)];
}

/* Parameters:
 *    due (number):
 *      Due datetime of the class (unix timestamp)
 *    reference (number):
 *      Time reference to determine difference (unix timestamp)
 * Returns (string): The DueCategoryNames member as calculated
 */
function getDueCategory(due, reference) {
  // TODO: Change to just use difference of unix values directly.
  const dueMoment = moment.unix(due);
  const referenceMoment = moment.unix(reference);
  if (referenceMoment.isAfter(dueMoment)) {
    return DueCategoryNames.OVERDUE;
  } else if (dueMoment.diff(referenceMoment, 'days') < 3) {
    return DueCategoryNames.DUE_SOON;
  } else {
    return DueCategoryNames.DUE_LATER;
  }
}

export {
  DueCategoryNames,
  DueCategoryClasses,
  getDueClass,
  getDueCategory,
};
