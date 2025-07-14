import React from 'react';
import { DayCardProps } from './DayCard';
import { ArrowLeft, Sun, Settings, Target, Moon, Sparkles, Info } from 'lucide-react';

type DayDetailsScreenProps = DayCardProps & {
  onBack: () => void;
};

export const DayDetailsScreen: React.FC<DayDetailsScreenProps> = ({ day, dayName, onBack }) => {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-3xl">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-6 bg-gray-100 hover:bg-gray-200 rounded-full pr-4 pl-2 py-2 transition-colors duration-200 shadow-sm">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Weekly Plan
      </button>

      {/* Day Summary Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 text-white text-lg font-extrabold shadow-lg">
            <Info className="w-5 h-5 mr-2 opacity-80" />
            {dayName}: {day.mainFocus}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-10 space-y-10">
          {/* Today's Tasks */}
          <section>
            <h3 className="font-bold text-2xl text-gray-800 mb-4 flex items-center">
              <Settings className="w-6 h-6 text-purple-400 mr-2" />Today's Tasks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Morning Launchpad */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-yellow-50 to-white shadow-sm">
                <div className="flex items-center mb-2">
                  <Sun className="w-5 h-5 text-yellow-500 mr-2" />
                  <h4 className="font-semibold text-lg text-gray-700">Morning Launchpad</h4>
                </div>
                <p className="text-gray-600 mt-1">{typeof day.morningLaunchpad === "object" ? Object.values(day.morningLaunchpad).join(", ") : day.morningLaunchpad}</p>
              </div>
              {/* System Building */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-purple-50 to-white shadow-sm">
                <div className="flex items-center mb-2">
                  <Settings className="w-5 h-5 text-purple-500 mr-2" />
                  <h4 className="font-semibold text-lg text-gray-700">System Building</h4>
                </div>
                <ul className="text-gray-600 mt-1 space-y-1">
                  {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).map((habit: any, i: number) => (
                    <li key={i}>
                      <b>Action:</b> {habit.action}
                      {habit.trigger && <> <b> | Trigger:</b> {habit.trigger}</>}
                      {habit.reward && <> <b> | Reward:</b> {habit.reward}</>}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Deep Focus */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-sm">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-lg text-gray-700">Deep Focus</h4>
                </div>
                <p className="text-gray-600 mt-1">{day.deepFocus}</p>
              </div>
              {/* Evening Reflection */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-gray-100 to-white shadow-sm">
                <div className="flex items-center mb-2">
                  <Moon className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="font-semibold text-lg text-gray-700">Evening Reflection</h4>
                </div>
                <p className="text-gray-600 mt-1">{day.eveningReflection}</p>
              </div>
            </div>
          </section>

          {/* Habit Details */}
          {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).length > 0 && (
            <section>
              <h3 className="font-bold text-2xl text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-6 h-6 text-pink-400 mr-2" />Habit Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).map((habit: any, i: number) => (
                  <div key={i} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <p className="font-semibold text-lg text-gray-800">{habit.action || habit.habit}</p>
                    {habit.trigger && <p className="text-md text-gray-600 mt-1"><b className='font-medium text-gray-700'>Trigger:</b> {habit.trigger}</p>}
                    {habit.reward && <p className="text-md text-gray-600"><b className='font-medium text-gray-700'>Reward:</b> {habit.reward}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Motivational Tip */}
          <section>
            <h3 className="font-bold text-2xl text-gray-800 mb-3 flex items-center">
              <Sparkles className="w-6 h-6 text-pink-500 mr-2" />Motivational Tip
            </h3>
            <blockquote className="text-xl text-pink-700 font-medium italic bg-pink-50 p-6 rounded-lg border-l-4 border-pink-500 shadow-md">
              <p>"{day.motivationalTip}"</p>
            </blockquote>
          </section>
        </div>
      </div>
    </div>
  );
};
