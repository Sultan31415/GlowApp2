import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Zap, Eye, TrendingUp, Calendar, User, Target, ArrowRight, RotateCcw, Star, Activity } from 'lucide-react';
import { AssessmentResults } from '../types';
import { useApi } from '../utils/useApi';
import { useUser } from '@clerk/clerk-react';

interface DashboardScreenProps {
  onGoToMicroHabits: () => void;
  onGoToFuture: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onGoToMicroHabits, onGoToFuture }) => {
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
    <div className="min-h-screen aurora-bg">
      {/* Navigation Bar */}
      <header className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo and app name removed */}
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
              Your Dashboard
            </h1>
          </div>

          {/* Main Content */}
          {!showFutureStats ? (
            <>
              {/* Hero Section: Avatar & Core Stats */}
              <div className="bg-white/80 rounded-3xl p-8 shadow-2xl border border-gray-100 mb-10 flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-12">
                {/* Large Selfie */}
                <div className="relative flex-shrink-0 flex flex-col items-center">
                  <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-3 shadow-xl flex items-center justify-center border-4 border-purple-300">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your current avatar"
                      className="w-full h-full rounded-xl object-cover shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">You</text></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Glow Score & Ages */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                  {/* Glow Score */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-center text-white shadow-xl flex flex-col justify-center border-2 border-white/40">
                    <div className="mb-2">
                      <Activity className="w-7 h-7 mx-auto mb-1" />
                      <h3 className="text-lg font-semibold">Glow Score</h3>
                    </div>
                    <div className="text-4xl font-black mb-1">{results.overallGlowScore}</div>
                    <p className="text-xs opacity-90">out of 100</p>
                  </div>

                  {/* Biological Age */}
                  <div className="bg-white rounded-2xl w-full h-full text-center shadow-lg border border-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="w-10 h-10 bg-green-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Biological</h3>
                    <div className="text-2xl font-bold text-gray-900">{results.biologicalAge}</div>
                  </div>

                  {/* Emotional Age */}
                  <div className="bg-white rounded-2xl w-full h-full text-center shadow-lg border border-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="w-10 h-10 bg-pink-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Emotional</h3>
                    <div className="text-2xl font-bold text-gray-900">{results.emotionalAge}</div>
                  </div>

                  {/* Actual Age */}
                  <div className="bg-white rounded-2xl w-full h-full text-center shadow-lg border border-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl mb-2 mx-auto flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Actual</h3>
                    <div className="text-2xl font-bold text-gray-900">{results.chronologicalAge}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Category Scores */}
              <div className="bg-white/90 rounded-3xl p-8 shadow-xl border border-gray-100 mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center tracking-tight">Your Current Performance</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg mr-2">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Physical Vitality</h3>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.physicalVitality}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <p className="text-2xl font-black text-purple-700">{categoryScores.physicalVitality}%</p>
                      <span className="text-xs text-gray-500 font-medium">Energy & Fitness</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg mr-2">
                        <Heart className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Emotional Health</h3>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-pink-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.emotionalHealth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <p className="text-2xl font-black text-pink-700">{categoryScores.emotionalHealth}%</p>
                      <span className="text-xs text-gray-500 font-medium">Mood & Stress</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg mr-2">
                        <Eye className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Visual Appearance</h3>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${categoryScores.visualAppearance}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <p className="text-2xl font-black text-blue-700">{categoryScores.visualAppearance}%</p>
                      <span className="text-xs text-gray-500 font-medium">Skin & Confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow-Up Archetype */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 shadow-xl border border-purple-100 mb-10 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2"><Star className="w-6 h-6 text-yellow-400" />Your Glow-Up Archetype</h2>
                <div className="bg-white/80 rounded-2xl p-6 border border-purple-100 w-full max-w-xl text-center">
                  <h3 className="text-xl font-bold text-purple-700 mb-2">{results.glowUpArchetype.name}</h3>
                  <p className="text-gray-700 leading-relaxed text-base">{results.glowUpArchetype.description}</p>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white/90 rounded-3xl p-8 shadow-xl border border-gray-100 mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center tracking-tight">Your Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Track Your Progress */}
                  <div className="group">
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center w-full">
                      <TrendingUp className="w-8 h-8 mb-2" />
                      <span className="text-base mb-1 font-semibold">Track Your Progress</span>
                      <span className="text-xs opacity-90">Monitor your daily achievements</span>
                    </button>
                  </div>

                  {/* Test Plan (was Glow Up) */}
                  <div className="group">
                    <button
                      onClick={onGoToMicroHabits}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center w-full"
                    >
                      <Target className="w-8 h-8 mb-2" />
                      <span className="text-base mb-1 font-semibold">See Your Test Plan</span>
                      <span className="text-xs opacity-90">Start your transformation today</span>
                    </button>
                  </div>

                  {/* AI Coach (future) */}
                  <div className="group opacity-60">
                    <button
                      disabled
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 text-lg rounded-2xl shadow-lg flex flex-col items-center text-center w-full opacity-60 cursor-not-allowed"
                    >
                      <User className="w-8 h-8 mb-2" />
                      <span className="text-base mb-1 font-semibold">AI Coach</span>
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