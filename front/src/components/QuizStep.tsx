import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Question, Option } from '../types';
import { ProgressBar } from './ProgressBar';

interface QuizStepProps {
  question: Question;
  sectionTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswer?: string | number;
  onAnswerSelect: (value: string | number, label: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

export const QuizStep: React.FC<QuizStepProps> = ({
  question,
  sectionTitle,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  canGoBack,
  canGoNext
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <ProgressBar 
            current={currentQuestionIndex + 1} 
            total={totalQuestions} 
            className="mb-8"
          />

          {/* Question Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
            {/* Section Title */}
            <div className="text-center mb-6">
              <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                {sectionTitle}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8 leading-tight">
              {question.text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-4 mb-12">
              {question.options.map((option: Option, index: number) => (
                <button
                  key={index}
                  onClick={() => onAnswerSelect(option.value, option.label)}
                  className={`w-full p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                    selectedAnswer === option.value
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg transform scale-[1.02]'
                      : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-semibold text-lg mb-1 ${
                        selectedAnswer === option.value ? 'text-white' : 'text-gray-800'
                      }`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className={`text-sm ${
                          selectedAnswer === option.value ? 'text-purple-100' : 'text-gray-600'
                        }`}>
                          {option.description}
                        </div>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 ${
                      selectedAnswer === option.value
                        ? 'border-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === option.value && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={onPrevious}
                disabled={!canGoBack}
                className={`flex items-center px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  canGoBack
                    ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <button
                onClick={onNext}
                disabled={!canGoNext}
                className={`flex items-center px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                  canGoNext
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};