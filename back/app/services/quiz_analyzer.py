import google.generativeai as genai
from app.config.settings import settings
from app.models.schemas import QuizAnswer
from app.services.prompt_optimizer import PromptOptimizer
from typing import List, Dict, Any, Optional
import json
import re
import asyncio

class QuizAnalyzerGemini:
    """Agent for analyzing quiz/health data using Gemini."""
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        # Remove async_model creation from __init__ to fix event loop issues

    async def analyze_quiz_async(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        OPTIMIZED: Async quiz analysis with dramatically shortened prompts.
        Expected 40-60% faster than sync version.
        Fixed event loop issue by creating async model in the correct context.
        """
        try:
            # Create async model in the current event loop context to avoid "different loop" errors
            async_model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            prompt = self._build_optimized_prompt(answers, base_scores, additional_data, question_map)
            
            # Optimized generation config for faster processing
            generation_config = genai.types.GenerationConfig(
                temperature=0.3,  # Lower for faster, more consistent results
                top_p=0.8,        # Reduced for faster processing
                candidate_count=1,
                max_output_tokens=600  # Reduced to prevent truncation
            )
            
            # Use async generation with model created in correct context
            response = await async_model.generate_content_async([prompt], generation_config=generation_config)
            return self._parse_response(response.text)
            
        except Exception as e:
            print(f"QuizAnalyzerGemini ASYNC error: {e}")
            return None

    def analyze_quiz_fast(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        ULTRA-FAST quiz analysis with optimized prompt and reduced complexity.
        Uses compressed prompts and minimal required fields.
        """
        try:
            print("[LangGraph] 📝⚡ Processing {} answers (speed mode) for {}".format(
                len(answers), additional_data.get('countryOfResidence', 'Global')))

            prompt = self._build_optimized_prompt(answers, base_scores, additional_data, question_map)

            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=1200,  # Increased from 350 to handle JSON properly
                    temperature=0.1,  # Even lower for maximum speed and consistency
                )
            )

            if not response or not response.text:
                print("QuizAnalyzer FAST: Empty response from Gemini")
                return self._get_fallback_quiz_response(base_scores, additional_data)

            result = self._parse_response(response.text)
            if result is None:
                print("QuizAnalyzer FAST: Failed to parse response, using fallback")
                return self._get_fallback_quiz_response(base_scores, additional_data)
                
            return result

        except Exception as e:
            print(f"QuizAnalyzer FAST error: {e}")
            return self._get_fallback_quiz_response(base_scores, additional_data)

    def _build_optimized_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> str:
        """
        FIXED: Concise prompt that prevents JSON truncation while maintaining quality.
        Optimized for speed and reliability.
        """
        age = additional_data.get('chronologicalAge', 'Unknown')
        country = additional_data.get('countryOfResidence', 'Unknown')
        
        # Build concise answer analysis
        key_answers = []
        for ans in answers:
            q_detail = question_map.get(ans.questionId, {})
            q_text = q_detail.get('text', f'Q{ans.questionId}')[:40] + "..." if len(q_detail.get('text', '')) > 40 else q_detail.get('text', f'Q{ans.questionId}')
            label = ans.label or str(ans.value)
            key_answers.append(f"Q{ans.questionId}: {label}")
        
        answers_summary = " | ".join(key_answers[:12])  # Limit to prevent truncation
        
        return f"""Analyze wellness data for user (Age: {age}, Country: {country}).

BASE SCORES: Physical={base_scores['physicalVitality']:.1f}, Emotional={base_scores['emotionalHealth']:.1f}, Visual={base_scores['visualAppearance']:.1f}

KEY ANSWERS: {answers_summary}

Apply {country}-specific health context and cultural factors. Be concise but thorough.

Return ONLY JSON (no extra text):
{{
  "chronologicalAge": {age},
  "adjustedScores": {{
    "physicalVitality": <0-100, adjust base score considering exercise, sleep, diet, and {country} health norms>,
    "emotionalHealth": <0-100, adjust base score considering stress, social support, and {country} cultural factors>,
    "visualAppearance": <0-100, adjust base score considering self-perception and {country} appearance standards>
  }},
  "healthAssessment": {{
    "physicalRisks": ["<top 2 health risks>"],
    "mentalWellness": ["<top 2 emotional patterns>"],
    "lifestyleFactors": ["<top 2 lifestyle impacts>"]
  }},
  "keyStrengths": [
    "<strength 1 with evidence>",
    "<strength 2 with evidence>"
  ],
  "priorityAreas": [
    "<priority 1 with action>",
    "<priority 2 with action>"
  ],
  "culturalContext": "<brief {country}-specific health insight>",
  "recommendations": {{
    "physicalVitality": "<specific actionable advice>",
    "emotionalHealth": "<targeted wellness strategy>",
    "visualAppearance": "<appearance-related guidance>"
  }},
  "summary": "<100 words integrating all factors with encouraging tone>"
}}

Keep responses concise to prevent truncation. Focus on key insights and actionable recommendations."""

    def analyze_quiz(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        ENHANCED: Comprehensive quiz analysis with advanced psychological and health assessment.
        Provides detailed wellness insights for integration with photo analysis.
        """
        try:
            prompt = self._build_enhanced_prompt(answers, base_scores, additional_data, question_map)
            # Use optimized generation configuration for comprehensive yet efficient analysis
            generation_config = genai.types.GenerationConfig(
                temperature=0.4,  # Balanced for nuanced analysis
                top_p=0.9,
                candidate_count=1,
                max_output_tokens=2500  # Increased for comprehensive analysis
            )
            response = self.model.generate_content([prompt], generation_config=generation_config)
            return self._parse_response(response.text)
        except Exception as e:
            print(f"QuizAnalyzerGemini error: {e}")
            return None

    def _build_enhanced_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> str:
        """
        ENHANCED: Comprehensive prompt using advanced wellness assessment principles.
        Integrates psychological, physiological, and cultural factors for holistic analysis.
        """
        user_profile_lines = [
            f"Chronological Age: {additional_data.get('chronologicalAge', 'Not provided')} years",
            f"Biological Sex: {additional_data.get('biologicalSex', 'Not provided').replace('-', ' ').title()}",
            f"Country of Primary Residence: {additional_data.get('countryOfResidence', 'Not provided')}",
            f"Assessment Date: Current comprehensive wellness evaluation"
        ]
        user_profile_str = "\n".join(user_profile_lines)

        # Enhanced health metrics section
        health_metrics_lines = []
        if additional_data.get('bmi'): 
            health_metrics_lines.append(f"- BMI Category: {additional_data['bmi'].replace('-', ' ').title()}")
        if additional_data.get('bloodPressure'): 
            health_metrics_lines.append(f"- Blood Pressure Status: {additional_data['bloodPressure'].replace('-', ' ').title()}")
        if additional_data.get('restingHeartRate'): 
            health_metrics_lines.append(f"- Resting Heart Rate: {additional_data['restingHeartRate'].replace('-', ' ').title()}")
        if additional_data.get('cvdHistory'): 
            health_metrics_lines.append(f"- Cardiovascular History: {additional_data['cvdHistory'].replace('-', ' ').title()}")
        
        health_metrics_info = "\nClinical Health Indicators:\n" + "\n".join(health_metrics_lines) if health_metrics_lines else "\nNo additional clinical metrics provided."

        # Comprehensive answer categorization and analysis
        detailed_answers_analysis = []
        physical_vitality_questions = []
        emotional_health_questions = []
        visual_appearance_questions = []
        lifestyle_questions = []
        
        for ans in answers:
            q_detail = question_map.get(ans.questionId, {})
            selected_option_label = ans.label or str(ans.value)
            
            if q_detail:
                question_context = {
                    "questionId": ans.questionId,
                    "category": q_detail.get('category', 'general'),
                    "questionText": q_detail['text'],
                    "selectedValue": ans.value,
                    "selectedLabel": selected_option_label,
                    "impactWeight": q_detail.get('impact_weight', 1.0)
                }
                
                # Categorize for targeted analysis
                if ans.questionId in ['q1', 'q2', 'q3', 'q4', 'q5', 'q12', 'q13', 'q14']:
                    physical_vitality_questions.append(question_context)
                elif ans.questionId in ['q6', 'q7', 'q8', 'q9']:
                    emotional_health_questions.append(question_context)
                elif ans.questionId in ['q10', 'q11']:
                    visual_appearance_questions.append(question_context)
                else:
                    lifestyle_questions.append(question_context)
                
                detailed_answers_analysis.append(question_context)

        country = additional_data.get('countryOfResidence', 'Global')
        
        # Enhanced country-specific analysis
        country_analysis_prompt = ""
        if country and country.lower() not in ['not provided', 'global', 'unknown']:
            country_analysis_prompt = f"""
            **CRITICAL CULTURAL & ENVIRONMENTAL CONTEXT: {country} Assessment Framework**
            
            Apply sophisticated analysis considering {country}'s specific health landscape:
            
            **Health System & Access Factors:**
            - Healthcare accessibility and quality in {country}
            - Preventive care culture and health education levels
            - Mental health stigma and support availability
            - Nutritional education and food security patterns
            
            **Environmental & Lifestyle Factors:**
            - Climate impact on physical activity and vitamin D levels
            - Air quality and pollution effects on physical vitality
            - Urbanization vs rural lifestyle impacts
            - Work culture and stress patterns typical in {country}
            
            **Cultural & Social Factors:**
            - Beauty standards and appearance pressures in {country}
            - Social support systems and community structures
            - Family dynamics and intergenerational influences
            - Gender roles and expectations affecting wellness
            
            **Economic & Socioeconomic Considerations:**
            - Access to healthy food, exercise facilities, mental health resources
            - Work-life balance norms and economic pressures
            - Healthcare costs and insurance coverage patterns
            
            **Demographic Health Patterns:**
            - Common health issues and risk factors in {country}
            - Life expectancy and healthy aging patterns
            - Nutritional deficiencies or abundance patterns
            - Substance use cultural norms and regulations
            
            **Integration Requirement:** Your adjusted scores MUST reflect how these {country}-specific factors would realistically impact someone with these survey responses compared to global averages.
            """
        else:
            country_analysis_prompt = "Apply general global wellness assessment principles with cultural sensitivity."

        physical_questions_json = json.dumps(physical_vitality_questions, indent=1)
        emotional_questions_json = json.dumps(emotional_health_questions, indent=1)
        visual_questions_json = json.dumps(visual_appearance_questions, indent=1)

        return f"""
        You are a leading expert in integrative wellness assessment with advanced training in:
        - Clinical psychology and behavioral health assessment
        - Exercise physiology and nutritional science  
        - Psychoneuroimmunology and stress medicine
        - Cultural competency in global health patterns
        - Lifestyle medicine and preventive health
        - Positive psychology and resilience factors

        Your task is to conduct a comprehensive, evidence-based wellness analysis that will integrate with advanced facial analysis for holistic health assessment.

        **ASSESSMENT SUBJECT PROFILE:**
        {user_profile_str}
        {health_metrics_info}

        **BASELINE WELLNESS METRICS (Pre-Cultural Adjustment):**
        - Physical Vitality Baseline: {base_scores['physicalVitality']:.2f}%
        - Emotional Health Baseline: {base_scores['emotionalHealth']:.2f}%  
        - Visual Appearance Baseline: {base_scores['visualAppearance']:.2f}%

        **DETAILED RESPONSE ANALYSIS BY CATEGORY:**

        **Physical Vitality Assessment Data:**
        {physical_questions_json}

        **Emotional Health Assessment Data:**
        {emotional_questions_json}

        **Visual Appearance Assessment Data:**
        {visual_questions_json}

        {country_analysis_prompt}

        **CRITICAL OUTPUT REQUIREMENTS:**
        - Return ONLY valid JSON (no markdown, explanations, or text outside JSON)
        - Apply evidence-based wellness science principles
        - Integrate cultural competency and demographic awareness
        - Provide actionable, specific insights for personalized recommendations
        - Ensure numerical adjustments reflect realistic cultural and individual factors

        **REQUIRED JSON OUTPUT STRUCTURE:**

        {{
            "chronologicalAge": {additional_data.get('chronologicalAge', 'null')},
            "adjustedScores": {{
                "physicalVitality": <number, 0-100. Evidence-based adjustment of {base_scores['physicalVitality']:.1f} considering sleep quality, cardiovascular fitness, nutrition patterns, substance use, and {country} environmental factors. Must reflect realistic impact of survey responses.>,
                "emotionalHealth": <number, 0-100. Sophisticated adjustment of {base_scores['emotionalHealth']:.1f} based on stress resilience, emotional regulation, social connectedness, and {country} cultural mental health factors.>,
                "visualAppearance": <number, 0-100. Thoughtful adjustment of {base_scores['visualAppearance']:.1f} considering self-perception, body image, lifestyle impacts on appearance, and {country} beauty culture influences.>
            }},
            "comprehensiveWellnessProfile": {{
                "physicalHealthAnalysis": {{
                    "cardiovascularRiskProfile": "<comprehensive assessment based on exercise, diet, smoking, stress, family history>",
                    "metabolicHealthStatus": "<detailed analysis of weight management, nutrition, activity patterns>",
                    "sleepHealthAssessment": "<thorough evaluation of sleep quality, duration, and recovery patterns>",
                    "nutritionalWellnessEvaluation": "<analysis of dietary patterns, nutritional knowledge, eating behaviors>",
                    "substanceUseHealthImpact": "<objective assessment of alcohol, tobacco, and other substance effects>",
                    "physicalActivityProfile": "<detailed evaluation of exercise habits, fitness level, movement patterns>",
                    "energyVitalityAssessment": "<analysis of energy levels, fatigue patterns, physical resilience>"
                }},
                "mentalEmotionalProfile": {{
                    "stressManagementCapacity": "<detailed assessment of stress coping mechanisms and resilience>",
                    "emotionalIntelligenceIndicators": "<evaluation of emotional awareness, regulation, and expression>",
                    "socialConnectionQuality": "<analysis of relationship satisfaction, social support, community engagement>",
                    "psychologicalResilienceFactors": "<assessment of mental toughness, adaptability, recovery capacity>",
                    "moodStabilityPatterns": "<evaluation of emotional balance, mood regulation, psychological wellbeing>",
                    "cognitiveFunctionIndicators": "<assessment of mental clarity, focus, cognitive health patterns>",
                    "purposeAndMeaningAssessment": "<evaluation of life satisfaction, purpose, personal fulfillment>"
                }},
                "lifestyleBehavioralAnalysis": {{
                    "selfCareConsistencyEvaluation": "<assessment of personal care habits, health maintenance behaviors>",
                    "workLifeIntegrationAssessment": "<evaluation of balance, boundaries, stress management in work/life>",
                    "environmentalWellnessFactors": "<analysis of living environment, nature access, environmental stressors>",
                    "personalGrowthOrientation": "<assessment of learning, development, self-improvement habits>",
                    "healthBehaviorSustainability": "<evaluation of long-term health habit maintenance and motivation>"
                }}
            }},
            "riskStratificationAnalysis": {{
                "highPriorityHealthRisks": [
                    "<specific, evidence-based health risks requiring immediate attention with clear rationale>",
                    "<additional high-priority risks based on survey responses and demographic factors>"
                ],
                "emergingHealthConcerns": [
                    "<potential future health issues based on current behavioral patterns>",
                    "<lifestyle-related risks that may develop if current patterns continue>"
                ],
                "protectiveHealthFactors": [
                    "<current behaviors and characteristics that protect against health risks>",
                    "<strengths that support long-term wellness and disease prevention>"
                ],
                "culturalRiskModifiers": [
                    "<{country}-specific factors that may increase or decrease standard risk assessments>"
                ]
            }},
            "keyStrengthsIdentified": [
                "<specific wellness strength with evidence from survey responses and impact explanation>",
                "<additional strength citing specific questions and demonstrating positive health behaviors>",
                "<third strength if applicable, focusing on resilience or positive lifestyle factors>"
            ],
            "priorityDevelopmentAreas": [
                "<highest impact improvement area with specific, actionable recommendations>",
                "<second priority area with clear rationale and suggested interventions>",
                "<third area if significant, focusing on sustainable behavior change>"
            ],
            "culturalContextIntegration": {{
                "countrySpecificHealthLandscape": "<detailed analysis of how {country}'s health environment influences assessment>",
                "culturalStrengthFactors": "<cultural elements that support the individual's wellness journey>",
                "culturalChallengeFactors": "<cultural barriers or challenges that may impact wellness goals>",
                "culturallyAdaptedRecommendations": "<wellness strategies adapted to {country}'s cultural context>"
            }},
            "categorySpecificInsights": {{
                "physicalVitalityDeepDive": "<comprehensive analysis justifying the adjusted physical vitality score, citing specific survey responses and {country} factors, minimum 100 words>",
                "emotionalHealthDeepDive": "<thorough analysis explaining the emotional health score adjustment with specific evidence from responses and cultural factors, minimum 100 words>", 
                "visualAppearanceDeepDive": "<detailed analysis of visual appearance score considering self-perception, lifestyle impacts, and {country} cultural beauty standards, minimum 75 words>"
            }},
            "integrativeWellnessSummary": "<300-400 word comprehensive narrative integrating all assessment domains, highlighting the interconnections between physical, emotional, and lifestyle factors, acknowledging cultural context, and providing an empowering, realistic outlook for wellness optimization. This should read like a professional wellness consultation summary.>"
        }}
        """

    def _parse_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        ENHANCED: Parses the comprehensive JSON response from Gemini with robust validation and error recovery.
        """
        try:
            print(f"Raw Gemini quiz response: {response_text}")
            
            # Handle JSON code blocks or plain JSON
            match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                # Fallback for plain JSON
                match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if not match:
                    print(f"QuizAnalyzer: Could not find JSON in response: {response_text}")
                    return None
                json_str = match.group(0)

            # Check for truncation/malformed JSON and attempt to fix
            if not json_str.strip().endswith('}'):
                print("QuizAnalyzer: Detected truncated JSON, attempting to fix...")
                # Try to close the JSON by finding the last complete field
                try:
                    # Find the last complete quote and close the JSON there
                    json_str = json_str.rstrip()
                    if json_str.endswith(','):
                        json_str = json_str[:-1]  # Remove trailing comma
                    
                    # Try to find the last complete field
                    last_quote = json_str.rfind('"')
                    if last_quote > 0:
                        # Look for the pattern: "key": "value" or "key": number
                        # Find where the last value ends
                        after_quote = json_str[last_quote+1:].lstrip()
                        if after_quote.startswith(':'):
                            # This quote is a key, find its value
                            value_start = json_str.find(':', last_quote) + 1
                            value_part = json_str[value_start:].strip()
                            
                            if value_part.startswith('"'):
                                # String value, find closing quote
                                closing_quote = value_part.find('"', 1)
                                if closing_quote > 0:
                                    json_str = json_str[:value_start + closing_quote + 1]
                            else:
                                # Number or other value, find where it should end
                                # Take everything up to the last meaningful content
                                json_str = json_str.rstrip(' ,\n\r\t')
                    
                    if not json_str.endswith('}'):
                        json_str += '}'
                    
                    # Clean up any remaining issues
                    json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
                    json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
                    
                    print(f"QuizAnalyzer: Attempted to fix truncated JSON")
                except Exception as repair_error:
                    print(f"QuizAnalyzer: JSON repair failed: {repair_error}")
                    return None

            parsed = json.loads(json_str)
            
            # Simplified validation for new schema
            required_fields = ["chronologicalAge", "adjustedScores"]
            
            # Validate required fields exist
            for field in required_fields:
                if field not in parsed:
                    print(f"QuizAnalyzer: Missing required field '{field}'")
                    return None
            
            # Validate adjusted scores structure
            if "adjustedScores" in parsed:
                required_scores = ["physicalVitality", "emotionalHealth", "visualAppearance"]
                for score_key in required_scores:
                    if score_key not in parsed["adjustedScores"]:
                        print(f"QuizAnalyzer: Missing score '{score_key}' in adjustedScores")
                        return None
                    
                    # Ensure scores are numeric and within range
                    score_value = parsed["adjustedScores"][score_key]
                    if isinstance(score_value, str):
                        try:
                            parsed["adjustedScores"][score_key] = float(score_value.replace('%', ''))
                        except ValueError:
                            print(f"Warning: Could not convert score {score_key} to number: {score_value}")
                    
                    # Validate score range (0-100)
                    final_score = parsed["adjustedScores"][score_key]
                    if not isinstance(final_score, (int, float)) or final_score < 0 or final_score > 100:
                        print(f"Warning: Score {score_key} out of range (0-100): {final_score}")
            
            # Coerce numeric fields
            if "chronologicalAge" in parsed and isinstance(parsed["chronologicalAge"], str):
                try:
                    parsed["chronologicalAge"] = int(float(parsed["chronologicalAge"].replace('%','')))
                except ValueError:
                    print(f"Warning: Could not convert chronologicalAge to number: {parsed['chronologicalAge']}")
            
            print("QuizAnalyzer: Successfully parsed quiz analysis JSON")
            return parsed
            
        except json.JSONDecodeError as e:
            print(f"Error parsing quiz analysis response: {e}")
            print(f"Problematic JSON string: {json_str[:300] if 'json_str' in locals() else 'Not extracted'}...")
            
            # Attempt one more aggressive repair
            try:
                if 'json_str' in locals() and json_str:
                    # Try to extract just the essential fields
                    essential_pattern = r'\{\s*"chronologicalAge":\s*\d+,\s*"adjustedScores":\s*\{[^}]+\}'
                    match = re.search(essential_pattern, json_str)
                    if match:
                        minimal_json = match.group(0) + '}'
                        parsed = json.loads(minimal_json)
                        print("QuizAnalyzer: Successfully extracted essential fields")
                        return parsed
            except Exception as final_error:
                print(f"QuizAnalyzer: Final repair attempt failed: {final_error}")
                
        except (IndexError, KeyError) as e:
            print(f"Error parsing quiz analysis response: {e}")
            
        return None

    def _get_fallback_quiz_response(self, base_scores: Dict[str, float], additional_data: Dict[str, Any]) -> Dict[str, Any]:
        """Returns a basic fallback response when quiz analysis fails."""
        return {
            "chronologicalAge": additional_data.get('chronologicalAge', 25),
            "adjustedScores": {
                "physicalVitality": max(50, min(90, base_scores.get('physicalVitality', 70))),
                "emotionalHealth": max(50, min(90, base_scores.get('emotionalHealth', 70))),
                "visualAppearance": max(50, min(90, base_scores.get('visualAppearance', 60)))
            },
            "keyStrengths": [
                "Seeking personal wellness improvement",
                "Taking proactive steps toward health goals"
            ],
            "priorityAreas": [
                "Continue building healthy habits",
                "Focus on consistent wellness practices",
                "Maintain motivation for positive changes"
            ],
            "culturalContext": f"Analysis completed for {additional_data.get('countryOfResidence', 'your location')} with standard wellness principles.",
            "recommendations": {
                "physicalVitality": "Focus on consistent sleep, nutrition, and regular physical activity.",
                "emotionalHealth": "Practice stress management and maintain social connections.",
                "visualAppearance": "Develop healthy self-care routines and positive self-image practices."
            },
            "summary": "Your wellness assessment shows good potential for improvement. Focus on building consistent healthy habits across physical, emotional, and lifestyle areas. Analysis was completed with fallback data due to processing limitations."
        }