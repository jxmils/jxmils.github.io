import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import '../TimelineItem.css';

const TimelineItem = ({ title, description, date, color }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  const variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      ref={ref}
      className="timeline-item"
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="timeline-content">
        <span className="timeline-date">{date}</span>
        <h3 className="timeline-title">{title}</h3>
        <p className="timeline-description">{description}</p>
      </div>
    </motion.div>
  );
};

export default TimelineItem;
