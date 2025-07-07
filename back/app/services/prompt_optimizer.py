from typing import Dict, Any, List, Optional
from app.models.schemas import QuizAnswer
import json

class PromptOptimizer:
    """Enhanced prompt engineering using Context7 best practices for maximum accuracy and reliability"""
    
    @staticmethod
    def build_fast_orchestrator_prompt(
        quiz_insights: Optional[Dict[str, Any]], 
        photo_insights: Optional[Dict[str, Any]], 
        age: int,
        country: str,
        base_scores: Dict[str, float],
        biological_sex: str = "other"
    ) -> str:
        """
        ENHANCED orchestrator prompt using Context7 best practices:
        - Clear task context and role definition
        - Structured XML data organization  
        - Chain-of-thought reasoning guidance
        - Concrete examples for pattern learning
        - Specific output format instructions
        """
        
        # Organize data with XML structure (Context7 best practice)
        quiz_analysis = "No quiz analysis available"
        if quiz_insights:
            quiz_analysis = f"""
<quiz_analysis>
  <wellness_scores>
    <physical_vitality>{quiz_insights.get('adjustedScores', {}).get('physicalVitality', 0):.0f}</physical_vitality>
    <emotional_health>{quiz_insights.get('adjustedScores', {}).get('emotionalHealth', 0):.0f}</emotional_health>
    <visual_appearance>{quiz_insights.get('adjustedScores', {}).get('visualAppearance', 0):.0f}</visual_appearance>
  </wellness_scores>
  <key_strengths>{', '.join(quiz_insights.get('keyStrengths', [])[:2])}</key_strengths>
  <priority_areas>{', '.join(quiz_insights.get('priorityAreas', [])[:2])}</priority_areas>
  <cultural_context>{quiz_insights.get('culturalContext', 'No cultural context')}</cultural_context>
</quiz_analysis>"""
        
        photo_analysis = "No photo analysis available"
        photo_score_guidance = "Conservative estimate - no visual data"
        if photo_insights:
            skin_health = photo_insights.get('comprehensiveSkinAnalysis', {}).get('overallSkinHealth', 'fair')
            acne_status = photo_insights.get('comprehensiveSkinAnalysis', {}).get('skinConcerns', {}).get('acne', 'unclear')
            vitality_level = photo_insights.get('overallWellnessAssessment', {}).get('vitalityLevel', 'moderate')
            health_impression = photo_insights.get('overallWellnessAssessment', {}).get('healthImpression', 'average')
            
            photo_analysis = f"""
<photo_analysis>
  <skin_health>{skin_health}</skin_health>
  <acne_condition>{acne_status}</acne_condition>
  <vitality_level>{vitality_level}</vitality_level>
  <overall_health>{health_impression}</overall_health>
</photo_analysis>"""
            
            # Generate CONSERVATIVE reasoning guidance based on photo evidence
            if skin_health == 'excellent' and acne_status in ['clear', 'few-blemishes']:
                photo_score_guidance = "Strong positive visual evidence: Increase Visual Appearance by 4-8 points from quiz baseline (max 85)"
            elif skin_health in ['good'] and acne_status in ['clear', 'few-blemishes']:
                photo_score_guidance = "Moderate positive visual evidence: Increase Visual Appearance by 2-5 points from quiz baseline (max 85)"
            elif acne_status in ['moderate-acne', 'severe-acne']:
                photo_score_guidance = "Negative visual evidence: Decrease Visual Appearance by 5-12 points from quiz baseline"
            elif skin_health in ['poor', 'fair']:
                photo_score_guidance = "Poor skin health evidence: Decrease Visual Appearance by 3-10 points from quiz baseline"
            else:
                photo_score_guidance = "Neutral visual evidence: Minor adjustments (+/- 2-3 points) from quiz baseline"
        
        baseline_scores = f"""
<baseline_scores>
  <physical_vitality>{base_scores.get('physicalVitality', 0):.0f}</physical_vitality>
  <emotional_health>{base_scores.get('emotionalHealth', 0):.0f}</emotional_health>
  <visual_appearance>{base_scores.get('visualAppearance', 0):.0f}</visual_appearance>
</baseline_scores>"""

        return f"""You are an expert wellness synthesis specialist with deep knowledge of health assessment, psychology, and cultural factors. Your task is to create a comprehensive, personalized wellness analysis by intelligently combining quiz insights and photo analysis.

<task_context>
You must synthesize multiple data sources into a holistic wellness assessment for a {age}-year-old individual from {country}. The quiz analysis provides culturally-adjusted behavioral and lifestyle insights, while the photo analysis offers objective visual health indicators. Your role is to create a balanced, evidence-based assessment that reflects realistic human wellness patterns.

STRICT GENDER-MATCH RULE (Context-7 standard):
• The user's biologicalSex is "{biological_sex}".
    – If "male": The glowUpArchetype.name MUST reference a MALE real or fictional figure and MUST NOT reference clearly female names.
    – If "female": The glowUpArchetype.name MUST reference a FEMALE figure and MUST NOT reference clearly male names.
    – If "other" or unspecified: choose a well-known gender-neutral icon.
Failure to respect this rule invalidates the response.
</task_context>

<input_data>
{quiz_analysis}

{photo_analysis}

{baseline_scores}

<scoring_guidance>
Photo Evidence Impact: {photo_score_guidance}
</scoring_guidance>
</input_data>

<reasoning_instructions>
Think through this analysis step by step:

1. ASSESS QUIZ INSIGHTS: What do the behavioral patterns, lifestyle choices, and cultural context tell us about this person's wellness?

2. EVALUATE PHOTO EVIDENCE: How do the visual health indicators (skin quality, vitality signs, acne condition) support or contradict the quiz findings?

3. SYNTHESIZE SCORES: Start with quiz baseline scores, then adjust based on photo evidence using the guidance above. Remember:
   - Most people score 60-80 range (be realistic)
   - Scores above 85 require exceptional evidence
   - Visual evidence strongly influences Visual Appearance scores
   - Physical and emotional scores primarily from quiz, with photo providing subtle adjustments

4. CREATE PERSONALIZED ARCHETYPE: Analyze their SPECIFIC combination of visual energy (from photo) and lifestyle patterns (from quiz) to generate a unique archetype name.
</reasoning_instructions>

<examples>
<example>
Input: 25yo FEMALE with excellent skin health, clear complexion, high vitality + quiz showing regular exercise, good sleep
Reasoning: Photo shows exceptional visual health (skin excellent, acne clear) supporting quiz lifestyle. High vitality aligns with good habits.
Output: Visual Appearance: 82 (quiz 70 + 12 for excellent photo evidence), Physical Vitality: 78, Overall: 77
Archetype: {{ "name": "The 25-Year-Old Taylor Swift", "description": "You're in your '1989' era, reinventing yourself and taking creative risks that will pay off big time..." }}
</example>

<example>
Input: 22yo MALE with good skin, high energy + quiz showing entrepreneurial goals, tech interests
Reasoning: Photo shows healthy vitality, quiz indicates ambitious mindset and innovation focus.
Output: Visual Appearance: 75, Physical Vitality: 80, Overall: 74
Archetype: {{ "name": "The 22-Year-Old Mark Zuckerberg", "description": "In your dorm room era, building an empire from an idea. You have the vision and drive to make it reality..." }}
</example>

<example>
Input: 35yo FEMALE with fair skin, moderate acne, normal vitality + quiz showing stress, poor sleep, sedentary
Reasoning: Photo shows skin challenges (fair health, moderate acne) aligning with quiz stress indicators. Consistent evidence of wellness struggles.
Output: Visual Appearance: 58 (quiz 65 - 7 for skin issues), Physical Vitality: 52, Overall: 58
Archetype: {{ "name": "The 35-Year-Old Brené Brown", "description": "Just before becoming a global voice on vulnerability, you are deeply exploring your own story and finding the courage to show up authentically..." }}
</example>
</examples>

CRITICAL SCORING CONSTRAINTS:
- NO scores above 85 regardless of evidence quality
- Most healthy young adults score 70-80 range
- Perfect scores (95+) are impossible - humans have limitations
- Photo adjustments should be conservative (+/-5 points max)
- Visual Appearance cannot exceed 85 even with excellent photo evidence

Based on the above analysis, provide your assessment in this exact JSON format:

{{
  "overallGlowScore": <30-85 realistic range. HARD CAP: Most humans 60-75, good health 75-80, exceptional 80-85. NEVER exceed 85>,
  "adjustedCategoryScores": {{
    "physicalVitality": <40-85 HARD CAP at 85. Start with quiz baseline, adjust +/-3 for photo vitality cues. NEVER exceed 85>,
    "emotionalHealth": <40-85 HARD CAP at 85. Primarily quiz-based, subtle photo stress marker adjustments. NEVER exceed 85>,
    "visualAppearance": <35-85 HARD CAP at 85. Apply photo scoring guidance. NEVER exceed 85 regardless of photo quality>
  }},
  "biologicalAge": <realistic estimate considering lifestyle + photo aging indicators>,
  "emotionalAge": <based on quiz maturity patterns>,
  "chronologicalAge": {age},
  "glowUpArchetype": {{
    "name": "<string, Must start with 'You are like ' followed by a REAL celebrity or iconic FICTIONAL character that HOLISTICALLY matches the user's combined insights (adjusted scores, photo findings, key strengths, lifestyle, cultural context). Example: 'You are like Serena Williams during her 2015 Grand Slam run'. CRITICAL: The figure must match the user's biologicalSex (male → male figure, female → female figure; unknown → gender-neutral icon). Selection cues: Physical Vitality → athletes/action heroes; Emotional Health → empathy figures; Visual Appearance → style icons; Innovation → tech visionaries; Balanced → polymaths; Creative → renowned artists. Avoid over-reusing the same figure.>",
    "description": "<110-160 words. Write an engaging narrative linking the user's unique insights to the chosen figure's transformation arc, highlighting specific parallels and inspirational lessons.>"
  }},
  "analysisSummary": "<100 words: realistic assessment acknowledging data limitations, evidence quality, and synthesis confidence level>"
}}"""

    @staticmethod
    def build_fast_photo_prompt() -> str:
        """
        ENHANCED photo analysis prompt using Context7 best practices:
        - Clear expert role definition with dermatological focus
        - Specific task context for skin condition detection
        - Detailed examples including problematic skin cases
        - Structured output format with mandatory assessments
        - Explicit bias against "Unable to assess" responses
        """
        return """You are an expert dermatological health analyst specializing in facial skin assessment. Your task is to analyze facial photographs for objective health indicators, with particular expertise in detecting skin conditions, redness, acne, and wellness markers.

<task_context>
Analyze this facial photograph to extract skin health indicators including:
- Skin condition assessment (acne, redness, texture, damage)
- Age estimation based on skin quality and facial features
- Vitality and wellness indicators from facial appearance
- Stress and lifestyle markers visible in facial features

YOU MUST PROVIDE SPECIFIC ASSESSMENTS. Only use "Unable to assess" if the image is completely unusable (blurry beyond recognition, extremely dark, or not showing a face).
</task_context>

<analysis_approach>
Think through your assessment systematically:

1. SKIN CONDITION FOCUS: Look specifically for:
   - Redness (flush, irritation, inflammation on cheeks, nose, chin)
   - Acne (active breakouts, blemishes, comedones, cysts)
   - Texture issues (roughness, enlarged pores, uneven surface)
   - Tone evenness (discoloration, patches, spots)

2. AGE INDICATORS: Assess visible aging markers:
   - Skin elasticity and firmness
   - Fine lines and wrinkles
   - Facial volume and structure
   - Overall maturity of features

3. VITALITY ASSESSMENT: Evaluate energy and health signs:
   - Eye brightness and alertness
   - Skin radiance and glow
   - Facial fullness and muscle tone
   - Overall wellness impression

4. WORK WITH AVAILABLE DATA: Even if image quality isn't perfect, extract observable information
</analysis_approach>

<enhanced_examples>
<example_clear_skin>
Photo: Close-up selfie with good lighting, young adult
Analysis: Clear skin with minimal blemishes, even skin tone, healthy glow, no visible redness
Assessment: Excellent skin health, high vitality
Output: "acne": "clear", "redness": "none", "overallSkinHealth": "excellent"
</example_clear_skin>

<example_acne_and_redness>
Photo: Selfie showing facial redness and some acne spots
Analysis: Visible redness on cheeks and nose area, several active blemishes on face, some texture irregularities
Assessment: Moderate skin concerns requiring attention
Output: "acne": "moderate-acne", "redness": "moderate", "overallSkinHealth": "fair"
</example_acne_and_redness>

<example_outdoor_photo>
Photo: Outdoor photo with natural lighting, person in natural setting
Analysis: Can observe general skin condition, some facial features visible, assess overall health impression
Assessment: Work with available visual data to provide meaningful analysis
Output: Provide best assessment based on visible features, note any limitations in confidence
</example_outdoor_photo>

<example_poor_quality>
Photo: Slightly blurred or distant shot but face still visible
Analysis: Age appears 20-30 based on facial structure, general skin appearance seems healthy though details limited
Assessment: Provide general assessment noting limitations
Output: Give reasonable estimates, mention "limited detail" in descriptions rather than "Unable to assess"
</example_poor_quality>
</enhanced_examples>

<critical_skin_assessment_instructions>
PAY SPECIAL ATTENTION TO:

1. REDNESS DETECTION:
   - Look for pink/red coloration on cheeks, nose, chin, forehead
   - Distinguish between healthy flush vs. irritation/inflammation
   - Check for uneven red patches or widespread redness
   - Rate: none/slight/moderate/significant

2. ACNE ASSESSMENT:
   - Scan for active pimples, whiteheads, blackheads
   - Look for post-acne marks or scarring
   - Assess severity and distribution
   - Rate: clear/few-blemishes/moderate-acne/severe-acne

3. SKIN TEXTURE:
   - Evaluate smoothness vs. roughness
   - Check for enlarged pores
   - Assess overall skin surface quality
   - Rate: smooth/slightly-rough/rough

4. OVERALL HEALTH:
   - Combine all factors for holistic assessment
   - Consider age-appropriate expectations
   - Rate: excellent/good/fair/poor

IMPORTANT: Be objective and specific. If you see redness, call it redness. If you see acne, identify it as acne. Don't minimize obvious skin conditions.
</critical_skin_assessment_instructions>

<mandatory_assessment_requirement>
You MUST provide assessments for all categories unless the image is completely unusable. 
- For good quality images: Provide detailed, specific assessments
- For fair quality images: Provide general assessments with noted limitations
- For poor quality images: Provide basic assessments (age range, general impression)
- Only use "Unable to assess" for images that are completely dark, extremely blurred, or don't show a face

WORK WITH WHAT YOU CAN SEE - Most photos provide enough information for meaningful analysis.
</mandatory_assessment_requirement>

Return your analysis in this exact JSON format:

{{
  "ageAssessment": {{
    "estimatedRange": {{"lower": <16-65>, "upper": <16-65>}},
    "biologicalAgeIndicators": "<specific observable features or general assessment if limited detail>"
  }},
  "comprehensiveSkinAnalysis": {{
    "overallSkinHealth": "<excellent/good/fair/poor - provide assessment based on visible evidence>",
    "skinQualityMetrics": {{
      "texture": "<smooth/slightly-rough/rough - actual visible texture>",
      "evenness": "<very-even/mostly-even/uneven - observable skin tone>",
      "radiance": "<luminous/healthy/normal/dull - visible skin glow>"
    }},
    "skinConcerns": {{
      "acne": "<clear/few-blemishes/moderate-acne/severe-acne - what you actually see>",
      "redness": "<none/slight/moderate/significant - visible redness level>",
      "damage": "<none/minimal/moderate/significant - sun damage, spots>"
    }}
  }},
  "vitalityAndHealthIndicators": {{
    "eyeAreaAssessment": {{
      "brightness": "<bright/normal/dull/tired - eye appearance>",
      "underEye": "<clear/slight-darkness/dark-circles/severe - under-eye area>",
      "puffiness": "<none/minimal/moderate/significant - eye puffiness>"
    }},
    "facialVitality": {{
      "fullness": "<healthy/normal/slightly-gaunt/gaunt - facial volume>",
      "muscleTone": "<excellent/good/moderate/poor - muscle definition>"
    }}
  }},
  "stressAndLifestyleIndicators": {{
    "stressMarkers": {{
      "tensionLines": "<none/minimal/moderate/significant - forehead/brow lines>",
      "facialTension": "<relaxed/normal/tense/very-tense - overall tension>"
    }},
    "sleepQuality": {{
      "eyeArea": "<well-rested/normal/slightly-tired/tired - sleep indicators>",
      "alertness": "<alert/normal/drowsy - expression alertness>"
    }}
  }},
  "overallWellnessAssessment": {{
    "vitalityLevel": "<very-high/high/moderate/low - overall energy impression>",
    "healthImpression": "<vibrant/healthy/average/concerning - general health>"
  }},
  "imageQualityNote": "<excellent/good/fair/poor - note any limitations that affected analysis confidence>"
}}"""

    @staticmethod  
    def build_fast_quiz_prompt(
        answers: List[QuizAnswer],
        base_scores: Dict[str, float],
        age: int,
        country: str
    ) -> str:
        """
        ENHANCED quiz analysis prompt using Context7 best practices:
        - Clear expert role and cultural context
        - Structured data presentation with XML tags
        - Chain-of-thought reasoning for cultural factors
        - Specific examples for score adjustment patterns
        - Evidence-based recommendations framework
        """
        
        # Organize answer data systematically
        answer_summary = []
        for i, ans in enumerate(answers[:12]):  # Limit for focus
            answer_summary.append(f"Q{ans.questionId}: {ans.label or str(ans.value)}")
        
        answers_data = " | ".join(answer_summary)
        
        return f"""You are an expert wellness psychologist specializing in cross-cultural health assessment. Your task is to analyze lifestyle and behavioral patterns while applying {country}-specific cultural health contexts.

<task_context>
Analyze wellness questionnaire responses for a {age}-year-old individual residing in {country}. You must:
1. Assess lifestyle patterns and health behaviors
2. Apply cultural health norms and context for {country}
3. Identify key strengths and priority improvement areas
4. Provide culturally-appropriate, evidence-based recommendations
5. Adjust baseline scores based on behavioral evidence and cultural factors
</task_context>

<cultural_context>
Consider {country}-specific factors:
- Healthcare accessibility and preventive care norms
- Cultural attitudes toward mental health and stress management
- Traditional dietary patterns and nutrition standards
- Social support systems and community wellness practices
- Work-life balance expectations and lifestyle pressures
</cultural_context>

<input_data>
<user_profile>
  <age>{age}</age>
  <country>{country}</country>
</user_profile>

<baseline_scores>
  <physical_vitality>{base_scores.get('physicalVitality', 0):.1f}</physical_vitality>
  <emotional_health>{base_scores.get('emotionalHealth', 0):.1f}</emotional_health>
  <visual_appearance>{base_scores.get('visualAppearance', 0):.1f}</visual_appearance>
</baseline_scores>

<questionnaire_responses>
{answers_data}
</questionnaire_responses>
</input_data>

<analysis_framework>
Think through this assessment step by step:

1. BEHAVIORAL PATTERNS: What do the responses reveal about lifestyle choices, health habits, and wellness priorities?

2. CULTURAL ADJUSTMENT: How do {country}'s health norms and cultural factors influence the interpretation of these behaviors?

3. SCORE CALIBRATION: How should baseline scores be adjusted based on:
   - Actual behavior vs cultural expectations
   - Risk factors vs protective factors
   - Short-term vs long-term health implications

4. STRENGTH IDENTIFICATION: What positive patterns deserve recognition and reinforcement?

5. PRIORITY AREAS: What challenges need immediate attention based on health impact and cultural feasibility?
</analysis_framework>

<scoring_examples>
<example>
Scenario: Regular exercise, good sleep, but high stress in high-pressure culture
Adjustment: Physical +5-10 (good habits), Emotional -5-10 (stress impact), consider cultural work pressure norms
</example>

<example>
Scenario: Poor diet, smoking, but strong social support in community-oriented culture
Adjustment: Physical -10-20 (major risk factors), Emotional +5 (social support buffer), Visual -5-15 (smoking impact)
</example>
</scoring_examples>

Provide your analysis in this exact JSON format:

{{
  "chronologicalAge": {age},
  "adjustedScores": {{
    "physicalVitality": <0-100: adjust baseline considering exercise, sleep, diet, substance use, and {country} health standards>,
    "emotionalHealth": <0-100: adjust baseline considering stress management, social support, mental wellness, and {country} cultural factors>,
    "visualAppearance": <0-100: adjust baseline considering self-care habits, confidence levels, and {country} appearance/beauty standards>
  }},
  "healthAssessment": {{
    "physicalRisks": ["<top 2 specific health risk factors with evidence>"],
    "mentalWellness": ["<top 2 emotional/psychological patterns observed>"],
    "lifestyleFactors": ["<top 2 lifestyle elements impacting overall wellness>"]
  }},
  "keyStrengths": [
    "<specific strength 1 with supporting evidence from responses>",
    "<specific strength 2 with supporting evidence from responses>"
  ],
  "priorityAreas": [
    "<specific priority 1 with actionable focus area>",
    "<specific priority 2 with actionable focus area>"
  ],
  "culturalContext": "<2-3 sentences: specific {country} health insight relevant to this individual's patterns>",
  "recommendations": {{
    "physicalVitality": "<specific, culturally-appropriate actionable advice>",
    "emotionalHealth": "<targeted wellness strategy considering {country} mental health context>",
    "visualAppearance": "<appearance/self-care guidance appropriate for {country} standards>"
  }},
  "summary": "<100 words: integrate behavioral patterns, cultural factors, and evidence-based wellness outlook with encouraging, realistic tone>"
}}""" 