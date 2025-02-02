import React from 'react';
import '../SkillBar.css';

const SkillBar = ({ skill, level }) => (
  <div className="skill-bar-container">
    <div className="skill-label">
      <span>{skill}</span>
      <span>{level}%</span>
    </div>
    <div className="skill-bar">
      <div
        className="skill-bar-progress"
        style={{ width: `${level}%` }}
        aria-label={`${skill} proficiency at ${level}%`}
      ></div>
    </div>
  </div>
);

export default SkillBar;
