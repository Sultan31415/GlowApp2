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
   * Enable rolling animation. Defaults to false.
   */
  animate?: boolean;
  /**
   * Additional tailwind classes to apply to the <img> element.
   */
  className?: string;
}

/**
 * Small presentational component that renders the Oylan logo.
 * Having a single component makes it trivial to keep the logo
 * consistent across the app and swap the asset in one place later.
 */
export const Logo: React.FC<LogoProps> = ({ size = 64, scale = 1, animate = false, className = "" }) => (
  <img
    src="/icon.svg"
    alt="Oylan logo"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      '--logo-scale': scale.toString()
    } as React.CSSProperties}
    className={`object-contain select-none ${animate ? 'animate-logo-roll' : ''} ${className}`.trim()}
    draggable={false}
  />
);

// Add the keyframes to the document head if not already present
if (typeof document !== 'undefined' && !document.querySelector('#logo-animation-styles')) {
  const style = document.createElement('style');
  style.id = 'logo-animation-styles';
  style.textContent = `
    @keyframes logoRoll {
      0% { transform: scale(var(--logo-scale)) rotate(0deg); }
      100% { transform: scale(var(--logo-scale)) rotate(360deg); }
    }
    .animate-logo-roll {
      animation: logoRoll 23s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

export default Logo; 