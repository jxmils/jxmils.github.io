import React, { useState } from 'react';
import '../WorkExperienceSection.css';

const WorkExperienceSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const experiences = [
    {
      title: 'Raytheon Technologies',
      subtitle: 'Signal Processing Engineer II (Scrum Master) | Tucson, AZ | Jan 2024 – Present',
      description: 'Led daily stand-up meetings, developed cross-organization software applications for analyzing missile/target tracking scenarios, wrote signal processing algorithms, and contributed to software architecture.',
    },
    {
      title: 'Sandia National Laboratories',
      subtitle: 'Computational Simulation Infrastructure Intern | Las Cruces, NM | Dec 2022 – Jan 2024',
      description: 'Implemented a CI/CD system to ensure seamless mirroring of repository updates across classified and unclassified networks, improving workflow efficiency.',
    },
    {
      title: 'New Mexico State University',
      subtitle: 'Machine Learning Research Assistant | Las Cruces, NM | Feb 2023 – Dec 2023',
      description: 'Analyzed the MIMIC-III dataset to develop a multifunctional machine learning model for sentiment analysis, patient background history, and clinical note topic extraction, enhancing healthcare insights.',
    },
    {
      title: 'Amazon',
      subtitle: 'Hardware Development Engineering Intern | Sunnyvale, CA | May 2023 – Aug 2023',
      description: 'Led the development of a cloud-based simulation application for battery use-cases, leveraging AWS infrastructure. Developed a dynamic front-end using React and a back-end simulation engine with Flask and PyBaMM.',
    },
    {
      title: 'Netflix',
      subtitle: 'Apprenticeship | Sunnyvale, CA | May 2023 – Aug 2023',
      description: 'Demonstrated expertise in Spring Boot and RESTful web services by implementing robust applications with comprehensive test coverage. Gained proficiency in GraphQL and Mockito for API development.',
    },
  ];

  return (
    <section className="work-experience-section">
      <h2 className="section-title">Work Experience</h2>
      <div className="timeline">
        {experiences.map((experience, index) => (
          <div
            key={index}
            className={`timeline-item ${activeIndex === index ? 'active' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <h3 className="experience-title">{experience.title}</h3>
              <p className="experience-subtitle">{experience.subtitle}</p>
              {activeIndex === index && (
                <p className="experience-description">{experience.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkExperienceSection;
