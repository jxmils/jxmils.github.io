import React from 'react';

const SkillBar = ({ skill, level }) => (
  <div className="skill-bar">
    <p>{skill}</p>
    <div className="bar">
      <div className="progress" style={{ width: `${level}%` }}></div>
    </div>
  </div>
);

export default SkillBar;
