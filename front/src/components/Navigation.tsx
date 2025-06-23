import React from 'react';
import { Zap, Plus, User, Target, MessageCircle, GraduationCap, Home } from 'lucide-react';
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
      <nav className="group flex flex-col items-center space-y-4 w-full px-2 flex-1">
        {/* HOME (new section) */}
        <button
          onClick={() => (hasResults ? navigate('/dashboard') : navigate('/'))}
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none ${
            (location.pathname === '/' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/results') || location.pathname.startsWith('/micro-habits')) ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">HOME</span>
        </button>

        {/* CREATE  GLow app */}
        <button
          onClick={onStartTest}
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none ${
            location.pathname.startsWith('/test') ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
          }`}
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">Glow Up</span>
        </button>

        {/* My plan (formerly GOALS) */}
        <button
          onClick={() => {/* Future feature */}}
          disabled
          className={`group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none ${
            'opacity-50 cursor-not-allowed'
          }`}
        >
          <Target className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">My plan</span>
        </button>

        {/* COACH */}
        <button
          onClick={() => {/* Future feature */}}
          className="group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none hover:bg-white/10 text-white/80"
        >
          <MessageCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">COACH</span>
        </button>
      </nav>
      {/* ME (moved to bottom) */}
      <div className="flex flex-col items-center w-full mt-auto px-2">
        <button
          disabled
          className="group flex flex-col items-center w-full py-3 rounded-lg transition-all duration-300 focus:outline-none opacity-50 cursor-not-allowed"
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">ME</span>
        </button>
      </div>
    </aside>
  );
};