
import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Question, QuizAnswer } from '../../types';
import { QuizStep } from './QuizStep';
import { PhotoUpload } from './PhotoUpload';
import { LoadingScreen } from '../screens/LoadingScreen';
import { useTranslation } from 'react-i18next';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: 'quiz' | 'photo-upload' | 'loading';
  currentQuestionIndex: number;
  allQuestions: (Question & { sectionTitle: string })[];
  answers: QuizAnswer[];
  uploadedPhoto: File | null;
  onAnswerSelect: (value: string | number, label: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onPhotoUpload: (file: File) => void;
  onBackToQuiz: () => void;
  onSubmitAssessment: () => void;
  canGoBack: () => boolean;
  canGoNext: () => boolean;
  getCurrentAnswer: () => string | number | undefined;
  isSubmitting: boolean;
  error: string | null;
}

export const TestModal: React.FC<TestModalProps> = ({
  isOpen,
  onClose,
  currentStep,
  currentQuestionIndex,
  allQuestions,
  answers,
  uploadedPhoto,
  onAnswerSelect,
  onNext,
  onPrevious,
  onPhotoUpload,
  onBackToQuiz,
  onSubmitAssessment,
  canGoBack,
  canGoNext,
  getCurrentAnswer,
  isSubmitting,
  error
}) => {
  if (!isOpen) return null;

  const { t } = useTranslation();

  // Reference to the scrollable container so we can scroll to top on question change
  const modalRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever the quiz question changes (only during quiz step)
  useEffect(() => {
    if (currentStep === 'quiz' && modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, currentQuestionIndex]);

  const renderModalContent = () => {
    switch (currentStep) {
      case 'quiz':
        if (allQuestions.length === 0) {
          return <LoadingScreen />;
        }
        const currentQuestion = allQuestions[currentQuestionIndex];
        if (!currentQuestion) {
          return <LoadingScreen />;
        }
        return (
          <QuizStep
            question={currentQuestion}
            sectionTitle={currentQuestion.sectionTitle}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={allQuestions.length}
            selectedAnswer={getCurrentAnswer()}
            onAnswerSelect={onAnswerSelect}
            onNext={onNext}
            onPrevious={onPrevious}
            canGoBack={canGoBack()}
            canGoNext={canGoNext()}
          />
        );
        
      case 'photo-upload':
        return (
          <PhotoUpload
            onPhotoUpload={onPhotoUpload}
            onBack={onBackToQuiz}
            onSubmit={onSubmitAssessment}
            uploadedPhoto={uploadedPhoto}
            isSubmitting={isSubmitting}
            error={error}
          />
        );
        
      case 'loading':
        return <LoadingScreen />;
        
      default:
        return null;
    }
  };

  return (
    <div ref={modalRef} className="absolute inset-0 z-40 bg-white aurora-bg overflow-y-auto overflow-x-hidden sm:left-[var(--sidebar-width)] transition-all duration-300">
      {/* Close Button - Re-styled for consistency */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 shadow-lg transition-colors"
        aria-label={t('quizUi.closeModal')}
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Modal Body */}
      <div className="w-full h-full">
        {renderModalContent()}
      </div>
    </div>
  );
};