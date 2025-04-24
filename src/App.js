import React, { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Section from './components/Section';
import AboutMe from './components/AboutMe';
import WorkExperienceSection from './components/WorkExperienceSection';
import EducationSection from './components/EducationSection';
import SkillsSection from './components/SkillsSection';
import ProjectsSection from './components/ProjectsSection';
import ContactMe from './components/ContactMe';  // Import the new Contact Me component
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
          <EducationSection />
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
          <ProjectsSection />
        </Section>
      ),
    },
    {
      title: 'Contact',
      content: (
        <Section title="Contact">
          <ContactMe />
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