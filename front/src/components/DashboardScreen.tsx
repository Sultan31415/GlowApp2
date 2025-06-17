import React, { useState } from 'react';
import { Sparkles, Heart, Zap, Eye, TrendingUp, Calendar, User, Target, ArrowRight, RotateCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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

          {/* Toggle Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowFutureStats(!showFutureStats)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <span>{showFutureStats ? 'Show Current Stats' : 'See Your Transformation Potential'}</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          {!showFutureStats ? (
            <>
              {/* Hero Section: Avatar & Core Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8 flex flex-col items-center">
                {/* Large Selfie */}
                <div className="relative mb-8">
                  <div className="w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-4 shadow-lg flex items-center justify-center">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your current avatar"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"100\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                {/* Glow Score & Ages in one row/box */}
                <div className="w-full max-w-3xl grid grid-cols-4 gap-6">
                  {/* Glow Score */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-center text-white shadow-lg flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-2">Glow Score</h3>
                    <div className="text-4xl font-bold mb-1">{results.overallGlowScore}</div>
                    <p className="text-xs opacity-90">out of 100</p>
                  </div>
                  {/* Biological Age */}
                  <div className="bg-white/90 rounded-2xl p-6 text-center shadow-md flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-2 mx-auto">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600">Biological</h3>
                    <div className="text-2xl font-bold text-gray-800">{results.biologicalAge}</div>
                  </div>
                  {/* Emotional Age */}
                  <div className="bg-white/90 rounded-2xl p-6 text-center shadow-md flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-2 mx-auto">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600">Emotional</h3>
                    <div className="text-2xl font-bold text-gray-800">{results.emotionalAge}</div>
                  </div>
                  {/* Actual Age */}
                  <div className="bg-white/90 rounded-2xl p-6 text-center shadow-md flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-2 mx-auto">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600">Actual</h3>
                    <div className="text-2xl font-bold text-gray-800">{results.chronologicalAge}</div>
                  </div>
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

              {/* Glow-Up Archetype */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Glow-Up Archetype</h2>
                <h3 className="text-xl font-semibold text-purple-600 mb-3">{results.glowUpArchetype.name}</h3>
                <p className="text-gray-700 leading-relaxed">{results.glowUpArchetype.description}</p>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Track Your Progress */}
                  <div className="flex flex-col items-center">
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-5 px-10 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-lg w-full justify-center">
                      <TrendingUp className="w-7 h-7 mr-3" />
                      Track Your Progress
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">Monitor your daily achievements</p>
                  </div>
                  {/* Micro-Habit Plan */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onGoToMicroHabits}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-5 px-10 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-lg w-full justify-center"
                    >
                      <Target className="w-7 h-7 mr-3" />
                      See Your Micro-Habit Plan
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">Start your transformation today</p>
                  </div>
                  {/* AI Coach (future) */}
                  <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                    <button
                      disabled
                      className="bg-gradient-to-r from-gray-300 to-gray-400 text-white font-semibold py-5 px-10 rounded-2xl transition-all duration-300 shadow-lg inline-flex items-center text-lg w-full justify-center"
                    >
                      <User className="w-7 h-7 mr-3" />
                      AI Coach (Coming Soon)
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">Personalized coaching with AI</p>
                  </div>
                  {/* Talk to Yourself (future) */}
                  <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                    <button
                      disabled
                      className="bg-gradient-to-r from-gray-300 to-gray-400 text-white font-semibold py-5 px-10 rounded-2xl transition-all duration-300 shadow-lg inline-flex items-center text-lg w-full justify-center"
                    >
                      <Heart className="w-7 h-7 mr-3" />
                      Talk to Yourself (Coming Soon)
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">Reflect and grow with journaling</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Future stats comparison (as before)
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Current Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Current You</h2>
                {/* Current Avatar and Glow Score */}
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-4 shadow-lg">
                      <img
                        src={results.avatarUrls.before}
                        alt="Your current avatar"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"100\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-xl">
                      <span className="text-3xl font-bold text-white">{results.overallGlowScore}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mt-2">Glow Score</h3>
                  </div>
                </div>
                {/* Current Stats */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Biological Age</h4>
                      <p className="text-2xl font-bold text-gray-800">{results.biologicalAge}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Emotional Age</h4>
                      <p className="text-2xl font-bold text-gray-800">{results.emotionalAge}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-sm font-bold text-gray-800">{results.categoryScores.physicalVitality}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${results.categoryScores.physicalVitality}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Emotional Health</span>
                        <span className="text-sm font-bold text-gray-800">{results.categoryScores.emotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                          style={{ width: `${results.categoryScores.emotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-sm font-bold text-gray-800">{results.categoryScores.visualAppearance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${results.categoryScores.visualAppearance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Future Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 transition-opacity duration-500 opacity-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Future You</h2>
                {/* Future Avatar and Glow Score */}
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-xl">
                      <span className="text-3xl font-bold text-white">{projectedGlowScore}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mt-2">Projected Glow Score</h3>
                  </div>
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full p-4 shadow-lg">
                      <img
                        src={results.avatarUrls.after}
                        alt="Your future avatar"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"100\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">Future You</text></svg>';
                        }}
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Future Stats */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Biological Age</h4>
                      <p className="text-2xl font-bold text-purple-600">{projectedBiologicalAge}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Emotional Age</h4>
                      <p className="text-2xl font-bold text-purple-600">{projectedEmotionalAge}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-sm font-bold text-purple-600">{projectedPhysicalVitality}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${projectedPhysicalVitality}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Emotional Health</span>
                        <span className="text-sm font-bold text-purple-600">{projectedEmotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                          style={{ width: `${projectedEmotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-sm font-bold text-purple-600">{projectedVisualAppearance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
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