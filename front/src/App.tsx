import React, { useState } from 'react';
import { QuizAnswer, AssessmentResults } from './types';
import { quizSections } from './data/quizData';
import { submitAssessment } from './utils/api';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Components
import { Navigation } from './components/Navigation';
import { MainScreen } from './components/MainScreen';
import { TestModal } from './components/TestModal';
import { ResultsScreen } from './components/ResultsScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { MicroHabitsScreen } from './components/MicroHabitsScreen';

function App() {
  const navigate = useNavigate();

  const [currentTestStep, setCurrentTestStep] = useState<'quiz' | 'photo-upload' | 'loading'>('quiz');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all questions in order
  const allQuestions = quizSections.flatMap(section => 
    section.questions.map(question => ({
      ...question,
      sectionTitle: section.title
    }))
  );

  const handleStartTest = () => {
    setCurrentTestStep('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setUploadedPhoto(null);
    setError(null);
    navigate('/test');
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
    if (!uploadedPhoto) {
      setError('Please upload a photo before submitting');
      return;
    }

    setCurrentTestStep('loading');
    setIsSubmitting(true);
    setError(null);
    
    try {
      const assessmentResults = await submitAssessment(answers, uploadedPhoto);
      setResults(assessmentResults);
      navigate('/dashboard');
    } catch (error) {
      console.error('Assessment submission failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit assessment');
      navigate('/error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    navigate('/');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setUploadedPhoto(null);
    setError(null);
    // Keep results for dashboard access
  };

  const handleRetry = () => {
    if (uploadedPhoto && answers.length > 0) {
      handleSubmitAssessment();
    } else {
      navigate('/');
    }
  };

  const canGoBack = () => {
    return currentQuestionIndex > 0;
  };

  const canGoNext = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const answer = answers.find(a => a.questionId === currentQuestion.id);
    
    if (currentQuestion.type === 'single-choice') {
      return answer?.value !== undefined;
    } else if (currentQuestion.type === 'number-input') {
      const value = answer?.value as number;
      return value !== undefined && 
             (!currentQuestion.min || value >= currentQuestion.min) && 
             (!currentQuestion.max || value <= currentQuestion.max);
    } else if (currentQuestion.type === 'text-input') {
      return answer?.value !== undefined && (answer.value as string).trim().length > 0;
    }
    
    return false;
  };

  const getCurrentAnswer = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const answer = answers.find(a => a.questionId === currentQuestion.id);
    return answer?.value;
  };

  return (
    <div className="min-h-screen pl-20">
      <Navigation 
        onStartTest={handleStartTest}
        hasResults={!!results}
      />
      
      <Routes>
        <Route path="/" element={<MainScreen onStartTest={handleStartTest} />} />
        <Route path="/test" element={
          <TestModal
            isOpen={true}
            onClose={() => navigate('/')}
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
            isSubmitting={isSubmitting}
            error={error}
          />
        } />
        <Route
          path="/results"
          element={
            results ? (
              <ResultsScreen
                results={results}
                onRestart={handleRestart}
                onGoToDashboard={() => navigate('/dashboard')}
              />
            ) : (
              <Navigate to="/error" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            results ? (
              <DashboardScreen
                results={results}
                onGoToMicroHabits={() => navigate('/micro-habits')}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/micro-habits"
          element={
            results ? (
              <MicroHabitsScreen
                microHabits={results.microHabits}
                onBack={() => navigate('/dashboard')}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/error" element={<ErrorScreen onRetry={handleRetry} error={error} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;