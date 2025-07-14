import React from 'react';
import { Calendar, Sparkles, Moon, Target, Settings, Info } from 'lucide-react';

export interface DayCardProps {
  day: any;
  dayName: string;
}

export const DayCard: React.FC<DayCardProps> = ({ day, dayName }) => {
  return (
    <div className="bg-white/90 rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col h-full min-h-[320px] self-stretch">
      <div className="flex items-center mb-2">
        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-bold text-gray-800">{dayName}</h3>
      </div>
      <div className="mb-2">
        <span className="text-xs font-semibold text-slate-500">Main Focus:</span>
        <div className="text-base font-medium text-gray-700">{day.mainFocus}</div>
      </div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Settings className="w-4 h-4 mr-1 text-purple-400" />System Building</h4>
        <ul className="space-y-1">
          {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).map((habit: any, hIdx: number) => (
            <li key={hIdx} className="flex flex-col text-sm text-gray-700">
              <span>
                <b>Action:</b> {habit.action}
                {habit.trigger && <> <b> | Trigger:</b> {habit.trigger}</>}
                {habit.reward && <> <b> | Reward:</b> {habit.reward}</>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Target className="w-4 h-4 mr-1 text-blue-400" />Deep Focus</h4>
        <div className="text-gray-700 text-sm">{day.deepFocus}</div>
      </div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Moon className="w-4 h-4 mr-1 text-gray-500" />Evening Reflection</h4>
        <div className="text-gray-700 text-sm">{day.eveningReflection}</div>
      </div>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Sparkles className="w-4 h-4 mr-1 text-pink-400" />Motivational Tip</h4>
        <div className="italic text-pink-700 text-sm">{day.motivationalTip}</div>
      </div>
    </div>
  );
}
