import google.generativeai as genai
from app.config.settings import settings
from app.models.schemas import QuizAnswer
from typing import List, Dict, Any, Optional
import json
import re

class QuizAnalyzerGemini:
    """Agent for analyzing quiz/health data using Gemini."""
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def analyze_quiz(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Analyze quiz answers and health metrics, return structured quiz insights (JSON).
        """
        try:
            prompt = self._build_prompt(answers, base_scores, additional_data, question_map)
            # Use a consistent generation configuration for reliable metrics
            generation_config = genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.9,
                candidate_count=1,
                max_output_tokens=1024
            )
            response = self.model.generate_content([prompt], generation_config=generation_config)
            return self._parse_response(response.text)
        except Exception as e:
            print(f"QuizAnalyzerGemini error: {e}")
            return None

    def _build_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any], question_map: Dict[str, Dict[str, Any]]) -> str:
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
            else:
                detailed_answers_context.append({
                    "questionId": ans.questionId, "questionText": f"Unknown Question: {ans.questionId}",
                    "selectedValue": ans.value, "selectedLabel": ans.label
                })
        detailed_answers_json = json.dumps(detailed_answers_context, indent=2)

        country = additional_data.get('countryOfResidence', 'Not provided')
        if country and country.lower() != 'not provided':
            country_specific_guidance = f"""**Crucial Context: The user is from {country}.**
When analyzing every relevant question and providing recommendations, you must infer and apply considerations based on {country}'s context (cultural, lifestyle, climate, nutrition, health risks, and healthcare norms). Integrate these insights deeply into your analysis."""
        else:
            country_specific_guidance = "No specific country of residence provided. Base analysis on general global wellness trends."

        # Prompt modeled after the legacy AIService template for deeper, more accurate reasoning
        return f"""
You are an extremely knowledgeable and empathetic expert wellness and personal development coach. Your primary goal is to provide a comprehensive, highly personalized, and actionable analysis of the user's wellness assessment results. Leverage all provided data points for a nuanced understanding. Do NOT reference any photo or visual data.

--- User's General Profile ---
{user_profile_str}
{health_metrics_info}

--- Overall Wellness Scores ---
- Physical Vitality: {base_scores['physicalVitality']}%
- Emotional Health: {base_scores['emotionalHealth']}%
- Visual Appearance: {base_scores['visualAppearance']}%

--- Detailed Assessment Answers (JSON) ---
{detailed_answers_json}

--- Specific Contextual Guidance ---
{country_specific_guidance}

IMPORTANT:
- Your response MUST be a single, valid JSON object and nothing else.
- Do NOT include any explanations, markdown, comments, or text before or after the JSON.
- Do NOT use trailing commas or any non-JSON syntax.
- Double-check that your output is valid JSON and can be parsed by Python's json.loads().
- If you are unsure, err on the side of strict JSON compliance.

--- Detailed Instructions for Your Analysis ---
You MUST provide a JSON response with EXACTLY the following structure. Each section should be richly detailed and directly reflective of the provided data:

{{
    "chronologicalAge": {additional_data.get('chronologicalAge', 'null')},
    "keyStrengths": [
        "<Identify a key strength with justification, explicitly citing question IDs and answers.>",
        "<Another key strength...>"
    ],
    "keyRisks": [
        "<Identify a key risk or area for improvement with justification, citing question IDs and answers.>",
        "<Another key risk...>"
    ],
    "categorySpecificInsights": {{
        "physicalVitality": "<Thorough insight synthesizing questions q1–q7, q17–q20 and health metrics. Compare to norms in {country}>.",
        "emotionalHealth": "<Insight synthesizing questions q8–q12 and related metrics.>",
        "visualAppearance": "<Insight interpreting q13 and any self-perception indicators.>"
    }},
    "quizDataSummary": "<200–300-word narrative weaving together all quiz answers, health metrics, and {country} context. End with an encouraging, empowering tone.>"
}}
"""

    def _parse_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        Parses the JSON response from Gemini, resilient to markdown code blocks.
        """
        try:
            # Gemini often wraps JSON in ```json ... ```
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
            
            parsed = json.loads(json_str)
            # Coerce numeric fields into numbers if they are strings
            for num_key in ["chronologicalAge"]:
                if num_key in parsed and isinstance(parsed[num_key], str):
                    try:
                        parsed[num_key] = float(parsed[num_key].replace('%',''))
                    except ValueError:
                        pass
            return parsed
        except json.JSONDecodeError as e:
            # Attempt to clean common issues such as trailing commas and parse again
            try:
                cleaned_json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
                parsed = json.loads(cleaned_json_str)
                # Apply numeric coercion again
                for num_key in ["chronologicalAge"]:
                    if num_key in parsed and isinstance(parsed[num_key], str):
                        try:
                            parsed[num_key] = float(parsed[num_key].replace('%', ''))
                        except ValueError:
                            pass
                print("QuizAnalyzer: Successfully parsed JSON after trailing comma cleanup.")
                return parsed
            except json.JSONDecodeError as e2:
                print(f"Error parsing quiz analysis response after cleanup attempt: {e2}")
            except Exception as e_generic:
                print(f"Unexpected error during cleanup parsing: {e_generic}")
        except (IndexError) as e:
            print(f"Error parsing quiz analysis response: {e}")
        return None