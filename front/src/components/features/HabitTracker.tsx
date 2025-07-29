import React, { useState } from 'react';
import { CheckCircle, Circle, Target, Settings, Moon, Zap, Award, Heart } from 'lucide-react';
import { useApi } from '../../utils/useApi';

interface HabitTrackerProps {
  habitType: string;
  habitContent: string;
  onComplete?: () => void;
  className?: string;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  habitType, 
  habitContent, 
  onComplete,
  className = ''
}) => {
  const { makeRequest } = useApi();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (isLoading || isCompleted) return;

    try {
      setIsLoading(true);
      
      await makeRequest('habits/complete', {
        method: 'POST',
        body: JSON.stringify({
          habit_type: habitType,
          habit_content: habitContent,
          day_date: new Date().toISOString().split('T')[0]
        })
      });

      setIsCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHabitTypeIcon = (type: string) => {
    switch (type) {
      case 'morning_routine': return <Zap className="w-4 h-4" />;
      case 'system_building': return <Settings className="w-4 h-4" />;
      case 'deep_focus': return <Target className="w-4 h-4" />;
      case 'evening_reflection': return <Moon className="w-4 h-4" />;
      case 'weekly_challenge': return <Award className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  const getHabitTypeColor = (type: string) => {
    switch (type) {
      case 'morning_routine': return 'text-yellow-600 bg-yellow-100';
      case 'system_building': return 'text-purple-600 bg-purple-100';
      case 'deep_focus': return 'text-blue-600 bg-blue-100';
      case 'evening_reflection': return 'text-pink-600 bg-pink-100';
      case 'weekly_challenge': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHabitTypeLabel = (type: string) => {
    switch (type) {
      case 'morning_routine': return 'Morning Routine';
      case 'system_building': return 'System Building';
      case 'deep_focus': return 'Deep Focus';
      case 'evening_reflection': return 'Evening Reflection';
      case 'weekly_challenge': return 'Weekly Challenge';
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getHabitTypeIcon(habitType)}
            <span className={`text-xs px-2 py-1 rounded-full ${getHabitTypeColor(habitType)}`}>
              {getHabitTypeLabel(habitType)}
            </span>
          </div>
          <p className="text-gray-700 text-sm">{habitContent}</p>
        </div>
        <button
          onClick={handleComplete}
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
  );
}; 