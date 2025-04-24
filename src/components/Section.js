import React, { useEffect, useRef, useState } from 'react';

const Section = ({ title, children }) => {
  const sectionRef = useRef(null);
  const [styleProps, setStyleProps] = useState({
    margin: '40px auto',
    borderRadius: '12px',
    width: '900px',
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      
      // Calculate progress: 0 when the section is off-screen and 1 when its top reaches the top of the viewport.
      let progress = Math.min(
        Math.max((window.innerHeight - rect.top) / window.innerHeight, 0),
        1
      );
      
      // Apply non-linear easing for a harder (more abrupt) transition.
      // Using the square root makes small progress values larger—accelerating the effect.
      const easedProgress = Math.sqrt(progress);
      
      // Interpolate margin and border radius:
      // At easedProgress = 0 → margin = 40px, borderRadius = 12px.
      // At easedProgress = 1 → margin = 0, borderRadius = 0.
      const newMargin = 40 * (1 - easedProgress);
      const newBorderRadius = 12 * (1 - easedProgress);

      // Interpolate width from a fixed 900px to the full window width.
      const initialWidth = 900;
      const finalWidth = window.innerWidth;
      const newWidth = initialWidth * (1 - easedProgress) + finalWidth * easedProgress;
      
      setStyleProps({
        margin: `${newMargin}px auto`,
        borderRadius: `${newBorderRadius}px`,
        width: `${newWidth}px`,
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Run once on mount.
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="section" ref={sectionRef} style={styleProps}>
      <h2 className="section-title">{title}</h2>
      <div className="section-content">{children}</div>
    </div>
  );
};

export default Section;