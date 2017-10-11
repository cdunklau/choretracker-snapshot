import PropTypes from 'prop-types';

const TaskType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  due: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  created: PropTypes.number.isRequired,
  modified: PropTypes.number.isRequired,
});

export { TaskType };
