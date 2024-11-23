import React, { useState, useRef, useEffect } from 'react';
import '../WorkExperienceSection.css';

const WorkExperienceSection = () => {
  const [scrollDirection, setScrollDirection] = useState(null);
  const timelineRef = useRef(null);
  const animationFrameRef = useRef(null); // To manage requestAnimationFrame

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
  useEffect(() => {
    let lastTime = performance.now();
  
    const smoothScroll = (currentTime) => {
      if (!timelineRef.current || !scrollDirection) return;
  
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
  
      const speed = 60; // Pixels per millisecond 
      const scrollAmount = deltaTime * speed;
  
      if (scrollDirection === 'left') {
        timelineRef.current.scrollLeft -= scrollAmount;
      } else if (scrollDirection === 'right') {
        timelineRef.current.scrollLeft += scrollAmount;
      }
  
      animationFrameRef.current = requestAnimationFrame(smoothScroll);
    };
  
    if (scrollDirection) {
      animationFrameRef.current = requestAnimationFrame(smoothScroll);
    }
  
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollDirection]);

  const handleMouseMove = (e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = rect.width;

    const centerThreshold = width * 0.25; // 25% dead zone in the center
    const center = width / 2;

    if (mouseX < center - centerThreshold) {
      setScrollDirection('left');
    } else if (mouseX > center + centerThreshold) {
      setScrollDirection('right');
    } else {
      setScrollDirection(null); // Stop scrolling
    }
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setScrollDirection(null)} // Stop scrolling when the mouse leaves
    >
      <div className="horizontal-timeline" ref={timelineRef}>
        {experiences.map((experience, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <h3 className="experience-title">{experience.title}</h3>
              <p className="experience-subtitle">{experience.subtitle}</p>
              <p className="experience-description">{experience.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkExperienceSection;
