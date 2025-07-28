import React, { useState } from 'react';
import { Calendar, Sparkles, Moon, Target, Settings, Info, CheckCircle, Circle, Heart, Brain, Zap } from 'lucide-react';
import { useApi } from '../../utils/useApi';

export interface DayCardProps {
  day: any;
  dayName: string;
  dayIndex: number;
}

export const DayCard: React.FC<DayCardProps> = ({ day, dayName, dayIndex }) => {
  const { makeRequest } = useApi();
  const [trackingState, setTrackingState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleHabitComplete = async (habitType: string, habitContent: string) => {
    const key = `${habitType}_${dayIndex}`;
    if (loading[key]) return;

    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      
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
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const getHabitTypeIcon = (habitType: string) => {
    switch (habitType) {
      case 'system_building': return <Settings className="w-4 h-4" />;
      case 'deep_focus': return <Target className="w-4 h-4" />;
      case 'evening_reflection': return <Moon className="w-4 h-4" />;
      case 'physical_activity': return <Zap className="w-4 h-4" />;
      case 'nutrition': return <Heart className="w-4 h-4" />;
      case 'mental_wellness': return <Brain className="w-4 h-4" />;
      case 'social_connection': return <Sparkles className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getHabitTypeColor = (habitType: string) => {
    switch (habitType) {
      case 'system_building': return 'text-purple-600 bg-purple-100';
      case 'deep_focus': return 'text-blue-600 bg-blue-100';
      case 'evening_reflection': return 'text-gray-600 bg-gray-100';
      case 'physical_activity': return 'text-green-600 bg-green-100';
      case 'nutrition': return 'text-red-600 bg-red-100';
      case 'mental_wellness': return 'text-indigo-600 bg-indigo-100';
      case 'social_connection': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderHabitWithTracking = (habitType: string, habitContent: string, title: string, icon: React.ReactNode) => {
    const key = `${habitType}_${dayIndex}`;
    const isCompleted = trackingState[key];
    const isLoading = loading[key];

    return (
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          {icon}
          <span className="ml-1">{title}</span>
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-700 text-sm">{habitContent}</p>
            </div>
            <button
              onClick={() => handleHabitComplete(habitType, habitContent)}
              disabled={isLoading || isCompleted}
              className={`ml-3 flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-100 text-green-600 cursor-default' 
                  : isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200'
              }`}
              title={isCompleted ? 'Completed' : isLoading ? 'Saving...' : 'Mark as completed'}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          </div>
          {isCompleted && (
            <div className="mt-2 flex items-center text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed today
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPersonalizedHabit = (habit: any, habitType: string, idx: number) => {
    const key = `${habitType}_${dayIndex}_${idx}`;
    const isCompleted = trackingState[key];
    const isLoading = loading[key];
    
    let habitContent = '';
    if (typeof habit === 'string') {
      habitContent = habit;
    } else if (habit.action) {
      habitContent = `Action: ${habit.action}`;
      if (habit.trigger) habitContent += ` | Trigger: ${habit.trigger}`;
      if (habit.reward) habitContent += ` | Reward: ${habit.reward}`;
    } else if (habit.title) {
      habitContent = `${habit.title}: ${habit.description || ''}`;
    } else {
      habitContent = JSON.stringify(habit);
    }

    return (
      <div key={idx} className="mb-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          {getHabitTypeIcon(habitType)}
          <span className="ml-1">{habitType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-700 text-sm">{habitContent}</p>
              {habit.difficulty && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className={`text-xs px-2 py-1 rounded ${getHabitTypeColor(habitType)}`}>
                    {habit.difficulty}
                  </span>
                  {habit.frequency && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                      {habit.frequency}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => handleHabitComplete(habitType, habitContent)}
              disabled={isLoading || isCompleted}
              className={`ml-3 flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-100 text-green-600 cursor-default' 
                  : isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200'
              }`}
              title={isCompleted ? 'Completed' : isLoading ? 'Saving...' : 'Mark as completed'}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          </div>
          {isCompleted && (
            <div className="mt-2 flex items-center text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed today
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col h-full min-h-[320px] self-stretch">
      <div className="flex items-center mb-3">
        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-bold text-gray-800">{dayName}</h3>
      </div>
      
      <div className="mb-3">
        <span className="text-xs font-semibold text-slate-500">Main Focus:</span>
        <div className="text-base font-medium text-gray-700">{day.mainFocus}</div>
      </div>

      {/* System Building */}
      {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).map((habit: any, hIdx: number) => (
        <div key={hIdx} className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Settings className="w-4 h-4 mr-1 text-purple-400" />
            System Building
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-700 text-sm">
                  <b>Action:</b> {habit.action}
                  {habit.trigger && <> <b> | Trigger:</b> {habit.trigger}</>}
                  {habit.reward && <> <b> | Reward:</b> {habit.reward}</>}
                </p>
              </div>
              <button
                onClick={() => handleHabitComplete('system_building', `Action: ${habit.action}${habit.trigger ? ` | Trigger: ${habit.trigger}` : ''}${habit.reward ? ` | Reward: ${habit.reward}` : ''}`)}
                disabled={loading[`system_building_${dayIndex}_${hIdx}`] || trackingState[`system_building_${dayIndex}_${hIdx}`]}
                className={`ml-3 flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                  trackingState[`system_building_${dayIndex}_${hIdx}`]
                    ? 'bg-green-100 text-green-600 cursor-default' 
                    : loading[`system_building_${dayIndex}_${hIdx}`]
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200'
                }`}
                title={trackingState[`system_building_${dayIndex}_${hIdx}`] ? 'Completed' : loading[`system_building_${dayIndex}_${hIdx}`] ? 'Saving...' : 'Mark as completed'}
              >
                {trackingState[`system_building_${dayIndex}_${hIdx}`] ? (
                  <CheckCircle className="w-5 h-5" />
                ) : loading[`system_building_${dayIndex}_${hIdx}`] ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
            </div>
            {trackingState[`system_building_${dayIndex}_${hIdx}`] && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed today
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Deep Focus */}
      {day.deepFocus && renderHabitWithTracking(
        'deep_focus',
        day.deepFocus,
        'Deep Focus',
        <Target className="w-4 h-4 mr-1 text-blue-400" />
      )}

      {/* Evening Reflection */}
      {day.eveningReflection && renderHabitWithTracking(
        'evening_reflection',
        day.eveningReflection,
        'Evening Reflection',
        <Moon className="w-4 h-4 mr-1 text-gray-500" />
      )}

      {/* Physical Activity */}
      {day.physicalActivity && renderHabitWithTracking(
        'physical_activity',
        day.physicalActivity,
        'Physical Activity',
        <Zap className="w-4 h-4 mr-1 text-green-400" />
      )}

      {/* Nutrition */}
      {day.nutrition && renderHabitWithTracking(
        'nutrition',
        day.nutrition,
        'Nutrition',
        <Heart className="w-4 h-4 mr-1 text-red-400" />
      )}

      {/* Mental Wellness */}
      {day.mentalWellness && renderHabitWithTracking(
        'mental_wellness',
        day.mentalWellness,
        'Mental Wellness',
        <Brain className="w-4 h-4 mr-1 text-indigo-400" />
      )}

      {/* Social Connection */}
      {day.socialConnection && renderHabitWithTracking(
        'social_connection',
        day.socialConnection,
        'Social Connection',
        <Sparkles className="w-4 h-4 mr-1 text-pink-400" />
      )}

      {/* Personalized Habits - handle any new habit types */}
      {Object.entries(day).map(([key, value]: [string, any]) => {
        // Skip already handled habit types
        if (['mainFocus', 'systemBuilding', 'deepFocus', 'eveningReflection', 'physicalActivity', 'nutrition', 'mentalWellness', 'socialConnection'].includes(key)) {
          return null;
        }
        
        // Handle array of habits
        if (Array.isArray(value)) {
          return value.map((habit: any, idx: number) => 
            renderPersonalizedHabit(habit, key, idx)
          );
        }
        
        // Handle single habit
        if (value && typeof value === 'object' || typeof value === 'string') {
          return renderPersonalizedHabit(value, key, 0);
        }
        
        return null;
      })}

      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
          <Sparkles className="w-4 h-4 mr-1 text-pink-400" />
          Motivational Tip
        </h4>
        <div className="italic text-pink-700 text-sm">{day.motivationalTip}</div>
      </div>
    </div>
  );
};
