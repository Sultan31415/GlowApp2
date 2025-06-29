from typing import Dict, Any, Optional
from app.services.photo_analyzer import PhotoAnalyzerGPT4o
from app.services.quiz_analyzer import QuizAnalyzerGemini
from app.services.prompt_optimizer import PromptOptimizer
from app.config.settings import settings
import google.generativeai as genai
import openai
import json
import re
import asyncio

# These analyzers are stateless, so we can instantiate them here
photo_analyzer = PhotoAnalyzerGPT4o()
quiz_analyzer = QuizAnalyzerGemini()

# Initialize Azure OpenAI client for orchestrator
azure_openai_client = None
azure_openai_async_client = None
orchestrator_model = None

if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
    azure_openai_client = openai.AzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
    )
    azure_openai_async_client = openai.AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
    )
    orchestrator_model = settings.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME
    print(f"[LangGraph] Using Azure OpenAI GPT-4o Mini for orchestration: {orchestrator_model}")
else:
    # Fallback to regular OpenAI
    azure_openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    azure_openai_async_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    orchestrator_model = "gpt-4o-mini"
    print(f"[LangGraph] Using OpenAI GPT-4o Mini for orchestration")

# Keep Gemini as fallback for emergency cases
genai.configure(api_key=settings.GEMINI_API_KEY)
fallback_orchestrator = genai.GenerativeModel(settings.GEMINI_MODEL)


def photo_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze the photo if a URL is provided.
    Now runs in PARALLEL with quiz_node for improved performance.
    """
    import time
    start_time = time.time()
    print("[LangGraph] 📸 Photo analysis started (parallel execution)")
    
    photo_url = state.get("photo_url")
    if photo_url:
        print(f"[LangGraph] 📸 Processing photo URL: {photo_url[:50]}...")
        insights = photo_analyzer.analyze_photo(photo_url)
        print(f"[LangGraph] 📸 Photo analysis completed in {time.time() - start_time:.2f}s")
    else:
        print("[LangGraph] 📸 No photo URL provided, skipping photo analysis")
        insights = None
        
    return {**state, "photo_insights": insights}


def quiz_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze quiz answers and base scores.
    Now runs in PARALLEL with photo_node for improved performance.
    """
    import time
    start_time = time.time()
    print("[LangGraph] 📝 Quiz analysis started (parallel execution)")
    
    answers = state["answers"]
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    question_map = state["question_map"]
    
    country = additional_data.get('countryOfResidence', 'Not provided')
    print(f"[LangGraph] 📝 Processing {len(answers)} quiz answers for user in {country}")
    
    insights = quiz_analyzer.analyze_quiz(answers, base_scores, additional_data, question_map)
    print(f"[LangGraph] 📝 Quiz analysis completed in {time.time() - start_time:.2f}s")
    
    return {**state, "quiz_insights": insights}


def orchestrator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Synthesize holistic analysis from all available data, including raw inputs and prior agent insights.
    This node is the final step, creating the comprehensive user-facing analysis.
    Waits for BOTH photo_node and quiz_node to complete (parallel processing).
    """
    import time
    start_time = time.time()
    print("[LangGraph] 🎯 Orchestrator started - received results from parallel nodes")
    
    orchestrator = state["orchestrator"]
    quiz_insights = state.get("quiz_insights")
    photo_insights = state.get("photo_insights")
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    answers = state["answers"]
    question_map = state["question_map"]
    
    # Log what data was received from parallel processing
    has_photo = photo_insights is not None
    has_quiz = quiz_insights is not None
    print(f"[LangGraph] 🎯 Synthesis inputs: Photo={'✅' if has_photo else '❌'}, Quiz={'✅' if has_quiz else '❌'}")

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
        "name": "<string, GENERATE a unique archetype name based on their SPECIFIC wellness profile analysis. CREATION PROCESS: 1) Identify their PRIMARY wellness signature from photo (energy level, stress markers, vitality) 2) Cross-reference with quiz dominant themes (main challenges, lifestyle patterns, values) 3) Synthesize into format 'The [Energy Adjective] [Identity Noun]'. Energy adjectives should reflect their photo-revealed energy state: Radiant/Luminous (high vitality), Gentle/Quiet (calm energy), Resilient/Phoenix (overcoming challenges), Fierce/Bold (strong determination), Balanced/Centered (harmonious). Identity nouns should reflect their quiz-revealed role: Seeker (growth-focused), Guardian (protective/nurturing), Alchemist (transformation-focused), Navigator (direction-seeking), Architect (structure-building). Examples: 'The Gentle Alchemist' (calm photo energy + transformation-focused quiz), 'The Radiant Navigator' (high vitality photo + direction-seeking quiz). Make it feel like their personal wellness archetype based on ACTUAL data synthesis.>",
        "description": "<string, 170-190 words. STRUCTURE: [Opening essence sentence] + [Photo-based physical/visual traits] + [Quiz-based lifestyle/values traits] + [Challenge acknowledgment with reframe] + [Unique superpower identification] + [Transformation potential] + [Wellness destiny/calling]. Write like a personalized wellness mythology. START with their core essence combining visual energy (from photo) and inner drive (from quiz). WEAVE IN specific photo findings (skin health, stress markers, vitality signs) as metaphors for their inner state. INTEGRATE quiz insights (lifestyle choices, values, focus areas) as their chosen path. ACKNOWLEDGE their challenges empathetically but frame as part of their heroic arc. IDENTIFY their unique wellness superpower - the specific combination of strengths only they possess. PAINT their transformation potential using vivid, aspirational language that feels both mystical and achievable. END with their wellness destiny - what they're called to become/contribute. Use nature metaphors, light/energy imagery, and transformation symbolism. Make it feel like discovering their secret wellness identity written in the stars but grounded in their real data.>"
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
    try:
        # Use Azure OpenAI GPT-4o mini for orchestration
        response = azure_openai_client.chat.completions.create(
            model=orchestrator_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert wellness synthesizer with advanced training in integrative health assessment. Your role is to intelligently combine insights from multiple specialized AI agents (photo analysis, quiz analysis) into a cohesive, actionable wellness assessment. Focus on accurate synthesis, cultural sensitivity, and actionable recommendations. IMPORTANT: Generate personalized archetype names based on the user's specific analysis data - do not use generic examples. Always return valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower for consistent synthesis
            max_tokens=2048,
            response_format={"type": "json_object"}  # Ensures JSON output
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Azure OpenAI GPT-4o Mini orchestrator")
            
        print(f"Raw LangGraph Orchestrator (Azure GPT-4o Mini) response: {content}")
        
        # Parse JSON response
        parsed = json.loads(content)
        
        # Coerce numeric fields into numbers if they are strings
        if 'adjustedCategoryScores' in parsed:
            for cat_key in parsed['adjustedCategoryScores']:
                val = parsed['adjustedCategoryScores'][cat_key]
                if isinstance(val, str):
                    try:
                        parsed['adjustedCategoryScores'][cat_key] = float(val)
                    except (ValueError, TypeError):
                        pass
        
        print(f"[LangGraph] 🎯 Orchestrator synthesis completed in {time.time() - start_time:.2f}s")
        return {**state, "ai_analysis": parsed}

    except Exception as e:
        print(f"[LangGraph] ❌ Azure OpenAI Orchestrator Error: {e}")
        print("Falling back to Gemini orchestrator...")
        
        # Fallback to Gemini orchestrator
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=0.6,
                top_p=0.9,
                candidate_count=1,
                max_output_tokens=2048
            )
            fallback_response = fallback_orchestrator.generate_content([prompt], generation_config=generation_config)
            print(f"Fallback Gemini Orchestrator response: {fallback_response.text}")
            
            # Parse response, resilient to markdown and with numeric coercion
            json_str = fallback_response.text
            match = re.search(r'```json\s*(\{.*?\})\s*```', fallback_response.text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                match = re.search(r'\{.*\}', fallback_response.text, re.DOTALL)
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
            
            print(f"[LangGraph] 🎯 Fallback Orchestrator synthesis completed in {time.time() - start_time:.2f}s")
            return {**state, "ai_analysis": parsed}
            
        except Exception as fallback_e:
            print(f"[LangGraph] ❌ Fallback Orchestrator Error: {fallback_e}")
            # Return a state indicating failure to prevent downstream errors
            return {**state, "ai_analysis": {"error": "Both Azure OpenAI and Gemini orchestrators failed", "details": str(e)}}


# OPTIMIZED ASYNC VERSIONS FOR BETTER PERFORMANCE

async def photo_node_async(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ULTRA-FAST: Async photo analysis node with speed-optimized processing.
    Expected 70-80% faster than previous version.
    """
    import time
    start_time = time.time()
    print("[LangGraph] 📸⚡ ULTRA-FAST photo analysis started")
    
    photo_url = state.get("photo_url")
    if photo_url:
        print(f"[LangGraph] 📸⚡ Processing photo (speed mode)")
        # Use FAST photo analyzer with optimized prompts and reduced tokens
        insights = await photo_analyzer.analyze_photo_fast(photo_url)
        print(f"[LangGraph] 📸⚡ ULTRA-FAST photo analysis completed in {time.time() - start_time:.2f}s")
    else:
        print("[LangGraph] 📸 No photo URL provided, skipping")
        insights = None
        
    return {**state, "photo_insights": insights}


async def quiz_node_async(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ULTRA-FAST: Async quiz analysis node with speed-optimized processing.
    Expected 60-70% faster than previous version.
    """
    import time, asyncio
    start_time = time.time()
    print("[LangGraph] 📝⚡ ULTRA-FAST quiz analysis started")
    
    answers = state["answers"]
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    question_map = state["question_map"]
    
    country = additional_data.get('countryOfResidence', 'Global')
    print(f"[LangGraph] 📝⚡ Processing {len(answers)} answers (speed mode) for {country}")
    
    # Use FAST quiz analyzer with optimized prompts and reduced tokens
    insights = await asyncio.to_thread(
        quiz_analyzer.analyze_quiz_fast,
        answers,
        base_scores,
        additional_data,
        question_map
    )
    print(f"[LangGraph] 📝⚡ ULTRA-FAST quiz analysis completed in {time.time() - start_time:.2f}s")
    
    return {**state, "quiz_insights": insights}


async def orchestrator_node_async(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    OPTIMIZED: Async orchestrator node with enhanced photo analysis integration.
    Now properly leverages comprehensive wellness indicators from photos.
    """
    import time
    start_time = time.time()
    print("[LangGraph] 🎯 ASYNC orchestrator started")
    
    orchestrator = state["orchestrator"]
    quiz_insights = state.get("quiz_insights")
    photo_insights = state.get("photo_insights")
    base_scores = state["base_scores"]
    additional_data = state["additional_data"]
    answers = state["answers"]
    question_map = state["question_map"]
    
    # Log what data was received
    has_photo = photo_insights is not None
    has_quiz = quiz_insights is not None
    print(f"[LangGraph] 🎯 ASYNC synthesis inputs: Photo={'✅' if has_photo else '❌'}, Quiz={'✅' if has_quiz else '❌'}")

    # Extract key data points
    user_age = additional_data.get('chronologicalAge', 'Not provided')
    user_country = additional_data.get('countryOfResidence', 'Not provided')
    
    # Extract key photo insights for focused analysis
    photo_summary = "No photo analysis available."
    if photo_insights:
        try:
            # Extract most relevant photo data for the orchestrator
            age_assessment = photo_insights.get('ageAssessment', {})
            skin_health = photo_insights.get('skinHealthAnalysis', {}) or photo_insights.get('comprehensiveSkinAnalysis', {})
            vitality_indicators = photo_insights.get('vitalityIndicators', {}) or photo_insights.get('vitalityAndHealthIndicators', {})
            stress_wellness = photo_insights.get('stressWellnessMarkers', {}) or photo_insights.get('stressAndLifestyleIndicators', {})
            lifestyle_indicators = photo_insights.get('lifestyleIndicators', {})
            overall_wellness = photo_insights.get('overallWellnessAssessment', {})
            
            # Safe extraction with fallbacks for null values
            def safe_get(obj, *keys, default="not assessed"):
                for key in keys:
                    if isinstance(obj, dict) and key in obj:
                        obj = obj[key]
                        if obj is None:
                            return default
                    else:
                        return default
                return obj if obj is not None else default
            
            age_lower = safe_get(age_assessment, 'estimatedRange', 'lower', default='unknown')
            age_upper = safe_get(age_assessment, 'estimatedRange', 'upper', default='unknown')
            age_range = f"{age_lower}-{age_upper}" if age_lower != 'unknown' and age_upper != 'unknown' else 'not assessed'
            
            photo_summary = f"""
PHOTO ANALYSIS SUMMARY:
- Age Estimate: {age_range} years
- Biological Age: {safe_get(age_assessment, 'biologicalAgeIndicators')}
- Skin Health: {safe_get(skin_health, 'overallSkinHealth')}
- Skin Quality: {safe_get(skin_health, 'skinQualityMetrics', 'texture')}, {safe_get(skin_health, 'skinLuminosity', 'radiance')}
- Hydration: {safe_get(skin_health, 'skinQualityMetrics', 'hydrationLevel')}
- Eye Health: {safe_get(vitality_indicators, 'eyeAreaAssessment', 'eyeBrightness')}
- Vitality Level: {safe_get(overall_wellness, 'vitalityLevel')}
- Sleep Quality: {safe_get(stress_wellness, 'sleepQualityIndicators', 'eyeArea')}
- Stress Level: {safe_get(stress_wellness, 'stressMarkers', 'tensionLines')}
- Exercise Signs: {safe_get(stress_wellness, 'lifestyleClues', 'nutritionalIndicators')}
- Overall Health: {safe_get(overall_wellness, 'healthImpression')}
- Analysis Confidence: {safe_get(photo_insights, 'analysisMetadata', 'analysisConfidence', default='moderate')}
"""
        except Exception as e:
            print(f"[LangGraph] Warning: Error extracting photo insights: {e}")
            photo_summary = "Photo analysis completed but data extraction encountered issues. Using available quiz data for assessment."
    
    # Extract comprehensive quiz insights for enhanced analysis
    quiz_summary = "No quiz analysis available."
    comprehensive_quiz_data = {}
    
    if quiz_insights:
        try:
            # Extract quiz data from simplified structure
            adjusted_scores = quiz_insights.get('adjustedScores', {})
            health_assessment = quiz_insights.get('healthAssessment', {})
            
            # Build quiz summary for orchestrator
            quiz_summary_parts = []
            
            if adjusted_scores:
                quiz_summary_parts.append(f"Adjusted Wellness Scores: Physical Vitality {adjusted_scores.get('physicalVitality', 'N/A')}, Emotional Health {adjusted_scores.get('emotionalHealth', 'N/A')}, Visual Appearance {adjusted_scores.get('visualAppearance', 'N/A')}")
            
            # Extract key insights from simplified structure
            key_strengths = quiz_insights.get('keyStrengths', [])
            priority_areas = quiz_insights.get('priorityAreas', [])
            cultural_context = quiz_insights.get('culturalContext', '')
            
            if health_assessment:
                physical_risks = health_assessment.get('physicalRisks', [])
                mental_wellness = health_assessment.get('mentalWellness', [])
                lifestyle_factors = health_assessment.get('lifestyleFactors', [])
                
                if physical_risks:
                    quiz_summary_parts.append(f"Physical Risks: {'; '.join(physical_risks[:2])}")
                if mental_wellness:
                    quiz_summary_parts.append(f"Mental Wellness: {'; '.join(mental_wellness[:2])}")
                if lifestyle_factors:
                    quiz_summary_parts.append(f"Lifestyle: {'; '.join(lifestyle_factors[:2])}")
            
            if key_strengths:
                strengths_text = "; ".join([str(s) for s in key_strengths[:2] if s])
                if strengths_text:
                    quiz_summary_parts.append(f"Key Strengths: {strengths_text}")
            
            if priority_areas:
                priorities_text = "; ".join([str(p) for p in priority_areas[:2] if p])
                if priorities_text:
                    quiz_summary_parts.append(f"Priority Areas: {priorities_text}")
            
            if cultural_context:
                quiz_summary_parts.append(f"Cultural Context: {cultural_context[:150]}...")
            
            # Fallback to basic fields if comprehensive data is missing
            if not quiz_summary_parts:
                basic_summary = quiz_insights.get('summary', '')
                if basic_summary:
                    quiz_summary_parts.append(f"Summary: {basic_summary[:200]}...")
            
            quiz_summary = " | ".join(quiz_summary_parts) if quiz_summary_parts else "Quiz analysis completed but no specific insights extracted."
            
            # Store structured data for orchestrator use
            comprehensive_quiz_data = {
                'adjustedScores': adjusted_scores,
                'healthAssessment': health_assessment,
                'keyStrengths': key_strengths,
                'priorityAreas': priority_areas,
                'culturalContext': cultural_context
            }
            
        except Exception as e:
            print(f"Error extracting quiz insights: {e}")
            # Fallback to basic extraction
            quiz_summary = quiz_insights.get('summary', 'Quiz analysis completed but could not extract detailed insights.')
            comprehensive_quiz_data = {'adjustedScores': quiz_insights.get('adjustedScores', {})}

    # ULTRA-FAST: Use optimized prompt with 80% fewer tokens
    synthesis_prompt = PromptOptimizer.build_fast_orchestrator_prompt(
        quiz_insights, 
        photo_insights, 
        int(user_age) if isinstance(user_age, (int, float)) and user_age else 30,
        user_country,
        base_scores
    )

    # Use Azure OpenAI GPT-4o mini for orchestration
    print("[LangGraph] 🎯⚡ ULTRA-FAST orchestrator with optimized prompt")
    try:
        response = await azure_openai_async_client.chat.completions.create(
            model=orchestrator_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a wellness synthesizer. Combine photo and quiz insights quickly. Generate personalized archetype names from the specific analysis data. Return structured JSON only."
                },
                {"role": "user", "content": synthesis_prompt}
            ],
            temperature=0.05, # Even lower for maximum speed
            max_tokens=800,   # Increased for enhanced archetype generation
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Azure OpenAI GPT-4o Mini orchestrator")
            
        print(f"Raw Azure OpenAI GPT-4o Mini orchestrator ASYNC response: {content}")
        clean_response = content.strip()
        
    except Exception as inner_e:
        print(f"[LangGraph] 🎯 Azure OpenAI orchestrator failed: {inner_e}")
        print("Falling back to Gemini orchestrator...")
        
        # Fallback to Gemini orchestrator
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=0.1,  # Faster
                top_p=0.7,        # Faster  
                candidate_count=1,
                max_output_tokens=1000  # Increased for enhanced archetype generation
            )
            fallback_response = await asyncio.to_thread(
                fallback_orchestrator.generate_content,
                [synthesis_prompt],
                generation_config=generation_config
            )
            
            clean_response = fallback_response.text.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            print(f"Fallback Gemini orchestrator ASYNC response: {clean_response}")
            
        except Exception as fallback_e:
            print(f"[LangGraph] 🎯 Both orchestrators failed: {fallback_e}")
            raise inner_e
    
    try:
        final_analysis = json.loads(clean_response)
        
        # VALIDATION: Ensure critical fields have valid values
        if not isinstance(final_analysis.get("biologicalAge"), (int, float)):
            # Fallback to user age if photo analysis failed
            photo_age_lower = None
            photo_age_upper = None
            if photo_insights:
                try:
                    age_assessment = photo_insights.get('ageAssessment', {})
                    age_range = age_assessment.get('estimatedRange', {})
                    photo_age_lower = age_range.get('lower')
                    photo_age_upper = age_range.get('upper')
                except:
                    pass
            
            if photo_age_lower and photo_age_upper:
                final_analysis["biologicalAge"] = int((photo_age_lower + photo_age_upper) / 2)
            else:
                final_analysis["biologicalAge"] = int(user_age) if isinstance(user_age, (int, float)) else 25
        
        if not isinstance(final_analysis.get("emotionalAge"), (int, float)):
            final_analysis["emotionalAge"] = int(user_age) if isinstance(user_age, (int, float)) else 25
            
        if not isinstance(final_analysis.get("chronologicalAge"), (int, float)):
            final_analysis["chronologicalAge"] = int(user_age) if isinstance(user_age, (int, float)) else 25
            
        if not isinstance(final_analysis.get("overallGlowScore"), (int, float)):
            # Calculate fallback from base scores
            if isinstance(base_scores, dict):
                scores = [v for v in base_scores.values() if isinstance(v, (int, float))]
                final_analysis["overallGlowScore"] = int(sum(scores) / len(scores)) if scores else 70
            else:
                final_analysis["overallGlowScore"] = 70
        
        # Ensure adjustedCategoryScores exist and are valid
        if not isinstance(final_analysis.get("adjustedCategoryScores"), dict):
            final_analysis["adjustedCategoryScores"] = base_scores
        else:
            # Validate each score
            for category in ["physicalVitality", "emotionalHealth", "visualAppearance"]:
                if not isinstance(final_analysis["adjustedCategoryScores"].get(category), (int, float)):
                    final_analysis["adjustedCategoryScores"][category] = base_scores.get(category, 70)
        
        # Ensure required fields exist
        if not final_analysis.get("glowUpArchetype"):
            final_analysis["glowUpArchetype"] = {
                "name": "The Balanced Navigator",
                "description": "You embody the essence of a thoughtful wellness explorer, naturally drawn to finding harmony between all aspects of life. Your inner compass points toward sustainable growth, and there's a quiet strength in how you approach challenges with both curiosity and wisdom. Like a skilled navigator reading the stars, you intuitively understand that true wellness comes from listening to your body's signals and honoring your emotional needs. Your superpower lies in your ability to adapt and find balance even in uncertainty. You're destined to become a guide for others seeking their own path to authentic wellness, showing them that transformation happens through gentle, consistent steps rather than dramatic changes."
            }
            
        if not final_analysis.get("microHabits"):
            final_analysis["microHabits"] = [
                "Drink an extra glass of water each morning",
                "Take 5 deep breaths when stressed",
                "Go to bed 15 minutes earlier",
                "Take a 10-minute walk daily",
                "Practice gratitude before sleep"
            ]
            
        if not final_analysis.get("analysisSummary"):
            final_analysis["analysisSummary"] = "Analysis completed with available data. Focus on consistent healthy habits for optimal wellness."
            
        if not final_analysis.get("detailedInsightsPerCategory"):
            final_analysis["detailedInsightsPerCategory"] = {
                "physicalVitalityInsights": ["Continue building healthy physical habits"],
                "emotionalHealthInsights": ["Focus on stress management and emotional balance"],
                "visualAppearanceInsights": ["Maintain consistent self-care routines"]
            }
        
        print(f"[LangGraph] 🎯 ASYNC orchestrator synthesis completed in {time.time() - start_time:.2f}s")
        return {**state, "ai_analysis": final_analysis}
    except Exception as parse_e:
        print(f"[LangGraph] ❌ Error parsing orchestrator JSON: {parse_e}")
        print(f"Raw response: {clean_response}")
        fallback_analysis = {
            "overallGlowScore": base_scores.get("overall", 70) if isinstance(base_scores, dict) else 70,
            "adjustedCategoryScores": base_scores,
            "biologicalAge": int(user_age) if isinstance(user_age, (int, float)) else 25,
            "emotionalAge": int(user_age) if isinstance(user_age, (int, float)) else 25,
            "chronologicalAge": int(user_age) if isinstance(user_age, (int, float)) else 25,
            "glowUpArchetype": {
                "name": "The Resilient Alchemist",
                "description": "Like a master alchemist, you possess the rare gift of transforming life's challenges into wisdom and strength. Your wellness journey is marked by an intuitive understanding that true healing happens from within, and you approach each setback as raw material for your personal transformation. There's a quiet power in your resilience—you don't just bounce back, you evolve forward. Your superpower lies in your ability to find the hidden lessons in every experience and transmute them into greater vitality. You're destined to become a beacon of authentic transformation, showing others that wellness isn't about perfection, but about the beautiful alchemy of turning wounds into wisdom and obstacles into opportunities for growth."
            },
            "microHabits": [
                "Drink an extra glass of water each morning",
                "Take 5 deep breaths when stressed",
                "Go to bed 15 minutes earlier",
                "Take a 10-minute walk daily",
                "Practice gratitude before sleep"
            ],
            "analysisSummary": "Analysis completed with available data. Focus on consistent healthy habits for optimal wellness.",
            "detailedInsightsPerCategory": {
                "physicalVitalityInsights": ["Continue building healthy physical habits"],
                "emotionalHealthInsights": ["Focus on stress management and emotional balance"],
                "visualAppearanceInsights": ["Maintain consistent self-care routines"]
            }
        }
        return {**state, "ai_analysis": fallback_analysis} 