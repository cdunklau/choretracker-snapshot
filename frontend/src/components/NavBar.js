import React from 'react';
import { NavLink } from 'react-router-dom';

import './NavBar.css';


function NavBar(props) {
  return (
    <nav className="NavBar">
      <NavLink exact to="/">Home</NavLink>
      <NavLink exact to="/tasks">Tasks</NavLink>
      <NavLink exact to="/tasks/new">Create Task</NavLink>
    </nav>
  );
}

export default NavBar;
