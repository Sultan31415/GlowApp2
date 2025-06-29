export interface QuizAnswer {
  questionId: string;
  value: string | number;
  label: string;
}

export interface QuizSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'single-choice' | 'number-input' | 'text-input' | 'select-country';
  options?: Option[];
  min?: number;
  max?: number;
  placeholder?: string;
  optional?: boolean;
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
  adjustedCategoryScores: {
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

export type ScreenType = 'main' | 'welcome' | 'quiz' | 'photo-upload' | 'loading' | 'results' | 'error' | 'dashboard' | 'microHabits';