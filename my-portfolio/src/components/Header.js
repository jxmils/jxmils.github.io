import React from 'react';
import '../Header.css';

const Header = () => (
  <header className="header">
    <div className="header-content">
      <h1 className="header-title">Jason Miller</h1>
      <p className="header-subtitle">Software Engineer | Tucson, AZ</p>
      <div className="header-contact">
        <p>📞 (575) 520-3458</p>
        <p>📧 <a href="mailto:jasonversamiller@gmail.com">jasonversamiller@gmail.com</a></p>
        <p>🌐 <a href="https://jxmils.github.io" target="_blank" rel="noopener noreferrer">jxmils.github.io</a></p>
      </div>
    </div>
  </header>
);

export default Header;
