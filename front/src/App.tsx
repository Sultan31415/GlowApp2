import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignUp } from '@clerk/clerk-react';
import CustomSignIn from './components/auth/CustomSignIn';

// Custom Hooks
import { useQuiz } from './hooks/useQuiz';
import { useAssessment } from './hooks/useAssessment';
import { useAuthEffects } from './hooks/useAuthEffects';

// Components
import { AppLayout } from './layouts/AppLayout';
import { Logo } from './components/ui/Logo';
import { AuroraBackground } from './components/ui/AuroraBackground';

// Lazy-loaded components for code-splitting
const TestModal = lazy(() => import('./components/features/TestModal').then(m => ({ default: m.TestModal })));
const DashboardScreen = lazy(() => import('./components/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const ErrorScreen = lazy(() => import('./components/screens/ErrorScreen').then(m => ({ default: m.ErrorScreen })));
const FutureScreen = lazy(() => import('./components/screens/FutureScreen').then(m => ({ default: m.FutureScreen })));
const AdvancedMainScreen = lazy(() => import('./components/screens/AdvancedMainScreen').then(m => ({ default: m.AdvancedMainScreen })));
const DailyPlanScreen = lazy(() => import('./components/screens/DailyPlanScreen').then(m => ({ default: m.DailyPlanScreen })));

// Home Screen Component
const HomeScreen: React.FC<{ onStartTest: () => void; results: any; isQuizLoading: boolean; quizError: string | null }> = ({ 
  onStartTest, 
  results, 
  isQuizLoading, 
  quizError 
}) => {
  const navigate = useNavigate();

  if (isQuizLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {quizError}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Logo size={80} scale={2} animate={true} className="mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome back to Oylan! ✨</h1>
      <p className="text-xl text-gray-600 mb-8">Ready to continue your transformation journey?</p>
      
      {results ? (
        <div className="space-y-4">
          <p className="text-gray-700 mb-6">You have previous assessment results. You can view your dashboard or start a new assessment.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              View Dashboard
            </button>
            <button
              onClick={onStartTest}
              className="bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              New Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-700 mb-6">Start your personalized assessment to discover your glow potential!</p>
          <button
            onClick={onStartTest}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
          >
            <span>Start Your Assessment</span>
            <span>🚀</span>
          </button>
        </div>
      )}
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Debug logging
  console.log('App - Current location:', location.pathname);
  console.log('App - TestModal should be open:', location.pathname === '/test');
  
  // Custom hooks
  const quiz = useQuiz();
  const assessment = useAssessment();
  
  // Auth effects
  useAuthEffects({ 
    results: assessment.results, 
    fetchLatestResults: assessment.fetchLatestResults 
  });

  const handleNext = () => {
    if (quiz.currentQuestionIndex < quiz.allQuestions.length - 1) {
      quiz.handleNext();
    } else {
      assessment.setCurrentTestStep('photo-upload');
    }
  };

  const handleBackToQuiz = () => {
    assessment.handleBackToQuiz();
    quiz.setCurrentQuestionIndex(quiz.allQuestions.length - 1);
  };

  const handleSubmitAssessment = () => {
    assessment.handleSubmitAssessment(quiz.answers);
  };

  const handleRestart = () => {
    assessment.handleRestart();
    quiz.resetQuiz();
  };

  const handleRetry = () => {
    if (assessment.uploadedPhoto && quiz.answers.length > 0) {
      handleSubmitAssessment();
    } else {
      navigate('/');
    }
  };

  return (
    <AppLayout onStartTest={assessment.handleStartTest} hasResults={!!assessment.results}>
      {/* Suspense ensures a small fallback bundle for initial paint while heavier route chunks load */}
      <Suspense fallback={<div className="flex justify-center items-center py-20"><Logo size={60} animate={true} /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/sign-in/*" element={
             <div className="flex justify-center items-center h-screen p-4">
               <CustomSignIn />
             </div>
           } />
          <Route path="/sign-up/*" element={
             <div className="flex justify-center items-center h-screen p-4">
                <SignUp routing="path" path="/sign-up" />
             </div>
          } />

          {/* Home page */}
          <Route path="/" element={
            <>
              <SignedOut>
                <AdvancedMainScreen onStartTest={assessment.handleStartTest} />
              </SignedOut>
              <SignedIn>
                <AuroraBackground>
                  <div className="max-w-4xl mx-auto p-8">
                    <HomeScreen 
                      onStartTest={assessment.handleStartTest}
                      results={assessment.results}
                      isQuizLoading={quiz.isQuizLoading}
                      quizError={quiz.quizError}
                    />
                  </div>
                </AuroraBackground>
              </SignedIn>
            </>
          } />

          {/* Protected Routes */}
          
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <DashboardScreen />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/future"
            element={
              <>
                <SignedIn>
                  {assessment.results ? (
                    <FutureScreen results={assessment.results} onBack={() => navigate('/dashboard')} />
                  ) : (
                    <Navigate to="/" />
                  )}
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/daily-plan"
            element={
              <>
                <SignedIn>
                  {assessment.results ? (
                    <DailyPlanScreen onBack={() => navigate('/dashboard')} />
                  ) : (
                    <Navigate to="/dashboard" />
                  )}
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route path="/error" element={<ErrorScreen onRetry={handleRetry} error={assessment.error} />} />

          <Route
            path="/test"
            element={
              <>
                <SignedIn>
                  {/* The actual assessment UI is rendered via <TestModal> outside of <Routes>. */}
                  <></>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Test Modal - Rendered conditionally */}
        <SignedIn>
          <TestModal
            isOpen={location.pathname === '/test'}
            onClose={() => navigate('/')}
            currentStep={assessment.currentTestStep}
            currentQuestionIndex={quiz.currentQuestionIndex}
            allQuestions={quiz.allQuestions}
            answers={quiz.answers}
            uploadedPhoto={assessment.uploadedPhoto}
            onAnswerSelect={quiz.handleAnswerSelect}
            onNext={handleNext}
            onPrevious={quiz.handlePrevious}
            onPhotoUpload={assessment.handlePhotoUpload}
            onBackToQuiz={handleBackToQuiz}
            onSubmitAssessment={handleSubmitAssessment}
            canGoBack={quiz.canGoBack}
            canGoNext={quiz.canGoNext}
            getCurrentAnswer={quiz.getCurrentAnswer}
            isSubmitting={assessment.isSubmitting}
            error={assessment.error}
          />
        </SignedIn>
      </Suspense>
    </AppLayout>
  );
}

export default App;