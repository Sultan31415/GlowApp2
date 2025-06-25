import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';

export const AppLayout = ({ children, onStartTest, hasResults }: { children: React.ReactNode, onStartTest: () => void, hasResults: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] via-[#eef1f7] to-white text-[#0f172a]">
      <Navigation 
        onStartTest={onStartTest} 
        hasResults={hasResults} 
        isExpanded={isExpanded} 
        setIsExpanded={setIsExpanded} 
      />
      <main className={`transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'} p-6`}>
        {children}
      </main>
    </div>
  );
};
