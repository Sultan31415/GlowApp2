import React, { useEffect, useState } from 'react';
import { RotateCcw, Sun, CheckCircle, Circle, Trophy, Target, Settings, Moon, Sparkles, Plus } from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { DayCard } from './DayCard';
import { useTranslation } from 'react-i18next';

const dayNames = [
  'daily.days.monday',
  'daily.days.tuesday',
  'daily.days.wednesday',
  'daily.days.thursday',
  'daily.days.friday',
  'daily.days.saturday',
  'daily.days.sunday',
];

interface DailyPlanScreenProps {
  onBack: () => void;
}

export const DailyPlanScreen: React.FC<DailyPlanScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const [plan, setPlan] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [customHabits, setCustomHabits] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingState, setTrackingState] = useState<Record<string, boolean>>({});
  const [loadingTracking, setLoadingTracking] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'plan' | 'goals' | 'habits' | 'profile'>('plan');

  const handleHabitComplete = async (habitType: string, habitContent: string, key: string) => {
    if (loadingTracking[key]) return;

    try {
      setLoadingTracking(prev => ({ ...prev, [key]: true }));
      
      await makeRequest('habits/complete', {
        method: 'POST',
        body: JSON.stringify({
          habit_type: habitType,
          habit_content: habitContent,
          day_date: new Date().toISOString().split('T')[0]
        })
      });

      setTrackingState(prev => ({ ...prev, [key]: true }));
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setLoadingTracking(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadPersonalizedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load daily plan
      const planData = await makeRequest('daily-plan');
      if (!planData || !Array.isArray(planData.days) || planData.days.length === 0) {
        await makeRequest('generate-daily-plan', { method: 'POST' });
        const newPlanData = await makeRequest('daily-plan');
        setPlan(newPlanData);
      } else {
        setPlan(planData);
      }

      // Load personalized goals
      try {
        const goalsData = await makeRequest('create-personalized-goals', { method: 'POST' });
        setGoals(goalsData.goals);
      } catch (goalsError) {
        console.log('Goals not available yet:', goalsError);
      }

      // Load custom habits
      try {
        const habitsData = await makeRequest('create-custom-habits', { method: 'POST' });
        setCustomHabits(habitsData.habits);
      } catch (habitsError) {
        console.log('Habits not available yet:', habitsError);
      }

      // Load user wellness profile
      try {
        const profileData = await makeRequest('user-wellness-profile');
        setUserProfile(profileData.profile);
      } catch (profileError) {
        console.log('Profile not available yet:', profileError);
      }

    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        try {
          await makeRequest('generate-daily-plan', { method: 'POST' });
          const data = await makeRequest('daily-plan');
          setPlan(data);
        } catch (genErr: any) {
          setError('Failed to generate your personalized plan. Please try again.');
          setPlan(null);
        }
      } else {
        setError('Failed to load your personalized wellness data.');
        setPlan(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonalizedData();
  }, [makeRequest]);

  if (loading) {
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animate-reverse"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{t('daily.loading')}</h3>
          <p className="text-gray-600 px-4">{t('daily.preparing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('daily.error')}</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              {t('daily.goBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Defensive: If plan or plan.days is not available, show nothing
  if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('daily.noPlan')}</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              {t('daily.tryAgain')}
            </button>
            <button
              onClick={onBack}
              className="w-full mt-3 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              {t('daily.goBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTabButton = (tab: 'plan' | 'goals' | 'habits' | 'profile', label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white/80 text-gray-700 hover:bg-white hover:text-blue-600'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  const renderPlanTab = () => (
    <>
      {/* Morning Routine & Challenges Section */}
      <div className="w-full flex justify-center px-2 sm:px-4 mt-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 w-full max-w-4xl mb-8 sm:mb-12">
          {/* Morning Routine Card */}
          <div className="flex-1 bg-transparent backdrop-blur-md shadow-xl rounded-2xl border-l-4 border-purple-300 p-4 sm:p-6 flex items-start min-w-0 mb-4 sm:mb-0">
            <div className="mr-3 sm:mr-4 mt-1">
              <Sun className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-yellow-700 mb-2 flex items-center">
                {t('daily.morningRoutine')}
              </h2>
              <ul className="list-none space-y-2 text-gray-700">
                {(typeof plan.morningLaunchpad === 'string' 
                  ? plan.morningLaunchpad.split(/,\s*|\.\s*|\n+/).filter(Boolean)
                  : Array.isArray(plan.morningLaunchpad)
                    ? plan.morningLaunchpad
                    : Object.values(plan.morningLaunchpad || {}))
                  .map((step: string, idx: number) => {
                    const key = `morning_routine_${idx}`;
                    const isCompleted = trackingState[key];
                    const isLoading = loadingTracking[key];
                    const stepText = step.trim().replace(/^[-•\d.\s]+/, '');
                    
                    return (
                      <li key={idx} className="flex items-start justify-between py-1">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="inline-block mt-0.5 text-green-500 text-base">✔️</span>
                          <span className="leading-snug font-medium text-gray-800">{stepText}</span>
                        </div>
                        <button
                          onClick={() => handleHabitComplete('morning_routine', stepText, key)}
                          disabled={isLoading || isCompleted}
                          className={`ml-3 flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-green-100 text-green-600 cursor-default' 
                              : isLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200'
                          }`}
                          title={isCompleted ? 'Completed' : isLoading ? 'Saving...' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
          {/* Weekly Challenges Card */}
          {Array.isArray(plan.challenges) && plan.challenges.length > 0 && (
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 flex items-center">
                <span className="mr-2">🏆</span>
                {t('daily.weeklyChallenges')}
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                {plan.challenges.map((challenge: any, idx: number) => {
                  const key = `weekly_challenge_${idx}`;
                  const isCompleted = trackingState[key];
                  const isLoading = loadingTracking[key];
                  const challengeText = `${challenge.title}: ${challenge.description}`;
                  
                  return (
                    <li key={idx} className="border-l-2 border-purple-300 pl-3 py-2 bg-purple-50/30 rounded shadow-none">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{challenge.category}</span>
                            <span className="text-xs sm:text-sm font-semibold text-purple-900">{challenge.title}</span>
                          </div>
                          <div className="text-gray-800 text-xs sm:text-sm mb-0.5">{challenge.description}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-0.5">
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⏱ {challenge.estimatedTime}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleHabitComplete('weekly_challenge', challengeText, key)}
                          disabled={isLoading || isCompleted}
                          className={`ml-3 flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-green-100 text-green-600 cursor-default' 
                              : isLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200'
                          }`}
                          title={isCompleted ? 'Completed' : isLoading ? 'Saving...' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Daily Plan Grid */}
      <div className="w-full mx-auto px-2 sm:px-8 lg:px-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 items-stretch">
          {plan.days.map((day: any, idx: number) => (
            <DayCard key={idx} day={day} dayName={t(dayNames[idx] || 'daily.day', { day: idx + 1 })} dayIndex={idx} />
          ))}
          {/* Invisible placeholder to fill the last cell of the first row and push last 3 cards to next row */}
          <div className="hidden lg:block" style={{ gridColumn: '4' }}></div>
        </div>
      </div>
    </>
  );

  const renderGoalsTab = () => (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-8">
      {goals ? (
        <div className="space-y-6">
          {/* Primary Goals */}
          <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              Primary Goals
            </h2>
            <div className="space-y-4">
              {goals.primaryGoals?.map((goal: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{goal.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{goal.category}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{goal.difficulty}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{goal.priority}</span>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{goal.timeframe}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2"><strong>Motivation:</strong> {goal.motivation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Goals */}
          {goals.supportingGoals?.length > 0 && (
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-purple-600" />
                Supporting Goals
              </h2>
              <div className="space-y-4">
                {goals.supportingGoals.map((goal: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50/50 rounded-r-lg">
                    <h3 className="font-semibold text-gray-800 mb-1">{goal.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{goal.category}</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{goal.difficulty}</span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{goal.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal Rationale */}
          {goals.goalRationale && (
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-600" />
                Why These Goals?
              </h2>
              <p className="text-gray-700 leading-relaxed">{goals.goalRationale}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No personalized goals yet</h3>
          <p className="text-gray-500">Complete your assessment to get personalized goals</p>
        </div>
      )}
    </div>
  );

  const renderHabitsTab = () => (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-8">
      {customHabits ? (
        <div className="space-y-6">
          {/* Core Habits */}
          <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-blue-600" />
              Core Habits
            </h2>
            <div className="space-y-4">
              {customHabits.coreHabits?.map((habit: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{habit.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{habit.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                        <div><strong>Trigger:</strong> {habit.trigger}</div>
                        <div><strong>Action:</strong> {habit.action}</div>
                        <div><strong>Reward:</strong> {habit.reward}</div>
                        <div><strong>Time:</strong> {habit.estimatedTime}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{habit.difficulty}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{habit.frequency}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{habit.goalConnection}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2"><strong>Progression:</strong> {habit.progression}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Habits */}
          {customHabits.supportingHabits?.length > 0 && (
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Moon className="w-6 h-6 mr-2 text-purple-600" />
                Supporting Habits
              </h2>
              <div className="space-y-4">
                {customHabits.supportingHabits.map((habit: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50/50 rounded-r-lg">
                    <h3 className="font-semibold text-gray-800 mb-1">{habit.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{habit.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div><strong>Trigger:</strong> {habit.trigger}</div>
                      <div><strong>Action:</strong> {habit.action}</div>
                      <div><strong>Frequency:</strong> {habit.frequency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habit Environment */}
          {customHabits.habitEnvironment && (
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-600" />
                Habit Environment
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Potential Obstacles:</h3>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    {customHabits.habitEnvironment.obstacles?.map((obstacle: string, idx: number) => (
                      <li key={idx}>{obstacle}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Success Enablers:</h3>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    {customHabits.habitEnvironment.enablers?.map((enabler: string, idx: number) => (
                      <li key={idx}>{enabler}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Integration Strategy:</h3>
                  <p className="text-gray-600 text-sm">{customHabits.habitEnvironment.integration}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No custom habits yet</h3>
          <p className="text-gray-500">Complete your assessment to get personalized habits</p>
        </div>
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-8">
      {userProfile ? (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-blue-600" />
              Your Wellness Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Personal Info</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {userProfile.user_info?.name}</div>
                  <div><strong>Age:</strong> {userProfile.user_info?.age}</div>
                  <div><strong>Biological Age:</strong> {userProfile.user_info?.biological_age}</div>
                  <div><strong>Emotional Age:</strong> {userProfile.user_info?.emotional_age}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Wellness Scores</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Overall Glow:</strong> {userProfile.wellness_scores?.overall_glow_score}</div>
                  <div><strong>Physical Vitality:</strong> {userProfile.wellness_scores?.physical_vitality}</div>
                  <div><strong>Emotional Health:</strong> {userProfile.wellness_scores?.emotional_health}</div>
                  <div><strong>Visual Appearance:</strong> {userProfile.wellness_scores?.visual_appearance}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Lifestyle */}
          <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-green-600" />
              Current Lifestyle Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(userProfile.current_lifestyle || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50/50 rounded-r">
                  <h3 className="font-semibold text-gray-800 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  {typeof value === 'object' ? (
                    <div className="text-xs text-gray-600 mt-1">
                      {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                        <div key={subKey}><strong>{subKey}:</strong> {String(subValue)}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">{String(value)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Your Strengths
              </h2>
              <ul className="space-y-2">
                {userProfile.strengths?.map((strength: string, idx: number) => (
                  <li key={idx} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/90 rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-orange-600" />
                Areas for Growth
              </h2>
              <ul className="space-y-2">
                {userProfile.challenges?.map((challenge: string, idx: number) => (
                  <li key={idx} className="flex items-center text-sm">
                    <Target className="w-4 h-4 text-orange-500 mr-2" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No profile data yet</h3>
          <p className="text-gray-500">Complete your assessment to see your wellness profile</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative sm:ml-[var(--sidebar-width)] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col overflow-x-hidden transition-all duration-300 pb-24">
      {/* Beta Version Label - centered above header */}
      <div className="flex justify-center items-center pt-4 pb-1">
        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">{t('daily.beta')}</span>
      </div>
      
      {/* Header */}
      <div className="relative overflow-hidden mt-4 w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative w-full px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-gray-200/50">
              <Sun className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-700">{t('daily.header')}</h1>
              <p className="text-slate-500 text-xs sm:text-base">{t('daily.subheader')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full flex justify-center px-4 sm:px-6 mt-6">
        <div className="flex flex-wrap gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          {renderTabButton('plan', 'Daily Plan', <Sun className="w-4 h-4" />)}
          {renderTabButton('goals', 'Goals', <Target className="w-4 h-4" />)}
          {renderTabButton('habits', 'Habits', <Settings className="w-4 h-4" />)}
          {renderTabButton('profile', 'Profile', <Sparkles className="w-4 h-4" />)}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'plan' && renderPlanTab()}
      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'habits' && renderHabitsTab()}
      {activeTab === 'profile' && renderProfileTab()}

      {/* Back Button */}
      <div className="text-center mt-8 sm:mt-12 px-2">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 sm:px-8 rounded-full inline-flex items-center transition-colors duration-300 w-full sm:w-auto max-w-xs sm:max-w-none">
          <RotateCcw className="w-5 h-5 mr-2" />
          <span>{t('daily.goBack')}</span>
        </button>
      </div>
    </div>
  );
}; 