import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import moment from 'moment';

import { TaskType } from '../types';
import taskRedirector from './taskRedirector';
import { Button, ButtonTypes } from './Button';
import DateTimeEditor from './DateTimeEditor';
import LineEditor from './LineEditor';
import MultilineEditor from './MultilineEditor';
import taskActions from '../actions/taskActions';
import notificationActions from '../actions/notificationActions';

const _CREATE_MODE = 'create-mode';
const _EDIT_MODE = 'edit-mode';

class TaskEditorImplementation extends React.Component {
  constructor(props) {
    super(props);

    if (this.props.task === undefined) {
      this._mode = _CREATE_MODE;
      this.state = {
        editedName: 'New task',
        editedDescription: '',
        // TODO: Decide if we really want to default to tomorrow
        editedDue: moment().add(1, 'day'),
      };
    } else {
      this._mode = _EDIT_MODE;
      this.state = {
        editedName: this.props.task.name,
        editedDescription: this.props.task.description,
        editedDue: this.props.task.due,
      };
    }
    this.handleChangedDue = this.handleChangedDue.bind(this);
    this.handleNameInput = this.handleNameInput.bind(this);
    this.handleDescriptionInput = this.handleDescriptionInput.bind(this);
    this.resetEdits = this.resetEdits.bind(this);
    this.saveEdits = this.saveEdits.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
  }

  handleChangedDue(newDue) {
    this.setState({
      editedDue: newDue
    });
  }

  handleNameInput(nameText) {
    this.setState({
      editedName: nameText
    });
  }

  handleDescriptionInput(descriptionText) {
    this.setState({
      editedDescription: descriptionText
    });
  }

  saveEdits() {
    const taskFields = {
      name: this.state.editedName,
      due: this.state.editedDue,
      description: this.state.editedDescription,
    };
    if (this._mode === _CREATE_MODE) {
      this.props.createTask(taskFields)
    } else {
      this.props.updateTask(this.props.task.id, taskFields);
    }
  }

  resetEdits() {
    this.props.resetTask(this.props.task.id);
  }

  deleteTask() {
    this.props.deleteTask(this.props.task.id);
  }

  render() {
    return (
      <div className="TaskEditor">
      {
        this._mode === _CREATE_MODE ? (
          <div className="TaskEditorControls">
            <Button
              type={ ButtonTypes.CREATE }
              onButtonClick={ this.saveEdits } />
          </div>
        ) : (
          <div className="TaskEditorControls">
            <Button
              type={ ButtonTypes.SAVE }
              onButtonClick={ this.saveEdits } />
            <Button
              type={ ButtonTypes.RESET }
              onButtonClick={ this.resetEdits } />
            <Button
              type={ ButtonTypes.DELETE }
              onButtonClick={ this.deleteTask } />
          </div>
        )
      }
        <p>
          Task name: <LineEditor
            value={ this.state.editedName }
            valueChanged={ this.handleNameInput } />
        </p>
        <p>
          Due on <DateTimeEditor
            value={ this.state.editedDue }
            dateTimeChanged={ this.handleChangedDue } />
        </p>
        <MultilineEditor
          value={ this.state.editedDescription }
          valueChanged={ this.handleDescriptionInput } />
      </div>
    );
  }
}
TaskEditorImplementation.propTypes = PropTypes.oneOfType([
  PropTypes.shape({
    task: TaskType.isRequired,
    updateTask: PropTypes.func.isRequired,
    resetTask: PropTypes.func.isRequired,
    deleteTask: PropTypes.func.isRequired,
  }),
  PropTypes.shape({
    createTask: PropTypes.func.isRequired,
  }),
]).isRequired;

const TaskCreator = connect(
  function mapStateToProps(state, ownProps) {
    return {};
  },
  function mapDispatchToProps(dispatch) {
    return {
      createTask: (taskFields) => {
        const newTaskAction = taskActions.createTask(taskFields);
        dispatch(newTaskAction);
        dispatch(notificationActions.showInfoNotification(
          `Created task ${newTaskAction.payload.task.id}`
        ));
        dispatch(push('/tasks/' + newTaskAction.payload.task.id));
      },
    };
  }
)(TaskEditorImplementation);

const TaskEditor = connect(
  function mapStateToProps(state, ownProps) {
    return { task: ownProps.task };
  },
  function mapDispatchToProps(dispatch) {
    return {
      updateTask: (taskId, taskFields) => {
        dispatch(taskActions.updateTask(taskId, taskFields));
        dispatch(notificationActions.showInfoNotification(`Updated task ${taskId}`));
        dispatch(push('/tasks/' + taskId));
      },
      resetTask: (taskId) => {
        dispatch(push('/tasks/' + taskId));
      },
      deleteTask: (taskId) => {
        dispatch(taskActions.deleteTask(taskId));
        dispatch(notificationActions.showInfoNotification(`Deleted task ${taskId}`));
        dispatch(push('/tasks'));
      },
    };
  }
)(TaskEditorImplementation)

const RedirectingTaskEditor = taskRedirector(TaskEditor);

export { TaskCreator, TaskEditor, RedirectingTaskEditor };
