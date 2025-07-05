import React, { useState } from 'react';
import { Navigation } from '../components/ui/Navigation';
import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export const AppLayout = ({ children, onStartTest, hasResults }: { children: React.ReactNode, onStartTest: () => void, hasResults: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSignedIn } = useAuth();
  const location = useLocation();
  
  // Hide navigation on landing page for signed-out users
  const shouldShowNavigation = isSignedIn || location.pathname !== '/';

  const sidebarWidth = isExpanded ? '256px' : '64px'; // Corresponds to ml-64 and ml-16 in Tailwind

  return (
    <div 
      className="min-h-screen aurora-bg text-[#0f172a]"
      style={{ '--sidebar-width': shouldShowNavigation ? sidebarWidth : '0px' } as React.CSSProperties}
    >
      {shouldShowNavigation && (
        <Navigation 
          onStartTest={onStartTest} 
          hasResults={hasResults} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      )}
      <main className={`transition-all duration-300 ${shouldShowNavigation ? (isExpanded ? 'ml-64' : 'ml-16') : 'ml-0'} ${shouldShowNavigation ? 'p-6' : 'p-0'}`}>
        {children}
      </main>
    </div>
  );
};
