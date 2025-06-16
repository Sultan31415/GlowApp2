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
    <header className="py-6 bg-white/50 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              GlowApp
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            <button
              onClick={() => onNavigate('main')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                currentScreen === 'main'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Main</span>
            </button>

            <button
              onClick={onStartTest}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                currentScreen === 'quiz' || currentScreen === 'photo-upload' || currentScreen === 'loading'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span>Test</span>
            </button>

            <button
              onClick={() => hasResults ? onNavigate('dashboard') : null}
              disabled={!hasResults}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                currentScreen === 'dashboard' || currentScreen === 'results'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : hasResults
                  ? 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};