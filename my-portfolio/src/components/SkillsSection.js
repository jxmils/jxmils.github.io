import React from 'react';
import '../SkillsSection.css';

const SkillsSection = () => {
  const skills = [
    {
      category: 'Programming Languages',
      items: [
        { name: 'Python', level: 90 },
        { name: 'Java', level: 85 },
        { name: 'C++', level: 85 },
        { name: 'JavaScript', level: 80 },
        { name: 'TypeScript', level: 75 },
        { name: 'SQL', level: 70 },
      ],
    },
    {
      category: 'Front-End Development',
      items: [
        { name: 'React', level: 80 },
        { name: 'HTML & CSS', level: 85 },
        { name: 'JavaScript (ES6+)', level: 80 },
        { name: 'TypeScript', level: 75 },
      ],
    },
    {
      category: 'Back-End Development',
      items: [
        { name: 'Flask', level: 80 },
        { name: 'Spring Boot', level: 75 },
        { name: 'GraphQL', level: 70 },
        { name: 'RESTful APIs', level: 85 },
      ],
    },
    {
      category: 'Machine Learning & Data Science',
      items: [
        { name: 'TensorFlow', level: 75 },
        { name: 'PyTorch', level: 70 },
        { name: 'Scikit-Learn', level: 80 },
        { name: 'Pandas & NumPy', level: 90 },
      ],
    },
    {
      category: 'Tools & Technologies',
      items: [
        { name: 'AWS', level: 70 },
        { name: 'Docker', level: 60 },
        { name: 'Git/GitHub', level: 85 },
        { name: 'Linux', level: 80 },
        { name: 'Jenkins', level: 65 },
      ],
    },
  ];

  return (
    <section className="skills-section">
      {skills.map((skillCategory, index) => (
        <div key={index} className="skills-category-block">
          <h3 className="skills-category-title">{skillCategory.category}</h3>
          <ul className="skills-list">
            {skillCategory.items.map((skill, idx) => (
              <li key={idx} className="skill-item">
                <div className="skill-name">{skill.name}</div>
                <div className="skill-bar">
                  <div
                    className="skill-bar-progress"
                    style={{ width: `${skill.level}%` }}
                    aria-label={`${skill.name} proficiency at ${skill.level}%`}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};

export default SkillsSection;
