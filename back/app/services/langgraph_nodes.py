from typing import Dict, Any, Optional
from app.services.photo_analyzer import PhotoAnalyzerGPT4o
from app.services.quiz_analyzer import QuizAnalyzerGemini
from app.config.settings import settings
import google.generativeai as genai
import json
import re

# These analyzers are stateless, so we can instantiate them here
photo_analyzer = PhotoAnalyzerGPT4o()
quiz_analyzer = QuizAnalyzerGemini()


def photo_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze the photo if a URL is provided.
    """
    photo_url = state.get("photo_url")
    insights = photo_analyzer.analyze_photo(photo_url) if photo_url else None
    return {**state, "photo_insights": insights}


def quiz_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze quiz answers and base scores.
    """
    answers = state["answers"]
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    question_map = state["question_map"]
    insights = quiz_analyzer.analyze_quiz(answers, base_scores, additional_data, question_map)
    return {**state, "quiz_insights": insights}


def orchestrator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Synthesize holistic analysis from quiz and photo insights using Gemini.
    """
    orchestrator = state["orchestrator"]
    quiz_insights = state.get("quiz_insights")
    photo_insights = state.get("photo_insights")
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    photo_url = state.get("photo_url")

    # Build prompt
    quiz_str = json.dumps(quiz_insights, indent=2) if quiz_insights else "No quiz insights available."
    photo_str = json.dumps(photo_insights, indent=2) if photo_insights else "No photo insights available."
    chronological_age = "null"
    if quiz_insights and 'chronologicalAge' in quiz_insights:
        chronological_age = quiz_insights['chronologicalAge']
    prompt = f"""
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
    generation_config = genai.types.GenerationConfig()
    response = orchestrator.generate_content([prompt], generation_config=generation_config)
    # Parse response
    try:
        return {**state, "ai_analysis": json.loads(response.text)}
    except json.JSONDecodeError:
        match = re.search(r'```json\s*(\{.*?\})\s*```', response.text, re.DOTALL)
        if match:
            json_str = match.group(1)
            return {**state, "ai_analysis": json.loads(json_str)}
        raise ValueError("AI response was not valid JSON.") 