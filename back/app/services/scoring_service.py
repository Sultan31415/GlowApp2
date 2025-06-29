from typing import Dict, List, Any, Optional
from app.models.schemas import QuizAnswer
from app.data.quiz_data import quiz_data
import math

class AdvancedScoringService:
    """
    Advanced evidence-based scoring service with demographic normalization,
    cultural adjustments, and sophisticated health impact algorithms.
    """
    
    # Country-specific health baseline adjustments (research-based)
    COUNTRY_HEALTH_MODIFIERS = {
        "US": {"physical": 0.92, "mental": 0.88, "social": 0.85},  # Lower due to lifestyle diseases
        "UK": {"physical": 0.94, "mental": 0.90, "social": 0.92},
        "CA": {"physical": 0.96, "mental": 0.93, "social": 0.95},  # Higher social support
        "AU": {"physical": 0.95, "mental": 0.92, "social": 0.94},
        "DE": {"physical": 0.97, "mental": 0.94, "social": 0.93},
        "FR": {"physical": 0.98, "mental": 0.91, "social": 0.94},  # Mediterranean diet effect
        "JP": {"physical": 1.02, "mental": 0.87, "social": 0.89},  # High longevity, work stress
        "KR": {"physical": 0.99, "mental": 0.82, "social": 0.88},  # High work pressure
        "CN": {"physical": 0.94, "mental": 0.86, "social": 0.87},
        "IN": {"physical": 0.89, "mental": 0.85, "social": 0.91},  # Social connections strong
        "BR": {"physical": 0.91, "mental": 0.90, "social": 0.96},  # Strong social culture
        "MX": {"physical": 0.88, "mental": 0.89, "social": 0.95},
        "OTHER": {"physical": 1.0, "mental": 1.0, "social": 1.0},  # No adjustment
    }
    
    # Age-adjusted baselines (decline rates per decade after 25)
    AGE_DECLINE_RATES = {
        "physicalVitality": 0.05,    # 5% decline per decade
        "emotionalHealth": 0.02,     # 2% decline per decade  
        "visualAppearance": 0.08,    # 8% decline per decade
    }
    
    # Gender-specific adjustments (research-based differences)
    GENDER_MODIFIERS = {
        "female": {"physical": 0.98, "mental": 1.02, "visual": 1.01},
        "male": {"physical": 1.02, "mental": 0.98, "visual": 0.99},
        "other": {"physical": 1.0, "mental": 1.0, "visual": 1.0},
    }
    
    # Advanced question categorization with dynamic weights
    CATEGORY_MAPPING = {
        # Physical Vitality Questions
        "q1": {"category": "physicalVitality", "base_weight": 0.25},  # Energy levels
        "q2": {"category": "physicalVitality", "base_weight": 0.25},  # Sleep quality
        "q3": {"category": "physicalVitality", "base_weight": 0.20},  # Physical activity
        "q4": {"category": "physicalVitality", "base_weight": 0.15},  # Nutrition
        "q5": {"category": "physicalVitality", "base_weight": 0.15},  # Tobacco
        "q12": {"category": "physicalVitality", "base_weight": 0.12}, # Physical symptoms
        "q13": {"category": "physicalVitality", "base_weight": 0.08}, # Alcohol
        "q14": {"category": "physicalVitality", "base_weight": 0.10}, # BMI
        
        # Emotional Health Questions  
        "q6": {"category": "emotionalHealth", "base_weight": 0.30},   # Stress management
        "q7": {"category": "emotionalHealth", "base_weight": 0.25},   # Emotional well-being
        "q8": {"category": "emotionalHealth", "base_weight": 0.25},   # Social connections
        "q9": {"category": "emotionalHealth", "base_weight": 0.20},   # Joy/fulfillment
        
        # Visual Appearance Questions
        "q10": {"category": "visualAppearance", "base_weight": 0.60}, # Body image
        "q11": {"category": "visualAppearance", "base_weight": 0.40}, # Skin health
    }
    
    # Sophisticated value scoring with non-linear curves
    ADVANCED_SCORING = {
        # Tobacco scoring with exponential health impact
        "tobacco": {
        "never": 1.0,
            "quit-5+": 0.95,
            "quit-1-5": 0.85,
            "quit-recent": 0.70,
            "occasional": 0.40,
            "regular": 0.15,
        },
        
        # Alcohol scoring with J-curve (moderate consumption optimal)
        "alcohol": {
            "none": 0.95,      # Slight penalty for complete abstinence
            "minimal": 1.0,    # Optimal level
            "moderate": 0.90,  # Still acceptable
            "high": 0.60,      # Significant health risk
            "excessive": 0.25, # Severe health risk
        },
        
        # BMI scoring with optimal range emphasis
        "bmi": {
            "underweight": 0.70,
        "normal": 1.0,
            "overweight": 0.75,
            "obese": 0.45,
            "unknown": 0.60,  # Penalty for not knowing
        }
    }
    
    def __init__(self):
        """Initialize with quiz data structure"""
        self.question_map = self._build_question_map()
    
    def _build_question_map(self) -> Dict[str, Dict[str, Any]]:
        """Build a comprehensive question mapping from quiz data"""
        q_map = {}
        for section in quiz_data:
            for question in section['questions']:
                q_map[question['id']] = question
        return q_map
    
    def calculate_advanced_scores(
        self, 
        answers: List[QuizAnswer],
        age: Optional[int] = None,
        gender: Optional[str] = None,
        country: Optional[str] = None
    ) -> Dict[str, float]:
        """
        Calculate sophisticated wellness scores with demographic normalization
        """
        # Extract demographic data if not provided
        demographics = self._extract_demographics(answers)
        age = age or demographics.get("age", 30)
        gender = gender or demographics.get("gender", "other")
        country = country or demographics.get("country", "OTHER")
        
        # Calculate raw category scores
        raw_scores = self._calculate_raw_scores(answers)
        
        # Apply demographic adjustments
        adjusted_scores = self._apply_demographic_adjustments(
            raw_scores, age, gender, country
        )
        
        # Apply country-specific health baselines
        final_scores = self._apply_country_normalization(
            adjusted_scores, country
        )
        
        return final_scores
    
    def _calculate_raw_scores(self, answers: List[QuizAnswer]) -> Dict[str, float]:
        """Calculate raw scores using advanced algorithms"""
        category_scores = {
            "physicalVitality": 0.0,
            "emotionalHealth": 0.0,
            "visualAppearance": 0.0
        }
        
        category_weights = {
            "physicalVitality": 0.0,
            "emotionalHealth": 0.0,
            "visualAppearance": 0.0
        }

        for answer in answers:
            q_id = answer.questionId
            if q_id not in self.CATEGORY_MAPPING:
                continue
                
            mapping = self.CATEGORY_MAPPING[q_id]
            category = mapping["category"]
            base_weight = mapping["base_weight"]
            
            # Get impact weight from quiz data
            question_data = self.question_map.get(q_id, {})
            impact_weight = question_data.get("impact_weight", 1.0)
            
            # Calculate final weight
            final_weight = base_weight * impact_weight
            
            # Calculate score for this answer
            score = self._calculate_answer_score(answer, q_id)
            
            # Apply sophisticated scoring curves
            adjusted_score = self._apply_scoring_curve(score, q_id, answer.value)
            
            category_scores[category] += adjusted_score * final_weight
            category_weights[category] += final_weight
        
        # Normalize scores to 0-100 scale
        for category in category_scores:
            if category_weights[category] > 0:
                category_scores[category] = min(100, max(0, 
                    (category_scores[category] / category_weights[category]) * 100
                ))
        
        return category_scores
    
    def _calculate_answer_score(self, answer: QuizAnswer, question_id: str) -> float:
        """Calculate score for individual answer with context awareness"""
        value = answer.value
        
        # Handle numeric values (1-5 scale)
        if isinstance(value, (int, float)):
            if question_id == "q6":  # Stress management (higher is better)
                return value / 5.0
            else:  # Most questions: higher is better
                return value / 5.0
        
        # Handle string values with advanced scoring
        if question_id == "q5":  # Tobacco
            return self.ADVANCED_SCORING["tobacco"].get(value, 0.5)
        elif question_id == "q13":  # Alcohol
            return self.ADVANCED_SCORING["alcohol"].get(value, 0.5)
        elif question_id == "q14":  # BMI
            return self.ADVANCED_SCORING["bmi"].get(value, 0.5)
        
        return 0.5  # Default neutral score
    
    def _apply_scoring_curve(self, score: float, question_id: str, value: Any) -> float:
        """Apply non-linear scoring curves for better differentiation"""
        # High-impact questions get exponential curves
        high_impact_questions = ["q1", "q2", "q3", "q5", "q6", "q7"]
        
        if question_id in high_impact_questions:
            # Apply exponential curve to amplify differences
            if score >= 0.8:  # Excellent responses get boosted
                return min(1.0, score * 1.1)
            elif score <= 0.4:  # Poor responses get penalized more
                return max(0.0, score * 0.8)
        
        return score
    
    def _apply_demographic_adjustments(
        self, 
        scores: Dict[str, float], 
        age: int, 
        gender: str, 
        country: str
    ) -> Dict[str, float]:
        """Apply age and gender normalization"""
        adjusted_scores = scores.copy()
        
        # Age adjustments (normalize against age-expected decline)
        age_adjustment = self._calculate_age_adjustment(age)
        
        # Gender adjustments
        gender_mods = self.GENDER_MODIFIERS.get(gender, self.GENDER_MODIFIERS["other"])
        
        # Apply adjustments
        adjusted_scores["physicalVitality"] *= age_adjustment["physical"] * gender_mods["physical"]
        adjusted_scores["emotionalHealth"] *= age_adjustment["mental"] * gender_mods["mental"]  
        adjusted_scores["visualAppearance"] *= age_adjustment["visual"] * gender_mods["visual"]
        
        # Ensure scores stay within bounds
        for category in adjusted_scores:
            adjusted_scores[category] = min(100, max(0, adjusted_scores[category]))
        
        return adjusted_scores
    
    def _calculate_age_adjustment(self, age: int) -> Dict[str, float]:
        """Calculate age-based adjustments with research-backed curves"""
        if age <= 25:
            return {"physical": 1.0, "mental": 1.0, "visual": 1.0}
        
        decades_past_25 = (age - 25) / 10.0
        
        adjustments = {}
        for category, decline_rate in self.AGE_DECLINE_RATES.items():
            # Use exponential decay for more realistic aging curve
            adjustment = math.exp(-decline_rate * decades_past_25)
            adjustments[category.replace("Vitality", "").replace("Health", "").replace("Appearance", "")] = adjustment
        
        return {
            "physical": adjustments.get("physical", 1.0),
            "mental": adjustments.get("emotional", 1.0),
            "visual": adjustments.get("visual", 1.0)
        }
    
    def _apply_country_normalization(
        self, 
        scores: Dict[str, float], 
        country: str
    ) -> Dict[str, float]:
        """Apply country-specific health baseline adjustments"""
        country_mods = self.COUNTRY_HEALTH_MODIFIERS.get(country, self.COUNTRY_HEALTH_MODIFIERS["OTHER"])
        
        normalized_scores = {
            "physicalVitality": scores["physicalVitality"] * country_mods["physical"],
            "emotionalHealth": scores["emotionalHealth"] * country_mods["mental"],
            "visualAppearance": scores["visualAppearance"] * country_mods["social"],  # Social affects self-perception
        }
        
        # Ensure scores stay within bounds after normalization
        for category in normalized_scores:
            normalized_scores[category] = min(100, max(0, normalized_scores[category]))
        
        return normalized_scores
    
    def _extract_demographics(self, answers: List[QuizAnswer]) -> Dict[str, Any]:
        """Extract demographic information from answers"""
        demographics = {}
        
        for answer in answers:
            if answer.questionId == "q15":  # Age
                demographics["age"] = int(answer.value) if isinstance(answer.value, (int, str)) else 30
            elif answer.questionId == "q16":  # Gender
                demographics["gender"] = answer.value
            elif answer.questionId == "q17":  # Country
                demographics["country"] = answer.value
        
        return demographics
    
    def calculate_overall_glow_score(self, category_scores: Dict[str, float]) -> int:
        """Calculate overall glow score with sophisticated weighting"""
        # Evidence-based category weights for overall wellness
        weights = {
            "physicalVitality": 0.40,    # Highest impact on overall health
            "emotionalHealth": 0.35,     # Strong impact on quality of life
            "visualAppearance": 0.25,    # Important for confidence and self-esteem
        }
        
        weighted_score = sum(
            category_scores.get(category, 0) * weight
            for category, weight in weights.items()
        )
        
        return round(weighted_score)
    
    def estimate_biological_age(
        self, 
        category_scores: Dict[str, float], 
        chronological_age: int,
        answers: List[QuizAnswer]
    ) -> int:
        """Estimate biological age using advanced algorithms"""
        # Base biological age starts at chronological age
        bio_age = chronological_age
        
        # Physical vitality has strongest correlation with biological age
        physical_score = category_scores.get("physicalVitality", 50)
        physical_adjustment = (physical_score - 50) * -0.2  # Each point = 0.2 years
        
        # Lifestyle factors
        tobacco_penalty = self._get_tobacco_penalty(answers)
        exercise_bonus = self._get_exercise_bonus(answers)
        sleep_adjustment = self._get_sleep_adjustment(answers)
        
        bio_age += physical_adjustment + tobacco_penalty - exercise_bonus + sleep_adjustment
        
        # Ensure reasonable bounds
        bio_age = max(chronological_age - 15, min(chronological_age + 20, bio_age))
        
        return round(bio_age)
    
    def _get_tobacco_penalty(self, answers: List[QuizAnswer]) -> float:
        """Calculate tobacco usage penalty on biological age"""
        for answer in answers:
            if answer.questionId == "q5":
                if answer.value == "regular":
                    return 8.0  # 8 years penalty
                elif answer.value == "occasional":
                    return 3.0  # 3 years penalty
                elif answer.value == "quit-recent":
                    return 1.0  # 1 year penalty
        return 0.0
    
    def _get_exercise_bonus(self, answers: List[QuizAnswer]) -> float:
        """Calculate exercise bonus on biological age"""
        for answer in answers:
            if answer.questionId == "q3":
                if answer.value == 5:
                    return 5.0  # 5 years younger
                elif answer.value == 4:
                    return 3.0  # 3 years younger
                elif answer.value == 3:
                    return 1.0  # 1 year younger
        return 0.0
    
    def _get_sleep_adjustment(self, answers: List[QuizAnswer]) -> float:
        """Calculate sleep quality adjustment on biological age"""
        for answer in answers:
            if answer.questionId == "q2":
                if answer.value <= 2:
                    return 3.0  # Poor sleep ages you
                elif answer.value >= 4:
                    return -1.0  # Good sleep bonus
        return 0.0

# Maintain backward compatibility
class ScoringService(AdvancedScoringService):
    """Backward compatibility wrapper"""
    
    @classmethod
    def calculate_base_scores(cls, answers: List[QuizAnswer]) -> Dict[str, float]:
        """Legacy method for backward compatibility"""
        service = cls()
        return service.calculate_advanced_scores(answers)

    @classmethod
    def extract_additional_data(cls, answers: List[QuizAnswer]) -> Dict[str, Any]:
        """Extract additional data for AI analysis"""
        service = cls()
        demographics = service._extract_demographics(answers)
        
        return {
            "chronologicalAge": demographics.get("age"),
            "biologicalSex": demographics.get("gender"),
            "countryOfResidence": demographics.get("country"),
            # Add other extracted data as needed
        }
    
    @classmethod
    def extract_chronological_age(cls, answers: List[QuizAnswer]) -> Optional[int]:
        """Extract chronological age from answers"""
        for answer in answers:
            if answer.questionId == "q15":  # Updated question ID
                return int(answer.value) if isinstance(answer.value, (int, str)) else None
        return None