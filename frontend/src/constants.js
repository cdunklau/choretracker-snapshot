import { mirrorKeys } from './utils';

const DueCategoryNames = mirrorKeys({
  OVERDUE: null,
  DUE_SOON: null,
  DUE_LATER: null,
});

const DueCategoryClasses = {
  [DueCategoryNames.OVERDUE]: 'overdue',
  [DueCategoryNames.DUE_SOON]: 'duesoon',
  [DueCategoryNames.DUE_LATER]: 'duelater',
};

export {
  DueCategoryNames,
  DueCategoryClasses,
};
