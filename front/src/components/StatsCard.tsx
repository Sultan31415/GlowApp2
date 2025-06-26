import React from 'react';
import { Sparkles } from 'lucide-react';

interface Stats {
  glowScore: number;
  biologicalAge: number;
  emotionalAge: number;
  physicalVitality: number;
  emotionalHealth: number;
  visualAppearance: number;
}

export interface StatsCardProps extends Stats {
  title: string;
  avatarUrl: string;
  /**
   * Differences to display next to each metric. Positive numbers mean an increase, negative a decrease.
   * Omit or set undefined if no delta label should be shown.
   */
  deltas?: Partial<Stats>;
  /** Whether to show the purple sparkle badge on avatar (for future projection). */
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  avatarUrl,
  glowScore,
  biologicalAge,
  emotionalAge,
  physicalVitality,
  emotionalHealth,
  visualAppearance,
  deltas = {},
  highlight = false,
}) => {
  const StatRow = (
    label: string,
    value: number,
    delta: number | undefined,
    gradient: string,
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900 flex items-center space-x-1">
          <span>{value}%</span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`text-[10px] font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </span>
      </div>
      <div className="w-full bg-white rounded-full h-2">
        <div
          className={`bg-gradient-to-r ${gradient} h-2 rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-xl shadow-purple-500/10 border border-purple-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{title}</h2>
      {/* Avatar & Glow */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl shadow-purple-500/25 flex items-center justify-center mb-2">
            <span className="text-2xl font-black text-white">{glowScore}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Glow Score</h3>
        </div>
        <div className="relative">
          <div className="w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl p-2 shadow-xl shadow-purple-500/10">
            <img
              src={avatarUrl}
              alt={`${title} avatar`}
              className="w-full h-full rounded-xl object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"><rect width=\"200\" height=\"200\" fill=\"%23f3f4f6\" rx=\"20\"/><text x=\"100\" y=\"100\" text-anchor=\"middle\" dy=\"0.3em\" font-family=\"Arial\" font-size=\"16\" fill=\"%236b7280\">Avatar</text></svg>';
              }}
            />
          </div>
          {highlight && (
            <div className="absolute -top-1 -right-1 bg-purple-600 rounded-xl p-2 shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Ages */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
          <h4 className="text-xs font-medium text-gray-600 mb-1">Biological Age</h4>
          <p className="text-xl font-bold text-purple-700 flex items-center justify-center space-x-1">
            <span>{biologicalAge}</span>
            {deltas.biologicalAge !== undefined && deltas.biologicalAge !== 0 && (
              <span
                className={`text-[10px] font-semibold ${deltas.biologicalAge < 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {deltas.biologicalAge > 0 ? `+${deltas.biologicalAge}` : deltas.biologicalAge}
              </span>
            )}
          </p>
        </div>
        <div className="text-center p-3 bg-white rounded-xl border border-purple-200">
          <h4 className="text-xs font-medium text-gray-600 mb-1">Emotional Age</h4>
          <p className="text-xl font-bold text-purple-700 flex items-center justify-center space-x-1">
            <span>{emotionalAge}</span>
            {deltas.emotionalAge !== undefined && deltas.emotionalAge !== 0 && (
              <span
                className={`text-[10px] font-semibold ${deltas.emotionalAge < 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {deltas.emotionalAge > 0 ? `+${deltas.emotionalAge}` : deltas.emotionalAge}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {StatRow('Physical Vitality', physicalVitality, deltas.physicalVitality, 'from-purple-500 to-purple-600')}
        {StatRow('Emotional Health', emotionalHealth, deltas.emotionalHealth, 'from-pink-500 to-pink-600')}
        {StatRow('Visual Appearance', visualAppearance, deltas.visualAppearance, 'from-blue-500 to-blue-600')}
      </div>
    </div>
  );
};
