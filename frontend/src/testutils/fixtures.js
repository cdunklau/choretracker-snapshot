import moment from 'moment';

function todayOffsetUnix(offset) {
  return moment().add(moment.duration(offset, 'days')).unix();
}

const dbFixtures = new Map([
  [
    'realistic', db => {
      db.createTask({
        taskGroup: 1,
        name: 'Clean Kitchen',
        due: todayOffsetUnix(-4),
        description: '- Wash dishes\n- Wipe down surfaces\n- Sweep and mop'
      });
      db.createTask({
        taskGroup: 1,
        name: 'Change Car Oil',
        due: todayOffsetUnix(30),
        description: ''
      });
      db.createTask({
        taskGroup: 1,
        name: 'Clean Bathroom',
        due: todayOffsetUnix(2),
        description: 'Make sure to get under the toilet'
      });
      // TODO: Add recurring tasks once that's implemented.
    },
  ],
]);

export { dbFixtures };
