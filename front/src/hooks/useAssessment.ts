import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizAnswer, AssessmentResults } from '../types';
import { useApi } from '../utils/useApi';

export const useAssessment = () => {
  const navigate = useNavigate();
  const { makeRequest } = useApi();
  
  const [currentTestStep, setCurrentTestStep] = useState<'quiz' | 'photo-upload' | 'loading'>('quiz');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file);
  };

  const handleSubmitAssessment = async (answers: QuizAnswer[]) => {
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

  const handleStartTest = () => {
    setCurrentTestStep('quiz');
    setUploadedPhoto(null);
    setError(null);
    navigate('/test');
  };

  const handleBackToQuiz = () => {
    setCurrentTestStep('quiz');
  };

  const handleRestart = () => {
    navigate('/');
    setUploadedPhoto(null);
    setError(null);
  };

  const handleRetry = () => {
    if (uploadedPhoto) {
      setCurrentTestStep('loading');
      setError(null);
    } else {
      navigate('/');
    }
  };

  const fetchLatestResults = useCallback(async () => {
    try {
      const data = await makeRequest('results');
      setResults(data);
    } catch (err) {
      // Optionally handle error
    }
  }, [makeRequest]);

  return {
    currentTestStep,
    setCurrentTestStep,
    uploadedPhoto,
    results,
    setResults,
    error,
    isSubmitting,
    handlePhotoUpload,
    handleSubmitAssessment,
    handleStartTest,
    handleBackToQuiz,
    handleRestart,
    handleRetry,
    fetchLatestResults
  };
}; 