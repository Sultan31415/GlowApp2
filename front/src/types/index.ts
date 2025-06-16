export interface QuizAnswer {
  questionId: string;
  value: string | number;
  label: string;
}

export interface QuizSection {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  type: 'single-choice';
}

export interface Option {
  value: string | number;
  label: string;
  description?: string;
}

export interface AssessmentResults {
  overallGlowScore: number;
  categoryScores: {
    physicalVitality: number;
    emotionalHealth: number;
    visualAppearance: number;
  };
  biologicalAge: number;
  emotionalAge: number;
  chronologicalAge: number;
  glowUpArchetype: {
    name: string;
    description: string;
  };
  microHabits: string[];
  avatarUrls: {
    before: string;
    after: string;
  };
}

export type ScreenType = 'main' | 'welcome' | 'quiz' | 'photo-upload' | 'loading' | 'results' | 'error' | 'dashboard';