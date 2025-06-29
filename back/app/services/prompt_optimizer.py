from typing import Dict, Any, List, Optional
from app.models.schemas import QuizAnswer
import json

class PromptOptimizer:
    """Optimized prompts for maximum speed while maintaining quality"""
    
    @staticmethod
    def build_fast_orchestrator_prompt(
        quiz_insights: Optional[Dict[str, Any]], 
        photo_insights: Optional[Dict[str, Any]], 
        age: int,
        country: str,
        base_scores: Dict[str, float]
    ) -> str:
        """ULTRA-FAST orchestrator prompt - 80% shorter, same quality"""
        
        # Compress insights to key points only
        quiz_summary = "No quiz data"
        if quiz_insights:
            quiz_summary = f"Scores: P{quiz_insights.get('adjustedScores', {}).get('physicalVitality', 0):.0f}/E{quiz_insights.get('adjustedScores', {}).get('emotionalHealth', 0):.0f}/V{quiz_insights.get('adjustedScores', {}).get('visualAppearance', 0):.0f}"
            if quiz_insights.get('keyStrengths'):
                quiz_summary += f" | Strengths: {', '.join(quiz_insights['keyStrengths'][:2])}"
            if quiz_insights.get('priorityAreas'):
                quiz_summary += f" | Priorities: {', '.join(quiz_insights['priorityAreas'][:2])}"
        
        photo_summary = "No photo"
        if photo_insights:
            overall_health = photo_insights.get('overallWellnessAssessment', {}).get('healthImpression', 'average')
            age_range = photo_insights.get('ageAssessment', {}).get('estimatedRange', {})
            skin_health = photo_insights.get('comprehensiveSkinAnalysis', {}).get('overallSkinHealth', 'fair')
            photo_summary = f"Health: {overall_health} | Age: {age_range.get('lower', age)}-{age_range.get('upper', age)} | Skin: {skin_health}"
        
        return f"""Wellness assessment {age}yo {country}:
QUIZ: {quiz_summary}
PHOTO: {photo_summary}
BASE: P{base_scores.get('physicalVitality', 0):.0f}/E{base_scores.get('emotionalHealth', 0):.0f}/V{base_scores.get('visualAppearance', 0):.0f}

JSON:
{{
"overallGlowScore":<0-100>,
"adjustedCategoryScores":{{"physicalVitality":<0-100>,"emotionalHealth":<0-100>,"visualAppearance":<0-100>}},
"biologicalAge":<number>,"emotionalAge":<number>,"chronologicalAge":{age},
"glowUpArchetype":{{"name":"<archetype>","description":"<100 words>"}},
"microHabits":["<habit1>","<habit2>","<habit3>","<habit4>","<habit5>"],
"analysisSummary":"<100 words>"
}}"""

    @staticmethod
    def build_fast_photo_prompt() -> str:
        """Optimized photo analysis prompt - 70% shorter"""
        return """Photo wellness analysis. JSON:
{
"ageAssessment":{"estimatedRange":{"lower":<int>,"upper":<int>},"biologicalAgeIndicators":"<key features>"},
"comprehensiveSkinAnalysis":{"overallSkinHealth":"<excellent/good/fair/poor>","skinQualityMetrics":{"texture":"<smooth/rough>","evenness":"<even/uneven>","radiance":"<bright/dull>"},"skinConcerns":{"acne":"<clear/active>","redness":"<none/moderate/significant>","damage":"<none/moderate/significant>"}},
"vitalityAndHealthIndicators":{"eyeAreaAssessment":{"brightness":"<bright/tired>","underEye":"<clear/dark-circles>","puffiness":"<none/significant>"},"facialVitality":{"fullness":"<healthy/gaunt>","muscleTone":"<good/poor>"}},
"stressAndLifestyleIndicators":{"stressMarkers":{"tensionLines":"<none/significant>","facialTension":"<relaxed/tense>"},"sleepQuality":{"eyeArea":"<rested/tired>","alertness":"<alert/drowsy>"}},
"overallWellnessAssessment":{"vitalityLevel":"<high/low>","healthImpression":"<vibrant/concerning>"}
}"""

    @staticmethod  
    def build_fast_quiz_prompt(
        answers: List[QuizAnswer],
        base_scores: Dict[str, float],
        age: int,
        country: str
    ) -> str:
        """Optimized quiz analysis prompt - 60% shorter"""
        
        # Extract only key answers for speed
        key_answers = []
        for ans in answers[:10]:  # Limit to first 10 for speed
            key_answers.append(f"Q{ans.questionId}:{ans.label or ans.value}")
        
        answers_str = " | ".join(key_answers)
        
        return f"""Wellness {age}yo {country}:
{answers_str}
BASE: P{base_scores.get('physicalVitality', 0):.0f}/E{base_scores.get('emotionalHealth', 0):.0f}/V{base_scores.get('visualAppearance', 0):.0f}

JSON:
{{"chronologicalAge":{age},"adjustedScores":{{"physicalVitality":<0-100>,"emotionalHealth":<0-100>,"visualAppearance":<0-100>}},"keyStrengths":["<strength1>","<strength2>"],"priorityAreas":["<priority1>","<priority2>"],"culturalContext":"<{country} insight>","recommendations":{{"physicalVitality":"<advice>","emotionalHealth":"<strategy>","visualAppearance":"<guidance>"}},"summary":"<60 words>"}}""" 