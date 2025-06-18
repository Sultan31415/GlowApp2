import React from 'react';
import { Sparkles, Target, User, TrendingUp, Brain, Heart, ArrowRight, Star } from 'lucide-react';

interface MainScreenProps {
  onStartTest: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onStartTest }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" fill="currentColor" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 leading-none tracking-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                GlowApp
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-600 font-light mb-4 max-w-3xl mx-auto leading-relaxed">
              Discover your transformation potential
            </p>
            
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              AI-powered assessment to unlock your true biological & emotional age
            </p>

            {/* Main CTA Button */}
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={onStartTest}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-5 px-12 rounded-2xl text-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <span>Start Assessment</span>
                <div className="flex items-center gap-1 text-sm opacity-75">
                  <span>5 min</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Science-Based</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Categories */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Physical Vitality</h3>
                <p className="text-gray-600 leading-relaxed">Energy levels, sleep quality, fitness habits</p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-pink-200 transition-all duration-500 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Emotional Health</h3>
                <p className="text-gray-600 leading-relaxed">Stress levels, mood patterns, social connections</p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Appearance</h3>
                <p className="text-gray-600 leading-relaxed">Skin health, confidence, self-perception</p>
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="bg-white/50 backdrop-blur-sm rounded-4xl p-12 mb-24 border border-gray-100 shadow-xl shadow-gray-500/5">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">What You'll Receive</h2>
              <p className="text-xl text-gray-600 font-light">Comprehensive insights tailored just for you</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/25 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Glow Score</h3>
                <p className="text-gray-600 leading-relaxed">Get your personalized transformation score out of 100</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-pink-500/25 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Avatar</h3>
                <p className="text-gray-600 leading-relaxed">See your transformation potential visualized</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-blue-500/25 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Custom Plan</h3>
                <p className="text-gray-600 leading-relaxed">Receive personalized micro-habits for transformation</p>
              </div>
            </div>
          </div>

          {/* Your Tools Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-4xl p-12 mb-24 border border-gray-100 shadow-xl shadow-gray-500/5">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Transformation Tools</h2>
              <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
                Everything you need to start and track your glow-up journey
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {/* Track Your Progress */}
              <div className="group">
                <div className="bg-white rounded-3xl p-8 h-full transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2 border border-gray-100 hover:border-purple-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Track Progress</h3>
                  <p className="text-gray-600 leading-relaxed">Monitor your daily achievements and growth</p>
                </div>
              </div>

              {/* Start Your Journey */}
              <div className="group">
                <div className="bg-white rounded-3xl p-8 h-full transition-all duration-500 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-2 border border-gray-100 hover:border-pink-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Start Journey</h3>
                  <p className="text-gray-600 leading-relaxed">Begin your transformation today</p>
                </div>
              </div>

              {/* AI Coach (future) */}
              <div className="group opacity-60">
                <div className="bg-gray-50 rounded-3xl p-8 h-full transition-all duration-500 border border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-gray-500/25">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-3">AI Coach</h3>
                  <p className="text-gray-500 leading-relaxed">Personalized coaching with AI</p>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Self Reflection (future) */}
              <div className="group opacity-60">
                <div className="bg-gray-50 rounded-3xl p-8 h-full transition-all duration-500 border border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-gray-500/25">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-3">Self Reflection</h3>
                  <p className="text-gray-500 leading-relaxed">Reflect and grow with journaling</p>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Get Started Button */}
            <div className="text-center">
              <button
                onClick={onStartTest}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-10 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-105 inline-flex items-center text-lg gap-3"
              >
                <Sparkles className="w-6 h-6" />
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Trust/Credibility Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Science-Backed Transformation</h2>
            <p className="text-xl text-gray-600 font-light max-w-4xl mx-auto leading-relaxed">
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