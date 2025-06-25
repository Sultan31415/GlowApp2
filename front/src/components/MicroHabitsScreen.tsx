import React from 'react';
import { RotateCcw } from 'lucide-react';

interface MicroHabitsScreenProps {
  microHabits: string[];
  onBack: () => void;
}

export const MicroHabitsScreen: React.FC<MicroHabitsScreenProps> = ({ microHabits, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Personalized Micro-Habit Plan</h2>
        <div className="space-y-4 mb-8">
          {microHabits.map((habit, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-300">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <p className="text-gray-700 leading-relaxed">{habit}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={onBack}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}; 