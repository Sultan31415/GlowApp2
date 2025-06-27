import React from 'react';
import { Sparkles, Target, User, TrendingUp, Brain, Heart, ArrowRight, Star, MessageCircle, Camera, Check, Users, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface MainScreenProps {
  onStartTest: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onStartTest }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleGetStarted = () => {
    if (isSignedIn) {
      onStartTest();
    } else {
      navigate('/sign-in');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" fill="currentColor" />
          <span className="text-2xl font-bold text-gray-900">GlowApp</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200">How It Works</a>
          <a href="#features" className="text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200">Pricing</a>
          <a href="#contact" className="text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200">Contact</a>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sign-in')}
            className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200 hidden md:block"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hidden md:block"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            
            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tighter">
              See Who You Could Become.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your life in 30 days with AI-powered guidance and visualization
            </p>

            {/* Main CTA Button */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-full text-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <span>Start Your GlowApp</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button className="group relative bg-white text-gray-800 font-semibold py-4 px-8 rounded-full text-lg border border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
                <span>Learn More</span>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex justify-center items-center gap-12 mt-16">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900">12,847</h3>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-green-500 text-xs flex items-center justify-center gap-1 mt-1"><Users className="w-3 h-3" /> +8.5% Up from yesterday</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900">8,293</h3>
                <p className="text-gray-500 text-sm">Transformations</p>
                <p className="text-green-500 text-xs flex items-center justify-center gap-1 mt-1"><RefreshCw className="w-3 h-3" /> +12.3% Up from last week</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900">8.7</h3>
                <p className="text-gray-500 text-sm">Avg GlowScore</p>
                <p className="text-red-500 text-xs flex items-center justify-center gap-1 mt-1"><TrendingUp className="w-3 h-3 transform rotate-180" /> -2.1% Up from yesterday</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900">4,521</h3>
                <p className="text-gray-500 text-sm">Active Plans</p>
                <p className="text-green-500 text-xs flex items-center justify-center gap-1 mt-1"><Clock className="w-3 h-3" /> +5.8% Up from yesterday</p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 font-light">Four simple steps to unlock your transformation potential</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-24">
            <div className="group text-center">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center mx-auto">
                  <span className="text-purple-600 font-bold text-xl mr-2">01</span>
                  <MessageCircle className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Take the Quiz</h3>
                <p className="text-gray-600 leading-relaxed text-sm">15 questions about your lifestyle and goals</p>
              </div>
            </div>

            <div className="group text-center">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-pink-200 transition-all duration-500 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-2 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center mx-auto">
                  <span className="text-pink-600 font-bold text-xl mr-2">02</span>
                  <Camera className="w-10 h-10 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Selfie</h3>
                <p className="text-gray-600 leading-relaxed text-sm">Get your FaceScore + GlowScore analysis</p>
              </div>
            </div>

            <div className="group text-center">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold text-xl mr-2">03</span>
                  <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">See Future Self</h3>
                <p className="text-gray-600 leading-relaxed text-sm">AI-generated avatar of your potential</p>
              </div>
            </div>

            <div className="group text-center">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-green-200 transition-all duration-500 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-2 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center mx-auto">
                  <span className="text-green-600 font-bold text-xl mr-2">04</span>
                  <Heart className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Start GlowApp</h3>
                <p className="text-gray-600 leading-relaxed text-sm">30-day plan with daily micro-habits</p>
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your GlowUp Style</h2>
            <p className="text-xl text-gray-600 font-light">Discover different archetypes and see your transformation timeline</p>
          </div>
          
          <div className="flex justify-center items-center gap-8 mb-24">
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-500 rounded-full mb-6 flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Avatars</h3>
              <p className="text-gray-600 leading-relaxed max-w-xs">AI-generated avatar of your potential</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-pink-500 rounded-full mb-6 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Glow Score</h3>
              <p className="text-gray-600 leading-relaxed max-w-xs">Get your personalized transformation score out of 100</p>
            </div>
          </div>

          {/* Micro-Habits Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Coaching</h2>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">Personalized guidance for your daily transformation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 mb-24">
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">+30 min sleep</h3>
                <p className="text-gray-600">Better skin & energy</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Drink 1L water</h3>
                <p className="text-gray-600">Clearer complexion</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">10 min walk</h3>
                <p className="text-gray-600">Improved posture</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Morning meditation</h3>
                <p className="text-gray-600">Reduced stress lines</p>
              </div>
            </div>
          </div>

          {/* Messages from Your Future Self */}
          <div className="bg-white rounded-4xl p-12 mb-24 border border-gray-100 shadow-xl shadow-gray-500/5">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Messages from Your Future Self</h2>
              <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto italic">
                "Hey! It's your future self. You're doing amazing today. Remember, that 10-minute walk you're about to skip? It's the difference between who you are now and who I became. Trust the process."
              </p>
              <p className="text-gray-500 text-sm mt-4">- Future You, Day 30</p>
            </div>

            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-10 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-105 inline-flex items-center text-lg gap-3"
              >
                <span>Receive Your First Message</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};