import React, { useState, useMemo } from 'react';
import { Calendar, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = all 4 activities completed
  habits: Array<{
    id: number;
    habit_type: string;
    habit_content: string;
    completed_at: string;
    day_date: string;
    notes?: string;
  }>;
  // New fields for tracking individual activity types
  morning_routine_completed?: boolean;
  system_building_completed?: boolean;
  deep_focus_completed?: boolean;
  evening_reflection_completed?: boolean;
}

interface ContributionGraphProps {
  data: ContributionDay[];
  onDayClick?: (day: ContributionDay) => void;
  selectedDate?: string | null;
  className?: string;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  onDayClick,
  selectedDate,
  className = ''
}) => {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Process data into a grid format similar to GitHub
  const gridData = useMemo(() => {
    const grid: ContributionDay[][] = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create a map of all dates for the current year
    const dateMap = new Map<string, ContributionDay>();
    data.forEach(day => {
      dateMap.set(day.date, day);
    });

    // Generate the grid starting from the beginning of the year
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    // Create weeks array
    const weeks: ContributionDay[][] = [];
    let currentWeek: ContributionDay[] = [];
    
    // Add empty cells for days before the first day of the year
    const firstDayOfYear = startDate.getDay();
    for (let i = 0; i < firstDayOfYear; i++) {
      currentWeek.push({
        date: '',
        count: 0,
        level: 0,
        habits: []
      });
    }

    // Fill in the rest of the year
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dateMap.get(dateStr) || {
        date: dateStr,
        count: 0,
        level: 0,
        habits: []
      };
      
      currentWeek.push(dayData);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add any remaining days in the last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data, currentYear]);

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 dark:bg-gray-800';
      case 1: return 'bg-purple-200 dark:bg-purple-900';
      case 2: return 'bg-purple-300 dark:bg-purple-800';
      case 3: return 'bg-purple-400 dark:bg-purple-700';
      case 4: return 'bg-purple-500 dark:bg-purple-600';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTooltipContent = (day: ContributionDay) => {
    if (!day.date) return '';
    
    const dateFormatted = formatDate(day.date);
    const completedActivities = [];
    
    if (day.morning_routine_completed) completedActivities.push('Morning Routine');
    if (day.system_building_completed) completedActivities.push('System Building');
    if (day.deep_focus_completed) completedActivities.push('Deep Focus');
    if (day.evening_reflection_completed) completedActivities.push('Evening Reflection');
    
    if (completedActivities.length === 0) {
      return `No activities completed on ${dateFormatted}`;
    }
    
    const activityText = completedActivities.join(', ');
    return `${completedActivities.length}/4 activities completed on ${dateFormatted}: ${activityText}`;
  };

  const totalContributions = data.reduce((sum, day) => sum + day.count, 0);
  const activeDays = data.filter(day => day.count > 0).length;

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const stats = {
      totalDays: data.length,
      perfectDays: 0, // All 4 activities completed
      goodDays: 0,    // 3 activities completed
      okayDays: 0,    // 2 activities completed
      poorDays: 0,    // 1 activity completed
      emptyDays: 0    // 0 activities completed
    };

    data.forEach(day => {
      const completedCount = [
        day.morning_routine_completed,
        day.system_building_completed,
        day.deep_focus_completed,
        day.evening_reflection_completed
      ].filter(Boolean).length;

      switch (completedCount) {
        case 4: stats.perfectDays++; break;
        case 3: stats.goodDays++; break;
        case 2: stats.okayDays++; break;
        case 1: stats.poorDays++; break;
        case 0: stats.emptyDays++; break;
      }
    });

    return stats;
  }, [data]);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity in {currentYear}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalContributions} activities completed in {activeDays} active days
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentYear(prev => prev - 1)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={currentYear <= 2020}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(prev => prev + 1)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={currentYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completionStats.perfectDays}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Perfect</div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl font-bold text-green-500 dark:text-green-400">{completionStats.goodDays}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Good</div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{completionStats.okayDays}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Okay</div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">{completionStats.poorDays}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Poor</div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">{completionStats.emptyDays}</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Empty</div>
          </div>
        </div>
      </div>

      {/* Contribution Grid */}
      <div className="overflow-x-auto">
        <div className="flex space-x-1 min-w-max mx-auto justify-center">
          {/* Day labels */}
          <div className="flex flex-col space-y-1 mr-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div
                key={day}
                className="h-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center"
                style={{ width: '16px' }}
              >
                {index % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>

          {/* Contribution squares */}
          <div className="flex space-x-1">
            {gridData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125 ${
                      getActivityColor(day.level)
                    } ${
                      selectedDate === day.date ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
                    } ${
                      hoveredDay?.date === day.date ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''
                    }`}
                    onClick={() => day.date && onDayClick?.(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={day.date ? getTooltipContent(day) : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
          <div className="w-4 h-4 bg-purple-200 dark:bg-purple-900 rounded-sm"></div>
          <div className="w-4 h-4 bg-purple-300 dark:bg-purple-800 rounded-sm"></div>
          <div className="w-4 h-4 bg-purple-400 dark:bg-purple-700 rounded-sm"></div>
          <div className="w-4 h-4 bg-purple-500 dark:bg-purple-600 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>



      {/* Hover Tooltip */}
      {hoveredDay && hoveredDay.date && (
        <div className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10">
          {getTooltipContent(hoveredDay)}
        </div>
      )}
    </div>
  );
}; 