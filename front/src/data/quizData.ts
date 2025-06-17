import { QuizSection } from '../types';

export const quizSections: QuizSection[] = [
  {
    id: 'daily-vitality',
    title: 'Your Daily Vitality & Habits',
    questions: [
      {
        id: 'q1',
        text: 'How often do you wake up feeling truly refreshed and energized, ready to start your day?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Almost every day (5-7 days/week)' },
          { value: 4, label: 'Most days (3-4 days/week)' },
          { value: 3, label: 'Sometimes (1-2 days/week)' },
          { value: 2, label: 'Rarely (Less than once a week)' },
          { value: 1, label: 'Never (Always feel tired upon waking)' }
        ]
      },
      {
        id: 'q2',
        text: 'On average, how many hours of quality sleep do you get per night?',
        type: 'single-choice',
        options: [
          { value: 5, label: '8+ hours' },
          { value: 4, label: '7-8 hours' },
          { value: 3, label: '6-7 hours ' },
          { value: 2, label: '5-6 hours ' },
          { value: 1, label: 'Less than 5 hours' }
        ]
      },
      {
        id: 'q3',
        text: 'How many glasses (8oz/250ml) of plain water do you typically drink per day?',
        type: 'single-choice',
        options: [
          { value: 5, label: '8+ glasses' },
          { value: 4, label: '6-7 glasses ' },
          { value: 3, label: '4-5 glasses ' },
          { value: 2, label: '2-3 glasses ' },
          { value: 1, label: '1 glass or less ' }
        ]
      },
      {
        id: 'q4',
        text: 'How often do you engage in moderate to vigorous physical activity (e.g., brisk walking, jogging, sports)?',
        type: 'single-choice',
        options: [
          { value: 5, label: '5 or more times a week' },
          { value: 4, label: '3-4 times a week' },
          { value: 3, label: '1-2 times a week' },
          { value: 2, label: 'Rarely or never' }
        ]
      },
      {
        id: 'q5',
        text: 'How would you describe your typical daily diet?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Whole foods' },
          { value: 4, label: 'Mostly healthy' },
          { value: 3, label: 'Mixed' },
          { value: 2, label: 'Processed' },
          { value: 1, label: 'Fast food' }          
        ]
      },
      {
        id: 'q6',
        text: 'What is your current experience with smoking (tobacco products, e-cigarettes, etc.)?',
        type: 'single-choice',
        options: [
          { value: 'never', label: 'Never smoked' },
          { value: 'quit-10+', label: 'Quit 10+ years ago' },
          { value: 'quit-5-10', label: 'Quit 5-10 years ago' },
          { value: 'quit-1-5', label: 'Quit 1-5 years ago' },
          { value: 'occasionally', label: 'Occasionally (less than daily)' },
          { value: 'daily', label: 'Daily' }
        ]
      },
      {
        id: 'q7',
        text: 'How much alcohol do you typically consume?',
        type: 'single-choice',
        options: [
          { value: 'rarely-never', label: 'Rarely or never' },
          { value: 'couple-per-month', label: 'A couple of drinks per month' },
          { value: 'couple-per-week', label: 'A couple of drinks per week' },
          { value: '1-2-per-day', label: '1-2 drinks per day' },
          { value: '3+-per-day', label: '3 or more drinks per day' }
        ]
      }
    ]
  },
  {
    id: 'inner-balance',
    title: 'Your Inner Balance & Connection',
    questions: [
      {
        id: 'q8',
        text: 'On a scale of 1-5, how stressed do you feel overall on an average week? (1=Not stressed at all, 5=Very stressed)',
        type: 'single-choice',
        options: [
          { value: 1, label: '1 - Not stressed at all' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5 - Very stressed' }
        ]
      },
      {
        id: 'q9',
        text: 'On a scale of 1-5, how happy do you feel overall on an average week? (1=Very unhappy, 5=Super happy)',
        type: 'single-choice',
        options: [
          { value: 1, label: '1 - Very unhappy' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5 - Super happy' }
        ]
      },
      {
        id: 'q10',
        text: 'How many hours do you spend socializing with friends, family, or community per month?',
        type: 'single-choice',
        options: [
          { value: 'less-2', label: 'Less than 2 hours' },
          { value: '2-15', label: '2-15 hours' },
          { value: '15+', label: '15+ hours' }
        ]
      },
      {
        id: 'q11',
        text: 'How satisfied are you with your closest relationships (romantic, family, friendships)?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Very satisfied - strong, supportive connections' },
          { value: 4, label: 'Mostly satisfied - good connections' },
          { value: 3, label: 'Neutral - some ups and downs' },
          { value: 2, label: 'Somewhat dissatisfied - room for improvement' },
          { value: 1, label: 'Very dissatisfied - feel isolated or unsupported' }
        ]
      },
      {
        id: 'q12',
        text: 'How many hours of recreational screen time (outside work/school) do you average per day?',
        type: 'single-choice',
        options: [
          { value: 5, label: '1-2 hours (Minimal)' },
          { value: 4, label: '2-3 hours (Moderate)' },
          { value: 3, label: '3-4 hours (Average)' },
          { value: 2, label: '4-6 hours (High)' },
          { value: 1, label: '6+ hours (Very high)' }
        ]
      }
    ]
  },
  {
    id: 'self-perception',
    title: 'Your Reflection & Self-Perception',
    questions: [
      {
        id: 'q13',
        text: 'When you look in the mirror, how often do you feel satisfied and confident with your appearance?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Almost always (Confident & happy)' },
          { value: 4, label: 'Most of the time (Generally satisfied)' },
          { value: 3, label: 'Sometimes (Mixed feelings)' },
          { value: 2, label: 'Rarely (Often dissatisfied)' },
          { value: 1, label: 'Almost never (Avoid looking in mirrors)' }
        ]
      }
    ]
  },
  {
    id: 'health-metrics',
    title: 'Your Health Metrics (Optional)',
    description: 'These questions help us provide the most accurate assessment. If you don\'t know, you can select \'I don\'t know\'.',
    questions: [
      {
        id: 'q15',
        text: 'What is your Body Mass Index (BMI)?',
        type: 'single-choice',
        options: [
          { value: 'underweight', label: 'Underweight (under 18.5)' },
          { value: 'normal', label: 'Normal weight (18.5-24.9)' },
          { value: 'overweight', label: 'Overweight (25-29.9)' },
          { value: 'obese', label: 'Obese (over 30)' },
          { value: 'dont-know', label: 'I don\'t know' }
        ]
      },
      {
        id: 'q16',
        text: 'What is your typical Blood Pressure reading (Systolic/Diastolic)?',
        type: 'single-choice',
        options: [
          { value: 'less-110-70', label: 'Less than 110/70' },
          { value: '110-119-70-79', label: '110-119/70-79' },
          { value: '120-139-80-89', label: '120-139/80-89' },
          { value: '140-90-plus', label: '140/90 or higher' },
          { value: 'dont-know', label: 'I don\'t know' }
        ]
      },
      {
        id: 'q17',
        text: 'What is your Resting Heart Rate (RHR) in beats per minute (bpm)?',
        type: 'single-choice',
        options: [
          { value: 'below-60', label: 'Below 60 bpm' },
          { value: '60-70', label: '60-70 bpm' },
          { value: '70-80', label: '70-80 bpm' },
          { value: 'over-80', label: 'Over 80 bpm' },
          { value: 'dont-know', label: 'I don\'t know' }
        ]
      },
      {
        id: 'q18',
        text: 'Do you have a history of cardiovascular disease (CVD)?',
        type: 'single-choice',
        options: [
          { value: 'no', label: 'No, I don\'t' },
          { value: 'yes-single', label: 'Yes, single event' },
          { value: 'yes-multiple', label: 'Yes, with multiple events' },
          { value: 'dont-know', label: 'I don\'t know' }
        ]
      },
      // Note: LDL, HbA1c, Vitamin B9/B12 are highly specific and might be too much for a quick onboarding.
      // Consider these for a 'Deep Dive' assessment later, or if user explicitly opts in.
      // For now, focusing on more common, easily known metrics.
    ]
  },
  {
    id: 'about-you',
    title: 'A Little About You',
    questions: [
      {
        id: 'q19',
        text: 'What is your current age in years?',
        type: 'number-input', // Use number input for precision
        min: 18,
        max: 90,
        placeholder: 'e.g., 30'
      },
      {
        id: 'q20',
        text: 'What is your biological sex?',
        type: 'single-choice',
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'prefer-not-to-say', label: 'Prefer not to say' }
        ]
      },
      {
        id: 'q21',
        text: 'In which country have you primarily lived for the past 10 years?',
        type: 'text-input', // Could be a dropdown with autocomplete for a full implementation
        placeholder: 'e.g., United States'
      },
      {
        id: 'q22',
        text: 'In which country do you plan to live for the majority of the next 10 years?',
        type: 'text-input', // Could be a dropdown with autocomplete for a full implementation
        placeholder: 'e.g., United States'
      },
    ]
  },
  {
    id: 'personal-growth-passion',
    title: 'Your Personal Growth Journey',
    questions: [
      {
        id: 'q23',
        text: 'Is there a specific skill, hobby, or area of personal growth you\'re passionate about improving daily? (e.g., learning a new language, playing an instrument, coding, writing, painting, meditation, public speaking, a sport, etc.)',
        type: 'text-input', // Free text input
        placeholder: 'e.g., Learning Spanish, playing guitar, daily meditation',
        optional: true // Make this optional if user doesn't have one in mind
      }
    ]
  }
];

