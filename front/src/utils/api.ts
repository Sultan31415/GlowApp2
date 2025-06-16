import { AssessmentResults, QuizAnswer } from '../types';

export const submitAssessment = async (
  answers: QuizAnswer[],
  photo: File
): Promise<AssessmentResults> => {
  // Simulate network delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock results directly (no API call needed for demo)
  return getMockResults();
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