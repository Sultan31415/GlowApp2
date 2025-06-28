import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Sparkles, HelpCircle, Heart, Utensils, Activity, Coffee, Zap, ZapOff } from 'lucide-react';
import { Question, Option } from '../../types';

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
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const percentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const estimatedTimeLeft = Math.max(1, Math.ceil((totalQuestions - currentQuestionIndex - 1) * 0.5));

  useEffect(() => {
    setIsAnswered(selectedAnswer !== undefined && selectedAnswer !== '');
  }, [selectedAnswer]);

  // Auto-advance with confirmation period and ability to change selection
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);
  const [showAutoAdvanceCountdown, setShowAutoAdvanceCountdown] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  useEffect(() => {
    if (selectedAnswer && question.type === 'single-choice' && autoAdvanceEnabled) {
      // Clear any existing timer
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
      
      // Start countdown
      setShowAutoAdvanceCountdown(true);
              setCountdown(2);
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowAutoAdvanceCountdown(false);
            if (canGoNext) {
              onNext();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setAutoAdvanceTimer(countdownInterval);
      
      return () => {
        clearInterval(countdownInterval);
        setShowAutoAdvanceCountdown(false);
      };
    } else {
      // Reset states when no answer selected
      setShowAutoAdvanceCountdown(false);
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        setAutoAdvanceTimer(null);
      }
    }
  }, [selectedAnswer, question.type, canGoNext, onNext, autoAdvanceEnabled]);

  const cancelAutoAdvance = () => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setShowAutoAdvanceCountdown(false);
  };

  const toggleAutoAdvance = () => {
    setAutoAdvanceEnabled(!autoAdvanceEnabled);
    // Cancel any active countdown when disabling
    if (autoAdvanceEnabled && autoAdvanceTimer) {
      cancelAutoAdvance();
    }
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canGoNext) {
      onNext();
    }
    if (e.key === 'ArrowLeft' && canGoBack) {
      onPrevious();
    }
    if (e.key === 'ArrowRight' && canGoNext) {
      onNext();
    }
  };

  // Global keyboard event listener for all question types
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Prevent if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Enter' && canGoNext) {
        // Cancel auto-advance if active to prevent double-advancing
        if (showAutoAdvanceCountdown) {
          cancelAutoAdvance();
        }
        onNext();
      }
      if (e.key === 'ArrowLeft' && canGoBack) {
        onPrevious();
      }
      if (e.key === 'ArrowRight' && canGoNext) {
        onNext();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [canGoNext, canGoBack, onNext, onPrevious, showAutoAdvanceCountdown, cancelAutoAdvance]);

  // Letter indicators for options
  const optionIndicators = ['A', 'B', 'C', 'D', 'E'];
  
  // Color scheme for option indicators
  const optionColors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-green-100 text-green-700 border-green-200', 
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200'
  ];

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-3 mb-6">
            {question.options?.map((option: Option, index: number) => {
              const isSelected = selectedAnswer === option.value;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden transition-all duration-500 ${
                    isSelected ? 'transform scale-[1.02] z-10' : 'hover:scale-[1.01]'
                  }`}
                >
                  <button
                    onClick={() => onAnswerSelect(option.value, option.label)}
                    className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border-2 min-h-[4rem] relative group ${
                      isSelected
                        ? 'bg-blue-50 text-slate-800 border-blue-200 shadow-md ring-2 ring-blue-100'
                        : 'bg-white/95 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center flex-1 space-x-3">
                        {/* Letter Indicator */}
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-medium text-sm transition-all duration-300 ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : `${optionColors[index % optionColors.length]} group-hover:scale-105`
                        }`}>
                          {optionIndicators[index]}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`font-medium text-base sm:text-lg transition-all duration-300 ${
                            isSelected ? 'text-slate-800' : 'text-gray-900'
                          }`}>
                            {option.label}
                          </div>
                          {option.description && (
                            <div className={`text-sm transition-all duration-300 leading-relaxed ${
                              isSelected ? 'text-slate-600' : 'text-gray-600'
                            }`}>
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced check indicator */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-transparent group-hover:text-blue-400 group-hover:bg-blue-50'
                      }`}>
                        <CheckCircle className="w-5 h-5" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Hover glow effect */}
                    {!isSelected && (
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                    )}
                  </button>
                </div>
              );
            })}
            <p className="text-sm text-gray-500 mt-4 text-center">
              Press Enter to continue after selecting an answer or use the Next button
            </p>
          </div>
        );

      case 'text-input':
        return (
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={textInput}
                onChange={handleTextInputChange}
                onKeyPress={handleKeyPress}
                placeholder={question.placeholder}
                className="w-full p-5 sm:p-6 rounded-3xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-base sm:text-lg bg-white/95 backdrop-blur-sm shadow-xl shadow-gray-500/10 placeholder-gray-400 min-h-[3.5rem]"
                autoFocus
              />
              {textInput && (
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="w-6 h-6 text-green-500" fill="currentColor" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Press Enter to continue or use the Next button
            </p>
          </div>
        );

      case 'number-input':
        return (
          <div className="mb-8">
            <div className="relative">
              <input
                type="number"
                value={numberInput}
                onChange={handleNumberInputChange}
                onKeyPress={handleKeyPress}
                min={question.min}
                max={question.max}
                placeholder={question.placeholder}
                className="w-full p-5 sm:p-6 rounded-3xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-base sm:text-lg bg-white/95 backdrop-blur-sm shadow-xl shadow-gray-500/10 placeholder-gray-400 text-center min-h-[3.5rem]"
                autoFocus
              />
              {numberInput && (
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="w-6 h-6 text-green-500" fill="currentColor" />
                </div>
              )}
            </div>
            {question.min !== undefined && question.max !== undefined && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Please enter a number between {question.min} and {question.max}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Progress Header with better hierarchy and accessibility */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Header Top Section */}
          <div className="flex items-center justify-between mb-4">
            {/* Left Section - Section Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-medium text-lg text-gray-800 leading-tight">
                    {sectionTitle}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Assessment in Progress
                  </p>
                </div>
              </div>
              

            </div>
            
            {/* Right Section - Question Counter */}
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <span className="sr-only">Question </span>
                {currentQuestionIndex + 1} 
                <span className="text-gray-400 mx-1">/</span> 
                {totalQuestions}
              </div>
            </div>
          </div>
          
                     {/* Progress Bar Section */}
           <div className="relative" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Assessment progress: ${percentage}% complete`}>
             {/* Progress Track */}
             <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
               <div
                 className="bg-gradient-to-r from-slate-400 via-blue-400 to-teal-400 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                 style={{ width: `${percentage}%` }}
               >
               </div>
             </div>
           </div>
          

        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Question Section - Top Layout (Wider) */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/10 border border-white/50 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30"></div>
            
            {/* Question Header */}
            <div className="relative text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                {question.text}
              </h1>
            </div>
          </div>
        </div>

        {/* Options Section - Bottom Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-500/10 border border-white/50 mb-6 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-indigo-50/30"></div>
            
            <div className="relative">
              {/* Encouraging subtitle */}
              <div className="text-center mb-6">
                <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                  Choose the option that best describes you 🌟
                </p>
              </div>
              
              {/* Answer Input */}
              {renderQuestionInput()}

              {/* Navigation - improved layout for 3 sections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 items-center">
                {/* Left: Previous Button */}
                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className={`flex items-center px-5 py-3 rounded-2xl font-medium transition-all duration-300 ${
                      canGoBack
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>
                </div>

                {/* Center: Auto-advance controls */}
                <div className="flex justify-center">
                  {question.type === 'single-choice' && (
                    <div className="flex flex-col items-center gap-2">
                      {/* Auto-advance toggle button */}
                      <button
                        onClick={toggleAutoAdvance}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 border-2 ${
                          autoAdvanceEnabled
                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:border-green-300'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                        title={autoAdvanceEnabled ? 'Turn off auto-advance' : 'Turn on auto-advance'}
                        aria-label={autoAdvanceEnabled ? 'Turn off auto-advance' : 'Turn on auto-advance'}
                      >
                        {autoAdvanceEnabled ? (
                          <>
                            <Zap className="w-4 h-4" />
                            <span className="hidden sm:inline">Auto-advance ON</span>
                            <span className="sm:hidden">Auto ON</span>
                          </>
                        ) : (
                          <>
                            <ZapOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Auto-advance OFF</span>
                            <span className="sm:hidden">Auto OFF</span>
                          </>
                        )}
                      </button>

                      {/* Countdown indicator when active */}
                      {showAutoAdvanceCountdown && (
                        <div className="flex items-center space-x-2 text-sm bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                          <div className="relative">
                            <div className="w-5 h-5 rounded-full border-2 border-blue-200">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"
                                style={{ animationDuration: '1s' }}
                              ></div>
                            </div>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-blue-600">
                              {countdown}
                            </span>
                          </div>
                          <span className="text-blue-600 font-medium text-xs">
                            {countdown}s
                          </span>
                          <button
                            onClick={cancelAutoAdvance}
                            className="text-blue-600 hover:text-blue-700 text-xs underline underline-offset-2 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Next Button */}
                <div className="flex justify-center sm:justify-end">
                  <button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className={`flex items-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                      canGoNext
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? 'Continue to Photo' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigation Dots - compact */}
          <div className="flex justify-center space-x-2 mb-4">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i < currentQuestionIndex
                    ? 'bg-green-400 w-2'
                    : i === currentQuestionIndex
                    ? 'bg-blue-400 w-8'
                    : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
      );
  };