import React, { useState, useEffect } from 'react';
import { Navigation } from '../components/ui/Navigation';
import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '../hooks';

export const AppLayout = ({ children, onStartTest, hasResults }: { children: React.ReactNode, onStartTest: () => void, hasResults: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [isMobile]);
  
  // Hide navigation on landing page for signed-out users
  const shouldShowNavigation = isSignedIn || location.pathname !== '/';

  const sidebarWidth = isExpanded ? '256px' : '64px'; // Corresponds to ml-64 and ml-16 in Tailwind
  const mainContentPaddingLeft = ''; // Let individual screens handle any offset
  const mainContentPadding = shouldShowNavigation && isMobile ? 'p-4' : ''; // Mobile padding only

  return (
    <div 
      className="min-h-screen text-[#0f172a]"
      style={{ '--sidebar-width': shouldShowNavigation && !isMobile ? sidebarWidth : '0px' } as React.CSSProperties}
    >
      {shouldShowNavigation && (
        <Navigation 
          onStartTest={onStartTest} 
          hasResults={hasResults} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      )}
      <main className={`transition-all duration-300 ${mainContentPadding}`}>
        {children}
      </main>
    </div>
  );
};
