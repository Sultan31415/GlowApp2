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
  getCurrentAnswer
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
          />
        );
        
      case 'loading':
        return <LoadingScreen />;
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Modal Body */}
        <div className="h-full overflow-y-auto">
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};