import React from 'react';
import { Heart, Zap, Eye, User } from 'lucide-react';
import { AssessmentResults } from '../../types';

interface ShareCardProps {
  results: AssessmentResults;
  userData: { first_name?: string; last_name?: string; } | null;
}

export const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(({ results, userData }, ref) => {
  const categoryScores = results.adjustedCategoryScores || results.categoryScores;

  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: '1920px',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -1,
        visibility: 'hidden',
      }}
      className="bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100 p-12 flex flex-col font-sans h-full"
    >
      {/* Header */}
      <header className="w-full flex justify-end text-right">
        <div>
          <h1 className="text-6xl font-bold text-gray-800">Glow Score</h1>
          <p className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            {results.overallGlowScore}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex flex-col items-center gap-10 mt-12">
        {/* Avatar & Name */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-72 h-72 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full p-1.5 shadow-2xl">
              <img
                src={results.avatarUrls.before}
                alt="User avatar"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-gray-800">
            {userData?.first_name || 'Wellness'} {userData?.last_name || 'Explorer'}
          </h2>
        </div>

        {/* Core Metrics Grid */}
        <div className="w-full grid grid-cols-5 gap-8">
          {/* Age Analysis */}
          <div className="col-span-2 bg-white/80 rounded-3xl p-8 text-center shadow-lg flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-gray-700 mb-6">Age Analysis</h3>
            <div className="flex justify-around">
              <div>
                <p className="text-7xl font-bold text-emerald-500">{results.biologicalAge}</p>
                <p className="text-xl text-gray-600 mt-1">Biological</p>
              </div>
              <div>
                <p className="text-7xl font-bold text-pink-500">{results.emotionalAge}</p>
                <p className="text-xl text-gray-600 mt-1">Emotional</p>
              </div>
            </div>
          </div>
          
          {/* Wellness Metrics */}
          <div className="col-span-3 bg-white/80 rounded-3xl p-8 shadow-lg">
            <h3 className="text-3xl font-bold text-gray-700 mb-6">Wellness Metrics</h3>
            <div className="space-y-5">
              <div className="flex items-center">
                <Zap className="w-11 h-11 text-purple-500 mr-5" />
                <span className="text-3xl text-gray-700 flex-grow">Physical Vitality</span>
                <span className="text-5xl font-bold text-gray-800">{categoryScores.physicalVitality}</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-11 h-11 text-pink-500 mr-5" />
                <span className="text-3xl text-gray-700 flex-grow">Emotional Health</span>
                <span className="text-5xl font-bold text-gray-800">{categoryScores.emotionalHealth}</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-11 h-11 text-blue-500 mr-5" />
                <span className="text-3xl text-gray-700 flex-grow">Visual Appearance</span>
                <span className="text-5xl font-bold text-gray-800">{categoryScores.visualAppearance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Archetype */}
        <div className="w-full bg-white/80 rounded-3xl p-8 text-center shadow-lg">
          <div className="flex items-center justify-center text-purple-600 mb-3">
            <User className="w-10 h-10 mr-3" />
            <h3 className="text-4xl font-bold">{results.glowUpArchetype.name}</h3>
          </div>
          <p className="text-3xl text-gray-600 leading-snug max-w-4xl mx-auto">
            {results.glowUpArchetype.description}
          </p>
        </div>
      </main>

      {/* Footer / Watermark */}
      <footer className="w-full mt-16 mb-4">
        <a
          href="https://oylan.me"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-4xl md:text-5xl font-semibold text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span>Get your results at </span>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">oylan.me</span>
        </a>
      </footer>
    </div>
  );
}); 