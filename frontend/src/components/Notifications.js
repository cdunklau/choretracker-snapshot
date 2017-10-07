import React from 'react';
import { connect } from 'react-redux';

import { Levels } from '../actions/notificationActions';
import './Notifications.css';

const NotificationClasses = {
  [Levels.INFO]: 'InfoNotification',
  [Levels.ERROR]: 'ErrorNotification',
};

function Notifications({ notifications }) {
  return (
    <div className="Notifications">
      <ul>{
        notifications.map(n => (
          <li className={ NotificationClasses[n.level] }
              key={ n.id }>{ n.message }</li>
        ))
      }</ul>
    </div>
  );
}

export default connect(function mapStateToProps(state) {
  return { notifications: state.notifications };
})(Notifications);
