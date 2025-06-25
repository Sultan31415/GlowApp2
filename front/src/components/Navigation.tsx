import React, { useState } from 'react';
import { Plus, Target, MessageCircle, Home, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  onStartTest: () => void;
  hasResults: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ onStartTest, hasResults }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  return (
    <aside
      className={`group fixed top-0 left-0 h-screen ${isExpanded ? 'w-64' : 'w-16'} bg-white/10 backdrop-blur-lg border-r border-white/20 text-gray-800 flex flex-col py-4 shadow-lg z-50 transition-all duration-300 rounded-r-3xl`}
    >
      {/* Toggle / Logo */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mx-auto mb-6 flex items-center justify-center focus:outline-none transition-transform hover:scale-110"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {/* Default logo */}
        <img src="/lcon.png" alt="Logo" className="w-8 h-8 block group-hover:hidden" />
        {/* Toggle icons shown on hover */}
        {isExpanded ? (
          <PanelLeftClose className="w-8 h-8 text-gray-800 hidden group-hover:block" />
        ) : (
          <PanelLeftOpen className="w-8 h-8 text-gray-800 hidden group-hover:block" />
        )}
      </button>

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-2 w-full px-2 flex-1">
        {/* HOME (new section) */}
        <button
          onClick={() => (hasResults ? navigate('/dashboard') : navigate('/'))}
          className={`group ${isExpanded ? 'flex flex-row' : 'flex flex-col items-center'} w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/30 hover:text-gray-900 text-gray-700`}
        >
          <Home className="w-8 h-8" />
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">HOME</span>}​
        </button>

        {/* CREATE  GLow app */}
        <button
          onClick={onStartTest}
          className={`group ${isExpanded ? 'flex flex-row' : 'flex flex-col items-center'} w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/30 hover:text-gray-900 text-gray-700`}
        >
          <Plus className="w-8 h-8" />
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">Glow Up</span>}​
        </button>

        {/* My plan (formerly GOALS) */}
        <button
          onClick={() => {/* Future feature */}}
          disabled
          className={`group ${isExpanded ? 'flex flex-row' : 'flex flex-col items-center'} w-full py-3 rounded-lg transition-all duration-300 focus:outline-none opacity-50 cursor-not-allowed`}
        >
          <Target className="w-8 h-8" />
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">My plan</span>}​
        </button>

        {/* COACH */}
        <button
          onClick={() => {/* Future feature */}}
          className={`group ${isExpanded ? 'flex flex-row' : 'flex flex-col items-center'} w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/30 hover:text-gray-900 text-gray-700`}
        >
          <MessageCircle className="w-8 h-8" />
          {isExpanded && <span className="ml-3 text-sm font-semibold tracking-wide">COACH</span>}​
        </button>
      </nav>
      {/* User Profile */}
      <div className={`flex ${isExpanded ? 'flex-row justify-between' : 'flex-col items-center'} w-full mt-auto px-2`}>
        <SignedIn>
          <UserButton afterSignOutUrl='/' />
        </SignedIn>
      </div>
    </aside>
  );
};