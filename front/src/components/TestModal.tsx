import React from 'react';
import { X } from 'lucide-react';
import { Question, QuizAnswer } from '../types';
import { QuizStep } from './QuizStep';
import { PhotoUpload } from './PhotoUpload';
import { LoadingScreen } from './LoadingScreen';

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

  const renderModalContent = () => {
    switch (currentStep) {
      case 'quiz':
        const currentQuestion = allQuestions[currentQuestionIndex];
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
    <div className="relative min-h-screen aurora-bg">

      
      {/* Modal Content */}
      <div className="relative w-full h-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body */}
        <div className="h-full overflow-y-auto">
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};