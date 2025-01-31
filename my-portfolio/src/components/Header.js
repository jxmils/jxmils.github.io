import React from 'react';
import '../Header.css';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

const Header = () => (
  <header className="header">
    <div className="header-content">
      <h1 className="header-title">Jason Miller</h1>
      <p className="header-subtitle">Electrical & Software Engineer</p>
      <div className="header-contact">
        <div className="contact-item">📞 (575) 520-3458</div>
        <div className="contact-item">
          📧 <a href="mailto:jasonversamiller@gmail.com">jasonversamiller@gmail.com</a>
        </div>
        <div className="contact-item">
          🌐 <a href="https://jxmils.github.io" target="_blank" rel="noopener noreferrer">jxmils.github.io</a>
        </div>
        <div className="header-socials">
          <a
            href="https://www.linkedin.com/in/jason-miller-379727163/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://github.com/jxmils"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
