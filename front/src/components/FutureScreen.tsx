import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { AssessmentResults } from '../types';

interface FutureScreenProps {
  results: AssessmentResults;
  onBack: () => void;
}

/**
 * Displays the "Future You" projection that used to live inside DashboardScreen.
 * This is now a dedicated page so users can share a permalink `/future`.
 */
export const FutureScreen: React.FC<FutureScreenProps> = ({ results, onBack }) => {
  // --- Projection helpers (duplicated from DashboardScreen) ---
  const projectedGlowScore = Math.min(100, results.overallGlowScore + 12);
  const projectedBiologicalAge = Math.max(18, results.biologicalAge - 3);
  const projectedEmotionalAge = Math.max(18, results.emotionalAge - 2);
  const projectedPhysicalVitality = Math.min(100, results.categoryScores.physicalVitality + 15);
  const projectedEmotionalHealth = Math.min(100, results.categoryScores.emotionalHealth + 15);
  const projectedVisualAppearance = Math.min(100, results.categoryScores.visualAppearance + 15);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="text-center mt-10 mb-8">
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-wide"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Future You
        </h1>
        <p className="text-gray-600 mt-2">Projected results if you stay consistent ✨</p>
      </div>

      {/* Card */}
      <div className="flex-grow flex items-start justify-center px-4">
        <div className="w-full max-w-xl bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-xl shadow-purple-500/10 border border-purple-100">
          {/* Avatar & Glow score */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-2">
                <span className="text-2xl font-black text-white">{projectedGlowScore}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Projected Glow Score</h3>
            </div>
            <div className="relative">
              <div className="w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-2 shadow-xl shadow-purple-500/10">
                <img
                  src={results.avatarUrls.after}
                  alt="Future avatar"
                  className="w-full h-full rounded-xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">Future You</text></svg>';
                  }}
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-purple-600 rounded-xl p-2 shadow-lg shadow-purple-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
                <h4 className="text-xs font-medium text-gray-600 mb-1">Biological Age</h4>
                <p className="text-xl font-bold text-purple-700">{projectedBiologicalAge}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
                <h4 className="text-xs font-medium text-gray-600 mb-1">Emotional Age</h4>
                <p className="text-xl font-bold text-purple-700">{projectedEmotionalAge}</p>
              </div>
            </div>
            <div className="space-y-3">
              <StatRow label="Physical Vitality" value={projectedPhysicalVitality} color="from-purple-500 to-purple-600" />
              <StatRow label="Emotional Health" value={projectedEmotionalHealth} color="from-pink-500 to-pink-600" />
              <StatRow label="Visual Appearance" value={projectedVisualAppearance} color="from-blue-500 to-blue-600" />
            </div>
          </div>

          {/* Back button */}
          <div className="text-center mt-10">
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
    </div>
  );
};

interface StatRowProps {
  label: string;
  value: number;
  /** Tailwind gradient classes without the leading bg-gradient-to-r */
  color: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, color }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="text-xs font-bold text-purple-700">{value}%</span>
    </div>
    <div className="w-full bg-white rounded-full h-2">
      <div
        className={`bg-gradient-to-r ${color} h-2 rounded-full`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
