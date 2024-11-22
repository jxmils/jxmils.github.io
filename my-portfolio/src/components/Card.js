import React from 'react';

const Card = ({ title, subtitle, description }) => (
  <div className="card">
    <h3>{title}</h3>
    <p><strong>{subtitle}</strong></p>
    <p>{description}</p>
  </div>
);

export default Card;
