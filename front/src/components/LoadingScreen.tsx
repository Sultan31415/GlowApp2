import React from 'react';
import { Sparkles, Brain, Zap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            <Brain className="w-12 h-12 text-white animate-pulse" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute -top-2 -right-2 animate-bounce">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Analyzing Your Assessment
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Our AI is calculating your Glow Score and generating your personalized transformation plan...
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Loading Steps */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-gray-700">Processing your quiz responses</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-gray-700">Analyzing your photo</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">Calculating your Glow Score</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              <span className="text-gray-500">Generating your transformation plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};