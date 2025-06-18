import React, { useState } from 'react';
import { Sparkles, Heart, Zap, Eye, TrendingUp, Calendar, User, Target, ArrowRight, RotateCcw, Star, Activity } from 'lucide-react';
import { AssessmentResults } from '../types';

interface DashboardScreenProps {
  results: AssessmentResults;
  onGoToMicroHabits: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ results, onGoToMicroHabits }) => {
  const [showFutureStats, setShowFutureStats] = useState(false);
  
  // Calculate projected future stats (simple enhancement logic)
  const projectedGlowScore = Math.min(100, results.overallGlowScore + 12);
  const projectedBiologicalAge = Math.max(18, results.biologicalAge - 3);
  const projectedEmotionalAge = Math.max(18, results.emotionalAge - 2);
  const projectedPhysicalVitality = Math.min(100, results.categoryScores.physicalVitality + 15);
  const projectedEmotionalHealth = Math.min(100, results.categoryScores.emotionalHealth + 15);
  const projectedVisualAppearance = Math.min(100, results.categoryScores.visualAppearance + 15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
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
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
              Your Dashboard
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Track your transformation journey and current stats
            </p>
          </div>

          {/* Toggle Button */}
          <div className="flex justify-center mb-12">
            <button
              onClick={() => setShowFutureStats(!showFutureStats)}
              className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center space-x-3 font-semibold"
            >
              <span>{showFutureStats ? 'Show Current Stats' : 'See Your Transformation Potential'}</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </div>

          {/* Main Content */}
          {!showFutureStats ? (
            <>
              {/* Hero Section: Avatar & Core Stats */}
              <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100 mb-12 flex flex-col items-center">
                {/* Large Selfie */}
                <div className="relative mb-12">
                  <div className="w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 shadow-xl shadow-purple-500/10 flex items-center justify-center">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your current avatar"
                      className="w-full h-full rounded-2xl object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Glow Score & Ages */}
                <div className="w-full max-w-4xl grid grid-cols-4 gap-8">
                  {/* Glow Score */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-center text-white shadow-xl shadow-purple-500/25 flex flex-col justify-center">
                    <div className="mb-4">
                      <Activity className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">Glow Score</h3>
                    </div>
                    <div className="text-5xl font-black mb-2">{results.overallGlowScore}</div>
                    <p className="text-sm opacity-90">out of 100</p>
                  </div>

                  {/* Biological Age */}
                  <div className="bg-white rounded-3xl p-8 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Biological</h3>
                    <div className="text-3xl font-bold text-gray-900">{results.biologicalAge}</div>
                  </div>

                  {/* Emotional Age */}
                  <div className="bg-white rounded-3xl p-8 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Emotional</h3>
                    <div className="text-3xl font-bold text-gray-900">{results.emotionalAge}</div>
                  </div>

                  {/* Actual Age */}
                  <div className="bg-white rounded-3xl p-8 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col justify-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Actual</h3>
                    <div className="text-3xl font-bold text-gray-900">{results.chronologicalAge}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Category Scores */}
              <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100 mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Current Performance</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 mr-4">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Physical Vitality</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6 mb-4">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-6 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${results.categoryScores.physicalVitality}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-3xl font-black text-gray-900">{results.categoryScores.physicalVitality}%</p>
                      <span className="text-sm text-gray-500 font-medium">Energy & Fitness</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25 mr-4">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Emotional Health</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6 mb-4">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-pink-600 h-6 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${results.categoryScores.emotionalHealth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-3xl font-black text-gray-900">{results.categoryScores.emotionalHealth}%</p>
                      <span className="text-sm text-gray-500 font-medium">Mood & Stress</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-4">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Visual Appearance</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${results.categoryScores.visualAppearance}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-3xl font-black text-gray-900">{results.categoryScores.visualAppearance}%</p>
                      <span className="text-sm text-gray-500 font-medium">Skin & Confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow-Up Archetype */}
              <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100 mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Glow-Up Archetype</h2>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
                  <h3 className="text-2xl font-bold text-purple-700 mb-4">{results.glowUpArchetype.name}</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{results.glowUpArchetype.description}</p>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100 mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {/* Track Your Progress */}
                  <div className="group">
                    <button className="w-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-8 px-8 rounded-3xl transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 flex flex-col items-center text-center">
                      <TrendingUp className="w-10 h-10 mb-4" />
                      <span className="text-xl mb-2">Track Your Progress</span>
                      <span className="text-sm opacity-90">Monitor your daily achievements</span>
                    </button>
                  </div>

                  {/* Micro-Habit Plan */}
                  <div className="group">
                    <button
                      onClick={onGoToMicroHabits}
                      className="w-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-8 px-8 rounded-3xl transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 flex flex-col items-center text-center"
                    >
                      <Target className="w-10 h-10 mb-4" />
                      <span className="text-xl mb-2">See Your Micro-Habit Plan</span>
                      <span className="text-sm opacity-90">Start your transformation today</span>
                    </button>
                  </div>

                  {/* AI Coach (future) */}
                  <div className="group opacity-60">
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 font-semibold py-8 px-8 rounded-3xl transition-all duration-300 shadow-lg flex flex-col items-center text-center cursor-not-allowed"
                    >
                      <User className="w-10 h-10 mb-4" />
                      <span className="text-xl mb-2">AI Coach</span>
                      <span className="text-sm">Coming Soon</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Future stats comparison
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              {/* Current Stats */}
              <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Current You</h2>
                
                {/* Current Avatar and Glow Score */}
                <div className="flex flex-col items-center mb-12">
                  <div className="relative mb-8">
                    <div className="w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-4 shadow-xl shadow-purple-500/10">
                      <img
                        src={results.avatarUrls.before}
                        alt="Your current avatar"
                        className="w-full h-full rounded-2xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-4">
                      <span className="text-3xl font-black text-white">{results.overallGlowScore}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Glow Score</h3>
                  </div>
                </div>

                {/* Current Stats */}
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Biological Age</h4>
                      <p className="text-3xl font-bold text-gray-900">{results.biologicalAge}</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-2xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Emotional Age</h4>
                      <p className="text-3xl font-bold text-gray-900">{results.emotionalAge}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-sm font-bold text-gray-900">{results.categoryScores.physicalVitality}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full"
                          style={{ width: `${results.categoryScores.physicalVitality}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Emotional Health</span>
                        <span className="text-sm font-bold text-gray-900">{results.categoryScores.emotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full"
                          style={{ width: `${results.categoryScores.emotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-sm font-bold text-gray-900">{results.categoryScores.visualAppearance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                          style={{ width: `${results.categoryScores.visualAppearance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Stats */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-4xl p-12 shadow-xl shadow-purple-500/10 border border-purple-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Future You</h2>
                
                {/* Future Avatar and Glow Score */}
                <div className="flex flex-col items-center mb-12">
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-4">
                      <span className="text-3xl font-black text-white">{projectedGlowScore}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Projected Glow Score</h3>
                  </div>
                  
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-3xl p-4 shadow-xl shadow-purple-500/20">
                      <img
                        src={results.avatarUrls.after}
                        alt="Your future avatar"
                        className="w-full h-full rounded-2xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">Future You</text></svg>';
                        }}
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-3 shadow-lg shadow-yellow-500/25">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Future Stats */}
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-white/70 rounded-2xl border border-purple-200">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Biological Age</h4>
                      <p className="text-3xl font-bold text-purple-700">{projectedBiologicalAge}</p>
                    </div>
                    <div className="text-center p-6 bg-white/70 rounded-2xl border border-purple-200">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Emotional Age</h4>
                      <p className="text-3xl font-bold text-purple-700">{projectedEmotionalAge}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-sm font-bold text-purple-700">{projectedPhysicalVitality}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full"
                          style={{ width: `${projectedPhysicalVitality}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Emotional Health</span>
                        <span className="text-sm font-bold text-purple-700">{projectedEmotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full"
                          style={{ width: `${projectedEmotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-sm font-bold text-purple-700">{projectedVisualAppearance}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                          style={{ width: `${projectedVisualAppearance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};