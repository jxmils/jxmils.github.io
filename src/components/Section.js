import React from 'react';

const Section = ({ title, children }) => (
  <div className="section">
    <h2 className="section-title">{title}</h2>
    <div className="section-content">{children}</div>
  </div>
);

export default Section;
