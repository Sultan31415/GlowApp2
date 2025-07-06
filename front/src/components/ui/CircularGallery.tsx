import React, { useState, useEffect, useRef } from 'react';
import './CircularGallery.css';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface CircularGalleryProps {
  children: React.ReactNode[];
}

export const CircularGallery: React.FC<CircularGalleryProps> = ({ children }) => {
  const galleryRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(galleryRef, { threshold: 0.1 });
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
    <div className="circular-gallery-container" ref={galleryRef}>
      <div className="circular-gallery-stage">
        <div className={`circular-gallery ${!isVisible ? 'animation-paused' : ''}`}>
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