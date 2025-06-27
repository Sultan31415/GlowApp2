import React from 'react';
import { RotateCcw, Target, CheckCircle2 } from 'lucide-react';

interface MicroHabitsScreenProps {
  microHabits: string[];
  onBack: () => void;
}

export const MicroHabitsScreen: React.FC<MicroHabitsScreenProps> = ({ microHabits, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Header */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-gray-200/50">
                <Target className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-medium text-slate-700">Your Test Plan</h1>
                <p className="text-slate-500 text-sm">Personalized micro-habits for transformation</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="bg-white/60 backdrop-blur-sm hover:bg-white/80 text-slate-600 px-4 py-2 rounded-xl border border-gray-200/50 transition-all duration-200 inline-flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Introduction */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-800 mb-3">Your Personalized Micro-Habit Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Based on your assessment, here are small, actionable habits designed to create meaningful transformation in your life.
            </p>
          </div>

          {/* Habits List */}
          <div className="space-y-4 mb-8">
            {microHabits.map((habit, index) => (
              <div key={index} className="group">
                <div className="flex items-start space-x-4 p-5 bg-gradient-to-r from-gray-50/80 to-blue-50/40 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-300">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-medium shadow-sm">
                    {index + 1}
                  </div>
                  
                  {/* Habit Content */}
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed text-base">{habit}</p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-green-400 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-green-400 transition-colors duration-300"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="bg-blue-50/60 rounded-xl p-6 border border-blue-100">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Ready to Start?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Start with just one habit and build momentum. Small steps lead to big transformations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={onBack}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 inline-flex items-center shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </button>
                  <div className="text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100">
                    📊 Habit tracking coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 