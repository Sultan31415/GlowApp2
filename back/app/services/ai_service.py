import google.generativeai as genai
import json
import traceback
import re
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

from app.models.schemas import QuizAnswer
from app.config.settings import settings
from app.data.quiz_data import quiz_data
from app.services.photo_analyzer import PhotoAnalyzerGPT4o
from app.services.quiz_analyzer import QuizAnalyzerGemini

class AIService:
    """Service for orchestrating multi-agent AI analysis using Gemini and GPT-4o."""

    def __init__(self):
        """Initialize AI services and data."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.orchestrator = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.question_map = self._build_question_map(quiz_data)
        self.photo_analyzer = PhotoAnalyzerGPT4o()
        self.quiz_analyzer = QuizAnalyzerGemini()

    def _build_question_map(self, q_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Builds a map from question ID to its full question details for quick lookup."""
        q_map = {}
        for section in q_data:
            for question in section['questions']:
                q_map[question['id']] = question
        return q_map

    def get_ai_analysis(
        self, 
        answers: List[QuizAnswer], 
        base_scores: Dict[str, float], 
        additional_data: Dict[str, Any],
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Orchestrate multi-agent analysis: quiz, photo, and holistic synthesis."""
        try:
            photo_insights = None
            if photo_url:
                photo_insights = self.photo_analyzer.analyze_photo(photo_url)
                print(f"Photo insights from GPT-4o: {json.dumps(photo_insights, indent=2)}")

            quiz_insights = self.quiz_analyzer.analyze_quiz(answers, base_scores, additional_data, self.question_map)
            if quiz_insights:
                print(f"Quiz insights from Gemini: {json.dumps(quiz_insights, indent=2)}")
            else:
                print("Warning: Quiz analyzer returned no insights.")

            orchestrator_prompt = self._build_orchestrator_prompt(quiz_insights, photo_insights)
            
            generation_config = genai.types.GenerationConfig()
            response = self.orchestrator.generate_content([orchestrator_prompt], generation_config=generation_config)
            
            ai_analysis = self._parse_ai_response(response.text)
            print(f"Parsed Holistic AI Analysis: {json.dumps(ai_analysis, indent=2)}")
            
            return self._format_response(ai_analysis, base_scores, additional_data.get('chronologicalAge'), photo_url, photo_insights, quiz_insights)
            
        except Exception as e:
            print(f"Error in get_ai_analysis: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    def _build_orchestrator_prompt(self, quiz_insights: Optional[Dict[str, Any]], photo_insights: Optional[Dict[str, Any]]) -> str:
        quiz_str = json.dumps(quiz_insights, indent=2) if quiz_insights else "No quiz insights available."
        photo_str = json.dumps(photo_insights, indent=2) if photo_insights else "No photo insights available."
        
        chronological_age = "null"
        if quiz_insights and 'chronologicalAge' in quiz_insights:
            chronological_age = quiz_insights['chronologicalAge']

        return f"""
        You are an expert wellness and personal development coach. Your task is to synthesize a holistic analysis from two sources: a structured analysis of a user's photo and a structured analysis of their quiz answers and health data.

        --- Photo Analysis (JSON) ---
        {photo_str}

        --- Quiz & Health Data Analysis (JSON) ---
        {quiz_str}

        Your output MUST be a single, complete JSON object. Do not include any text before or after the JSON.

        Based on the provided data, generate a JSON object with the following schema:
        {{
          "overallGlowScore": <number, 0-100. Holistically assess and combine insights from both photo and quiz. Justify your score in the analysisSummary.>,
          "biologicalAge": <number, estimate based on all available data. Use photo 'estimatedAgeRange' as a primary visual cue and quiz 'keyRisks' (e.g., smoking, diet) to adjust. Justify in the analysisSummary.>,
          "emotionalAge": <number, estimate primarily based on quiz 'keyStrengths' and 'keyRisks' related to emotional health. Justify in the analysisSummary.>,
          "chronologicalAge": {chronological_age},
          "glowUpArchetype": {{
            "name": "<string, create an inspiring archetype name that reflects the user's integrated profile (e.g., 'The Resilient Artist', 'The Mindful Innovator')>",
            "description": "<string, 150-250 words. A detailed, empathetic description synthesizing insights from both the photo (e.g., 'a thoughtful expression') and the quiz (e.g., 'a strong sense of community').>"
          }},
          "microHabits": [
            "<1. Specific, Actionable Habit: Connect this directly to a specific finding, e.g., 'To address the observed skin dullness (from photo) and reported low energy (from quiz), try...'>",
            "<2. Specific, Actionable Habit: (as above)>",
            "<3. Specific, Actionable Habit: (as above)>",
            "<4. Specific, Actionable Habit: (as above)>",
            "<5. Specific, Actionable Habit: (as above)>"
          ],
          "analysisSummary": "<string, 200-400 words. A comprehensive narrative. Start by explaining the overallGlowScore and age estimates, explicitly referencing both photo and quiz insights (e.g., 'Your score reflects your strong emotional resilience noted in the quiz, balanced with visual signs of stress around the eyes from the photo.'). End with an empowering message.>",
          "detailedInsightsPerCategory": {{
            "physicalVitalityInsights": [
                "<string, Synthesize findings. Example: 'The quiz indicated a risk related to cardiovascular health, which is not visually apparent in the photo, suggesting a hidden risk to address.'>"
            ],
            "emotionalHealthInsights": [
                "<string, Synthesize findings. Example: 'Your quiz answers show high emotional awareness, and your facial expression in the photo appears calm and composed, suggesting a strong alignment.'>"
            ],
            "visualAppearanceInsights": [
                "<string, Synthesize findings. Example: 'The photo analysis noted some skin redness, and your quiz answers about diet might suggest a link to inflammatory foods.'>"
            ]
          }}
        }}
        """

    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response, expecting a clean JSON string.
        """
        try:
            # Gemini with response_mime_type="application/json" should return clean JSON
            return json.loads(response_text)
        except json.JSONDecodeError:
            print(f"Warning: Failed to parse clean JSON, attempting to extract from markdown. Raw text: {response_text}")
            # Fallback for cases where JSON is still wrapped in markdown
            match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                json_str = match.group(1)
                return json.loads(json_str)
            raise ValueError("AI response was not valid JSON.")

    def _format_response(
        self, 
        ai_analysis: Dict[str, Any], 
        base_scores: Dict[str, float], 
        chronological_age: Optional[int],
        photo_url: Optional[str],
        photo_insights: Optional[Dict[str, Any]] = None,
        quiz_insights: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Format the final response, including all new AI analysis fields."""
        final_chronological_age = chronological_age if chronological_age is not None else ai_analysis.get("chronologicalAge")

        # Ensure archetype is a dictionary
        archetype = ai_analysis.get("glowUpArchetype", {})
        if not isinstance(archetype, dict):
            archetype = {"name": "Unknown", "description": "No archetype provided."}

        return {
            "overallGlowScore": ai_analysis.get("overallGlowScore", 0),
            "categoryScores": base_scores,
            "biologicalAge": ai_analysis.get("biologicalAge", final_chronological_age),
            "emotionalAge": ai_analysis.get("emotionalAge", final_chronological_age),
            "chronologicalAge": final_chronological_age,
            "glowUpArchetype": archetype,
            "microHabits": ai_analysis.get("microHabits", []),
            "analysisSummary": ai_analysis.get("analysisSummary", "A comprehensive summary will be provided after AI analysis."),
            "detailedInsightsPerCategory": ai_analysis.get("detailedInsightsPerCategory", {}),
            "avatarUrls": {
                "before": photo_url if photo_url else settings.DEFAULT_AVATAR_BEFORE,
                "after": settings.DEFAULT_AVATAR_AFTER
            },
            "photoInsights": photo_insights,
            "quizInsights": quiz_insights
        }