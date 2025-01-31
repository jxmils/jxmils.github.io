import React, { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Section from './components/Section';
import AboutMe from './components/AboutMe'; // Import About Me Section
import WorkExperienceSection from './components/WorkExperienceSection';
import SkillsSection from './components/SkillsSection';
import Card from './components/Card';
import Footer from './components/Footer';

const App = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const sections = [
    {
      title: 'About Me',
      content: (
        <Section title="About Me">
          <AboutMe />
        </Section>
      ),
    },
    {
      title: 'Education',
      content: (
        <Section title="Education">
          <Card
            title="New Mexico State University"
            subtitle="Masters Accelerated Program: Electrical Engineering & Computer Science- GPA: 3.889"
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
          <WorkExperienceSection />
        </Section>
      ),
    },
    {
      title: 'Skills',
      content: (
        <Section title="Skills">
          <SkillsSection />
          <footer className="skills-section-footer">
            © 2024 Jason Miller | Secret Clearance | Languages: English, Spanish
          </footer>
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
          <Card
            title="AI Sentient Garden"
            subtitle="Interactive Art Installation | 2024"
            description="Created an AI-powered interactive art installation that translates plant biofeedback into light and sound patterns using Arduino, sensors, and custom AI algorithms."
          />
          <Card
            title="N-Queens Visualizer"
            subtitle="Algorithm Visualization Tool | 2023"
            description="Developed a modern algorithm visualizer for the N-Queens problem, showcasing step-by-step solutions with interactive pseudocode and animations."
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

export default App;
