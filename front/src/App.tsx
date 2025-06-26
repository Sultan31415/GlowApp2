import { useState, useEffect, useMemo } from 'react';
import { QuizAnswer, AssessmentResults, QuizSection } from './types';
import { getQuizData } from './utils/api';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useApi } from './utils/useApi';

// Components
import { AppLayout } from './layouts/AppLayout';
import { TestModal } from './components/TestModal';
import { ResultsScreen } from './components/ResultsScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { MicroHabitsScreen } from './components/MicroHabitsScreen';
import { FutureScreen } from './components/FutureScreen';

function App() {
  const navigate = useNavigate();
  const { makeRequest } = useApi();
  const { isSignedIn } = useAuth();

  const [currentTestStep, setCurrentTestStep] = useState<'quiz' | 'photo-upload' | 'loading'>('quiz');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizSections, setQuizSections] = useState<QuizSection[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const data = await getQuizData();
        setQuizSections(data);
      } catch (err) {
        setQuizError('Failed to load quiz. Please try refreshing the page.');
      } finally {
        setIsQuizLoading(false);
      }
    };
    fetchQuizData();
  }, []);

  // Fetch latest results when the user signs in or when navigating to dashboard
  useEffect(() => {
    const fetchResults = async () => {
      if (isSignedIn) { // Only fetch if signed in
        try {
          const data = await makeRequest('results');
          setResults(data);
        } catch (err) {
          // Optionally handle error, e.g., setResults(null)
        }
      }
    };

    // Only fetch if on dashboard route
    if (window.location.pathname === '/dashboard') {
      fetchResults();
    }
  }, [isSignedIn, window.location.pathname]); // Add isSignedIn here

  // When the user has just signed in, automatically navigate to the dashboard
  useEffect(() => {
    if (isSignedIn && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (results && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [results, navigate, window.location.pathname]);

  useEffect(() => {
    if (isSignedIn) {
      makeRequest('me').catch(() => {});
    }
  }, [isSignedIn]);

  // Get all questions in order
  const allQuestions = useMemo(() => 
    quizSections.flatMap((section: QuizSection) => 
      section.questions.map((question: any) => ({
        ...question,
        sectionTitle: section.title
      }))
    )
  , [quizSections]);

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

    setAnswers((prev: QuizAnswer[]) => {
      const filtered = prev.filter((answer: QuizAnswer) => answer.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev: number) => prev + 1);
    } else {
      setCurrentTestStep('photo-upload');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev: number) => prev - 1);
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
      // Prepare photo as base64
      const photoBase64 = await fileToBase64(uploadedPhoto);
      let chronologicalAge: number | undefined;
      const ageAnswer = answers.find(answer => answer.questionId === 'q19');
      if (ageAnswer && typeof ageAnswer.value === 'number') {
        chronologicalAge = ageAnswer.value;
      }
      const payload = {
        answers,
        chronological_age: chronologicalAge,
        photo_url: photoBase64
      };
      const assessmentResults = await makeRequest('assess', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
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
    if (!currentQuestion) return false;
    const answer = answers.find((a: QuizAnswer) => a.questionId === currentQuestion.id);
    
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
    if (!currentQuestion) return undefined;
    const answer = answers.find((a: QuizAnswer) => a.questionId === currentQuestion.id);
    return answer?.value;
  };

  // Add fileToBase64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <AppLayout onStartTest={handleStartTest} hasResults={!!results}>
      <Routes>
        {/* Public routes */}
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

        {/* Home page with different content for signed-in and signed-out users */}
        <Route path="/" element={
          <div className="p-6 text-gray-700">
            <SignedOut>
              Welcome to GlowApp. Please sign in to start your assessment.
            </SignedOut>
            <SignedIn>
              {
                isQuizLoading ? "Loading quiz..." :
                quizError ? <div className="text-red-500">{quizError}</div> :
                "Welcome back to GlowApp. Click \"CREATE\" to start your assessment."
              }
            </SignedIn>
          </div>
        } />

        {/* Protected Routes */}
        <Route
          path="/test"
          element={
            <>
              <SignedIn>
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
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <DashboardScreen
                  onGoToMicroHabits={() => navigate('/micro-habits')}
                  onGoToFuture={() => navigate('/future')}
                />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/results/:id"
          element={
            <>
              <SignedIn>
                {results ? (
                  <ResultsScreen
                    results={results}
                    onRestart={handleRestart}
                    onGoToDashboard={() => navigate('/dashboard')}
                  />
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
          path="/future"
          element={
            <>
              <SignedIn>
                {results ? (
                  <FutureScreen results={results} onBack={() => navigate('/dashboard')} />
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
          path="/micro-habits"
          element={
            <>
              <SignedIn>
                {results ? (
                  <MicroHabitsScreen
                    microHabits={results.microHabits}
                    onBack={() => navigate('/dashboard')}
                  />
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
          path="/error"
          element={
            <>
              <SignedIn>
                <ErrorScreen error={error} onRetry={handleRetry} />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
}

export default App;