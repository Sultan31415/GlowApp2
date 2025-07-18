import React, { useEffect, useState } from 'react';
import { RotateCcw, Sun } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setPlan(newData);
            console.log('Fetched plan after generation (missing/empty days):', newData);
            return;
          } else {
            setError('No daily plan found. Please try to generate your plan again.');
            setPlan(null);
            return;
          }
        }
        setPlan(data);
        console.log('Fetched plan:', data); // Debug: log the plan structure
      } catch (err: any) {
        // If 404, try to generate the plan
        if ((err?.status === 404 || err?.response?.status === 404) && !triedGeneration) {
          triedGeneration = true;
          try {
            await makeRequest('generate-daily-plan', { method: 'POST' });
            // Try fetching again
            const data = await makeRequest('daily-plan');
            setPlan(data);
            console.log('Fetched plan after generation:', data); // Debug: log after generation
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
    if (error) {
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
    // If no error, show loading spinner (should be rare)
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
                  .map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 py-0.5">
                      <span className="inline-block mt-0.5 text-green-500 text-base">✔️</span>
                      <span className="leading-snug font-medium text-gray-800">{step.trim().replace(/^[-•\d.\s]+/, '')}</span>
                    </li>
                  ))}
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
                {plan.challenges.map((challenge: any, idx: number) => (
                  <li key={idx} className="border-l-2 border-purple-300 pl-3 py-1 bg-purple-50/30 rounded shadow-none">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{t('daily.category', { category: challenge.category })}</span>
                      <span className="text-xs sm:text-sm font-semibold text-purple-900">{t('daily.title', { title: challenge.title })}</span>
                    </div>
                    <div className="text-gray-800 text-xs sm:text-sm mb-0.5">{t('daily.description', { description: challenge.description })}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-0.5">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⏱ {t('daily.estimatedTime', { time: challenge.estimatedTime })}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Daily Plan Grid */}
      <div className="w-full mx-auto px-2 sm:px-8 lg:px-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 items-stretch">
          {plan.days.map((day: any, idx: number) => (
            <DayCard key={idx} day={day} dayName={t(dayNames[idx] || 'daily.day', { day: idx + 1 })} />
          ))}
          {/* Invisible placeholder to fill the last cell of the first row and push last 3 cards to next row */}
          <div className="hidden lg:block" style={{ gridColumn: '4' }}></div>
        </div>
      </div>

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