import React from 'react';
import { Sparkles, Heart, Zap, Eye, TrendingUp, Calendar, User, Target, ArrowRight, RotateCcw } from 'lucide-react';
import { AssessmentResults } from '../types';

interface DashboardScreenProps {
  results: AssessmentResults;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ results }) => {
  // Calculate projected future stats (simple enhancement logic)
  const projectedGlowScore = Math.min(100, results.overallGlowScore + 12);
  const projectedBiologicalAge = Math.max(18, results.biologicalAge - 3);
  const projectedEmotionalAge = Math.max(18, results.emotionalAge - 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Your Personal Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Track your transformation journey and current stats
            </p>
          </div>

          {/* Hero Section: Avatar & Core Stats */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Current Avatar */}
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-4 shadow-lg">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your current avatar"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6" rx="100"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="%236b7280">You</text></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Current You</h2>
              </div>

              {/* Overall Glow Score */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-xl">
                  <span className="text-4xl font-bold text-white">{results.overallGlowScore}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Glow Score</h3>
                <p className="text-lg text-gray-600">out of 100</p>
                <div className="mt-4 flex justify-center">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
                    <span className="text-sm font-medium text-purple-700">
                      🎯 Great potential for growth!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Age Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Biological Age */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Biological Age</h3>
              <p className="text-3xl font-bold text-gray-800">{results.biologicalAge}</p>
              <p className="text-xs text-gray-500">years</p>
            </div>

            {/* Emotional Age */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Emotional Age</h3>
              <p className="text-3xl font-bold text-gray-800">{results.emotionalAge}</p>
              <p className="text-xs text-gray-500">years</p>
            </div>

            {/* Chronological Age */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-3">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Actual Age</h3>
              <p className="text-3xl font-bold text-gray-800">{results.chronologicalAge}</p>
              <p className="text-xs text-gray-500">years</p>
            </div>
          </div>

          {/* Detailed Category Scores (Progress Bars) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Current Performance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Physical Vitality</h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${results.categoryScores.physicalVitality}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-gray-800">{results.categoryScores.physicalVitality}%</p>
                  <span className="text-sm text-gray-500">Energy & Fitness</span>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-pink-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Emotional Health</h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-pink-600 h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${results.categoryScores.emotionalHealth}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-gray-800">{results.categoryScores.emotionalHealth}%</p>
                  <span className="text-sm text-gray-500">Mood & Stress</span>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Visual Appearance</h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${results.categoryScores.visualAppearance}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-gray-800">{results.categoryScores.visualAppearance}%</p>
                  <span className="text-sm text-gray-500">Skin & Confidence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Transformation Potential */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Transformation Potential</h2>
            
            {/* Before & After Avatars */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Current State</h3>
                <div className="bg-gray-100 rounded-2xl p-4 aspect-square flex items-center justify-center relative">
                  <img
                    src={results.avatarUrls.before}
                    alt="Current state avatar"
                    className="max-w-full max-h-full rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="%236b7280">Current You</text></svg>';
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Transformation Potential</h3>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 aspect-square flex items-center justify-center relative">
                  <img
                    src={results.avatarUrls.after}
                    alt="Transformation potential avatar"
                    className="max-w-full max-h-full rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="%236b7280">Future You</text></svg>';
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Future Stats Enhancement */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Your stats can be enhanced to this in 30 days:</h3>
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">Achievable with consistent micro-habits</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{results.overallGlowScore}</span>
                    <ArrowRight className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{projectedGlowScore}</span>
                  </div>
                  <p className="text-sm text-gray-600">Glow Score</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{results.biologicalAge}</span>
                    <ArrowRight className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{projectedBiologicalAge}</span>
                  </div>
                  <p className="text-sm text-gray-600">Biological Age (years)</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{results.emotionalAge}</span>
                    <ArrowRight className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{projectedEmotionalAge}</span>
                  </div>
                  <p className="text-sm text-gray-600">Emotional Age (years)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Glow-Up Archetype */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Glow-Up Archetype</h2>
            <h3 className="text-xl font-semibold text-purple-600 mb-3">{results.glowUpArchetype.name}</h3>
            <p className="text-gray-700 leading-relaxed">{results.glowUpArchetype.description}</p>
          </div>

          {/* Personalized Micro-Habit Plan */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Personalized Micro-Habit Plan</h2>
            <div className="space-y-4">
              {results.microHabits.map((habit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{habit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Level Up?</h3>
              <p className="text-gray-600 mb-4">Track your progress and see your transformation unfold</p>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Track Your Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};