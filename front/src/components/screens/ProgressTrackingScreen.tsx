import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Award,
  Flame,
  ArrowLeft,
  Activity,
  Zap,
  Heart,
  Plus,
  X,
  CalendarDays,
  Trophy
} from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { useTranslation } from 'react-i18next';
import { ContributionGraph } from '../ui/ContributionGraph';
import { LeoChatWidget } from '../features';

interface ProgressTrackingScreenProps {
  onBack?: () => void;
}

interface HabitCompletion {
  id: number;
  habit_type: string;
  habit_content: string;
  completed_at: string;
  day_date: string;
  notes?: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  habits: HabitCompletion[];
}

interface CompletionStats {
  total_completions: number;
  completion_rate_overall: number;
  habit_type_counts: Record<string, number>;
  current_streaks: Record<string, number>;
  longest_streaks: Record<string, number>;
  most_consistent_habit?: string;
}

interface ContributionStats {
  total_contributions: number;
  active_days: number;
  total_days: number;
  activity_rate: number;
  current_streak: number;
  longest_streak: number;
  average_per_active_day: number;
  monthly_activity: Record<string, number>;
  most_active_day?: {
    date: string;
    count: number;
    habits: HabitCompletion[];
  };
  year: number;
}

interface TodayTracking {
  morning_routine: boolean;
  system_building: boolean;
  deep_focus: boolean;
  evening_reflection: boolean;
}

interface HabitConfig {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const HABIT_CONFIGS: Record<string, HabitConfig> = {
  morning_routine: {
    type: 'morning_routine',
    label: 'Morning Routine',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-100'
  },
  system_building: {
    type: 'system_building',
    label: 'System Building',
    icon: Target,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-100'
  },
  deep_focus: {
    type: 'deep_focus',
    label: 'Deep Focus',
    icon: Activity,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 border-sky-100'
  },
  evening_reflection: {
    type: 'evening_reflection',
    label: 'Evening Reflection',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-100'
  }
};

export const ProgressTrackingScreen: React.FC<ProgressTrackingScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [todayTracking, setTodayTracking] = useState<TodayTracking>({
    morning_routine: false,
    system_building: false,
    deep_focus: false,
    evening_reflection: false
  });
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  
  // Data state
  const [contributionData, setContributionData] = useState<ContributionDay[]>([]);
  const [contributionStats, setContributionStats] = useState<ContributionStats | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<ContributionDay | null>(null);
  const [currentYear] = useState(new Date().getFullYear());

  // Fetch data on component mount
  useEffect(() => {
    fetchProgressData();
    fetchTodayTracking();
  }, [currentYear]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [contributionsData, statsData] = await Promise.all([
        makeRequest(`contributions/github-style?year=${currentYear}`),
        makeRequest(`contributions/stats?year=${currentYear}`)
      ]);

      setContributionData(contributionsData.contributions);
      setContributionStats(statsData);

    } catch (err: any) {
      console.error('Error fetching progress data:', err);
      setError(err?.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayTracking = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayCompletions = await makeRequest(`habits/completions?start_date=${today}&end_date=${today}`);
      
      const tracking: TodayTracking = {
        morning_routine: false,
        system_building: false,
        deep_focus: false,
        evening_reflection: false
      };

      todayCompletions.forEach((completion: HabitCompletion) => {
        if (completion.habit_type in tracking) {
          tracking[completion.habit_type as keyof TodayTracking] = true;
        }
      });

      setTodayTracking(tracking);
    } catch (err) {
      console.error('Error fetching today tracking:', err);
    }
  };

  const handleTrackHabit = async (habitType: string, habitContent: string) => {
    if (trackingLoading[habitType]) return;

    try {
      setTrackingLoading(prev => ({ ...prev, [habitType]: true }));
      
      if (todayTracking[habitType as keyof TodayTracking]) {
        return;
      }

      await makeRequest('habits/complete', {
        method: 'POST',
        body: JSON.stringify({
          habit_type: habitType,
          habit_content: habitContent,
          day_date: new Date().toISOString().split('T')[0]
        })
      });

      setTodayTracking(prev => ({ ...prev, [habitType]: true }));
      fetchProgressData();
    } catch (error) {
      console.error('Error tracking habit:', error);
    } finally {
      setTrackingLoading(prev => ({ ...prev, [habitType]: false }));
    }
  };

  const handleDayClick = (day: ContributionDay) => {
    setSelectedDate(day.date);
    setSelectedDayDetails(day);
  };

  const getHabitTypeIcon = (habitType: string) => {
    const config = HABIT_CONFIGS[habitType];
    if (config) {
      const IconComponent = config.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  const getHabitTypeColor = (habitType: string) => {
    const config = HABIT_CONFIGS[habitType];
    if (config) {
      return `${config.color} ${config.bgColor}`;
    }
    return 'text-gray-600 bg-gray-50 border-gray-100';
  };

  const getHabitTypeLabel = (habitType: string) => {
    const config = HABIT_CONFIGS[habitType];
    return config?.label || habitType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderHabitCard = (habitKey: keyof TodayTracking) => {
    const config = HABIT_CONFIGS[habitKey];
    if (!config) return null;

    const IconComponent = config.icon;
    const isCompleted = todayTracking[habitKey];
    const isLoading = trackingLoading[habitKey];

    return (
      <div 
        key={habitKey} 
        className={`flex items-center justify-between p-3 ${config.bgColor} rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${isCompleted ? 'opacity-75' : 'hover:scale-[1.02]'}`}
        onClick={() => !isCompleted && !isLoading && handleTrackHabit(habitKey, config.label)}
      >
        <div className="flex items-center space-x-2">
          <div className={`p-2 ${config.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg ${isCompleted ? 'opacity-60' : ''}`}>
            <IconComponent className={`w-4 h-4 ${config.color} ${isCompleted ? 'opacity-60' : ''}`} />
          </div>
          <div>
            <p className={`font-semibold text-gray-900 text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>{config.label}</p>
            <p className={`text-xs ${isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>
              {isCompleted ? 'Completed today' : 'Tap to mark as done'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          {isCompleted ? (
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          ) : isLoading ? (
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
              <div className="w-3 h-3 rounded-full bg-transparent"></div>
            </div>
          )}
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Progress Data</h3>
          <p className="text-gray-600">Analyzing your wellness journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Progress</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchProgressData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Leo Chat Widget */}
      <LeoChatWidget />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack || (() => navigate(-1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Progress Tracking</h1>
                <p className="text-sm text-gray-600">Your wellness journey visualized</p>
              </div>
            </div>
            
            <button
              onClick={fetchProgressData}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tracking Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/50 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Today's Tracking</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(HABIT_CONFIGS).map(habitKey => renderHabitCard(habitKey as keyof TodayTracking))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* GitHub-Style Contribution Graph */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/50">
            <ContributionGraph
              data={contributionData}
              onDayClick={handleDayClick}
              selectedDate={selectedDate}
              className="w-full"
            />
          </div>

          {/* Selected Day Details Modal */}
          {selectedDayDetails && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-100/50 max-w-md w-full mx-auto animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatDate(selectedDayDetails.date)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Daily Summary</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedDayDetails(null);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Stats Summary */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                    <span className="text-sm font-medium text-gray-600">Habits Completed</span>
                    <span className="text-2xl font-bold text-green-600">{selectedDayDetails.count}</span>
                  </div>
                  
                  {/* Completed Habits List */}
                  {selectedDayDetails.habits.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Completed Habits:</h4>
                      {selectedDayDetails.habits.map((habit, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${getHabitTypeColor(habit.habit_type)}`}>
                                {getHabitTypeLabel(habit.habit_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 