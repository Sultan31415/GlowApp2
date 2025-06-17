import { AssessmentResults, QuizAnswer } from '../types';

const API_BASE_URL = 'http://localhost:8000';

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

// Mock results for development/demo
const getMockResults = (): AssessmentResults => {
  return {
    overallGlowScore: 73,
    categoryScores: {
      physicalVitality: 68,
      emotionalHealth: 82,
      visualAppearance: 71,
    },
    biologicalAge: 28,
    emotionalAge: 32,
    chronologicalAge: 30,
    glowUpArchetype: {
      name: "The Radiant Transformer",
      description: "You're someone who values inner wellness as much as outer beauty. Your transformation journey focuses on building sustainable habits that create lasting change from the inside out. You have strong emotional intelligence and are ready to make meaningful improvements to your physical vitality and appearance confidence."
    },
    microHabits: [
      "Start each morning with 10 minutes of sunlight exposure and 2 glasses of water to boost energy and support your circadian rhythm",
      "Practice the 5-4-3-2-1 grounding technique when feeling stressed: notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste",
      "Apply a gentle skincare routine with cleanser and moisturizer twice daily, plus sunscreen every morning to protect and nourish your skin"
    ],
    avatarUrls: {
      before: "/api/static/demo_before_avatar.png",
      after: "/api/static/demo_after_avatar.png"
    }
  };
};