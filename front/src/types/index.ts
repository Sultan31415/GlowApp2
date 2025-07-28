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

  avatarUrls: {
    before: string;
    after: string;
  };
}

export type ScreenType = 'main' | 'welcome' | 'quiz' | 'photo-upload' | 'loading' | 'results' | 'error' | 'dashboard';

export interface FutureProjection {
  id: number;
  user_id: number;
  assessment_id?: number;
  created_at: string;
  orchestrator_output: any;
  quiz_insights: any;
  photo_insights: any;
  projection_result: {
    sevenDay: {
      projectedScores: {
        overallGlowScore: number;
        physicalVitality: number;
        emotionalHealth: number;
        visualAppearance: number;
      };
      rationalePerMetric: {
        physicalVitality: string;
        emotionalHealth: string;
        visualAppearance: string;
      };
      narrativeSummary: string;
      keyActions: string[];
    };
    thirtyDay: {
      projectedScores: {
        overallGlowScore: number;
        physicalVitality: number;
        emotionalHealth: number;
        visualAppearance: number;
      };
      rationalePerMetric: {
        physicalVitality: string;
        emotionalHealth: string;
        visualAppearance: string;
      };
      narrativeSummary: string;
      keyMilestones: string[];
    };
    actionPlan: {
      immediateSteps: string[];
      weeklyFocus: {
        week1: string;
        week2: string;
        week3: string;
        week4: string;
      };
    };
  };
}