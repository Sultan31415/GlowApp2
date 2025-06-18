import React from 'react';
import { Sparkles, Brain, Zap, Star } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Animated Icon */}
        <div className="relative mb-12">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/25 mx-auto">
            <Brain className="w-16 h-16 text-white animate-pulse" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute -top-4 -right-4 animate-bounce">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="w-10 h-10 bg-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="absolute top-1/2 -left-8 animate-bounce" style={{ animationDelay: '1s' }}>
            <div className="w-8 h-8 bg-pink-400 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Star className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
          Analyzing Your Assessment
        </h2>
        <p className="text-xl text-gray-600 font-light mb-12 leading-relaxed">
          Our AI is calculating your Glow Score and generating your personalized transformation plan...
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-3 mb-12">
          <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Loading Steps */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-gray-500/5 border border-gray-100">
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700 font-medium">Processing your quiz responses</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700 font-medium">Analyzing your photo</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-purple-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-gray-700 font-medium">Calculating your Glow Score</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-gray-300 rounded-full shadow-sm"></div>
              <span className="text-gray-500 font-medium">Generating your transformation plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};