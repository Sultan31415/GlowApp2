import React from 'react';
import { Calendar, TrendingUp, Flame } from 'lucide-react';

interface ContributionWidgetProps {
  data: Array<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
  stats?: {
    total_contributions: number;
    active_days: number;
    current_streak: number;
  };
  className?: string;
}

export const ContributionWidget: React.FC<ContributionWidgetProps> = ({
  data,
  stats,
  className = ''
}) => {
  // Get the last 7 weeks of data for a compact view
  const recentData = data.slice(-49); // 7 weeks * 7 days = 49 days
  
  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 dark:bg-gray-800';
      case 1: return 'bg-green-200 dark:bg-green-900';
      case 2: return 'bg-green-300 dark:bg-green-800';
      case 3: return 'bg-green-400 dark:bg-green-700';
      case 4: return 'bg-green-500 dark:bg-green-600';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        {stats && (
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">{stats.total_contributions}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3 text-orange-600" />
              <span className="text-gray-600 dark:text-gray-400">{stats.current_streak}</span>
            </div>
          </div>
        )}
      </div>

      {/* Compact contribution grid */}
      <div className="overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col space-y-1 mr-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={day}
                className="h-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center"
                style={{ width: '8px' }}
              >
                {index % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>

          {/* Contribution squares */}
          <div className="flex space-x-1">
            {Array.from({ length: Math.ceil(recentData.length / 7) }, (_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {recentData.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-2 h-2 rounded-sm ${getActivityColor(day.level)}`}
                    title={`${day.date}: ${day.count} habits`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-200 dark:bg-green-900 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-300 dark:bg-green-800 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-400 dark:bg-green-700 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-500 dark:bg-green-600 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}; 