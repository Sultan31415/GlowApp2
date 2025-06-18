import React from 'react';
import { Zap, Home, TestTube, BarChart3 } from 'lucide-react';

interface NavigationProps {
  currentScreen: string;
  onNavigate: (screen: 'main' | 'dashboard') => void;
  onStartTest: () => void;
  hasResults: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, onStartTest, hasResults }) => {
  return (
    <header className="sticky top-0 z-50 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('main')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                currentScreen === 'main'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={onStartTest}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                currentScreen === 'quiz' || currentScreen === 'photo-upload' || currentScreen === 'loading'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span>Assessment</span>
            </button>

            <button
              onClick={() => hasResults ? onNavigate('dashboard') : null}
              disabled={!hasResults}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                currentScreen === 'dashboard' || currentScreen === 'results'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : hasResults
                  ? 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </nav>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              GlowApp
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};