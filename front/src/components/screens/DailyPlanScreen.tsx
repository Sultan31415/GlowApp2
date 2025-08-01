import React, { useEffect, useState } from 'react';
import { RotateCcw, Sun, CheckCircle, Circle, Trophy, Edit, Calendar, Target, Activity, Heart, Save, X, History } from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { DayCard } from './DayCard';
import { useTranslation } from 'react-i18next';
import { LeoChatWidget, PlanVersionHistory } from '../features';
import { format, parseISO, addDays, startOfDay } from 'date-fns';

// Fallback day names in case calendar dates are not available
const fallbackDayNames = [
  'daily.days.monday',
  'daily.days.tuesday',
  'daily.days.wednesday',
  'daily.days.thursday',
  'daily.days.friday',
  'daily.days.saturday',
  'daily.days.sunday',
];

// Function to generate calendar dates if not provided by backend
const generateFallbackDates = () => {
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(tomorrow, i);
    dates.push({
      date: format(date, 'yyyy-MM-dd'),
      day_of_week: format(date, 'EEEE'),
      day_number: date.getDate(),
      month: format(date, 'MMMM'),
      year: date.getFullYear(),
      is_today: false,
      is_weekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return dates;
};

// Function to format date for display
const formatDateForDisplay = (calendarDate: any, t: any) => {
  if (!calendarDate) return '';
  
  try {
    const date = parseISO(calendarDate.date);
    const dayName = t(`daily.days.${calendarDate.day_of_week.toLowerCase()}`);
    const formattedDate = format(date, 'MMM d');
    
    return `${dayName}, ${formattedDate}`;
  } catch (error) {
    // Fallback to just the day name if date parsing fails
    return t(`daily.days.${calendarDate.day_of_week.toLowerCase()}`);
  }
};

// Function to ensure plan has calendar dates
const ensurePlanHasCalendarDates = (plan: any) => {
  if (!plan || !Array.isArray(plan.days)) {
    return plan;
  }
  
  const fallbackDates = generateFallbackDates();
  
  // Add calendar dates to each day if they don't exist
  plan.days.forEach((day: any, index: number) => {
    if (!day.calendar_date && fallbackDates[index]) {
      day.calendar_date = fallbackDates[index];
    }
  });
  
  // Add week metadata if it doesn't exist
  if (!plan.week_metadata && fallbackDates.length > 0) {
    plan.week_metadata = {
      start_date: fallbackDates[0].date,
      end_date: fallbackDates[fallbackDates.length - 1].date,
      generated_at: new Date().toISOString(),
      total_days: fallbackDates.length
    };
  }
  
  return plan;
};

interface DailyPlanScreenProps {
  onBack: () => void;
}

export const DailyPlanScreen: React.FC<DailyPlanScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for inline editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  // State for Leo updates
  const [leoUpdating, setLeoUpdating] = useState(false);
  // State for version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Function to refetch the plan when Leo updates it
  const refetchPlan = async () => {
    try {
      console.log('Refetching plan after Leo update...');
      setLeoUpdating(true); // Show Leo is updating
      setLoading(true); // Show loading state while refetching
      
      const data = await makeRequest('daily-plan');
      // Ensure plan has calendar dates
      const planWithDates = ensurePlanHasCalendarDates(data);
      setPlan(planWithDates);
      setError(null); // Clear any previous errors
      console.log('Plan refetched successfully:', planWithDates);
      
      // Show a brief success message (optional)
      // You could add a toast notification here if you have a toast system
      
    } catch (err: any) {
      console.error('Error refetching plan:', err);
      setError('Failed to refresh plan after Leo update. Please try refreshing the page.');
      
      // Try to refetch again after a short delay
      setTimeout(async () => {
        try {
          console.log('Retrying plan refetch...');
          const retryData = await makeRequest('daily-plan');
          const retryPlanWithDates = ensurePlanHasCalendarDates(retryData);
          setPlan(retryPlanWithDates);
          setError(null);
          console.log('Plan refetched successfully on retry:', retryPlanWithDates);
        } catch (retryErr: any) {
          console.error('Retry failed:', retryErr);
          setError('Unable to refresh plan. Please refresh the page manually.');
        }
      }, 2000);
    } finally {
      setLoading(false);
      setLeoUpdating(false); // Hide Leo updating indicator
    }
  };

  // New functions for inline editing
  const handleEditClick = () => {
    setIsEditing(true);
    setEditingPlan(JSON.parse(JSON.stringify(plan))); // Deep copy for editing
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPlan(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    
    setSaving(true);
    try {
      const response = await makeRequest('update-daily-plan', {
        method: 'POST',
        body: JSON.stringify(editingPlan)
      });
      
      console.log('Plan update response:', response);
      setPlan(editingPlan);
      setIsEditing(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const updateMorningRoutine = (index: number, value: string) => {
    if (!editingPlan) return;
    
    const newPlan = { ...editingPlan };
    if (Array.isArray(newPlan.morningLaunchpad)) {
      newPlan.morningLaunchpad[index] = value;
    } else if (typeof newPlan.morningLaunchpad === 'string') {
      const steps = newPlan.morningLaunchpad.split(/,\s*|\.\s*|\n+/).filter(Boolean);
      steps[index] = value;
      newPlan.morningLaunchpad = steps.join('. ');
    }
    setEditingPlan(newPlan);
  };

  const updateDayField = (dayIndex: number, field: string, value: any) => {
    if (!editingPlan) return;
    
    const newPlan = { ...editingPlan };
    newPlan.days[dayIndex] = { ...newPlan.days[dayIndex], [field]: value };
    setEditingPlan(newPlan);
  };

  const updateSystemBuilding = (dayIndex: number, habitIndex: number, field: string, value: string) => {
    if (!editingPlan) return;
    
    const newPlan = { ...editingPlan };
    const day = { ...newPlan.days[dayIndex] };
    
    if (Array.isArray(day.systemBuilding)) {
      day.systemBuilding[habitIndex] = { ...day.systemBuilding[habitIndex], [field]: value };
    } else if (day.systemBuilding) {
      day.systemBuilding = { ...day.systemBuilding, [field]: value };
    }
    
    newPlan.days[dayIndex] = day;
    setEditingPlan(newPlan);
  };

  useEffect(() => {
    let triedGeneration = false;
    const fetchPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await makeRequest('daily-plan');
        // If plan.days is missing or empty, try to generate a new plan (for early users)
        if (!data || !Array.isArray(data.days) || data.days.length === 0) {
          if (!triedGeneration) {
            triedGeneration = true;
            await makeRequest('generate-daily-plan', { method: 'POST' });
            const newData = await makeRequest('daily-plan');
            const newPlanWithDates = ensurePlanHasCalendarDates(newData);
            setPlan(newPlanWithDates);
            console.log('Fetched plan after generation (missing/empty days):', newPlanWithDates);
            return;
          } else {
            setError('No daily plan found. Please try to generate your plan again.');
            setPlan(null);
            return;
          }
        }
        // Ensure plan has calendar dates
        const planWithDates = ensurePlanHasCalendarDates(data);
        setPlan(planWithDates);
        console.log('Fetched plan with dates:', planWithDates); // Debug: log the plan structure
      } catch (err: any) {
        // If 404, try to generate the plan
        if ((err?.status === 404 || err?.response?.status === 404) && !triedGeneration) {
          triedGeneration = true;
          try {
            await makeRequest('generate-daily-plan', { method: 'POST' });
            // Try fetching again
            const data = await makeRequest('daily-plan');
            const planWithDates = ensurePlanHasCalendarDates(data);
            setPlan(planWithDates);
            console.log('Fetched plan after generation:', planWithDates); // Debug: log after generation
          } catch (genErr: any) {
            setError('Failed to generate your daily plan. Please try again.');
            setPlan(null);
            console.log('Error during plan generation:', genErr); // Debug: log generation error
          }
        } else {
          setError('Failed to load your daily plan.');
          setPlan(null);
          console.log('Error fetching daily plan:', err); // Debug: log fetch error
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
    // eslint-disable-next-line
  }, [makeRequest]);

  if (loading) {
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center px-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animate-reverse"></div>
          </div>
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2">{t('daily.loading')}</h3>
          <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-4">{t('daily.preparing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center max-w-sm sm:max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('daily.error')}</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6">{error}</p>
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation text-sm sm:text-base"
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
    if (error) {
      return (
        <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
          <div className="text-center max-w-sm sm:max-w-md mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('daily.noPlan')}</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation text-sm sm:text-base mb-2 sm:mb-3"
              >
                {t('daily.tryAgain')}
              </button>
              <button
                onClick={onBack}
                className="w-full bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation text-sm sm:text-base"
              >
                {t('daily.goBack')}
              </button>
            </div>
          </div>
        </div>
      );
    }
    // If no error, show loading spinner (should be rare)
    return (
      <div className="absolute inset-0 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center transition-all duration-300 overflow-x-hidden">
        <div className="text-center px-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animate-reverse"></div>
          </div>
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2">{t('daily.loading')}</h3>
          <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-4">{t('daily.preparing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative sm:ml-[var(--sidebar-width)] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col overflow-x-hidden transition-all duration-300 pb-16 sm:pb-24">
      {/* Leo Chat Widget */}
      <LeoChatWidget onPlanUpdated={refetchPlan} />
      
      {/* Beta Version Label - centered above header */}
      <div className="flex justify-center items-center pt-2 sm:pt-4 pb-1">
        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">{t('daily.beta')}</span>
      </div>
      
      {/* Header */}
      <div className="relative overflow-hidden mt-2 sm:mt-4 w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-start sm:items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 sm:mr-4 border border-gray-200/50 flex-shrink-0">
                <Sun className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-700 leading-tight">{t('daily.header')}</h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-500 mt-0.5 sm:mt-1">{t('daily.subheader')}</p>
                {plan?.week_metadata && (
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-600 font-medium">
                      {format(parseISO(plan.week_metadata.start_date), 'MMM d')} - {format(parseISO(plan.week_metadata.end_date), 'MMM d, yyyy')}
                    </span>
                    {plan.week_metadata.generated_at && (
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        • Generated {format(parseISO(plan.week_metadata.generated_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                )}
                {leoUpdating && (
                  <div className="flex items-center gap-1 sm:gap-2 mt-1">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-200 border-t-blue-600"></div>
                    <span className="text-xs text-blue-600 font-medium">Leo is updating your plan...</span>
                  </div>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
                  title="Save Changes"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
                  title="Cancel Changes"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleEditClick}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 text-sm"
                    title={t('daily.customize', 'Customize Your Plan')}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('daily.customize', 'Customize')}</span>
                  </button>
                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 text-sm"
                    title="View Plan History"
                  >
                    <History className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>History</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 text-center hidden sm:block">
                  💡 Tip: You can also ask Leo to modify your plans!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Morning Routine & Challenges Section */}
      <div className="w-full flex justify-center px-3 sm:px-4 mt-4 sm:mt-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-12 w-full max-w-4xl mb-6 sm:mb-8 lg:mb-12">
          {/* Morning Routine Card */}
          <div className="flex-1 bg-transparent backdrop-blur-md shadow-xl rounded-2xl border-l-4 border-purple-300 p-3 sm:p-4 lg:p-6 flex items-start min-w-0 mb-4 lg:mb-0">
            <div className="mr-2 sm:mr-3 lg:mr-4 mt-1 flex-shrink-0">
              <Sun className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-yellow-700 mb-2 flex items-center">
                {t('daily.morningRoutine')}
              </h2>
              <ul className="list-none space-y-1.5 sm:space-y-2 text-gray-700">
                {(typeof (isEditing ? editingPlan?.morningLaunchpad : plan.morningLaunchpad) === 'string' 
                  ? (isEditing ? editingPlan?.morningLaunchpad : plan.morningLaunchpad).split(/,\s*|\.\s*|\n+/).filter(Boolean)
                  : Array.isArray(isEditing ? editingPlan?.morningLaunchpad : plan.morningLaunchpad)
                    ? (isEditing ? editingPlan?.morningLaunchpad : plan.morningLaunchpad)
                    : Object.values((isEditing ? editingPlan?.morningLaunchpad : plan.morningLaunchpad) || {}))
                  .map((step: any, idx: number) => {
                    // Ensure step is a string before calling trim
                    const stepString = typeof step === 'string' ? step : String(step || '');
                    const stepText = stepString.trim().replace(/^[-•\d.\s]+/, '');
                    
                    return (
                      <li key={idx} className="flex items-start justify-between py-0.5 sm:py-1">
                        <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                          <span className="inline-block mt-0.5 text-green-500 text-sm sm:text-base flex-shrink-0">✔️</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={stepString}
                              onChange={(e) => updateMorningRoutine(idx, e.target.value)}
                              className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                              placeholder="Enter morning routine step"
                            />
                          ) : (
                            <span className="leading-snug font-medium text-gray-800 text-sm sm:text-base break-words">{stepText}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
          
          {/* Weekly Challenges Card */}
          {Array.isArray(plan.challenges) && plan.challenges.length > 0 && (
            <div className="flex-1">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-900 mb-2 sm:mb-3 flex items-center">
                <span className="mr-1.5 sm:mr-2">🏆</span>
                {t('daily.weeklyChallenges')}
              </h2>
              <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                {plan.challenges.map((challenge: any, idx: number) => {
                  const challengeText = `${challenge.title}: ${challenge.description}`;
                  
                  return (
                    <li key={idx} className="border-l-2 border-purple-300 pl-2 sm:pl-3 py-1.5 sm:py-2 bg-purple-50/30 rounded shadow-none">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full">{t('daily.category', { category: challenge.category })}</span>
                            <span className="text-xs sm:text-sm font-semibold text-purple-900 break-words">{t('daily.title', { title: challenge.title })}</span>
                          </div>
                          <div className="text-gray-800 text-xs sm:text-sm mb-0.5 break-words">{t('daily.description', { description: challenge.description })}</div>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-600 mb-0.5">
                            <span className="bg-yellow-100 text-yellow-700 px-1.5 sm:px-2 py-0.5 rounded">⏱ {t('daily.estimatedTime', { time: challenge.estimatedTime })}</span>
                          </div>
                        </div>
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
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-8 xl:px-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8 items-stretch">
          {(isEditing ? editingPlan?.days : plan.days).map((day: any, idx: number) => (
            <DayCard 
              key={idx} 
              day={day} 
              dayName={formatDateForDisplay(day.calendar_date, t) || t(fallbackDayNames[idx] || 'daily.day', { day: idx + 1 })} 
              dayIndex={idx}
              isEditing={isEditing}
              onUpdateField={updateDayField}
              onUpdateSystemBuilding={updateSystemBuilding}
            />
          ))}
          {/* Invisible placeholder to fill the last cell of the first row and push last 3 cards to next row */}
          <div className="hidden lg:block" style={{ gridColumn: '4' }}></div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center mt-6 sm:mt-8 lg:mt-12 px-3 sm:px-4">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 rounded-full inline-flex items-center justify-center transition-colors duration-300 w-full sm:w-auto max-w-xs sm:max-w-none text-sm sm:text-base">
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          <span>{t('daily.goBack')}</span>
        </button>
      </div>

      {/* Plan Version History Modal */}
      <PlanVersionHistory
        isVisible={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onPlanRestored={refetchPlan}
      />
    </div>
  );
}; 