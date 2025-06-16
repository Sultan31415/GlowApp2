import React, { useState } from 'react';
import { ScreenType, QuizAnswer, AssessmentResults } from './types';
import { quizSections } from './data/quizData';
import { submitAssessment } from './utils/api';

// Components
import { Navigation } from './components/Navigation';
import { MainScreen } from './components/MainScreen';
import { TestModal } from './components/TestModal';
import { ResultsScreen } from './components/ResultsScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ErrorScreen } from './components/ErrorScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [currentTestStep, setCurrentTestStep] = useState<'quiz' | 'photo-upload' | 'loading'>('quiz');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [results, setResults] = useState<AssessmentResults | null>(null);

  // Get all questions in order
  const allQuestions = quizSections.flatMap(section => 
    section.questions.map(question => ({
      ...question,
      sectionTitle: section.title
    }))
  );

  const handleStartTest = () => {
    setIsTestModalOpen(true);
    setCurrentTestStep('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setUploadedPhoto(null);
  };

  const handleCloseTestModal = () => {
    setIsTestModalOpen(false);
    setCurrentTestStep('quiz');
    setCurrentQuestionIndex(0);
  };

  const handleNavigate = (screen: 'main' | 'dashboard') => {
    if (screen === 'dashboard' && results) {
      setCurrentScreen('dashboard');
    } else if (screen === 'main') {
      setCurrentScreen('main');
    }
  };

  const handleAnswerSelect = (value: string | number, label: string) => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      value,
      label
    };

    setAnswers(prev => {
      const filtered = prev.filter(answer => answer.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentTestStep('photo-upload');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
  };

  const handleBackToQuiz = () => {
    setCurrentTestStep('quiz');
    setCurrentQuestionIndex(allQuestions.length - 1);
  };

  const handleSubmitAssessment = async () => {
    if (!uploadedPhoto) return;

    setCurrentTestStep('loading');
    
    try {
      const assessmentResults = await submitAssessment(answers, uploadedPhoto);
      setResults(assessmentResults);
      setIsTestModalOpen(false);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Assessment submission failed:', error);
      setCurrentScreen('error');
      setIsTestModalOpen(false);
    }
  };

  const handleRestart = () => {
    setCurrentScreen('main');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setUploadedPhoto(null);
    // Keep results for dashboard access
  };

  const handleRetry = () => {
    if (uploadedPhoto && answers.length > 0) {
      handleSubmitAssessment();
    } else {
      setCurrentScreen('main');
    }
  };

  // Get current answer for the current question
  const getCurrentAnswer = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const answer = answers.find(a => a.questionId === currentQuestion.id);
    return answer?.value;
  };

  // Check if user can proceed to next question
  const canGoNext = () => {
    return getCurrentAnswer() !== undefined;
  };

  const canGoBack = () => {
    return currentQuestionIndex > 0;
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return <MainScreen onStartTest={handleStartTest} />;
        
      case 'results':
        return results ? (
          <ResultsScreen results={results} onRestart={handleRestart} />
        ) : (
          <ErrorScreen onRetry={handleRetry} />
        );

      case 'dashboard':
        return results ? (
          <DashboardScreen results={results} />
        ) : (
          <MainScreen onStartTest={handleStartTest} />
        );
        
      case 'error':
        return <ErrorScreen onRetry={handleRetry} />;
        
      default:
        return <MainScreen onStartTest={handleStartTest} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onStartTest={handleStartTest}
        hasResults={!!results}
      />
      
      {renderScreen()}

      {/* Test Modal */}
      <TestModal
        isOpen={isTestModalOpen}
        onClose={handleCloseTestModal}
        currentStep={currentTestStep}
        currentQuestionIndex={currentQuestionIndex}
        allQuestions={allQuestions}
        answers={answers}
        uploadedPhoto={uploadedPhoto}
        onAnswerSelect={handleAnswerSelect}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onPhotoUpload={handlePhotoUpload}
        onBackToQuiz={handleBackToQuiz}
        onSubmitAssessment={handleSubmitAssessment}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        getCurrentAnswer={getCurrentAnswer}
      />
    </div>
  );
}

export default App;