import React from 'react';
import '../EducationSection.css';

const EducationSection = () => {
  const educationData = [
    {
      institution: 'New Mexico State University',
      degree: 'Masters Accelerated Program: Electrical Engineering & Computer Science',
      gpa: 'GPA: 3.9',
      dates: 'Aug 2018 – Dec 2023',
      description: (
        <>
          B.S. <strong>Electrical Engineering</strong>: Communication and Signal Processing | B.S. <strong>Computer Science</strong>
        </>
      ),
    },
    {
      institution: 'Google Tech Exchange',
      degree: 'Google HQ and Virtual | 2022 – 2023',
      description: 'Focused on Machine Learning and Applied Data Structures. Participated in advanced workshops and projects.'
    },
    // Add more education experiences as needed
  ];

  return (
    <div className="timeline">
      {educationData.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3 className="institution">{item.institution}</h3>
            <p className="degree">{item.degree}</p>
            {item.gpa && <p className="gpa"><strong>{item.gpa}</strong></p>}
            <p className="dates">{item.dates}</p>
            <p className="description">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EducationSection;
