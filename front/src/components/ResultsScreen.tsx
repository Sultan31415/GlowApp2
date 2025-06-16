import React from 'react';
import { Sparkles, Heart, Zap, Eye, RotateCcw } from 'lucide-react';
import { AssessmentResults } from '../types';

interface ResultsScreenProps {
  results: AssessmentResults;
  onRestart: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ results, onRestart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Your Glow-Up Results
            </h1>
            <p className="text-lg text-gray-600">
              Your personalized transformation insights are ready!
            </p>
          </div>

          {/* Overall Glow Score */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Overall Glow Score</h2>
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <span className="text-4xl font-bold text-white">{results.overallGlowScore}</span>
            </div>
            <p className="text-lg text-gray-600">out of 100</p>
          </div>

          {/* Category Breakdowns */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Physical Vitality</h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full"
                  style={{ width: `${results.categoryScores.physicalVitality}%` }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-800">{results.categoryScores.physicalVitality}%</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center mb-4">
                <Heart className="w-6 h-6 text-pink-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Emotional Health</h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full"
                  style={{ width: `${results.categoryScores.emotionalHealth}%` }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-800">{results.categoryScores.emotionalHealth}%</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center mb-4">
                <Eye className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Visual Appearance</h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                  style={{ width: `${results.categoryScores.visualAppearance}%` }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-800">{results.categoryScores.visualAppearance}%</p>
            </div>
          </div>

          {/* Ages */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Age Analysis</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Biological Age</p>
                <p className="text-3xl font-bold text-purple-600">{results.biologicalAge}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Emotional Age</p>
                <p className="text-3xl font-bold text-pink-600">{results.emotionalAge}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Chronological Age</p>
                <p className="text-3xl font-bold text-blue-600">{results.chronologicalAge}</p>
              </div>
            </div>
          </div>

          {/* Glow-Up Archetype */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Glow-Up Archetype</h2>
            <h3 className="text-xl font-semibold text-purple-600 mb-3">{results.glowUpArchetype.name}</h3>
            <p className="text-gray-700 leading-relaxed">{results.glowUpArchetype.description}</p>
          </div>

          {/* AI Avatars */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Transformation Potential</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Current State</h3>
                <div className="bg-gray-100 rounded-2xl p-4 aspect-square flex items-center justify-center">
                  <img
                    src={results.avatarUrls.before}
                    alt="Current state avatar"
                    className="max-w-full max-h-full rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="%236b7280">Avatar Loading...</text></svg>';
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Transformation Potential</h3>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 aspect-square flex items-center justify-center">
                  <img
                    src={results.avatarUrls.after}
                    alt="Transformation potential avatar"
                    className="max-w-full max-h-full rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="%236b7280">Avatar Loading...</text></svg>';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Micro-Habits */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Personalized Micro-Habit Plan</h2>
            <div className="space-y-4">
              {results.microHabits.map((habit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{habit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={onRestart}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Take Assessment Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};