import { DueCategoryNames, DueCategoryClasses } from './constants';

/* Parameters:
 *    due (moment):
 *      Due datetime of the class
 *    reference (moment):
 *      Time reference to determine difference
 * Returns (string): The DueCategoryClasses member as calculated
 */
function getDueClass(due, reference) {
  return DueCategoryClasses[getDueCategory(due, reference)];
}

/* Parameters:
 *    due (moment):
 *      Due datetime of the class
 *    reference (moment):
 *      Time reference to determine difference
 * Returns (string): The DueCategoryNames member as calculated
 */
function getDueCategory(due, reference) {
  if (reference.isAfter(due)) {
    return DueCategoryNames.OVERDUE;
  } else if (due.diff(reference, 'days') < 3) {
    return DueCategoryNames.DUE_SOON;
  } else {
    return DueCategoryNames.DUE_LATER;
  }
}

export default {
  getDueClass,
  getDueCategory,
};
