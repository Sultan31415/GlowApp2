import { QuizSection } from '../types';

export const quizSections: QuizSection[] = [
  {
    id: 'vision',
    title: 'Your Glow-Up Vision',
    questions: [
      {
        id: 'q1',
        text: "What's the ONE thing you dream of transforming about yourself in the next 30-90 days?",
        type: 'single-choice',
        options: [
          { value: 'clearer-skin', label: 'Clearer, glowing skin' },
          { value: 'boosted-energy', label: 'Boosted energy levels' },
          { value: 'better-sleep', label: 'Better, deeper sleep' },
          { value: 'less-stress', label: 'Less stress and anxiety' },
          { value: 'youthful-appearance', label: 'More youthful appearance' },
          { value: 'emotional-resilience', label: 'Stronger emotional resilience' },
          { value: 'confidence', label: 'Increased confidence' },
          { value: 'gut-health', label: 'Better gut health' },
          { value: 'fitness', label: 'Improved fitness level' },
          { value: 'social-connections', label: 'Stronger social connections' }
        ]
      }
    ]
  },
  {
    id: 'energy-vitality',
    title: 'Your Daily Energy & Vitality',
    questions: [
      {
        id: 'q2',
        text: 'How often do you wake up feeling truly refreshed and energized?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Almost every day', description: 'I consistently wake up feeling great' },
          { value: 4, label: 'Most days', description: '4-5 days per week' },
          { value: 3, label: 'Sometimes', description: '2-3 days per week' },
          { value: 2, label: 'Rarely', description: 'Once a week or less' },
          { value: 1, label: 'Never', description: 'I always feel tired upon waking' }
        ]
      },
      {
        id: 'q3',
        text: 'How would you describe your energy levels from morning to evening?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Consistently high all day' },
          { value: 4, label: 'Good morning energy, slight afternoon dip' },
          { value: 3, label: 'Up and down throughout the day' },
          { value: 2, label: 'Low energy most of the day' },
          { value: 1, label: 'Exhausted from morning to night' }
        ]
      },
      {
        id: 'q4',
        text: 'How many glasses of plain water do you typically drink per day?',
        type: 'single-choice',
        options: [
          { value: 5, label: '8+ glasses', description: 'I stay well hydrated' },
          { value: 4, label: '6-7 glasses', description: 'Pretty good hydration' },
          { value: 3, label: '4-5 glasses', description: 'Moderate hydration' },
          { value: 2, label: '2-3 glasses', description: 'Below recommended' },
          { value: 1, label: '1 glass or less', description: 'I rarely drink plain water' }
        ]
      },
      {
        id: 'q5',
        text: 'How often do you engage in moderate to intense physical activity?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Daily or almost daily' },
          { value: 4, label: '4-5 times per week' },
          { value: 3, label: '2-3 times per week' },
          { value: 2, label: 'Once a week' },
          { value: 1, label: 'Rarely or never' }
        ]
      },
      {
        id: 'q6',
        text: 'How would you describe your typical daily diet?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Mostly whole foods, balanced nutrition' },
          { value: 4, label: 'Generally healthy with occasional treats' },
          { value: 3, label: 'Mixed - some healthy, some processed foods' },
          { value: 2, label: 'Mostly processed foods, limited vegetables' },
          { value: 1, label: 'Fast food and processed foods dominate' }
        ]
      }
    ]
  },
  {
    id: 'inner-radiance',
    title: 'Your Inner Radiance & Calm',
    questions: [
      {
        id: 'q7',
        text: 'How often do you feel overwhelmed or highly stressed?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Rarely', description: 'I manage stress very well' },
          { value: 4, label: 'Occasionally', description: 'A few times per month' },
          { value: 3, label: 'Sometimes', description: 'A few times per week' },
          { value: 2, label: 'Often', description: 'Most days of the week' },
          { value: 1, label: 'Almost constantly', description: 'Stress dominates my daily life' }
        ]
      },
      {
        id: 'q8',
        text: 'How would you describe your general mood over the past month?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Consistently positive and upbeat' },
          { value: 4, label: 'Generally good with minor fluctuations' },
          { value: 3, label: 'Mixed - some good days, some difficult ones' },
          { value: 2, label: 'Often down or irritable' },
          { value: 1, label: 'Frequently sad, anxious, or overwhelmed' }
        ]
      },
      {
        id: 'q9',
        text: 'How often do you feel genuinely connected to friends, family, or your community?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Very often', description: 'I have strong, meaningful relationships' },
          { value: 4, label: 'Often', description: 'Good connections most of the time' },
          { value: 3, label: 'Sometimes', description: 'Occasional meaningful connections' },
          { value: 2, label: 'Rarely', description: 'I often feel isolated' },
          { value: 1, label: 'Almost never', description: 'I feel very disconnected' }
        ]
      },
      {
        id: 'q10',
        text: 'How many hours of screen time do you average per day outside of work/school?',
        type: 'single-choice',
        options: [
          { value: 5, label: '1-2 hours', description: 'Minimal recreational screen time' },
          { value: 4, label: '2-3 hours', description: 'Moderate usage' },
          { value: 3, label: '3-4 hours', description: 'Average usage' },
          { value: 2, label: '4-6 hours', description: 'High usage' },
          { value: 1, label: '6+ hours', description: 'Very high screen time' }
        ]
      }
    ]
  },
  {
    id: 'reflection-perception',
    title: 'Your Reflection & Perception',
    questions: [
      {
        id: 'q11',
        text: 'When you look in the mirror, how often do you feel satisfied and confident with your appearance?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Almost always', description: 'I feel confident about how I look' },
          { value: 4, label: 'Most of the time', description: 'Generally satisfied with my appearance' },
          { value: 3, label: 'Sometimes', description: 'Mixed feelings about my appearance' },
          { value: 2, label: 'Rarely', description: 'Often dissatisfied with how I look' },
          { value: 1, label: 'Almost never', description: 'I avoid looking in mirrors' }
        ]
      },
      {
        id: 'q12',
        text: 'How would you describe the current state of your skin?',
        type: 'single-choice',
        options: [
          { value: 5, label: 'Clear, glowing, and healthy' },
          { value: 4, label: 'Generally good with minor concerns' },
          { value: 3, label: 'Average - some good and bad days' },
          { value: 2, label: 'Problematic with frequent breakouts or issues' },
          { value: 1, label: 'Poor - significant skin concerns' }
        ]
      }
    ]
  },
  {
    id: 'about-you',
    title: 'A Little About You',
    questions: [
      {
        id: 'q13',
        text: 'What is your current age?',
        type: 'single-choice',
        options: [
          { value: '18-24', label: '18-24 years old' },
          { value: '25-34', label: '25-34 years old' },
          { value: '35-44', label: '35-44 years old' },
          { value: '45-54', label: '45-54 years old' },
          { value: '55-64', label: '55-64 years old' },
          { value: '65+', label: '65+ years old' }
        ]
      },
      {
        id: 'q14',
        text: 'What is your gender?',
        type: 'single-choice',
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'non-binary', label: 'Non-binary' },
          { value: 'prefer-not-to-say', label: 'Prefer not to say' }
        ]
      },
      {
        id: 'q15',
        text: 'What is your primary motivation for seeking a "Glow-Up" today?',
        type: 'single-choice',
        options: [
          { value: 'feel-better', label: 'To feel better about myself overall' },
          { value: 'improve-appearance', label: 'To improve my physical appearance' },
          { value: 'specific-goal', label: 'I have a specific health or wellness goal' },
          { value: 'special-event', label: 'Preparing for a special event or milestone' },
          { value: 'curious', label: 'Just curious about my current state' }
        ]
      }
    ]
  }
];