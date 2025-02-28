import React from 'react';
import TimelineItem from './TimelineItem.js';
import '../Timeline.css';

const timelineData = [
  {
    title: "Started College",
    date: "August 2016",
    description: "I began my journey in Electrical Engineering and Computer Science.",
    color: "#A8DADC"
  },
  {
    title: "First Internship",
    date: "Summer 2018",
    description: "I landed my first internship and learned about scalable software.",
    color: "#F1FAEE"
  },
  {
    title: "Graduated",
    date: "May 2020",
    description: "Graduated with honors and a passion for innovation.",
    color: "#457B9D"
  },
  {
    title: "Joined Industry",
    date: "July 2020",
    description: "Started working on impactful projects at a leading tech company.",
    color: "#1D3557"
  },
  // Add additional timeline items as needed...
];

const Timeline = () => {
  return (
    <div className="timeline-container">
      {timelineData.map((item, index) => (
        <TimelineItem 
          key={index}
          title={item.title}
          date={item.date}
          description={item.description}
          color={item.color}
        />
      ))}
    </div>
  );
};

export default Timeline;
