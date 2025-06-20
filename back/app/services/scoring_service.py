from typing import Dict, List, Any, Optional
from app.models.schemas import QuizAnswer # Assuming QuizAnswer is defined in app/models/schemas.py

class ScoringService:
    """Service for calculating quiz scores and extracting additional health data."""
    
    # Question categories mapping with weights
    # Weights are carefully assigned to reflect the impact of each question on the overall category score.
    QUESTION_CATEGORIES = {
        # Daily Vitality & Habits
        "q1": ("physicalVitality", 0.15),  # Sleep quality
        "q2": ("physicalVitality", 0.15),  # Sleep duration
        "q3": ("physicalVitality", 0.1),   # Water intake
        "q4": ("physicalVitality", 0.2),   # Physical activity
        "q5": ("physicalVitality", 0.15),  # Diet
        "q6": ("physicalVitality", 0.1),   # Smoking (significant impact on physical health)
        "q7": ("physicalVitality", 0.1),   # Alcohol (significant impact on physical health)
        
        # Inner Balance & Connection
        "q8": ("emotionalHealth", 0.2),    # Stress level
        "q9": ("emotionalHealth", 0.2),    # Happiness
        "q10": ("emotionalHealth", 0.15),  # Socializing
        "q11": ("emotionalHealth", 0.25),  # Relationships
        "q12": ("emotionalHealth", 0.2),   # Screen time (impacts mental well-being)
        
        # Self-Perception
        "q13": ("visualAppearance", 1.0)  # Self-confidence directly ties to visual perception
    }
    
    # Score mapping for string values, normalized to a 0-1 scale (1 being best).
    SCORE_MAPPING = {
        # q6 Smoking
        "never": 1.0,
        "quit-10+": 0.9,
        "quit-5-10": 0.8,
        "quit-1-5": 0.7,
        "occasionally": 0.4,
        "daily": 0.1,
        
        # q7 Alcohol
        "rarely-never": 1.0,
        "couple-per-month": 0.8,
        "couple-per-week": 0.6,
        "1-2-per-day": 0.4,
        "3+-per-day": 0.2,

        # q10 Socializing
        "less-2": 0.2, # Less social interaction
        "2-15": 0.6,
        "15+": 1.0, # Healthy social interaction

        # q17 BMI
        "normal": 1.0,
        "underweight": 0.7, # Can indicate health issues, though less common than overweight/obese
        "overweight": 0.6,
        "obese": 0.3,
        "dont-know": 0.5, # Neutral if unknown

        # q18 Blood Pressure
        "less-110-70": 1.0,
        "110-119-70-79": 0.8,
        "120-139-80-89": 0.5, # Pre-hypertensive / elevated
        "140-90-plus": 0.2, # Hypertensive
        "dont-know": 0.5,

        # q19 Resting Heart Rate
        "below-60": 0.9, # Often excellent, but can be too low for some (e.g., bradycardia)
        "60-70": 1.0, # Ideal healthy range
        "70-80": 0.7,
        "over-80": 0.4,
        "dont-know": 0.5,

        # q20 CVD History
        "no": 1.0,
        "yes-single": 0.4, # Significant health concern
        "yes-multiple": 0.1, # Serious health concern
        "dont-know": 0.7, # Assume some potential risk if unknown
    }
    
    @classmethod
    def calculate_base_scores(cls, answers: List[QuizAnswer]) -> Dict[str, float]:
        """
        Calculates base scores for Physical Vitality, Emotional Health, and Visual Appearance.
        Each score is normalized to a percentage (0-100).
        """
        scores = {
            "physicalVitality": 0.0,
            "emotionalHealth": 0.0,
            "visualAppearance": 0.0
        }
        
        # Keep track of the total possible weight for each category to ensure correct normalization.
        category_weights_sum = {  
            "physicalVitality": 0.0,
            "emotionalHealth": 0.0,
            "visualAppearance": 0.0
        }

        for answer in answers:
            if answer.questionId in cls.QUESTION_CATEGORIES:
                category, weight = cls.QUESTION_CATEGORIES[answer.questionId]
                score = cls._convert_answer_to_score(answer.value, answer.questionId)
                scores[category] += score * weight
                category_weights_sum[category] += weight
        
        # Normalize scores to percentages.
        for category in scores:
            if category_weights_sum[category] > 0:
                scores[category] = round((scores[category] / category_weights_sum[category]) * 100)
            else:
                scores[category] = 0 # No questions contributed to this category
        
        return scores
    
    @classmethod
    def _convert_answer_to_score(cls, value: Any, question_id: str) -> float:
        """
        Converts an answer's value into a standardized score between 0 and 1.
        Handles both numerical (1-5 scales) and string-based answers.
        """
        if isinstance(value, (int, float)):
            # Special handling for questions with inverted or direct 1-5 scales
            if question_id == "q8": # Stress: 1=Not stressed (best) -> 5, 5=Very stressed (worst) -> 1
                return (6 - value) / 5.0 
            elif question_id in ["q1", "q2", "q3", "q4", "q5", "q9", "q11", "q12", "q13"]: 
                # These are direct 1-5 scales where 5 is best
                return value / 5.0
            else:
                # Default for any other numerical value, assuming it might be a direct score already
                return float(value) / 5.0 # Fallback, though quiz questions use specific scales
        else:
            # Handle string values using the predefined SCORE_MAPPING
            return cls.SCORE_MAPPING.get(value, 0.5) # Default to a neutral score if mapping is missing
    
    @classmethod
    def extract_chronological_age(cls, answers: List[QuizAnswer]) -> Optional[int]:
        """
        Extracts the chronological age from the list of quiz answers.
        """
        for answer in answers:
            if answer.questionId == "q14":
                if isinstance(answer.value, int):
                    return answer.value
        return None

    @classmethod
    def extract_additional_data(cls, answers: List[QuizAnswer]) -> Dict[str, Any]:
        """
        Extracts specific demographic and health metric data from the answers
        that are used for AI context rather than direct scoring.
        """
        data = {
            "chronologicalAge": None,
            "biologicalSex": None,
            "countryOfResidence": None,
            "bmi": None,
            "bloodPressure": None,
            "restingHeartRate": None,
            "cvdHistory": None
        }
        for answer in answers:
            if answer.questionId == "q14":
                if isinstance(answer.value, int):
                    data["chronologicalAge"] = answer.value
            elif answer.questionId == "q15":
                data["biologicalSex"] = answer.value
            elif answer.questionId == "q16":
                data["countryOfResidence"] = answer.value
            elif answer.questionId == "q17":
                data["bmi"] = answer.value
            elif answer.questionId == "q18":
                data["bloodPressure"] = answer.value
            elif answer.questionId == "q19":
                data["restingHeartRate"] = answer.value
            elif answer.questionId == "q20":
                data["cvdHistory"] = answer.value
        return data