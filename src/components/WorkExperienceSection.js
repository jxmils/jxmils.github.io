import React, { useState } from 'react';
import '../WorkExperienceSection.css';

const WorkExperienceSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const experiences = [
    {
      company: 'Raytheon Technologies',
      role: 'Software Engineer II (Scrum Master)',
      location: 'Tucson, AZ',
      dates: 'Jan 2024 – Present',
      responsibilities: [
        'Led daily stand-up meetings, program increment planning, demos, and assigned user stories/bugs/features as a Scrum Master.',
        'Developed a cross-organization software application for analyzing missile/target tracking scenarios using Python, PyQt, NumPy, and Matplotlib, featuring various plotting functionalities.',
        'Wrote signal processing algorithms and machine learning models for missile/target tracking scenarios, enhancing tracking accuracy and data analysis.',
        'Contributed to the software’s architecture, focusing on data handling and efficient processing for missile and target tracking analysis.',
      ],
    },
    {
      company: 'Sandia National Laboratories',
      role: 'Software Engineering Intern',
      location: 'Las Cruces, NM',
      dates: 'Dec 2022 – Jan 2024',
      responsibilities: [
        'Implemented a Continuous Integration/Continuous Delivery (CI/CD) system to ensure seamless mirroring of repository updates across both classified and unclassified networks, improving communication, workflow, efficiency, and security.',
      ],
    },
    {
      company: 'Amazon',
      role: 'Hardware Development Engineering Intern',
      location: 'Sunnyvale, CA',
      dates: 'May 2023 – Aug 2023',
      responsibilities: [
        'Led the end-to-end development of a customized cloud-based simulation application for battery use-cases, tailored to meet the specific needs of Amazon’s product lines.',
        'Leveraged AWS infrastructure to enhance accuracy, optimization, and scalability of the simulation platform.',
        'Took charge of full stack development, employing React for the dynamic front-end user interface (UI/UX) and Flask with PyBaMM for the robust back-end simulation engine.',
        'Ensured seamless integration and smooth performance across the application, resulting in a powerful and user-friendly battery simulation tool.',
      ],
    },
    {
      company: 'Netflix',
      role: 'Software Apprenticeship',
      location: 'Sunnyvale, CA',
      dates: 'May 2023 – Aug 2023',
      responsibilities: [
        'Demonstrated expertise in Spring Boot and RESTful web services, measured by successful implementation of robust applications with comprehensive test coverage.',
        'Achieved proficiency in working with data stores and Spring Data JPA, measured by the successful development of web services that leverage relational databases, advanced SQL statements, and effective object-relational mapping.',
        'Mastered the use of Mockito, services, and GraphQL, measured by writing effective test cases, mocking dependencies, and implementing GraphQL APIs in web service projects.',
      ],
    },
    {
      company: 'BlackSky',
      role: 'Software Engineering Intern',
      location: 'Las Cruces, NM',
      dates: 'Sep 2022 – Mar 2023',
      responsibilities: [
        'Spearheaded proposal creation for a joint effort with local laboratories to improve Moving Target Indicator functionality.',
        'Crafted compelling presentations that showcased product insights for Department of Defense customers, effectively communicating key information, driving engagement, and securing collaborations.',
        'Developed synthetic data using rendered.ai to train a supervised learning model capable of accurately identifying missile vehicles.',
      ],
    },
    {
      company: 'Johns Hopkins University Applied Physics Laboratory',
      role: 'Software Engineering Intern',
      location: 'Laurel, MD, USA',
      dates: 'May 2022 – Aug 2022',
      responsibilities: [
        'Pioneered advancements in embedded systems by independently researching and developing a high-performance 1024-point Fast Fourier Transform (FFT) implementation on the RB5 platform’s CPU and DSP using Hexagon SDK, achieving significant speed improvements and enabling further integration into embedded applications.',
        'Expertly employed technologies like Google’s Protocol Buffers and gRPC to design a highly efficient data serialization and transfer server-client application, optimizing performance while maintaining minimal memory usage.',
      ],
    },
    {
      company: 'TMC Design Corporation',
      role: 'Electrical Engineering Intern',
      location: 'Las Cruces, NM, USA',
      dates: 'Oct 2019 – May 2022',
      responsibilities: [
        'Gained project management expertise by contributing to the successful delivery of multiple projects, employing advanced procurement strategies like CHESS and Gantt charts to secure resources and ensure timely execution.',
        'Developed proficiency in operating a range of testing equipment, including Signal and Network Analyzers, Signal Generators, FieldFoxes, Oscilloscopes, Multimeters, and Soldering stations, contributing to high-quality system performance.',
        'Designed detailed schematics, including system layouts, power systems, and RF signal pathways, ensuring efficient and reliable project execution.',
        'Conducted independent research to source new electrical components and materials that met or exceeded system design requirements, driving innovation in project development.',
        'Oversaw product life cycles from initial development to end-user satisfaction, ensuring successful project outcomes and alignment with customer needs.',
      ],
    },
    {
      company: 'New Mexico State University',
      role: 'Associate Justice',
      location: 'Las Cruces, NM, USA',
      dates: 'Feb 2019 – Oct 2019',
      responsibilities: [
        'Revised the Associated Students of New Mexico’s Law book to improve support for student life and streamline internal governmental structure and procedures.',
        'Led the planning and execution of campus-wide events, which featured free food, activities, and university merchandise. These events resulted in a 30% increase in attendance.',
      ],
    },
  ];

  return (
    <div className="work-experience-section">
      <ul className="timeline">
        {experiences.map((exp, index) => (
          <li
            key={index}
            className={`timeline-item ${index === hoveredIndex ? 'active' : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <h3 className="company-name">{exp.company}</h3>
              <p className="role">{exp.role}</p>
              <p className="location">{exp.location} | {exp.dates}</p>
              <ul className="responsibilities">
                {exp.responsibilities.map((responsibility, idx) => (
                  <li key={idx}>{responsibility}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkExperienceSection;
