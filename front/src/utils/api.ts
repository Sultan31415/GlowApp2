import { AssessmentResults, QuizAnswer, QuizSection } from '../types';

const API_BASE_URL = 'http://localhost:8000';

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

export const submitAssessment = async (
  answers: QuizAnswer[],
  photo: File
): Promise<AssessmentResults> => {
  try {
    // Re-enable sending photo_url
    const photoBase64 = await fileToBase64(photo);
    
    // Extract chronological age from answers
    let chronologicalAge: number | undefined;
    const ageAnswer = answers.find(answer => answer.questionId === 'q19');
    if (ageAnswer && typeof ageAnswer.value === 'number') {
      chronologicalAge = ageAnswer.value;
    }

    // Prepare the request payload
    const payload = {
      answers,
      chronological_age: chronologicalAge,
      photo_url: photoBase64 // Re-enabled
    };

    // Make the API request
    const response = await fetch(`${API_BASE_URL}/api/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Error submitting assessment:', error);
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