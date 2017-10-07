import PropTypes from 'prop-types';

const TaskType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  due: PropTypes.object.isRequired,
  description: PropTypes.string.isRequired,
});

export { TaskType };
