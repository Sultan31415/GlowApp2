import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Award,
  Flame,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  CalendarDays,
  Activity,
  Zap,
  Heart,
  Eye
} from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';

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

interface HabitStreak {
  habit_type: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  last_completion_date?: string;
}

interface DailyProgress {
  date: string;
  completed_habits: HabitCompletion[];
  total_habits_available: number;
  completion_rate: number;
  streak_info: Record<string, number>;
}

interface CompletionStats {
  total_completions: number;
  completion_rate_overall: number;
  habit_type_counts: Record<string, number>;
  current_streaks: Record<string, number>;
  longest_streaks: Record<string, number>;
  most_consistent_habit?: string;
}

export const ProgressTrackingScreen: React.FC<ProgressTrackingScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'weekly' | 'history'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);
  const [progressHistory, setProgressHistory] = useState<any>(null);
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all progress data in parallel
      const [dailyData, weeklyData, historyData, streaksData] = await Promise.all([
        makeRequest('progress/daily'),
        makeRequest('progress/weekly'),
        makeRequest('progress/history?days=30'),
        makeRequest('progress/streaks')
      ]);

      setDailyProgress(dailyData);
      setWeeklyProgress(weeklyData);
      setProgressHistory(historyData);
      setStreaks(streaksData.streaks);
      setCompletionStats(historyData.completion_stats);

    } catch (err: any) {
      console.error('Error fetching progress data:', err);
      setError(err?.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHabit = async (habitType: string, habitContent: string) => {
    try {
      await makeRequest('habits/complete', {
        method: 'POST',
        body: JSON.stringify({
          habit_type: habitType,
          habit_content: habitContent,
          day_date: selectedDate
        })
      });
      
      // Refresh data after completion
      fetchProgressData();
    } catch (err: any) {
      console.error('Error completing habit:', err);
      setError('Failed to complete habit');
    }
  };

  const getHabitTypeIcon = (habitType: string) => {
    switch (habitType) {
      case 'morning_routine': return <Zap className="w-4 h-4" />;
      case 'system_building': return <Target className="w-4 h-4" />;
      case 'deep_focus': return <Activity className="w-4 h-4" />;
      case 'evening_reflection': return <Heart className="w-4 h-4" />;
      case 'weekly_challenge': return <Award className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getHabitTypeColor = (habitType: string) => {
    switch (habitType) {
      case 'morning_routine': return 'text-yellow-600 bg-yellow-100';
      case 'system_building': return 'text-purple-600 bg-purple-100';
      case 'deep_focus': return 'text-blue-600 bg-blue-100';
      case 'evening_reflection': return 'text-pink-600 bg-pink-100';
      case 'weekly_challenge': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHabitTypeLabel = (habitType: string) => {
    switch (habitType) {
      case 'morning_routine': return 'Morning Routine';
      case 'system_building': return 'System Building';
      case 'deep_focus': return 'Deep Focus';
      case 'evening_reflection': return 'Evening Reflection';
      case 'weekly_challenge': return 'Weekly Challenge';
      default: return habitType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
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
                <p className="text-sm text-gray-600">Monitor your wellness journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'daily', label: 'Daily', icon: Calendar },
              { id: 'weekly', label: 'Weekly', icon: CalendarDays },
              { id: 'history', label: 'History', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Completions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {completionStats?.total_completions || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((completionStats?.completion_rate_overall || 0) * 100)}%
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...(streaks?.map(s => s.current_streak) || [0]))}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...(streaks?.map(s => s.longest_streak) || [0]))}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Streaks Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Habit Streaks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streaks?.map((streak) => (
                  <div key={streak.habit_type} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getHabitTypeIcon(streak.habit_type)}
                        <span className="font-medium text-gray-900">
                          {getHabitTypeLabel(streak.habit_type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-semibold text-green-600">{streak.current_streak} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Longest:</span>
                        <span className="font-semibold text-purple-600">{streak.longest_streak} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold text-gray-900">{streak.total_completions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Consistent Habit */}
            {completionStats?.most_consistent_habit && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Consistent Habit</h3>
                <div className="flex items-center space-x-4">
                  {getHabitTypeIcon(completionStats.most_consistent_habit)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {getHabitTypeLabel(completionStats.most_consistent_habit)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {completionStats.current_streaks[completionStats.most_consistent_habit]} day streak
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Daily Progress</h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {dailyProgress && (
                <div className="space-y-4">
                  {/* Completion Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Math.round(dailyProgress.completion_rate * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${dailyProgress.completion_rate * 100}%` }}
                    />
                  </div>

                  {/* Completed Habits */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Completed Habits</h4>
                    <div className="space-y-2">
                      {dailyProgress.completed_habits.map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">{habit.habit_content}</p>
                              <p className={`text-xs px-2 py-1 rounded-full inline-block ${getHabitTypeColor(habit.habit_type)}`}>
                                {getHabitTypeLabel(habit.habit_type)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(habit.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
              {weeklyProgress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{Math.round(weeklyProgress.weekly_completion_rate * 100)}%</p>
                      <p className="text-sm text-gray-600">Weekly Completion</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">{weeklyProgress.weekly_goals_met}</p>
                      <p className="text-sm text-gray-600">Goals Met</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <p className="text-2xl font-bold text-purple-600">{weeklyProgress.weekly_goals_total}</p>
                      <p className="text-sm text-gray-600">Total Goals</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress History</h3>
              {progressHistory && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Showing progress data for the last 30 days
                  </p>
                  {/* Add charts and detailed history here */}
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Detailed progress charts coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 