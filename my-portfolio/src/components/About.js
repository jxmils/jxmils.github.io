import React from 'react';

const About = () => (
  <section id="about">
    <h2>About Me</h2>
    <p>Hello! I'm Jason, a software developer passionate about creating intuitive user experiences.</p>
  </section>
);

export default About;{
    "name": "my-portfolio",
    "version": "0.1.0",
    "private": true,
    "homepage": "https://jxmils.github.io",
    "dependencies": {
      "@emotion/react": "^11.13.5",
      "@emotion/styled": "^11.13.5",
      "@mui/material": "^6.1.8",
      "@testing-library/jest-dom": "^5.17.0",
      "@testing-library/react": "^13.4.0",
      "@testing-library/user-event": "^13.5.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-scripts": "^5.0.1",
      "web-vitals": "^2.1.4"
    },
    "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject",
      "predeploy": "npm run build",
      "deploy": "gh-pages -d build"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    },
    "devDependencies": {
      "gh-pages": "^5.0.0"
    }
  }import React, { useState } from 'react';
  import Header from './components/Header';
  import Tabs from './components/Tabs';
  import Section from './components/Section';
  import Card from './components/Card';
  import SkillBar from './components/SkillBar';
  import Footer from './components/Footer';
  
  const App = () => {
    const [selectedTab, setSelectedTab] = useState(0);
  
    const sections = [
      {
        title: 'Education',
        content: (
          <Section title="Education">
            <Card
              title="New Mexico State University"
              subtitle="Masters Accelerated Program: Electrical Engineering - GPA: 3.889"
              description="B.S. Electrical Engineering: Communication and Signal Processing | B.S. Computer Science"
            />
            <Card
              title="Google Tech Exchange"
              subtitle="Google HQ and Virtual | 2022 – 2023"
              description="Focused on Machine Learning and Applied Data Structures. Participated in advanced workshops and projects, gaining hands-on experience in software engineering and machine learning practices."
            />
          </Section>
        ),
      },
      {
        title: 'Work Experience',
        content: (
          <Section title="Work Experience">
            <Card
              title="Raytheon Technologies"
              subtitle="Signal Processing Engineer II (Scrum Master) | Tucson, AZ | Jan 2024 – Present"
              description="Led daily stand-up meetings, developed cross-organization software applications for analyzing missile/target tracking scenarios, wrote signal processing algorithms, and contributed to software architecture."
            />
            <Card
              title="Sandia National Laboratories"
              subtitle="Computational Simulation Infrastructure Intern | Las Cruces, NM | Dec 2022 – Jan 2024"
              description="Implemented a CI/CD system to ensure seamless mirroring of repository updates across classified and unclassified networks, improving workflow efficiency."
            />
            <Card
              title="New Mexico State University"
              subtitle="Machine Learning Research Assistant | Las Cruces, NM | Feb 2023 – Dec 2023"
              description="Analyzed the MIMIC-III dataset to develop a multifunctional machine learning model for sentiment analysis, patient background history, and clinical note topic extraction, enhancing healthcare insights."
            />
            <Card
              title="Amazon"
              subtitle="Hardware Development Engineering Intern | Sunnyvale, CA | May 2023 – Aug 2023"
              description="Led the development of a cloud-based simulation application for battery use-cases, leveraging AWS infrastructure. Developed a dynamic front-end using React and a back-end simulation engine with Flask and PyBaMM."
            />
            <Card
              title="Netflix"
              subtitle="Apprenticeship | Sunnyvale, CA | May 2023 – Aug 2023"
              description="Demonstrated expertise in Spring Boot and RESTful web services by implementing robust applications with comprehensive test coverage. Gained proficiency in GraphQL and Mockito for API development."
            />
            <Card
              title="BlackSky"
              subtitle="Geospatial/Software Developer Co-Op | Las Cruces, NM | Sep 2022 – Mar 2023"
              description="Developed synthetic data using rendered.ai for training supervised learning models to identify missile vehicles. Created presentations for Department of Defense customers, showcasing innovative solutions."
            />
            <Card
              title="Johns Hopkins University Applied Physics Laboratory"
              subtitle="Electrical/Software Engineering Intern | Laurel, MD | May 2022 – Aug 2022"
              description="Developed a high-performance 1024-point FFT on the RB5 platform using Hexagon SDK. Designed an efficient server-client data serialization system with Protocol Buffers and gRPC."
            />
            <Card
              title="TMC Design Corporation"
              subtitle="Electrical Engineering Co-Op | Las Cruces, NM | Oct 2019 – May 2022"
              description="Designed detailed system layouts, power systems, and RF signal pathways. Conducted research to source innovative electrical components, and managed projects using advanced procurement strategies."
            />
          </Section>
        ),
      },    
      {
        title: 'Skills',
        content: (
          <Section title="Skills">
            <Section title="Programming Languages">
              <SkillBar skill="Python" level={90} />
              <SkillBar skill="Java" level={85} />
              <SkillBar skill="C++" level={85} />
              <SkillBar skill="JavaScript" level={80} />
              <SkillBar skill="TypeScript" level={75} />
              <SkillBar skill="SQL" level={70} />
            </Section>
            <Section title="Front-End Development">
              <SkillBar skill="React" level={80} />
              <SkillBar skill="HTML & CSS" level={85} />
              <SkillBar skill="JavaScript (ES6+)" level={80} />
              <SkillBar skill="TypeScript" level={75} />
            </Section>
            <Section title="Back-End Development">
              <SkillBar skill="Flask" level={80} />
              <SkillBar skill="Spring Boot" level={75} />
              <SkillBar skill="GraphQL" level={70} />
              <SkillBar skill="RESTful APIs" level={85} />
            </Section>
            <Section title="Machine Learning & Data Science">
              <SkillBar skill="TensorFlow" level={75} />
              <SkillBar skill="PyTorch" level={70} />
              <SkillBar skill="Scikit-Learn" level={80} />
              <SkillBar skill="Pandas & NumPy" level={90} />
            </Section>
            <Section title="Tools & Technologies">
              <SkillBar skill="AWS" level={70} />
              <SkillBar skill="Docker" level={60} />
              <SkillBar skill="Git/GitHub" level={85} />
              <SkillBar skill="Linux" level={80} />
              <SkillBar skill="Jenkins" level={65} />
            </Section>
          </Section>
        ),
      },
      {
        title: 'Projects',
        content: (
          <Section title="Projects">
            <Card
              title="DueNext"
              subtitle="Personal Project | Nov 2024 – Present"
              description="Developing an assignment tracker for iOS using Swift, designed to help students manage their deadlines effectively."
            />
            <Card
              title="Aggie Pathfinder"
              subtitle="Personal Project | Jan 2023 – Present"
              description="Spearheaded the development of a campus navigational tool for iOS using Swift. Conducted extensive campus surveys and leveraged Apple's indoor map program to create an interactive 3D map for students and visitors."
            />
            <Card
              title="Game Store Application"
              subtitle="Netflix Apprenticeship Project | May 2023 – Aug 2023"
              description="Developed a robust RESTful API for a game store using Java, Spring Boot, GraphQL, and MySQL. Successfully deployed the API to AWS, ensuring scalability and reliability."
            />
            <Card
              title="Classifying Disaster Tweets"
              subtitle="Kaggle Competition | Jan 2023 – May 2023"
              description="Built a machine learning model to classify disaster-related tweets using a dataset of 10,000 manually labeled tweets. This tool was designed to assist emergency response teams."
            />
            <Card
              title="Mini Baja Data Acquisition"
              subtitle="Engineering Capstone Project | Aug 2022 – Dec 2022"
              description="Developed a data acquisition system for the Mini Baja team, incorporating sensors to monitor vehicle performance. Designed and soldered the hardware system to ensure high precision and reliability."
            />
          </Section>
        ),
      },
    ];
  
    return (
      <div>
        <Header />
        <Tabs
          tabs={sections.map((section) => section.title)}
          onSelect={(index) => setSelectedTab(index)}
        />
        {sections[selectedTab].content}
        <Footer />
      </div>
    );
  };
  
  export default App;import React from 'react';
  
  const Footer = () => (
    <footer className="footer">
      <p>© 2024 Jason Miller | Secret Clearance | Languages: English, Spanish</p>
    </footer>
  );
  
  export default Footer;import React from 'react';
  
  const Contact = () => (
    <section id="contact">
      <h2>Contact Me</h2>
      <p>Email: <a href="mailto:jasonversamiller@gmail.com">jasonversamiller@gmail.com</a></p>
    </section>
  );
  
  export default Contact;import React from 'react';
  
  const Projects = () => (
    <section id="projects">
      <h2>My Projects</h2>
      <ul>
        <li>
          <h3>Project 1</h3>
          <p>Description of your project.</p>
        </li>
        <li>
          <h3>Project 2</h3>
          <p>Description of another project.</p>
        </li>
      </ul>
    </section>
  );
  
  export default Projects;
