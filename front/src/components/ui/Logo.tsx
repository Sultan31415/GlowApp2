import React from 'react';

interface LogoProps {
  /**
   * Pixel size (both width & height). Defaults to 32.
   */
  size?: number;
  /**
   * Visual scale multiplier (uses CSS transform). Defaults to 1.
   */
  scale?: number;
  /**
   * Additional tailwind classes to apply to the <img> element.
   */
  className?: string;
}

/**
 * Small presentational component that renders the GlowApp logo.
 * Having a single component makes it trivial to keep the logo
 * consistent across the app and swap the asset in one place later.
 */
export const Logo: React.FC<LogoProps> = ({ size = 32, scale = 1, className = "" }) => (
  <img
    src="/icon.svg"
    alt="GlowApp logo"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center'
    }}
    className={`object-contain select-none ${className}`.trim()}
    draggable={false}
  />
);

export default Logo; 