import { useState, useEffect, useMemo } from 'react';
import { QuizAnswer, QuizSection } from '../types';
import { getQuizData } from '../utils/api';

export const useQuiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizSections, setQuizSections] = useState<QuizSection[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Get all questions in order
  const allQuestions = useMemo(() => 
    quizSections.flatMap((section: QuizSection) => 
      section.questions.map((question: any) => ({
        ...question,
        sectionTitle: section.title
      }))
    )
  , [quizSections]);

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
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev: number) => prev - 1);
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
    } else if (currentQuestion.type === 'select-country') {
      return answer?.value !== undefined && answer.value !== '';
    }
    
    return false;
  };

  const getCurrentAnswer = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    if (!currentQuestion) return undefined;
    const answer = answers.find((a: QuizAnswer) => a.questionId === currentQuestion.id);
    return answer?.value;
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  return {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    allQuestions,
    isQuizLoading,
    quizError,
    handleAnswerSelect,
    handleNext,
    handlePrevious,
    canGoBack,
    canGoNext,
    getCurrentAnswer,
    resetQuiz
  };
}; 