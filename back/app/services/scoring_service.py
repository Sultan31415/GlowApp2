from typing import Dict, List
from app.models.schemas import QuizAnswer

class ScoringService:
    """Service for calculating quiz scores"""
    
    # Question categories mapping with weights
    QUESTION_CATEGORIES = {
        # Daily Vitality & Habits
        "q1": ("physicalVitality", 0.15),  # Sleep quality
        "q2": ("physicalVitality", 0.15),  # Sleep duration
        "q3": ("physicalVitality", 0.1),   # Water intake
        "q4": ("physicalVitality", 0.2),   # Physical activity
        "q5": ("physicalVitality", 0.15),  # Diet
        "q6": ("physicalVitality", 0.1),   # Smoking
        "q7": ("physicalVitality", 0.15),  # Alcohol
        
        # Inner Balance & Connection
        "q8": ("emotionalHealth", 0.2),    # Stress level
        "q9": ("emotionalHealth", 0.2),    # Happiness
        "q10": ("emotionalHealth", 0.15),  # Socializing
        "q11": ("emotionalHealth", 0.25),  # Relationships
        "q12": ("emotionalHealth", 0.2),   # Screen time
        
        # Self-Perception
        "q13": ("visualAppearance", 1.0),  # Self-confidence
    }
    
    # Score mapping for string values
    SCORE_MAPPING = {
        "never": 1.0,
        "quit-10+": 0.9,
        "quit-5-10": 0.8,
        "quit-1-5": 0.7,
        "occasionally": 0.4,
        "daily": 0.1,
        "rarely-never": 1.0,
        "couple-per-month": 0.8,
        "couple-per-week": 0.6,
        "1-2-per-day": 0.4,
        "3+-per-day": 0.2,
    }
    
    @classmethod
    def calculate_base_scores(cls, answers: List[QuizAnswer]) -> Dict[str, float]:
        """Calculate base scores from quiz answers"""
        scores = {
            "physicalVitality": 0,
            "emotionalHealth": 0,
            "visualAppearance": 0
        }
        
        # Calculate scores
        for answer in answers:
            if answer.questionId in cls.QUESTION_CATEGORIES:
                category, weight = cls.QUESTION_CATEGORIES[answer.questionId]
                score = cls._convert_answer_to_score(answer.value)
                scores[category] += score * weight
        
        # Normalize scores to percentages
        for category in scores:
            scores[category] = round(scores[category] * 100)
        
        return scores
    
    @classmethod
    def _convert_answer_to_score(cls, value: any) -> float:
        """Convert answer value to a score between 0 and 1"""
        if isinstance(value, (int, float)):
            return value / 5.0  # Assuming max value is 5
        else:
            # Handle string values
            return cls.SCORE_MAPPING.get(value, 0.5)
    
    @classmethod
    def extract_chronological_age(cls, answers: List[QuizAnswer]) -> int:
        """Extract chronological age from answers"""
        for answer in answers:
            if answer.questionId == "q19":  # Assuming q19 is the age question
                if isinstance(answer.value, int):
                    return answer.value
        return None 