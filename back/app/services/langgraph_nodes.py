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
    LangGraph node: Synthesize holistic analysis from all available data, including raw inputs and prior agent insights.
    This node is the final step, creating the comprehensive user-facing analysis.
    """
    orchestrator = state["orchestrator"]
    quiz_insights = state.get("quiz_insights")
    photo_insights = state.get("photo_insights")
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    answers = state["answers"]
    question_map = state["question_map"]

    # --- Rebuild detailed context from raw data for a more nuanced analysis ---
    user_profile_lines = [
        f"Chronological Age: {additional_data.get('chronologicalAge', 'Not provided')} years",
        f"Biological Sex: {additional_data.get('biologicalSex', 'Not provided').replace('-', ' ').title()}",
        f"Country of Primary Residence (past 10 years): {additional_data.get('countryOfResidence', 'Not provided')}"
    ]
    user_profile_str = "\n".join(user_profile_lines)

    health_metrics_lines = []
    if additional_data.get('bmi'): health_metrics_lines.append(f"- BMI Status: {additional_data['bmi'].replace('-', ' ').title()}")
    if additional_data.get('bloodPressure'): health_metrics_lines.append(f"- Blood Pressure: {additional_data['bloodPressure'].replace('-', ' ').title()}")
    if additional_data.get('restingHeartRate'): health_metrics_lines.append(f"- Resting Heart Rate: {additional_data['restingHeartRate'].replace('-', ' ').title()}")
    if additional_data.get('cvdHistory'): health_metrics_lines.append(f"- Cardiovascular Disease History: {additional_data['cvdHistory'].replace('-', ' ').title()}")
    health_metrics_info = "\nAdditional Health Metrics:\n" + "\n".join(health_metrics_lines) if health_metrics_lines else ""

    detailed_answers_context = []
    for ans in answers:
        q_detail = question_map.get(ans.questionId)
        selected_option_label = ans.label
        if q_detail:
            if not selected_option_label and q_detail.get('type') == 'single-choice' and 'options' in q_detail:
                selected_option_label = next((opt['label'] for opt in q_detail['options'] if opt['value'] == ans.value), str(ans.value))
            detailed_answers_context.append({
                "questionId": ans.questionId, "questionText": q_detail['text'],
                "questionType": q_detail['type'], "selectedValue": ans.value, "selectedLabel": selected_option_label
            })
    detailed_answers_json = json.dumps(detailed_answers_context, indent=2)

    country = additional_data.get('countryOfResidence', 'Not provided')

    # --- Convert insights to strings for the prompt ---
    quiz_str = json.dumps(quiz_insights, indent=2) if quiz_insights else "No quiz insights available."
    photo_str = json.dumps(photo_insights, indent=2) if photo_insights else "No photo insights available."
    base_scores_str = json.dumps(base_scores, indent=2)

    # --- Build the new, comprehensive prompt ---
    prompt = f"""
You are an extremely knowledgeable and empathetic expert wellness and personal development coach. Your final task is to synthesize all available information into a single, holistic, and actionable analysis. You will be given raw user data, plus pre-analyzed insights from specialized agents. Your analysis must be the final word, intelligently combining everything.

--- RAW DATA ---

1.  **User's General Profile:**
    {user_profile_str}
    {health_metrics_info}

2.  **Detailed Assessment Answers:**
    {detailed_answers_json}

3.  **Base Category Scores (from quiz only):**
    {base_scores_str}

--- PRE-ANALYZED INSIGHTS FROM SPECIALIST AGENTS ---

4.  **Photo Analysis (from Vision agent):**
    {photo_str}

5.  **Quiz Analysis (from Quiz agent):**
    {quiz_str}

--- INSTRUCTIONS FOR YOUR FINAL SYNTHESIS ---

**IMPORTANT:**
- You are REQUIRED to reference at least one specific finding from the photo analysis when adjusting the overallGlowScore and each category score.
- If the photo shows any negative indicators (e.g., stress, poor skin, tiredness), you MUST lower the score accordingly, even if quiz scores are high.
- If the photo shows positive indicators, you may raise the score, but always justify this with explicit reference to the photo findings.
- In your analysisSummary, you MUST justify the overallGlowScore by referencing BOTH photo and quiz insights. Failure to do so is a critical error.

Your output MUST be a single, complete JSON object. Do not include any text before or after the JSON.

Based on ALL the information above, generate a JSON object with the following schema. You must critically evaluate and synthesize, not just copy, the inputs.

{{
    "overallGlowScore": <number, 0-100. This is the most important metric. Calculate it holistically. The base scores are a starting point, but you MUST adjust based on the severity of risks and significance of strengths from BOTH the quiz and photo analyses. For example, a user with good quiz scores but visible signs of high stress and poor skin in the photo should have a significantly lower score than their quiz answers suggest. Justify your final score in the analysisSummary, referencing at least one photo finding.>,

    "adjustedCategoryScores": {{
        "physicalVitality": <number, 0-100. Start with the base score ({base_scores['physicalVitality']}) and ADJUST it based on photo insights. For example, if the photo shows clear signs of fatigue or poor health not captured in the quiz, lower this score. If the user looks vibrant despite average quiz answers, you might slightly raise it. Reference at least one photo finding.>,
        "emotionalHealth": <number, 0-100. Start with the base score ({base_scores['emotionalHealth']}) and ADJUST it based on photo insights. For example, if the photo shows facial tension or stress cues, lower this score. If the user appears calm and composed, you might slightly raise it. Reference at least one photo finding.>,
        "visualAppearance": <number, 0-100. Start with the base score ({base_scores['visualAppearance']}) and ADJUST it based on the detailed skinAnalysis and stress indicators from the photo. This score should heavily reflect the objective photo analysis. Reference at least one photo finding.>
    }},

    "biologicalAge": <number, estimate based on all available data. Use the photo's 'estimatedAgeRange' as a primary visual cue and the quiz's 'keyRisks' (e.g., smoking, diet) to refine the estimate.>,
    "emotionalAge": <number, estimate primarily based on quiz 'keyStrengths' and 'keyRisks' related to emotional health, but also consider facial expression cues from the photo.>,
    "chronologicalAge": {additional_data.get('chronologicalAge', 'null')},

    "glowUpArchetype": {{
        "name": "<string, create an inspiring archetype name that reflects the user's INTEGRATED profile (e.g., 'The Resilient Artist', 'The Mindful Innovator')>",
        "description": "<string, 150-250 words. A detailed, empathetic description synthesizing insights from BOTH the photo (e.g., 'a thoughtful expression') and the quiz (e.g., 'a strong sense of community').>"
    }},

    "microHabits": [
        "<1. Specific, Actionable Habit: Connect this directly to a specific finding from EITHER the photo or quiz, e.g., 'To address the observed skin dullness (from photo) and reported low energy (from quiz), try...'>",
        "<2. Specific, Actionable Habit>",
        "<3. Specific, Actionable Habit>",
        "<4. Specific, Actionable Habit>",
        "<5. Specific, Actionable Habit>"
    ],

    "analysisSummary": "<string, 200-400 words. A comprehensive narrative. Start by explaining the overallGlowScore and age estimates, explicitly referencing BOTH photo and quiz insights (e.g., 'Your score reflects your strong emotional resilience noted in the quiz, balanced with visual signs of stress around the eyes from the photo.'). Integrate the {country} context. End with an empowering message.>",

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
    generation_config = genai.types.GenerationConfig(
        temperature=0.6, # Lower temperature for more deterministic synthesis
        top_p=0.9,
        candidate_count=1,
        max_output_tokens=2048 # Increased token limit for the detailed response
    )
    response = orchestrator.generate_content([prompt], generation_config=generation_config)
    print(f"Raw LangGraph Orchestrator LLM response: {response.text}")
    # Parse response, resilient to markdown and with numeric coercion
    try:
        json_str = response.text
        match = re.search(r'```json\s*(\{.*?\})\s*```', response.text, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                json_str = match.group(0)

        parsed = json.loads(json_str)
        # Coerce numeric fields into numbers if they are strings
        if 'adjustedCategoryScores' in parsed:
            for cat_key in parsed['adjustedCategoryScores']:
                val = parsed['adjustedCategoryScores'][cat_key]
                if isinstance(val, str):
                    try:
                        parsed['adjustedCategoryScores'][cat_key] = float(val)
                    except (ValueError, TypeError):
                        pass
        return {**state, "ai_analysis": parsed}

    except (json.JSONDecodeError, IndexError) as e:
        print(f"Orchestrator Error: Failed to parse JSON. Details: {e}")
        print(f"Problematic response text: {response.text}")
        # Return a state indicating failure to prevent downstream errors
        return {**state, "ai_analysis": {"error": "Failed to parse orchestrator response", "details": response.text}} 