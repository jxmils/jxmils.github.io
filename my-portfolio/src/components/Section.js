import React from 'react';

const Section = ({ title, children }) => (
  <div className="section">
    <h2>{title}</h2>
    <div className="section-content">{children}</div>
  </div>
);

export default Section;
