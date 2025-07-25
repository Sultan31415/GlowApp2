import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ShareResults } from '../features/ShareResults';
import { ShareCard } from '../features/ShareCard';
import { useApi } from '../../utils/useApi';
import { useUser } from '@clerk/clerk-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { AIChatScreen } from './AIChatScreen';


interface DashboardScreenProps {}

export const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const { user } = useUser();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showChat = searchParams.get('chat') === 'open';
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { t } = useTranslation();

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
      <div className="absolute inset-0 sm:left-[var(--sidebar-width)] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-start justify-center p-4 pt-24 sm:pt-32 lg:pt-48 transition-all duration-300 overflow-x-hidden">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animate-reverse"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{t('dashboard.loadingTitle')}</h3>
          <p className="text-gray-600 px-4">{t('dashboard.loadingDesc')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 sm:left-[var(--sidebar-width)] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {user && import.meta.env.DEV && (
              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
                <strong>Debug:</strong> Clerk user_id: {user.id}
              </div>
            )}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('dashboard.errorTitle')}</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
              >
                {t('dashboard.errorTryAgain')}
              </button>
              <button
                onClick={() => navigate('/test')}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 touch-manipulation"
              >
                {t('dashboard.errorTakeAssessment')}
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
      <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg overflow-x-hidden transition-all duration-300 pb-24 sm:pb-0">
        {/* Clean Glow Score Badge with Potential - Mobile Optimized */}
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[100] flex flex-col items-end space-y-2">
          <div 
            onClick={() => navigate('/future')}
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 border-gray-100 px-3 py-2 sm:px-6 sm:py-4 min-w-[100px] sm:min-w-[160px] transition-all duration-200 hover:shadow-3xl hover:scale-105 backdrop-blur-sm cursor-pointer touch-manipulation"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">{t('wellness.glowScore')}</span>
              <div className="flex items-start space-x-1 sm:space-x-2">
                <span className="text-lg sm:text-3xl font-black text-gray-900">{sampleData.overallGlowScore}</span>
                <div className="flex items-baseline space-x-0.5 -mt-1">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                  <span className="text-base sm:text-2xl font-extrabold text-emerald-600">{sampleData.potentialScore}+</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/future')}
            className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
          >
            {t('dashboard.seePotential')}
          </button>
        </div>

        {/* Floating CTA Button is removed to reduce clutter */}

                          {/* Enhanced Header - Mobile Optimized */}
         <div className="relative overflow-hidden sm:-mx-6 lg:-mx-8 mt-4">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
           <div className="relative lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-3">
             <div className="flex items-center">
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 sm:mr-4 border border-gray-200/50">
                 <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600" />
               </div>
               <div>
                 <h1 className="text-sm sm:text-lg lg:text-xl font-medium text-slate-700">{t('dashboard.welcome', { name: userData?.first_name || t('dashboard.journey') })}</h1>
                 <p className="text-slate-500 text-xs sm:text-sm">{t('dashboard.welcomePreview')}</p>
               </div>
             </div>
           </div>
         </div>

         <div className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-6 relative z-10">

            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg text-center">
                <div className="flex justify-center items-center mb-4">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mr-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('dashboard.previewTitle')}</h3>
                </div>
                <p className="text-gray-700 max-w-2xl mx-auto mb-5 text-sm sm:text-base">
                  {t('dashboard.previewDesc')}
                </p>
                <button 
                  onClick={() => navigate('/test')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center mx-auto touch-manipulation"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('dashboard.getRealScore')}
                </button>
            </div>
                        {/* Main Content Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
               
               {/* Profile Section */}
               <div className="lg:col-span-4">
                 <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
                 
                 <div className="text-center">
                   <div className="relative inline-block mb-4 sm:mb-6">
                     <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
                       <img
                         src={sampleData.avatarUrls.before}
                         alt="Sample avatar"
                         className="w-full h-full rounded-full object-cover bg-white"
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-4 mt-4">
                     <div>
                       <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('dashboard.journey')}</h3>
                     </div>
                     
                     {/* Age Analysis Compact */}
                     <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                       <div className="text-center mb-3">
                         <h4 className="text-sm font-semibold text-gray-700">{t('dashboard.ageAnalysis')}</h4>
                       </div>
                       <div className="grid grid-cols-3 gap-1 sm:gap-4 text-center">
                         <div>
                           <div className="text-xl sm:text-2xl font-bold text-emerald-600">{sampleData.biologicalAge}</div>
                           <div className="text-xs text-gray-600">{t('dashboard.biologicalAge')}</div>
                         </div>
                         <div>
                           <div className="text-xl sm:text-2xl font-bold text-pink-600">{sampleData.emotionalAge}</div>
                           <div className="text-xs text-gray-600">{t('dashboard.emotionalAge')}</div>
                         </div>
                         <div>
                           <div className="text-xl sm:text-2xl font-bold text-gray-700">{sampleData.chronologicalAge}</div>
                           <div className="text-xs text-gray-600">{t('dashboard.actualAge')}</div>
                         </div>
                       </div>
                       
                       <div className="mt-4 text-center space-y-3">
                         <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                           <TrendingUp className="w-4 h-4 mr-1" />
                           {t('dashboard.yearsYounger', { years: sampleData.chronologicalAge - sampleData.biologicalAge })}
                         </div>
                         <div>
                           <button 
                             onClick={() => navigate('/test')}
                             className="text-xs text-gray-600 hover:text-purple-600 font-medium underline decoration-dotted transition-colors duration-200"
                           >
                             {t('dashboard.discoverBioAge')}
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
                 <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                     <div>
                       <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{t('dashboard.wellnessMetrics')}</h3>
                       <p className="text-gray-600 text-sm">{t('dashboard.performanceOverview')}</p>
                     </div>
                     <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg mt-2 sm:mt-0">
                       <BarChart3 className="w-4 h-4 mr-2" />
                       {t('dashboard.liveData')}
                     </div>
                   </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                   {/* Physical Vitality */}
                   <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                     <div className="flex items-center mb-4">
                       <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                         <Zap className="w-4 h-4 text-purple-600" />
                       </div>
                       <div>
                         <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.physicalVitality')}</h4>
                         <p className="text-xs text-gray-500">{t('dashboard.physicalDesc')}</p>
                       </div>
                     </div>
                     
                     <div className="mb-4">
                       <div className="flex items-baseline">
                         <span className="text-xl sm:text-3xl font-bold text-gray-900">{sampleData.categoryScores.physicalVitality}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                           {t('dashboard.excellent')}
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           {t('dashboard.getYours')}
                         </button>
                       </div>
                     </div>
                   </div>

                   {/* Emotional Health */}
                   <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                     <div className="flex items-center mb-4">
                       <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                         <Heart className="w-4 h-4 text-pink-600" />
                       </div>
                       <div>
                         <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.emotionalHealth')}</h4>
                         <p className="text-xs text-gray-500">{t('dashboard.emotionalDesc')}</p>
                       </div>
                     </div>
                     
                     <div className="mb-4">
                       <div className="flex items-baseline">
                         <span className="text-xl sm:text-3xl font-bold text-gray-900">{sampleData.categoryScores.emotionalHealth}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                           {t('dashboard.excellent')}
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           {t('dashboard.getYours')}
                         </button>
                       </div>
                     </div>
                   </div>

                   {/* Visual Appearance */}
                   <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                     <div className="flex items-center mb-4">
                       <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                         <Eye className="w-4 h-4 text-blue-600" />
                       </div>
                       <div>
                         <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.visualAppearance')}</h4>
                         <p className="text-xs text-gray-500">{t('dashboard.visualDesc')}</p>
                       </div>
                     </div>
                     
                     <div className="mb-4">
                       <div className="flex items-baseline">
                         <span className="text-xl sm:text-3xl font-bold text-gray-900">{sampleData.categoryScores.visualAppearance}</span>
                         <span className="text-base text-gray-500 ml-2">/100</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mt-auto">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                           {t('dashboard.excellent')}
                         </span>
                         <button 
                           onClick={() => navigate('/test')}
                           className="text-xs text-purple-600 hover:text-purple-800 font-medium underline decoration-dotted"
                         >
                           {t('dashboard.getYours')}
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
               <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6">
                {isMobile ? (
                  <div>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                        <User className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {sampleData.glowUpArchetype.name}
                        </h3>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {sampleData.glowUpArchetype.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <span className="text-gray-600 mr-0 mb-2 block">{t('dashboard.archetypeReady')}</span>
                      <button 
                        onClick={() => navigate('/test')}
                        className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors duration-200 flex items-center"
                      >
                        {t('dashboard.takeAssessment')}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ) : (
                 <div className="flex flex-col sm:flex-row items-start">
                   <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-0 mb-4 sm:mr-4 sm:mb-0 flex-shrink-0 border border-gray-200/50">
                     <User className="w-5 h-5 text-gray-700" />
                   </div>
                   <div className="flex-1">
                     <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                       {sampleData.glowUpArchetype.name}
                     </h3>
                     <p className="text-gray-800 leading-relaxed text-sm sm:text-base mb-4">
                       {sampleData.glowUpArchetype.description}
                     </p>
                   </div>
                 </div>
                )}
               </div>
             </div>

             {/* Quick Actions Section */}
             <div className="mb-6">
               <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50 p-6 sm:p-8">
                 <div className="mb-6">
                   <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">{t('dashboard.unlockResults')}</h3>
                   <p className="text-gray-600 text-sm sm:text-base">{t('dashboard.completeAssessment')}</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                   <button 
                     onClick={() => navigate('/test')}
                     className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center w-full sm:w-auto touch-manipulation"
                   >
                     {t('dashboard.startAssessment')}
                     <ArrowRight className="w-5 h-5 ml-2" />
                   </button>
                   <div className="flex items-center text-gray-500 text-sm mt-3 sm:mt-0">
                     <div className="flex items-center mr-4 sm:mr-6">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                       {t('dashboard.minutes')}
                     </div>
                     <div className="flex items-center">
                       <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                       {t('dashboard.freeAssessment')}
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
    <div className="relative sm:ml-[var(--sidebar-width)] aurora-bg flex flex-col overflow-x-hidden transition-all duration-300 sm:pb-0">
      <ShareCard ref={shareCardRef} results={results} userData={userData} />
      
      {/* Clean Glow Score Badge with Potential - Mobile Optimized */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[100] flex flex-col items-end space-y-2">
        <div 
          onClick={() => (isNewUser ? navigate('/test') : navigate('/future'))}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 border-gray-100 px-3 py-2 sm:px-6 sm:py-4 min-w-[100px] sm:min-w-[160px] transition-all duration-200 hover:shadow-3xl hover:scale-105 backdrop-blur-sm cursor-pointer touch-manipulation"
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">{t('wellness.glowScore')}</span>
            <div className="flex items-start space-x-1 sm:space-x-2">
              <span className="text-lg sm:text-3xl font-black text-gray-900">{isNewUser ? 78 : results?.overallGlowScore}</span>
              <div className="flex items-baseline space-x-0.5 -mt-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                <span className="text-base sm:text-2xl font-extrabold text-emerald-600">{isNewUser ? '92+' : '85+'}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/future')}
          className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
        >
          {t('dashboard.seePotential')}
        </button>
      </div>

      {/* Enhanced Header - Mobile Optimized */}
      <div className="relative overflow-hidden sm:-mx-6 lg:-mx-8 mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-3">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 sm:mr-4 border border-gray-200/50">
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg lg:text-xl font-medium text-slate-700">{t('dashboard.welcome', { name: userData?.first_name || t('dashboard.journey') })}</h1>
              <p className="text-slate-500 text-xs sm:text-sm">{t('dashboard.welcomePreview')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-6 relative z-10 flex-1 flex flex-col">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
          
          {/* Profile Section */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
              {isMobile ? (
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-0.5 shadow-xl">
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
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {userData?.first_name && userData?.last_name 
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData?.first_name 
                        ? userData.first_name
                        : 'Your Profile'
                      }
                    </h3>
                    <div className="bg-gray-100 rounded-lg p-2 mt-2 text-center">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="font-bold text-emerald-600">{results.biologicalAge}</span>
                          <span className="text-gray-500 block">Bio</span>
                        </div>
                        <div>
                          <span className="font-bold text-pink-600">{results.emotionalAge}</span>
                          <span className="text-gray-500 block">Emo</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">{results.chronologicalAge}</span>
                          <span className="text-gray-500 block">Actual</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="text-center">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1 shadow-2xl">
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
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {userData?.first_name && userData?.last_name 
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData?.first_name 
                        ? userData.first_name
                        : 'Your Profile'
                      }
                    </h3>
                  </div>
                  
                  {/* Age Analysis Compact */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="text-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">{t('dashboard.ageAnalysis')}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-4 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600">{results.biologicalAge}</div>
                        <div className="text-xs text-gray-600">{t('dashboard.biologicalAge')}</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-pink-600">{results.emotionalAge}</div>
                        <div className="text-xs text-gray-600">{t('dashboard.emotionalAge')}</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-700">{results.chronologicalAge}</div>
                        <div className="text-xs text-gray-600">{t('dashboard.actualAge')}</div>
                      </div>
                    </div>
                    
                    {results.chronologicalAge - results.biologicalAge > 0 && (
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {t('dashboard.yearsYounger', { years: results.chronologicalAge - results.biologicalAge })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{t('dashboard.wellnessMetrics')}</h3>
                  <p className="text-gray-600 text-sm">{t('dashboard.performanceOverview')}</p>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg mt-2 sm:mt-0">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('dashboard.liveData')}
                </div>
              </div>
              
              {isMobile ? (
                 <div className="space-y-4">
                  {/* Physical Vitality */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-gray-900">{t('dashboard.physicalVitality')}</h4>
                          <span className="text-sm font-bold text-gray-900">{categoryScores.physicalVitality}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 bg-purple-500 rounded-full"
                            style={{ width: `${categoryScores.physicalVitality}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Emotional Health */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-gray-900">{t('dashboard.emotionalHealth')}</h4>
                          <span className="text-sm font-bold text-gray-900">{categoryScores.emotionalHealth}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 bg-pink-500 rounded-full"
                            style={{ width: `${categoryScores.emotionalHealth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                   {/* Visual Appearance */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-gray-900">{t('dashboard.visualAppearance')}</h4>
                          <span className="text-sm font-bold text-gray-900">{categoryScores.visualAppearance}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${categoryScores.visualAppearance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                 </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Physical Vitality */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.physicalVitality')}</h4>
                      <p className="text-xs text-gray-500">{t('dashboard.physicalDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-xl sm:text-3xl font-bold text-gray-900">{categoryScores.physicalVitality}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                        {categoryScores.physicalVitality >= 70 ? t('dashboard.excellent') : categoryScores.physicalVitality >= 50 ? t('dashboard.good') : t('dashboard.needsFocus')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emotional Health */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.emotionalHealth')}</h4>
                      <p className="text-xs text-gray-500">{t('dashboard.emotionalDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-xl sm:text-3xl font-bold text-gray-900">{categoryScores.emotionalHealth}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                        {categoryScores.emotionalHealth >= 70 ? t('dashboard.excellent') : categoryScores.emotionalHealth >= 50 ? t('dashboard.good') : t('dashboard.needsFocus')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Appearance */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t('dashboard.visualAppearance')}</h4>
                      <p className="text-xs text-gray-500">{t('dashboard.visualDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-xl sm:text-3xl font-bold text-gray-900">{categoryScores.visualAppearance}</span>
                      <span className="text-base text-gray-500 ml-2">/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('dashboard.progress')}</span>
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
                        {categoryScores.visualAppearance >= 70 ? t('dashboard.excellent') : categoryScores.visualAppearance >= 50 ? t('dashboard.good') : t('dashboard.needsFocus')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Glow-Up Archetype Section */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6">
            {isMobile ? (
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {results.glowUpArchetype.name}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {results.glowUpArchetype.description}
                    </p>
                  </div>
                </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mr-0 mb-4 sm:mr-4 sm:mb-0 flex-shrink-0 border border-gray-200/50">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                    {results.glowUpArchetype.name}
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-sm sm:text-base mb-4">
                    {results.glowUpArchetype.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Mentor CTA Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-200/60 rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              {/* Mobile: stack everything vertically, center, and make button full width */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-2xl font-bold text-gray-900 mb-2 text-center sm:text-left">
                    🔍 Discover Your Hidden Problems
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 text-center sm:text-left">
                    Leo has analyzed your complete wellness profile and identified patterns you might not see.
                  </p>
                  {/* Show specific indicators */}
                  <div className="flex flex-col gap-2 mb-3 sm:gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start items-center">
                    {categoryScores.physicalVitality < 70 && (
                      <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium w-full sm:w-fit text-center">
                        Energy Issues Detected
                      </span>
                    )}
                    {categoryScores.emotionalHealth < 70 && (
                      <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium w-full sm:w-fit text-center">
                        Stress Patterns Found
                      </span>
                    )}
                    {categoryScores.visualAppearance < 70 && (
                      <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium w-full sm:w-fit text-center">
                        Self-Image Concerns
                      </span>
                    )}
                    {results.biologicalAge > results.chronologicalAge + 2 && (
                      <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium w-full sm:w-fit text-center">
                        Accelerated Aging
                      </span>
                    )}
                  </div>
                </div>
                {/* Mobile: full width button below, Desktop: right-aligned */}
                <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto flex justify-center sm:block">
                  <button
                    onClick={() => navigate('/ai-chat')}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center text-base"
                  >
                    Talk to Leo →
                  </button>
                </div>
              </div>
              {/* Suggested questions preview (if any) */}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6" id="quick-actions-section">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/50 p-6 sm:p-8">
            <div className="mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-6 h-6 text-purple-500 mr-2 sm:mr-3" />
                {t('dashboard.quickActionsTitle')}
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">{t('dashboard.quickActionsDesc')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* Visual Transformation Avatar */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-3xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative" onClick={() => navigate('/future')}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <Image className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">{t('dashboard.available')}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">{t('dashboard.visualAvatar')}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('dashboard.visualAvatarDesc')}</p>
                </div>

                {/* Atomic Glow-Up System */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 rounded-3xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative" onClick={() => navigate('/daily-plan')}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">{t('dashboard.available')}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">{t('dashboard.atomicSystem')}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('dashboard.atomicSystemDesc')}</p>
                </div>

                {/* AI Mentor */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 rounded-3xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative" onClick={() => navigate('/ai-chat')}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">{t('dashboard.available')}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">{t('dashboard.aiMentor')}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('dashboard.aiMentorDesc')}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Share Button */}
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[110]">
        <ShareResults targetRef={shareCardRef} />
      </div>
      
      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm">
          <AIChatScreen onBack={() => navigate('/dashboard')} />
        </div>
      )}
    </div>
  );
};