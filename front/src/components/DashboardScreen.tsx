import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Zap, Eye, TrendingUp, Calendar, User, Target, ArrowRight, RotateCcw, Star, Activity } from 'lucide-react';
import { AssessmentResults } from '../types';
import { useApi } from '../utils/useApi';
import { useUser } from '@clerk/clerk-react';

interface DashboardScreenProps {
  onGoToMicroHabits: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onGoToMicroHabits }) => {
  const { user } = useUser();
  const { makeRequest } = useApi();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFutureStats, setShowFutureStats] = useState(false);
  

 
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await makeRequest('results');
        setResults(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('No assessment found for your account. Please complete the quiz.');
        } else {
          setError('Failed to load your results. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">Loading your dashboard...</div>;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">
        {user && (
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            <strong>Debug:</strong> Clerk user_id: {user.id}
          </div>
        )}
        {error}
      </div>
    );
  }
  if (!results) return null;

  // Calculate projected future stats (simple enhancement logic)
  const projectedGlowScore = Math.min(100, results.overallGlowScore + 12);
  const projectedBiologicalAge = Math.max(18, results.biologicalAge - 3);
  const projectedEmotionalAge = Math.max(18, results.emotionalAge - 2);
  const projectedPhysicalVitality = Math.min(100, results.categoryScores.physicalVitality + 15);
  const projectedEmotionalHealth = Math.min(100, results.categoryScores.emotionalHealth + 15);
  const projectedVisualAppearance = Math.min(100, results.categoryScores.visualAppearance + 15);

  // For all category score displays, use adjustedCategoryScores if available, otherwise fallback to categoryScores
  const categoryScores = results.adjustedCategoryScores || results.categoryScores;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <header className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-600" fill="currentColor" />
          <span className="text-xl font-bold text-gray-900">GlowApp</span>
        </div>
        <button
          onClick={onGoToMicroHabits}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Get Started
        </button>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Your Dashboard
            </h1>
            <p className="text-base text-gray-700 font-normal">
              Track your transformation journey and current stats
            </p>
          </div>

          {/* Toggle Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowFutureStats(!showFutureStats)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>{showFutureStats ? 'Show Current Stats' : 'See Your Transformation Potential'}</span>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </div>

          {/* Main Content */}
          {!showFutureStats ? (
            <>
              {/* Hero Section: Avatar & Core Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-500/5 border border-gray-100 mb-6 flex flex-col items-center md:flex-row md:items-start md:space-x-8">
                {/* Large Selfie */}
                <div className="relative mb-6 md:mb-0">
                  <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-3 shadow-xl shadow-purple-500/10 flex items-center justify-center">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your current avatar"
                      className="w-full h-full rounded-xl object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2 shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Glow Score & Ages */}
                <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Glow Score */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-center text-white shadow-xl shadow-purple-500/25 flex flex-col justify-center">
                    <div className="mb-2">
                      <Activity className="w-6 h-6 mx-auto mb-1" />
                      <h3 className="text-base font-semibold">Glow Score</h3>
                    </div>
                    <div className="text-3xl font-black mb-1">{results.overallGlowScore}</div>
                    <p className="text-xs opacity-90">out of 100</p>
                  </div>

                  {/* Biological Age */}
                  <div className="bg-white rounded-full w-28 h-28 md:w-32 md:h-32 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Biological</h3>
                    <div className="text-xl font-bold text-gray-900">{results.biologicalAge}</div>
                  </div>

                  {/* Emotional Age */}
                  <div className="bg-white rounded-full w-28 h-28 md:w-32 md:h-32 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 bg-pink-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Emotional</h3>
                    <div className="text-xl font-bold text-gray-900">{results.emotionalAge}</div>
                  </div>

                  {/* Actual Age */}
                  <div className="bg-white rounded-full w-28 h-28 md:w-32 md:h-32 text-center shadow-lg shadow-gray-500/5 border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-600 mb-1">Actual</h3>
                    <div className="text-xl font-bold text-gray-900">{results.chronologicalAge}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Category Scores */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-500/5 border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your Current Performance</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 mr-2">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Physical Vitality</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.physicalVitality}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-gray-900">{categoryScores.physicalVitality}%</p>
                      <span className="text-xs text-gray-500 font-medium">Energy & Fitness</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25 mr-2">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Emotional Health</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-pink-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.emotionalHealth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-gray-900">{categoryScores.emotionalHealth}%</p>
                      <span className="text-xs text-gray-500 font-medium">Mood & Stress</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-2">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Visual Appearance</h3>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.visualAppearance}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-black text-gray-900">{categoryScores.visualAppearance}%</p>
                      <span className="text-xs text-gray-500 font-medium">Skin & Confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow-Up Archetype */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-500/5 border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Glow-Up Archetype</h2>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-700 mb-2">{results.glowUpArchetype.name}</h3>
                  <p className="text-gray-700 leading-relaxed text-base">{results.glowUpArchetype.description}</p>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-500/5 border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Track Your Progress */}
                  <div className="group">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center">
                      <TrendingUp className="w-7 h-7 mb-2" />
                      <span className="text-base mb-1">Track Your Progress</span>
                      <span className="text-xs opacity-90">Monitor your daily achievements</span>
                    </button>
                  </div>

                  {/* Micro-Habit Plan */}
                  <div className="group">
                    <button
                      onClick={onGoToMicroHabits}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center"
                    >
                      <Target className="w-7 h-7 mb-2" />
                      <span className="text-base mb-1">See Your Micro-Habit Plan</span>
                      <span className="text-xs opacity-90">Start your transformation today</span>
                    </button>
                  </div>

                  {/* AI Coach (future) */}
                  <div className="group opacity-60">
                    <button
                      disabled
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center opacity-60 cursor-not-allowed"
                    >
                      <User className="w-7 h-7 mb-2" />
                      <span className="text-base mb-1">AI Coach</span>
                      <span className="text-xs">Coming Soon</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Future stats comparison
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Current Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-500/5 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Current You</h2>
                {/* Current Avatar and Glow Score */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-2 shadow-xl shadow-purple-500/10">
                      <img
                        src={results.avatarUrls.before}
                        alt="Your current avatar"
                        className="w-full h-full rounded-xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-2">
                      <span className="text-2xl font-black text-white">{results.overallGlowScore}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Glow Score</h3>
                  </div>
                </div>
                {/* Current Stats */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Biological Age</h4>
                      <p className="text-xl font-bold text-gray-900">{results.biologicalAge}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Emotional Age</h4>
                      <p className="text-xl font-bold text-gray-900">{results.emotionalAge}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-xs font-bold text-gray-900">{categoryScores.physicalVitality}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${categoryScores.physicalVitality}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Emotional Health</span>
                        <span className="text-xs font-bold text-gray-900">{categoryScores.emotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                          style={{ width: `${categoryScores.emotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-xs font-bold text-gray-900">{categoryScores.visualAppearance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${categoryScores.visualAppearance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Stats */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-xl shadow-purple-500/10 border border-purple-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Future You</h2>
                {/* Future Avatar and Glow Score */}
                <div className="flex flex-col items-center mb-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-2">
                      <span className="text-2xl font-black text-white">{projectedGlowScore}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Projected Glow Score</h3>
                  </div>
                  <div className="relative">
                    <div className="w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-2 shadow-xl shadow-purple-500/10">
                      <img
                        src={results.avatarUrls.after}
                        alt="Your future avatar"
                        className="w-full h-full rounded-xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">Future You</text></svg>';
                        }}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-purple-600 rounded-xl p-2 shadow-lg shadow-purple-500/25">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Future Stats */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Biological Age</h4>
                      <p className="text-xl font-bold text-purple-700">{projectedBiologicalAge}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Emotional Age</h4>
                      <p className="text-xl font-bold text-purple-700">{projectedEmotionalAge}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Physical Vitality</span>
                        <span className="text-xs font-bold text-purple-700">{projectedPhysicalVitality}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${projectedPhysicalVitality}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Emotional Health</span>
                        <span className="text-xs font-bold text-purple-700">{projectedEmotionalHealth}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                          style={{ width: `${projectedEmotionalHealth}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Visual Appearance</span>
                        <span className="text-xs font-bold text-purple-700">{projectedVisualAppearance}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
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