import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorScreenProps {
  onRetry: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Something went wrong
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          We encountered an issue processing your assessment. Please try again, and if the problem persists, 
          check your internet connection.
        </p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Try Again
        </button>
      </div>
    </div>
  );
};