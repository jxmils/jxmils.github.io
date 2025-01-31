import React from 'react';

const Card = ({ title, subtitle, description }) => (
  <div className="card">
    <h3 className="card-title">{title}</h3>
    <p className="card-subtitle">{subtitle}</p>
    <p className="card-description">{description}</p>
  </div>
);

export default Card;
