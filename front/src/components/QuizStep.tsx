import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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
  const [textInput, setTextInput] = useState<string>('');
  const [numberInput, setNumberInput] = useState<string>('');

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextInput(value);
    onAnswerSelect(value, value);
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumberInput(value);
    if (value) {
      onAnswerSelect(Number(value), value);
    }
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-4 mb-16">
            {question.options?.map((option: Option, index: number) => (
              <button
                key={index}
                onClick={() => onAnswerSelect(option.value, option.label)}
                className={`group w-full p-8 rounded-3xl text-left transition-all duration-300 border-2 ${
                  selectedAnswer === option.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-xl shadow-purple-500/25 transform scale-[1.02]'
                    : 'bg-white/70 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg shadow-gray-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`font-semibold text-xl mb-2 ${
                      selectedAnswer === option.value ? 'text-white' : 'text-gray-900'
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
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ml-6 transition-all duration-300 ${
                    selectedAnswer === option.value
                      ? 'border-white bg-white/20'
                      : 'border-gray-300 group-hover:border-purple-400'
                  }`}>
                    {selectedAnswer === option.value && (
                      <CheckCircle className="w-5 h-5 text-white" fill="currentColor" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case 'text-input':
        return (
          <div className="mb-16">
            <input
              type="text"
              value={textInput}
              onChange={handleTextInputChange}
              placeholder={question.placeholder}
              className="w-full p-6 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-lg bg-white/70 backdrop-blur-sm shadow-lg shadow-gray-500/5"
            />
          </div>
        );

      case 'number-input':
        return (
          <div className="mb-16">
            <input
              type="number"
              value={numberInput}
              onChange={handleNumberInputChange}
              min={question.min}
              max={question.max}
              placeholder={question.placeholder}
              className="w-full p-6 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-lg bg-white/70 backdrop-blur-sm shadow-lg shadow-gray-500/5"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <ProgressBar 
            current={currentQuestionIndex + 1} 
            total={totalQuestions} 
            className="mb-12"
          />

          {/* Question Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100">
            {/* Section Title */}
            <div className="text-center mb-8">
              <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-purple-500/25">
                {sectionTitle}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 leading-tight">
              {question.text}
            </h2>

            {/* Answer Input */}
            {renderQuestionInput()}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={onPrevious}
                disabled={!canGoBack}
                className={`flex items-center px-8 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  canGoBack
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <button
                onClick={onNext}
                disabled={!canGoNext}
                className={`flex items-center px-10 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  canGoNext
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105'
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