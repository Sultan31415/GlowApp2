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
    You are an extremely knowledgeable and empathetic expert wellness synthesizer. Your ultimate task is to create a holistic, final analysis by intelligently integrating all provided information: raw user data, detailed quiz insights (which are already country-adjusted by another agent), and granular photo analysis.

    --- RAW DATA & INITIAL CONTEXT ---

    1.  **User's General Profile:**
        {user_profile_str}
        {health_metrics_info}

    2.  **Detailed Assessment Answers:**
        {detailed_answers_json}

    3.  **Initial Base Category Scores (from quiz only - provided for reference, but use 'quiz_insights.adjustedScores' as your primary baseline):**
        {base_scores_str}

    --- PRE-ANALYZED INSIGHTS FROM SPECIALIST AGENTS ---

    4.  **Photo Analysis (from Vision agent):**
        {photo_str}

    5.  **Quiz Analysis (from Quiz agent - NOTE: the 'adjustedScores' here have ALREADY factored in country context):**
        {quiz_str}

    --- CRITICAL INSTRUCTIONS FOR FINAL SYNTHESIS & SCORE ADJUSTMENTS ---

    **Your output MUST be a single, complete JSON object. Do not include any text before or after the JSON.**

    Based on ALL the information above, generate a final JSON object with the following schema. You must critically evaluate and synthesize, not just copy, the inputs.

    **SCORE ADJUSTMENT RULES:**

    1.  **Baseline for Category Scores:** You MUST start with the `quiz_insights.adjustedScores` (which are already country-adjusted) as your primary baseline for `physicalVitality`, `emotionalHealth`, and `visualAppearance`.
    2.  **Visual Appearance (`adjustedCategoryScores.visualAppearance`):** This score is **DOMINATED and HEAVILY weighted by the `photo_insights`**. You MUST significantly and numerically adjust the `visualAppearance` score from the quiz's `adjustedScores` based on the detailed findings in `photo_insights.skinAnalysis` and `photo_insights.stressAndTirednessIndicators`.
        * **If photo indicates significant issues (e.g., pronounced redness, excessive oiliness, dullness, obvious blemishes, strong stress/tiredness indicators affecting appearance):** Drastically reduce the score (e.g., by 10-30 points or more if severe). The visual evidence overrides quiz answers here.
        * **If photo indicates exceptional health/radiance (e.g., clear, even-toned, luminous skin, no visible stress signs):** Substantially increase the score (e.g., by 10-25 points).
        * **Important: Any negative visual indicator (e.g., redness, dullness, roughness, fatigue signs) MUST result in a score reduction from the quiz-adjusted baseline. Do NOT interpret noticeable factors as neutral or positive if they indicate an issue.**
        * **Always explicitly reference specific photo findings in your justification for this score.**
    3.  **Physical Vitality (`adjustedCategoryScores.physicalVitality`):** This score is primarily from quiz answers but can be **moderately influenced by strong visual cues from the photo.**
        * **If photo shows clear signs of fatigue or poor underlying physical health:**
            * Look for specific indicators such as: `photo_insights.stressAndTirednessIndicators.skinToneAndLuster` (e.g., "sallow appearance," "dullness," "lack of natural glow") OR `photo_insights.stressAndTirednessIndicators.eyes` (e.g., "pronounced dark circles," "significant puffiness," "redness in sclera").
            * You MUST moderately decrease this score (e.g., by 5-15 points) from the quiz's `adjustedScores` if such visual signs are clearly present, even if quiz answers are otherwise good.
        * **If the `photo_insights.stressAndTirednessIndicators` explicitly state "none discernible" for all its sub-fields, then the photo provides NO direct negative influence on this score. The score should NOT be decreased based on photo for these cases. Any changes must come from positive photo indicators or quiz data alone.**
        * **Explicitly reference specific photo findings if they influence this score.**
    4.  **Emotional Health (`adjustedCategoryScores.emotionalHealth`):** This score is mostly from quiz answers, but facial expressions in the photo can provide **subtle supportive indicators.**
        * **If photo shows clear facial tension or stress cues:** (`photo_insights.stressAndTirednessIndicators.facialExpressionCues` indicating "furrowed brow," "tension around mouth," "subtle lines between eyebrows") you MAY slightly decrease this score (e.g., by 1-5 points).
        * **If the photo analysis explicitly states "none discernible" for all `stressAndTirednessIndicators`, then the photo has minimal direct influence on this score, and the quiz's adjusted score for Physical Vitality should remain largely unchanged by visual input.**
        * **If photo shows a particularly calm, composed, or relaxed expression:** you MAY slightly increase this score (e.g., by 1-5 points). If the `photo_insights.stressAndTirednessIndicators.facialExpressionCues` explicitly states "none discernible," then the photo provides NO direct influence on this score.
        * **Reference photo findings if they influence this score.**
    5.  **Biological Age:**
        * Use the `photo_insights.estimatedAgeRange` as the **primary visual anchor** for the biological age estimation.
        * Refine this visual estimate by incorporating `quiz_insights.keyRisks` (e.g., smoking, poor diet, chronic stress, lack of exercise) and `quiz_insights.keyStrengths` (e.g., healthy lifestyle, good sleep).
        * If the photo visually suggests an age older than chronological due to lifestyle risks from the quiz, adjust biological age upwards. If younger due to healthy lifestyle, adjust downwards.
        * **CRITICAL: The `visualAppearance` score and its photo-based adjustments should NOT directly dictate the `biologicalAge` estimate.** They are related but distinct. A person can have bad skin but still have a good biological age if their underlying health is good. Focus on overall vitality for biological age, not just surface appearance.
    6.  **Overall Glow Score:** Holistically assess and combine ALL insights (final adjusted category scores, photo analysis, quiz analysis, and the `country` context). This should be a weighted average of the final `adjustedCategoryScores`, but also a qualitative reflection of the severity of risks and significance of strengths identified across *all* data sources. Justify this comprehensively in the `analysisSummary`.
    7.  **Analysis Summary:** MUST explain the `overallGlowScore` and age estimates, explicitly referencing **BOTH photo and quiz insights**, AND **the user's {country} context** (even if already handled by Quiz Analyzer, reiterate their impact on the *final* synthesis). Explain the final score adjustments, particularly for visual appearance and physical vitality based on the photo. End with an empowering message.

    --- Final JSON Schema ---
    {{
      "overallGlowScore": <number, 0-100. Holistically assessed based on all integrated insights and final adjusted category scores. Justify in the analysisSummary.>,
      "adjustedCategoryScores": {{
          "physicalVitality": <number, 0-100. Start with the quiz's adjusted score and **significantly adjust based on photo visual vitality cues (e.g., skin luster, eye appearance)**. Explicitly state how photo influenced this.>,
          "emotionalHealth": <number, 0-100. Start with the quiz's adjusted score and **moderately adjust based on photo facial expression cues (e.g., tension, calmness)**. Explicitly state how photo influenced this.>,
          "visualAppearance": <number, 0-100. **This is the most critical adjustment.** Start with the quiz's adjusted score and **drastically modify it based on the photo analysis's detailed skin and stress indicators (e.g., redness, texture, blemishes, dullness).** This score should predominantly reflect the visual evidence. Explicitly state how photo influenced this.>
      }},
      "biologicalAge": <number, estimate based on all available data. Primarily use photo 'estimatedAgeRange' as a visual anchor and refine with quiz 'keyRisks' and 'keyStrengths'. Justify in the analysisSummary.>,
      "emotionalAge": <number, estimate primarily based on quiz 'keyStrengths' and 'keyRisks' related to emotional health, but also consider facial expression cues from the photo. Justify in the analysisSummary.>,
      "chronologicalAge": {additional_data.get('chronologicalAge', 'null')},
      "glowUpArchetype": {{
        "name": "<string, create an inspiring archetype name that reflects the user's integrated profile (e.g., 'The Resilient Artist', 'The Mindful Innovator')>",
        "description": "<string, 150-250 words. A detailed, empathetic description synthesizing insights from both the photo (e.g., 'a thoughtful expression') and the quiz (e.g., 'a strong sense of community').>"
      }},
      "microHabits": [
        "<1. Specific, Actionable Habit: Connect this directly to a specific finding from EITHER the photo or quiz, e.g., 'To address the observed skin dullness (from photo) and reported low energy (from quiz), try...'>",
        "<2. Specific, Actionable Habit: (as above)>",
        "<3. Specific, Actionable Habit: (as above)>",
        "<4. Specific, Actionable Habit: (as above)>",
        "<5. Specific, Actionable Habit: (as above)>"
      ],
      "analysisSummary": "<string, 200-400 words. A comprehensive narrative. Start by explaining the overallGlowScore and age estimates, explicitly referencing BOTH photo and quiz insights, and the {country} context. Explain the final score adjustments, especially visual appearance and physical vitality, *detailing how the photo influenced them*. End with an empowering message.>",
      "detailedInsightsPerCategory": {{
        "physicalVitalityInsights": [
            "<string, Synthesize findings from quiz and photo. Example: 'The quiz indicated significant physical risks (e.g., lack of exercise and poor diet). The photo further reinforced this with subtle visual cues like a slight dullness in skin tone, contributing to the adjusted physical vitality score.'>"
        ],
        "emotionalHealthInsights": [
            "<string, Synthesize findings from quiz and photo. Example: 'Your quiz answers show high emotional awareness, and your facial expression in the photo appears calm and composed, suggesting a strong alignment. Conversely, if facial tension was noted in the photo, it would have impacted this insight and the emotional health score.'>"
        ],
        "visualAppearanceInsights": [
            "<string, Synthesize findings from quiz and photo. Example: 'The photo analysis noted pronounced redness on the cheeks and nose, which critically lowered your visual appearance score. This aligns with your quiz answers about diet, smoking, and alcohol consumption, strongly suggesting a link to inflammatory factors that are visibly impacting your skin.'>"
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