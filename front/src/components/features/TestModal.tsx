import React from 'react';
import { X } from 'lucide-react';
import { Question, QuizAnswer } from '../../types';
import { QuizStep } from './QuizStep';
import { PhotoUpload } from './PhotoUpload';
import { LoadingScreen } from '../screens/LoadingScreen';

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
            onClose={onClose}
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
            onClose={onClose}
          />
        );
        
      case 'loading':
        return <LoadingScreen />;
        
      default:
        return null;
    }
  };

  return <>{renderModalContent()}</>;
};