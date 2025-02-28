import React from 'react';
import Graph from './Graph';
import '../Header.css';

const Header = () => (
  <header className="header">
    <Graph />
    <div className="header-content">
      <h1 className="header-title">Jason Miller</h1>
      <p className="header-subtitle">Electrical & Software Engineer</p>
      <div className="header-contact">
        </div>
      </div>
  </header>
);

export default Header;
