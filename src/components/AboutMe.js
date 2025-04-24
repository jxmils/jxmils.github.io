import React from 'react';
import '../AboutMe.css';
import avatar from '../avatar.jpg';

const AboutMe = () => {
  return (
    <section className="about-me-section">
      <div className="about-me-content">

        {/* Introduction Section */}
        <div className="about-me-intro">
          <p>
            My name is <strong>Jason Paul Miller</strong>, a first-generation student and proud descendant of an immigrant family from Chihuahua, Mexico. 
            My mother’s unwavering determination to provide better opportunities for her children shaped my values of perseverance, education, and resilience.
          </p>
        </div>

        {/* Personal Journey */}
        <div className="about-me-journey">
          <h3>My Journey</h3>
          <p>
            Growing up in Las Cruces, New Mexico, I witnessed the sacrifices my mother made to ensure our future. Despite financial hardships, she instilled in me 
            the importance of learning and the belief that knowledge could transform lives. Inspired by her dedication, I pursued dual degrees in Electrical Engineering 
            and Computer Science at New Mexico State University while balancing work and family responsibilities.
          </p>
          <p>
            These experiences cultivated resilience and determination, enabling me to excel academically and become a leader among my peers. I founded and led the 
            Google Developer Student Club at my university, hosting workshops and hackathons to bridge the gap between theory and practice for students from underserved communities.
          </p>
        </div>

        {/* Challenges and Growth */}
        <div className="about-me-challenges">
          <h3>Overcoming Challenges</h3>
          <p>
            My journey was not without challenges. During my freshman year, my mother suffered a serious injury, placing financial and emotional responsibility on my shoulders. 
            Balancing a full-time academic schedule with supporting my family taught me time management, discipline, and resilience.
          </p>
          <p>
            I also endured the heartbreaking loss of four close friends to suicide. This tragedy deepened my empathy and fueled my commitment to mental health advocacy, 
            motivating me to make a meaningful impact in underserved communities.
          </p>
        </div>

        {/* Aspirations */}
        <div className="about-me-aspirations">
          <h3>My Aspirations</h3>
          <p>
            My research explores how optimized interconnects, in-network computing, and distributed memory architectures can enable faster, more efficient training of large neural networks.
          </p>
        </div>
      </div>

      {/* Image Section */}
      <div className="about-me-photo">
        <img 
          src={avatar} 
          alt="Jason Paul Miller" 
        />
      </div>
    </section>
  );
};

export default AboutMe;
