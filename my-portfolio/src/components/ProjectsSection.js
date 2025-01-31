import React from 'react';
import '../ProjectsSection.css';

const ProjectsSection = () => {
  const projectData = [
    {
      title: 'DueNext',
      subtitle: 'Personal Project | Nov 2024 – Present',
      description: 'Developing an assignment tracker for iOS using Swift, designed to help students manage their deadlines effectively.'
    },
    {
      title: 'Aggie Pathfinder',
      subtitle: 'Personal Project | Jan 2023 – Present',
      description: 'Spearheaded the development of a campus navigational tool for iOS using Swift. Conducted extensive campus surveys and leveraged Apple\'s indoor map program to create an interactive 3D map for students and visitors.'
    },
    {
      title: 'Game Store Application',
      subtitle: 'Netflix Apprenticeship Project | May 2023 – Aug 2023',
      description: 'Developed a robust RESTful API for a game store using Java, Spring Boot, GraphQL, and MySQL. Successfully deployed the API to AWS, ensuring scalability and reliability.'
    },
    {
      title: 'Classifying Disaster Tweets',
      subtitle: 'Kaggle Competition | Jan 2023 – May 2023',
      description: 'Built a machine learning model to classify disaster-related tweets using a dataset of 10,000 manually labeled tweets. This tool was designed to assist emergency response teams.'
    },
    {
      title: 'Mini Baja Data Acquisition',
      subtitle: 'Engineering Capstone Project | Aug 2022 – Dec 2022',
      description: 'Developed a data acquisition system for the Mini Baja team, incorporating sensors to monitor vehicle performance. Designed and soldered the hardware system to collect and process telemetry data in real-time.'
    },
  ];

  return (
    <div className="timeline">
      {projectData.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <h3 className="project-title">{item.title}</h3>
            <p className="project-subtitle">{item.subtitle}</p>
            <p className="project-description">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsSection;
