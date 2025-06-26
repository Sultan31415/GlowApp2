import React from 'react';
import { RotateCcw } from 'lucide-react';
import { StatsCard } from './StatsCard';
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

  // Assemble stat objects for reusable component
  const categoryScores = results.adjustedCategoryScores || results.categoryScores;
  const currentStats = {
    glowScore: results.overallGlowScore,
    biologicalAge: results.biologicalAge,
    emotionalAge: results.emotionalAge,
    physicalVitality: categoryScores.physicalVitality,
    emotionalHealth: categoryScores.emotionalHealth,
    visualAppearance: categoryScores.visualAppearance,
    avatarUrl: results.avatarUrls.before,
  } as const;

  const futureStats = {
    glowScore: projectedGlowScore,
    biologicalAge: projectedBiologicalAge,
    emotionalAge: projectedEmotionalAge,
    physicalVitality: projectedPhysicalVitality,
    emotionalHealth: projectedEmotionalHealth,
    visualAppearance: projectedVisualAppearance,
    avatarUrl: results.avatarUrls.after,
  } as const;

  // Deltas to display on future card
  const deltas = {
    glowScore: futureStats.glowScore - currentStats.glowScore,
    biologicalAge: futureStats.biologicalAge - currentStats.biologicalAge,
    emotionalAge: futureStats.emotionalAge - currentStats.emotionalAge,
    physicalVitality: futureStats.physicalVitality - currentStats.physicalVitality,
    emotionalHealth: futureStats.emotionalHealth - currentStats.emotionalHealth,
    visualAppearance: futureStats.visualAppearance - currentStats.visualAppearance,
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="text-center pt-12 pb-8">
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Future You
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Here's a projection of your results if you stay consistent.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <StatsCard title="Current You" {...currentStats} />
          <StatsCard title="Future You" highlight deltas={deltas} {...futureStats} />
        </div>
      </div>

      {/* Back button */}
      <div className="text-center py-10">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-3 px-6 border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 inline-flex items-center"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};


