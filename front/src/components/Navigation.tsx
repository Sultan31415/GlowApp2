import React from 'react';
import { Zap, Plus, User, Target, MessageCircle, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  onStartTest: () => void;
  hasResults: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ onStartTest, hasResults }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside className="fixed top-0 left-0 h-screen w-20 bg-gradient-to-b from-purple-600 to-pink-600 text-white flex flex-col items-center py-6 shadow-lg z-50">
      {/* Logo */}
      <div className="group flex flex-col items-center mb-8">
        <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center shadow-md">
          <Zap className="w-6 h-6" />
        </div>
        
      </div>

      {/* Navigation Links */}
      <nav className="group flex flex-col items-center space-y-4 w-full px-2">
        {/* ME */}
        <button
          onClick={() => navigate('/')}
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none ${
            location.pathname === '/'
              ? 'bg-white/20 text-white'
              : 'hover:bg-white/10 text-white/80'
          }`}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">ME</span>
        </button>

        {/* CREATE */}
        <button
          onClick={onStartTest}
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/10 text-white/80`}
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">CREATE</span>
        </button>

        {/* GOALS */}
        <button
          onClick={() => hasResults ? navigate('/dashboard') : null}
          disabled={!hasResults}
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none ${
            location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/results') || location.pathname.startsWith('/micro-habits')
              ? 'bg-white/20 text-white'
              : hasResults
              ? 'hover:bg-white/10 text-white/80'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <Target className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">GOALS</span>
        </button>

        {/* COACH */}
        <button
          onClick={() => {/* Future feature */}}
          className="group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/10 text-white/80"
        >
          <MessageCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">COACH</span>
        </button>

        {/* RESOURCES */}
        <button
          onClick={() => {/* Future feature */}}
          className="group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/10 text-white/80"
        >
          <GraduationCap className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">RESOURCES</span>
        </button>
      </nav>
    </aside>
  );
};