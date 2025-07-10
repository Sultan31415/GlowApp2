/**
 * FutureScreen.tsx - Dual Timeframe Transformation Projections
 * 
 * This screen shows users their potential across two timeframes:
 * - 7-day mini-transformation (quick wins)
 * - 30-day transformation (sustained progress)
 * 
 * Displays current score, projected improvements, and actionable plans.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Zap, Eye, TrendingUp, ArrowRight, Star, RotateCcw, Target, Calendar, CheckCircle, Sparkles, Activity } from 'lucide-react';
import { AssessmentResults, FutureProjection } from '../../types';
import { useApi } from '../../utils/useApi';

interface FutureScreenProps {
  results: AssessmentResults;
  onBack: () => void;
}

// Clamp helper
const clamp = (val: number) => Math.max(0, Math.min(100, val));

export const FutureScreen: React.FC<FutureScreenProps> = ({ results, onBack }) => {
  const navigate = useNavigate();
  const { makeRequest } = useApi();
  const [projection, setProjection] = useState<FutureProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProjection = async () => {
      try {
        setLoading(true);
        const projectionData = await makeRequest('future-projection');
        setProjection(projectionData);
        setError(null);
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.status === 404) {
          setError('No future projection available. Complete a new assessment to generate your transformation projection.');
        } else {
          setError('Failed to load future projection. Please try again.');
        }
        console.error('Error fetching future projection:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjection();
  }, [makeRequest]);

  const handleGenerateProjection = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await makeRequest('generate-future-projection', { method: 'POST' });
      if (response.projection_result) {
        setProjection({
          id: Date.now(),
          user_id: Date.now(),
          assessment_id: Date.now(),
          created_at: new Date().toISOString(),
          orchestrator_output: {},
          quiz_insights: {},
          photo_insights: {},
          projection_result: response.projection_result
        });
      } else {
        const projectionData = await makeRequest('future-projection');
        setProjection(projectionData);
      }
    } catch (err: any) {
      setError('Failed to generate future projection. Please try again.');
      console.error('Error generating future projection:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg overflow-y-auto overflow-x-hidden transition-all duration-300">
        <main className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 mt-6 relative z-10">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your transformation projections...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state with generation option
  if (error || !projection) {
    return (
      <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg overflow-y-auto overflow-x-hidden transition-all duration-300">
        <main className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 mt-6 relative z-10">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projection Not Available</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <button
                onClick={handleGenerateProjection}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Transformation Plan
                  </>
                )}
              </button>
              <div>
                <button
                  onClick={onBack}
                  className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Parse projection result
  let projectionResult;
  try {
    projectionResult = typeof projection.projection_result === 'string' 
      ? JSON.parse(projection.projection_result) 
      : projection.projection_result;
  } catch (parseError) {
    console.error('Error parsing projection result:', parseError);
    return (
      <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg overflow-y-auto overflow-x-hidden transition-all duration-300">
        <main className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 mt-6 relative z-10">
          <div className="text-center py-20">
            <p className="text-red-600">Invalid projection data format.</p>
            <button
              onClick={onBack}
              className="mt-4 bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const categoryScores = results.adjustedCategoryScores || results.categoryScores;
  const currentScore = clamp(results.overallGlowScore);
  const sevenDayScore = clamp(projectionResult.sevenDay?.projectedScores?.overallGlowScore || currentScore);
  const thirtyDayScore = clamp(projectionResult.thirtyDay?.projectedScores?.overallGlowScore || currentScore);

  // --- NEW LAYOUT ---
  return (
    <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg overflow-y-auto overflow-x-hidden transition-all duration-300">
      {/* Header: Move outside main, remove vertical padding, make full width */}
      <div className="relative overflow-hidden w-full -mx-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative w-full max-w-none px-0 py-0">
          <div className="flex items-center px-4 sm:px-6 lg:px-8 py-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 sm:mr-4 border border-gray-200/50">
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg lg:text-xl font-medium text-slate-700">Your Transformation journey</h1>
              <p className="text-slate-500 text-xs sm:text-sm">Your wellness journey continues</p>
            </div>
          </div>
        </div>
      </div>
      <main className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 mt-6 relative z-10">
        {/* Glow Score Progression - Clean, Impactful Layout */}
        <div className="w-full mb-10 select-none">
          {/* Mobile: horizontal scroll, Desktop: row */}
          <div className="flex flex-row md:flex-row justify-center items-center gap-0 md:gap-0 overflow-x-auto md:overflow-x-visible px-1 md:px-0">
            {/* Current Score */}
            <div className="flex flex-col items-center min-w-[90px] sm:min-w-[120px] mx-1 sm:mx-2">
              <span className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Current</span>
              <span className="text-[2rem] sm:text-[2.8rem] md:text-[4.5rem] font-extrabold text-gray-900 drop-shadow-[0_2px_8px_rgba(80,80,80,0.10)]">{currentScore}</span>
              <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Now</span>
            </div>
            {/* Arrow */}
            <div className="flex-shrink-0 flex items-center mx-0.5 sm:mx-1 md:mx-6">
              <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 text-purple-300" />
            </div>
            {/* 7-Day Quick Win */}
            <div className="flex flex-col items-center min-w-[90px] sm:min-w-[120px] mx-1 sm:mx-2">
              <span className="flex items-center mb-0.5 sm:mb-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-0.5 sm:mr-1" />
                <span className="text-green-600 font-semibold text-[10px] sm:text-xs">7-Day Quick Win</span>
              </span>
              <span className="text-[2rem] sm:text-[2.8rem] md:text-[4.5rem] font-extrabold text-green-500 drop-shadow-[0_2px_12px_rgba(34,197,94,0.18)]">{sevenDayScore}</span>
              <span className="text-[10px] sm:text-xs text-green-600 mt-0.5 sm:mt-1 font-medium">+{sevenDayScore - currentScore} in 7 days</span>
            </div>
            {/* Arrow */}
            <div className="flex-shrink-0 flex items-center mx-0.5 sm:mx-1 md:mx-6">
              <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 text-pink-300" />
            </div>
            {/* 30-Day Transformation */}
            <div className="flex flex-col items-center min-w-[90px] sm:min-w-[120px] mx-1 sm:mx-2">
              <span className="flex items-center mb-0.5 sm:mb-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400 mr-0.5 sm:mr-1" />
                <span className="text-pink-600 font-semibold text-[10px] sm:text-xs">30-Day Transformation</span>
              </span>
              <span className="text-[2rem] sm:text-[2.8rem] md:text-[4.5rem] font-extrabold text-pink-500 drop-shadow-[0_2px_12px_rgba(236,72,153,0.18)]">{thirtyDayScore}</span>
              <span className="text-[10px] sm:text-xs text-pink-500 mt-0.5 sm:mt-1 font-medium">+{thirtyDayScore - currentScore} in 30 days</span>
            </div>
          </div>
        </div>
        {/* Main Content Grid (rest of the screen remains unchanged) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
          {/* 7-Day Mini Transformation Card (Avatar) */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full flex flex-col items-center justify-center">
              {/* Clean Avatar Area */}
              <div className="mb-4 sm:mb-6 flex flex-col items-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={results.avatarUrls?.before || 'https://ui-avatars.com/api/?name=Sultan&background=cccccc&color=222222&size=160'}
                    alt="User avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                {/* Future avatar message */}
                <div className="mt-3 text-xs text-purple-500 text-center font-medium">
                  Future avatar will be ready soon — stay tuned to see your transformation!
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Sultan in 30 days</h3>
                <div className="text-2xl font-bold text-green-600 mb-1">+{thirtyDayScore - currentScore} points</div>
                <div className="text-lg font-semibold text-gray-700">{thirtyDayScore}/100</div>
              </div>
            </div>
          </div>
          {/* Stats Section (Category Stats) */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Category Stats</h3>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg mt-2 sm:mt-0">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Projected
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {['physicalVitality', 'emotionalHealth', 'visualAppearance'].map((key) => {
                  const label = key === 'physicalVitality' ? 'Physical Vitality' : key === 'emotionalHealth' ? 'Emotional Health' : 'Visual Appearance';
                  const Icon = key === 'physicalVitality' ? Zap : key === 'emotionalHealth' ? Heart : Eye;
                  const current = clamp(categoryScores[key as keyof typeof categoryScores] ?? 0);
                  const potential = clamp(projectionResult.thirtyDay?.projectedScores?.[key] ?? current);
                  const diff = potential - current;
                  const bg = key === 'physicalVitality' ? 'bg-purple-100' : key === 'emotionalHealth' ? 'bg-pink-100' : 'bg-blue-100';
                  const text = key === 'physicalVitality' ? 'text-purple-600' : key === 'emotionalHealth' ? 'text-pink-600' : 'text-blue-600';
                  const bar = key === 'physicalVitality' ? 'bg-purple-500' : key === 'emotionalHealth' ? 'bg-pink-500' : 'bg-blue-500';
                  const futureText = key === 'physicalVitality' ? 'text-purple-500' : key === 'emotionalHealth' ? 'text-pink-500' : 'text-blue-500';
                  return (
                    <div key={key} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mr-3`}>
                          <Icon className={`w-4 h-4 ${text}`} />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900">{label}</h4>
                      </div>
                      {/* Minimal Comparison Row */}
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div className="flex flex-col items-center min-w-[40px]">
                          <span className="text-xs text-gray-400 font-medium mb-0.5">Now</span>
                          <span className="text-lg font-bold text-gray-700">{current}</span>
                        </div>
                        <div className="flex flex-col items-center min-w-[40px]">
                          <span className="text-xs text-white font-medium mb-0.5 opacity-0">+</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border-2 border-green-200 bg-green-50 text-green-700 text-lg font-bold shadow-sm">
                            +{diff}
                          </span>
                        </div>
                        <div className="flex flex-col items-center min-w-[40px]">
                          <span className={`text-xs font-medium mb-0.5 ${futureText}`}>Future</span>
                          <span className={`text-2xl font-extrabold ${futureText}`}>{potential}</span>
                        </div>
                      </div>
                      {/* Subtle Progress Bar */}
                      <div className="mt-auto">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${bar}`}
                            style={{ width: `${potential}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Message from Future Self (after avatar and stats grid) */}
        {projectionResult.messageFromFutureSelf && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-pink-200" />
              <h2 className="text-2xl font-extrabold text-purple-700 text-center whitespace-nowrap">Message from Your Future Self</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-purple-200 to-pink-200" />
            </div>
            <div className="bg-white/80 rounded-2xl shadow-lg p-6">
              <blockquote className="italic text-gray-700 border-l-4 border-purple-300 pl-4">{projectionResult.messageFromFutureSelf}</blockquote>
            </div>
          </div>
        )}

        {/* Action Plan Section */}
        {projectionResult.weeklyBackbone && Array.isArray(projectionResult.weeklyBackbone) && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-pink-200" />
              <h2 className="text-2xl font-extrabold text-purple-700 text-center whitespace-nowrap">Your Action Plan</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-purple-200 to-pink-200" />
            </div>
            <div className="bg-white/80 rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectionResult.weeklyBackbone.map((weekObj: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="font-semibold text-purple-800 mb-2">Week {weekObj.week}: {weekObj.theme}</div>
                    <div className="text-gray-700 text-sm">{weekObj.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Daily Plan Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/daily-plan')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center mb-4"
          >
            <Calendar className="w-5 h-5 mr-2" />
            View Your 7-Day Daily Plan
          </button>
        </div>

        {/* Back Button */}
        <div className="text-center py-10">
          <button
            onClick={onBack}
            className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};


