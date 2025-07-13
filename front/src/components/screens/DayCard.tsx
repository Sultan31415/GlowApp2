import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface DayCardProps {
  day: any;
  dayName: string;
}

export const DayCard: React.FC<DayCardProps> = ({ day, dayName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="bg-pink-100 text-pink-800 font-bold text-center py-3 px-4">
        {dayName}
      </div>
      <div className="p-5">
        <div className="flex items-center mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          <h3 className="font-semibold text-gray-800 text-lg">{day.mainFocus}</h3>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <div>
            <b className="text-gray-700">Morning:</b> {typeof day.morningLaunchpad === 'object' ? Object.values(day.morningLaunchpad).join(', ') : day.morningLaunchpad}
          </div>
          <div>
            <b className="text-gray-700">Habit:</b> {Array.isArray(day.systemBuilding) ? day.systemBuilding.map((h: any) => h.action || h.habit).join(', ') : day.systemBuilding}
          </div>
        </div>

        <button
          className="text-blue-500 hover:text-blue-700 font-semibold text-sm mt-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Learn More'}
        </button>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-700 space-y-3">
            <div><b>Tip:</b> {day.motivationalTip}</div>
            <div><b>Why:</b> {day.rationale}</div>
            {Array.isArray(day.systemBuilding) && (
              <div>
                <b className="block mb-1">Habit Details:</b>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  {day.systemBuilding.map((habit: any, i: number) => (
                    <li key={i}>
                      <span className="font-semibold">{habit.action || habit.habit}</span>
                      {habit.trigger && <div className="text-xs text-gray-500">Trigger: {habit.trigger}</div>}
                      {habit.reward && <div className="text-xs text-gray-500">Reward: {habit.reward}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
