import { AssessmentResults, QuizAnswer, QuizSection } from '../types';
import { useApi } from './useApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://164.90.175.148:8000';

export const getQuizData = async (): Promise<QuizSection[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quiz`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};