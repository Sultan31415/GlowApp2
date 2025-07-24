import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Sparkles, HelpCircle, Heart, Utensils, Activity, Coffee, Zap, ZapOff, Search, ChevronDown } from 'lucide-react';
import { Question, Option } from '../../types';
import { useTranslation } from 'react-i18next';

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
  
  // Country selector state
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Option[]>([]);

  const percentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const estimatedTimeLeft = Math.max(1, Math.ceil((totalQuestions - currentQuestionIndex - 1) * 0.5));

  /* ----------------- BMI Calculator (for question q14) ------------------ */
  const isBMIQuestion = question.id === 'q14';
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);

  useEffect(() => {
    if (!isBMIQuestion) return;
    // Reset calculator when leaving BMI question
    return () => {
      setWeightKg('');
      setHeightCm('');
      setCalculatedBMI(null);
    };
  }, [isBMIQuestion]);

  const handleBMICalc = () => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h) return;
    const bmi = w / ((h / 100) ** 2);
    setCalculatedBMI(bmi);

    // Determine category
    let categoryValue = 'unknown';
    if (bmi < 18.5) categoryValue = 'underweight';
    else if (bmi < 25) categoryValue = 'normal';
    else if (bmi < 30) categoryValue = 'overweight';
    else categoryValue = 'obese';

    // Find label from options
    const categoryOption = question.options?.find(o => o.value === categoryValue);
    const label = categoryOption ? categoryOption.label : categoryValue;
    onAnswerSelect(categoryValue, label);
  };

  useEffect(() => {
    setIsAnswered(selectedAnswer !== undefined && selectedAnswer !== '');
  }, [selectedAnswer]);

  // Filter countries based on search
  useEffect(() => {
    if (question.type === 'select-country' && question.options) {
      const filtered = question.options.filter(country =>
        country.label.toLowerCase().includes(countrySearch.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [countrySearch, question.options, question.type]);

  // Initialize filtered countries and set selected country
  useEffect(() => {
    if (question.type === 'select-country' && question.options) {
      setFilteredCountries(question.options);
      // If there's a selected answer, set it in the search
      if (selectedAnswer) {
        const selectedCountry = question.options.find(option => option.value === selectedAnswer);
        if (selectedCountry) {
          setCountrySearch(selectedCountry.label);
        }
      } else {
        // Reset country search when no answer is selected
        setCountrySearch('');
      }
      // Close dropdown when initializing
      setShowCountryDropdown(false);
    } else if (question.type !== 'select-country') {
      // Reset country-specific state when not on country question
      setCountrySearch('');
      setShowCountryDropdown(false);
      setFilteredCountries([]);
    }
  }, [question.type, question.options, selectedAnswer]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountryDropdown && event.target instanceof Element) {
        const dropdown = document.getElementById('country-dropdown');
        const input = document.getElementById('country-input');
        if (dropdown && input && !dropdown.contains(event.target) && !input.contains(event.target)) {
          setShowCountryDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // Auto-advance with confirmation period and ability to change selection
  // Remove all state and logic related to autoAdvanceEnabled, autoAdvanceTimer, showAutoAdvanceCountdown, countdown, toggleAutoAdvance, cancelAutoAdvance, and their useEffects. Remove the auto-advance button and any UI related to auto-advance in both desktop and mobile navigation controls. Ensure navigation and answer selection still work as normal.

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

  const handleCountrySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountrySearch(value);
    setShowCountryDropdown(true);
    
    // If search is cleared, reset the selected answer
    if (!value.trim()) {
      onAnswerSelect('', '');
    } else {
      // Check for exact match to auto-select
      const exactMatch = question.options?.find(option => 
        option.label.toLowerCase() === value.toLowerCase()
      );
      if (exactMatch) {
        onAnswerSelect(exactMatch.value, exactMatch.label);
        setShowCountryDropdown(false);
      }
    }
  };

  const handleCountrySelect = (country: Option) => {
    setCountrySearch(country.label);
    setShowCountryDropdown(false);
    onAnswerSelect(country.value, country.label);
  };

  const toggleCountryDropdown = () => {
    setShowCountryDropdown(!showCountryDropdown);
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
  }, [canGoNext, canGoBack, onNext, onPrevious]);

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

  const { t } = useTranslation();
  const sectionId = (question as any).sectionId || 'unknown-section';

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <>
            {isBMIQuestion && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-1">{t('quizUi.weight')}</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      placeholder={t('quizUi.weightPlaceholder')}
                      min={1}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-1">{t('quizUi.height')}</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      placeholder={t('quizUi.heightPlaceholder')}
                      min={1}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBMICalc}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold shadow w-full mt-2 text-base"
                >
                  {t('quizUi.calculate')}
                </button>
                {calculatedBMI && (
                  <div className="text-center mt-3">
                    <div className="text-base font-medium text-gray-700">BMI: {calculatedBMI.toFixed(1)}</div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3 mb-6">
              {question.options?.map((option: Option, index: number) => {
                const isSelected = selectedAnswer === option.value;
                const optionKey = `quiz.${sectionId}.${question.id}.option${index + 1}`;
                const optionLabel = t(optionKey);
                const displayLabel = optionLabel === optionKey ? option.label : optionLabel;
                return (
                  <div
                    key={index}
                    className={`group relative overflow-hidden transition-all duration-500 ${
                      isSelected ? 'transform scale-[1.02] z-10' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <button
                      onClick={() => onAnswerSelect(option.value, displayLabel)}
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
                              {displayLabel}
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
                {t('quizUi.pressEnterToContinue')}
              </p>
            </div>
          </>
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
              {t('quizUi.pressEnterToContinueOrNext')}
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
                {t('quizUi.pleaseEnterNumber', { min: question.min, max: question.max })}
              </p>
            )}
          </div>
        );

      case 'select-country':
        return (
          <div className="mb-8">
            <div className="relative">
              <div className="relative">
                <input
                  id="country-input"
                  type="text"
                  value={countrySearch}
                  onChange={handleCountrySearch}
                  onKeyPress={handleKeyPress}
                  onClick={toggleCountryDropdown}
                  placeholder={(function() {
                    const key = 'quizUi.selectCountry';
                    const translated = t(key);
                    return translated === key ? (question.placeholder || '') : translated;
                  })()}
                  className="w-full p-5 sm:p-6 rounded-3xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-base sm:text-lg bg-white/95 backdrop-blur-sm shadow-xl shadow-gray-500/10 placeholder-gray-400 min-h-[3.5rem] pr-16"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {countrySearch && (
                    <CheckCircle className="w-6 h-6 text-green-500" fill="currentColor" />
                  )}
                  <button
                    type="button"
                    onClick={toggleCountryDropdown}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Country Dropdown */}
              {showCountryDropdown && (
                <div id="country-dropdown" className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl shadow-gray-500/10 z-10 max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, index) => (
                      <button
                        key={index}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{country.label}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      {t('quizUi.noCountriesFound')}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              {t('quizUi.typeToSearchOrDropdown')}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Progress Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="font-semibold text-sm sm:text-base text-gray-800 leading-tight">
                  {(() => {
                    const sectionTitleKey = `quiz.${sectionId}.title`;
                    const translated = t(sectionTitleKey);
                    return translated === sectionTitleKey ? sectionTitle : translated;
                  })()}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  {t('quizUi.assessmentInProgress')}
                </p>
              </div>
            </div>
            
            <div className="text-sm sm:text-base font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-400 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="h-3 sm:h-4"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container sm:mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="max-w-4xl sm:mx-auto">
          {/* Question Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg border border-white/50 mb-4 sm:mb-6">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                {(() => {
                  const questionKey = `quiz.${sectionId}.${question.id}.text`;
                  const translated = t(questionKey);
                  return translated === questionKey ? question.text : translated;
                })()}
              </h1>
            </div>
          </div>

          {/* Options & Navigation Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg border border-white/50">
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
                {t('quizUi.chooseOption')}
              </p>
            </div>
            
            {renderQuestionInput()}

            {/* Navigation Controls */}
            <div className="mt-6 pt-6 border-t border-gray-200/80">
              {/* --- Desktop Navigation (2-column) --- */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-3 items-center">
                {/* Previous Button */}
                <div className="flex justify-start">
                  <button
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className="flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    {t('quizUi.previous')}
                  </button>
                </div>

                {/* Next Button */}
                <div className="flex justify-end">
                  <button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="flex items-center px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? t('quizUi.continue') : t('quizUi.next')}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </div>

              {/* --- Mobile Navigation (stacked with 2-button row) --- */}
              <div className="sm:hidden flex flex-col gap-4">
                {/* Previous & Next Button Row */}
                <div className="flex gap-3">
                  <button
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="flex-[2] flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-colors duration-200 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <span>{currentQuestionIndex === totalQuestions - 1 ? t('quizUi.continue') : t('quizUi.next')}</span>
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};