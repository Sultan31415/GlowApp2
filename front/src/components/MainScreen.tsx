import React from 'react';
import { Sparkles, Target, User, TrendingUp, Brain, Heart } from 'lucide-react';

interface MainScreenProps {
  onStartTest: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onStartTest }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent block mb-2">
                GlowApp
              </span>
              <span className="text-3xl md:text-4xl text-gray-700 font-medium">
                Discover your transformation potential
              </span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              AI-powered assessment to unlock your true biological & emotional age
            </p>

            {/* Main CTA Button */}
            <button
              onClick={onStartTest}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 px-12 rounded-full text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 mb-4"
            >
              Start test 5 min
            </button>
            
            <p className="text-sm text-gray-500">
              ✨ 100% Free • Instant Results • Science-Based
            </p>
          </div>

          {/* Assessment Categories */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Physical Vitality</h3>
              <p className="text-gray-600 text-sm">Energy levels, sleep quality, fitness habits</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Emotional Health</h3>
              <p className="text-gray-600 text-sm">Stress levels, mood patterns, social connections</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Visual Appearance</h3>
              <p className="text-gray-600 text-sm">Skin health, confidence, self-perception</p>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-16 shadow-lg border border-white/20">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">What You'll Receive</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Glow Score</h4>
                <p className="text-gray-600">Get your personalized transformation score out of 100</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">AI Avatar</h4>
                <p className="text-gray-600">See your transformation potential visualized</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Custom Plan</h4>
                <p className="text-gray-600">Receive personalized micro-habits for transformation</p>
              </div>
            </div>
          </div>

          {/* Your Tools Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 mb-16 shadow-lg border border-white/20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Transformation Tools</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to start and track your glow-up journey
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Track Your Progress */}
              <div className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Track Progress</h3>
                    <p className="text-gray-600">Monitor your daily achievements and growth</p>
                  </div>
                </div>
              </div>

              {/* Start Your Journey */}
              <div className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Journey</h3>
                    <p className="text-gray-600">Begin your transformation today</p>
                  </div>
                </div>
              </div>

              {/* AI Coach (future) */}
              <div className="group opacity-75">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 h-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl mb-4 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Coach</h3>
                    <p className="text-gray-600">Personalized coaching with AI</p>
                  </div>
                </div>
              </div>

              {/* Talk to Yourself (future) */}
              <div className="group opacity-75">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 h-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl mb-4 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Self Reflection</h3>
                    <p className="text-gray-600">Reflect and grow with journaling</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Get Started Button */}
            <div className="text-center">
              <button
                onClick={onStartTest}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-lg"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Get Started
              </button>
            </div>
          </div>

          {/* Trust/Credibility Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">We are Transformation-Seekers</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered assessment is grounded in scientific research on biological aging, 
              emotional intelligence, and lifestyle factors. We analyze your responses using 
              cutting-edge algorithms to provide accurate insights into your true age and 
              transformation potential.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};