import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Crown,
  Image,
  Bot,
  MessageCircle
} from 'lucide-react';
import { AssessmentResults } from '../../types';
import { useApi } from '../../utils/useApi';
import { useUser } from '@clerk/clerk-react';


interface DashboardScreenProps {}

export const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const { user } = useUser();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsNewUser(false);
      
      try {
        // Try to get user info first - this is less likely to fail
        const userInfo = await makeRequest('me');
        setUserData(userInfo);
        
        // Then try to get results
        try {
          const resultsData = await makeRequest('results');
          setResults(resultsData);
        } catch (resultsErr: any) {
          if (resultsErr?.response?.status === 404 || resultsErr?.status === 404) {
            // User hasn't completed assessment yet - this is normal for new users
            setIsNewUser(true);
            setError(null);
          } else {
            throw resultsErr; // Re-throw if it's not a 404
          }
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        
        // Handle different types of errors
        if (err?.message?.includes('fetch')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (err?.response?.status === 401 || err?.status === 401) {
          setError('Authentication error. Please try refreshing the page or logging out and back in.');
        } else if (err?.response?.status === 403 || err?.status === 403) {
          setError('Access denied. Please make sure you have the correct permissions.');
        } else if (err?.response?.status >= 500 || err?.status >= 500) {
          setError('Server error. Our team has been notified. Please try again in a few minutes.');
        } else {
          setError(err?.message || 'Something went wrong. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [makeRequest]);

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
            {user && import.meta.env.DEV && (
              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
                <strong>Debug:</strong> Clerk user_id: {user.id}
              </div>
            )}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/test')}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Take Assessment Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New User Welcome Experience with Sample Data
  if (isNewUser) {
    // Realistic sample data for preview
    const sampleData = {
      overallGlowScore: 78,
      potentialScore: 92,
      categoryScores: {
        physicalVitality: 74,
        emotionalHealth: 68,
        visualAppearance: 82
      },
      biologicalAge: 24,
      emotionalAge: 26,
      chronologicalAge: 28,
      glowUpArchetype: {
        name: "The Wellness Explorer",
        description: "You're on a journey of self-discovery and wellness optimization. With natural curiosity and openness to growth, you're ready to unlock your full potential through personalized insights and targeted improvements."
      },
      avatarUrls: {
        before: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23667eea;stop-opacity:1' /><stop offset='100%' style='stop-color:%23764ba2;stop-opacity:1' /></linearGradient></defs><rect width='200' height='200' fill='url(%23grad)' rx='100'/><text x='100' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='16' fill='white' font-weight='bold'>Your Avatar</text></svg>"
      }
    };

        return (
      <div className="min-h-screen aurora-bg">
        {/* Clean Glow Score Badge with Potential */}
        <div className="fixed top-4 right-4 z-[100]">
          <div 
            onClick={() => navigate('/test')}
            className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 px-6 py-4 min-w-[160px] transition-all duration-200 hover:shadow-3xl hover:scale-105 backdrop-blur-sm cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Glow Score</span>
              <div className="flex items-start space-x-2">
                <span className="text-3xl font-black text-gray-900">{sampleData.overallGlowScore}</span>
                <div className="flex items-baseline space-x-0.5 -mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-2xl font-extrabold text-emerald-600">{sampleData.potentialScore}+</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-purple-600 font-medium">Click to get yours →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating CTA Button is removed to reduce clutter */}

                          {/* Enhanced Header */}
         <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
           <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
             <div className="flex items-center">
               <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-gray-200/50">
                 <Activity className="w-6 h-6 text-slate-600" />
               </div>
               <div>
                 <h1 className="text-lg lg:text-xl font-medium text-slate-700">Welcome, {userData?.first_name || 'Explorer'}!</h1>
                 <p className="text-slate-500 text-sm">Here's a preview of your future dashboard.</p>
               </div>
             </div>
           </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">

            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-8 shadow-lg text-center">
                <div className="flex justify-center items-center mb-4">
                  <Bot className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">This is a Preview Dashboard!</h3>
                </div>
                <p className="text-gray-700 max-w-2xl mx-auto mb-5">
                  You're currently viewing a dashboard with sample data to show you what's possible. To see your own personalized scores, insights, and AI-powered recommendations, take our quick assessment.
                </p>
                <button 
                  onClick={() => navigate('/test')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center mx-auto"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your Real Score
                </button>
            </div>
                        {/* Main Content Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
               
               {/* Profile Section */}
               <div className="lg:col-span-4">
                 <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 h-full">
                 
                 <div className="text-center">
                   <div className="relative inline-block mb-6">
                     <div className="w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
                       <img
                         src={sampleData.avatarUrls.before}
                         alt="Sample avatar"
                         className="w-full h-full rounded-full object-cover bg-white"
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-4 mt-4">
                     <div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Your Journey</h3>
                     </div>
                     
                     {/* Age Analysis Compact */}
                     <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                       <div className="text-center mb-3">
                         <h4 className="text-sm font-semibold text-gray-700">Age Analysis</h4>
                       </div>
                       <div className="grid grid-cols-3 gap-4 text-center">
                         <div>
                           <div className="text-2xl font-bold text-emerald-600">{sampleData.biologicalAge}</div>
                           <div className="text-xs text-gray-600">Biological Age</div>
                         </div>
                         <div>
                           <div className="text-2xl font-bold text-pink-600">{sampleData.emotionalAge}</div>
                           <div className="text-xs text-gray-600">Emotional Age</div>
                         </div>
                         <div>
                           <div className="text-2xl font-bold text-gray-700">{sampleData.chronologicalAge}</div>
                           <div className="text-xs text-gray-600">Actual Age</div>
                         </div>
                       </div>
                       
                       <div className="mt-4 text-center space-y-3">
                         <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                           <TrendingUp className="w-4 h-4 mr-1" />
                           {sampleData.chronologicalAge - sampleData.biologicalAge} years younger biologically!
                         </div>
                         <div>
                           <button 
                             onClick={() => navigate('/test')}
                             className="text-xs text-gray-600 hover:text-purple-600 font-medium underline decoration-dotted transition-colors duration-200"
                           >
                             Discover your biological age →
                           </button>
                         </div>
                       </div>
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
                         <span className="text-3xl font-bold text-gray-900">{sampleData.categoryScores.physicalVitality}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">Progress</span>
                         <span className="font-medium text-gray-900">{sampleData.categoryScores.physicalVitality}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="h-2 bg-purple-500 rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${sampleData.categoryScores.physicalVitality}%` }}
                         />
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Good
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           Get yours
                         </button>
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
                         <span className="text-3xl font-bold text-gray-900">{sampleData.categoryScores.emotionalHealth}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">Progress</span>
                         <span className="font-medium text-gray-900">{sampleData.categoryScores.emotionalHealth}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="h-2 bg-pink-500 rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${sampleData.categoryScores.emotionalHealth}%` }}
                         />
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Good
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           Get yours
                         </button>
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
                         <span className="text-3xl font-bold text-gray-900">{sampleData.categoryScores.visualAppearance}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">Progress</span>
                         <span className="font-medium text-gray-900">{sampleData.categoryScores.visualAppearance}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="h-2 bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${sampleData.categoryScores.visualAppearance}%` }}
                         />
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Excellent
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           Get yours
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

                        {/* Glow-Up Archetype Section */}
             <div className="mb-6">
               <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
                 <div className="flex items-start">
                   <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border border-gray-200/50">
                     <User className="w-5 h-5 text-gray-700" />
                   </div>
                   <div className="flex-1">
                     <h3 className="text-xl font-bold text-gray-900 mb-3">
                       {sampleData.glowUpArchetype.name}
                     </h3>
                     <p className="text-gray-800 leading-relaxed text-base mb-4">
                       {sampleData.glowUpArchetype.description}
                     </p>
                     <div className="flex items-center text-sm">
                       <span className="text-gray-600 mr-3">Ready to discover your archetype?</span>
                       <button 
                         onClick={() => navigate('/test')}
                         className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center"
                       >
                         Take Assessment
                         <ArrowRight className="w-3 h-3 ml-1" />
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Quick Actions Section */}
             <div className="mb-6">
               <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50 p-8">
                 <div className="mb-6">
                   <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                     Want to unlock your real results?
                   </h3>
                   <p className="text-gray-600">Complete the wellness assessment to see your personalized dashboard with AI-powered insights.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                     onClick={() => navigate('/test')}
                     className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                   >
                     Start Assessment
                     <ArrowRight className="w-5 h-5 ml-2" />
                   </button>
                   <div className="flex items-center text-gray-500 text-sm">
                     <div className="flex items-center mr-6">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                       3-5 minutes
                     </div>
                     <div className="flex items-center">
                       <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                       Free assessment
                     </div>
                   </div>
                 </div>
               </div>
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

  const scrollToQuickActions = () => {
    const quickActionsElement = document.getElementById('quick-actions-section');
    if (quickActionsElement) {
      quickActionsElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen aurora-bg">
      {/* Clean Glow Score Badge with Potential */}
      <div className="fixed top-4 right-4 z-[100]">
        <div 
          onClick={scrollToQuickActions}
          className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 px-6 py-4 min-w-[160px] transition-all duration-200 hover:shadow-3xl hover:scale-105 backdrop-blur-sm cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Glow Score</span>
            <div className="flex items-start space-x-2">
              <span className="text-3xl font-black text-gray-900">{results.overallGlowScore}</span>
              <div className="flex items-baseline space-x-0.5 -mt-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-extrabold text-emerald-600">85+</span>
              </div>
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

        {/* Glow-Up Archetype Section */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border border-gray-200/50">
                <User className="w-5 h-5 text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {results.glowUpArchetype.name}
                </h3>
                <p className="text-gray-800 leading-relaxed text-base">
                  {results.glowUpArchetype.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section - Moved Below Archetype */}
        <div className="mb-6" id="quick-actions-section">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50 p-8">
            <div className="mb-10">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-6 h-6 text-purple-500 mr-3" />
                Quick Actions: Your Ultimate Glow-Up Experience
              </h3>
              <p className="text-gray-500 text-sm">Revolutionary features powered by cutting-edge AI - Coming Soon!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Visual Transformation Avatar */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <Image className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">Soon</span>
                  </div>
                  <h5 className="font-semibold text-gray-900 text-base mb-3">Visual Transformation Avatar</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">AI-powered avatar and metrics showing your full potential</p>
                  <div className="mt-4 w-full bg-green-200 rounded-full h-1">
                    <div className="h-1 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                {/* Atomic Glow-Up System */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <Calendar className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">Soon</span>
                  </div>
                  <h5 className="font-semibold text-gray-900 text-base mb-3">Atomic Glow-Up System</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">30-day micro-habits and challenges to reach your full glow potential</p>
                  <div className="mt-4 w-full bg-red-200 rounded-full h-1">
                    <div className="h-1 bg-red-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">Soon</span>
                  </div>
                  <h5 className="font-semibold text-gray-900 text-base mb-3">Progress Tracker</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">Watch your avatar evolve with every habit</p>
                  <div className="mt-4 w-full bg-blue-200 rounded-full h-1">
                    <div className="h-1 bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                {/* AI Coach */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <Bot className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">Soon</span>
                  </div>
                  <h5 className="font-semibold text-gray-900 text-base mb-3">AI Coach</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">Personalized guidance & tips</p>
                  <div className="mt-4 w-full bg-orange-200 rounded-full h-1">
                    <div className="h-1 bg-orange-500 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                {/* Future Self Chat */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">Soon</span>
                  </div>
                  <h5 className="font-semibold text-gray-900 text-base mb-3">Talk to Future Self</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">Get motivation from your transformed self</p>
                  <div className="mt-4 w-full bg-purple-200 rounded-full h-1">
                    <div className="h-1 bg-purple-500 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>




              </div>


            </div>
          </div>
        </div>


      </div>

  );
};