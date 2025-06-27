import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Heart, 
  Zap, 
  Eye, 
  TrendingUp, 
  Calendar, 
  User, 
  Target, 
  ArrowRight, 
  Star, 
  Activity,
  BarChart3,
  Brain,
  Shield,
  ChevronRight,
  Award,
  Flame,
  Crown
} from 'lucide-react';
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resultsData, userInfo] = await Promise.all([
          makeRequest('results'),
          makeRequest('me')
        ]);
        setResults(resultsData);
        setUserData(userInfo);
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
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animate-reverse"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading your dashboard</h3>
          <p className="text-gray-600">Preparing your wellness insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {user && (
              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
                <strong>Debug:</strong> Clerk user_id: {user.id}
              </div>
            )}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  // For all category score displays, use adjustedCategoryScores if available, otherwise fallback to categoryScores
  const categoryScores = results.adjustedCategoryScores || results.categoryScores;
  
  // Calculate performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'emerald', icon: Crown };
    if (score >= 60) return { label: 'Good', color: 'blue', icon: Award };
    if (score >= 40) return { label: 'Fair', color: 'yellow', icon: Flame };
    return { label: 'Needs Focus', color: 'red', icon: Target };
  };

  const performanceLevel = getPerformanceLevel(results.overallGlowScore);

  return (
    <div className="min-h-screen aurora-bg">
      {/* Fixed Glow Score Badge */}
      <div className="fixed top-4 right-4 z-[100]">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 px-6 py-4 min-w-[140px] transition-all duration-200 hover:shadow-3xl hover:scale-105 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Glow Score</span>
              <span className="text-3xl font-black text-gray-900">{results.overallGlowScore}</span>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              results.overallGlowScore >= 80 ? 'bg-emerald-500 text-white' :
              results.overallGlowScore >= 60 ? 'bg-blue-500 text-white' :
              results.overallGlowScore >= 40 ? 'bg-amber-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              <performanceLevel.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Header */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-gray-200/50">
              <Activity className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-medium text-slate-700">Welcome back!</h1>
              <p className="text-slate-500 text-sm">Your wellness journey continues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Profile Section */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 h-full">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
                    <img
                      src={results.avatarUrls.before}
                      alt="Your avatar"
                      className="w-full h-full rounded-full object-cover bg-white"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6" rx="100"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="%236b7280">You</text></svg>';
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {userData?.first_name && userData?.last_name 
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData?.first_name 
                        ? userData.first_name
                        : 'Your Profile'
                      }
                    </h3>
                  </div>
                  
                  {/* Age Analysis Compact */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Age Analysis</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{results.biologicalAge}</div>
                        <div className="text-xs text-gray-600">Biological Age</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-pink-600">{results.emotionalAge}</div>
                        <div className="text-xs text-gray-600">Emotional Age</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-700">{results.chronologicalAge}</div>
                        <div className="text-xs text-gray-600">Actual Age</div>
                      </div>
                    </div>
                    
                    {results.chronologicalAge - results.biologicalAge > 0 && (
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {results.chronologicalAge - results.biologicalAge} years younger biologically!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Wellness Metrics</h3>
                  <p className="text-gray-600">Your current performance overview</p>
                </div>
                <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Live Data
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Physical Vitality */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Physical Vitality</h4>
                      <p className="text-xs text-gray-500">Energy, fitness & strength</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{categoryScores.physicalVitality}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{categoryScores.physicalVitality}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-purple-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${categoryScores.physicalVitality}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoryScores.physicalVitality >= 70 
                          ? 'bg-green-100 text-green-800' 
                          : categoryScores.physicalVitality >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {categoryScores.physicalVitality >= 70 ? 'Excellent' : categoryScores.physicalVitality >= 50 ? 'Good' : 'Needs Focus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emotional Health */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Emotional Health</h4>
                      <p className="text-xs text-gray-500">Mood, stress & resilience</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{categoryScores.emotionalHealth}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{categoryScores.emotionalHealth}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-pink-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${categoryScores.emotionalHealth}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoryScores.emotionalHealth >= 70 
                          ? 'bg-green-100 text-green-800' 
                          : categoryScores.emotionalHealth >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {categoryScores.emotionalHealth >= 70 ? 'Excellent' : categoryScores.emotionalHealth >= 50 ? 'Good' : 'Needs Focus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Appearance */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Visual Appearance</h4>
                      <p className="text-xs text-gray-500">Skin, style & confidence</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{categoryScores.visualAppearance}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{categoryScores.visualAppearance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${categoryScores.visualAppearance}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoryScores.visualAppearance >= 70 
                          ? 'bg-green-100 text-green-800' 
                          : categoryScores.visualAppearance >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {categoryScores.visualAppearance >= 70 ? 'Excellent' : categoryScores.visualAppearance >= 50 ? 'Good' : 'Needs Focus'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Archetype & Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Glow-Up Archetype */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Your Glow-Up Archetype</h3>
                <p className="text-gray-500 text-sm">Personalized transformation type</p>
              </div>
            </div>
            
            <div className="bg-blue-50/60 rounded-xl border border-blue-100/60 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-700">
                  {results.glowUpArchetype.name}
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">{results.glowUpArchetype.description}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Quick Actions</h3>
              <p className="text-gray-500 text-sm">Start your transformation journey</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={onGoToMicroHabits}
                className="w-full group bg-blue-50/80 hover:bg-blue-50 border border-blue-100 rounded-xl p-5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700 text-base">View Test Plan</p>
                      <p className="text-gray-500 text-sm">Start your transformation journey</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <button
                onClick={onGoToFuture}
                className="w-full group bg-orange-50/80 hover:bg-orange-50 border border-orange-100 rounded-xl p-5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700 text-base">Future Transformation</p>
                      <p className="text-gray-500 text-sm">See your potential results</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      <Brain className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-500 text-base">AI Coach</p>
                      <p className="text-gray-400 text-sm">Personalized guidance & tips</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium border border-yellow-100">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Insights Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Progress Insights</h3>
              <p className="text-gray-600">Personalized recommendations based on your assessment</p>
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              AI Analysis
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths Card */}
            <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900">Your Strengths</h4>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Your biological age is <strong>{results.chronologicalAge - results.biologicalAge} years younger</strong> than your actual age! This shows excellent lifestyle choices.
              </p>
            </div>

            {/* Growth Opportunity Card */}
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-blue-900">Growth Opportunity</h4>
              </div>
              <p className="text-blue-800 leading-relaxed">
                Focus on improving your <strong>lowest scoring area</strong> for maximum impact. Small, consistent changes yield the biggest results.
              </p>
            </div>

            {/* Goal Achievement Card */}
            <div className="group p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-purple-900">Achievement Goal</h4>
              </div>
              <p className="text-purple-800 leading-relaxed">
                With consistent effort, you could reach an <strong>85+ Glow Score</strong> in just 3 months. Your potential is unlimited!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
      );
};