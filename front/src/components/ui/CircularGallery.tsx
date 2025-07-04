import React, { useState, useEffect } from 'react';
import './CircularGallery.css';

interface CircularGalleryProps {
  children: React.ReactNode[];
}

export const CircularGallery: React.FC<CircularGalleryProps> = ({ children }) => {
  const [radius, setRadius] = useState(440);
  const angleStep = 360 / children.length;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setRadius(200); // Tighter radius for mobile
      } else {
        setRadius(440);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="circular-gallery-container">
      <div className="circular-gallery-stage">
        <div className="circular-gallery">
          {children.map((child, i) => (
            <div
              key={i}
              className="gallery-item"
              style={
                {
                  '--angle': `${i * angleStep}deg`,
                  '--radius': `${radius}px`,
                } as React.CSSProperties
              }
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 