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
            response = self.model.generate_content([prompt])
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
        country_specific_guidance = f"**Context: The user is from {country}.** Consider this in your analysis." if country and country.lower() != 'not provided' else "No specific country provided."

        return f"""
        You are a wellness assessment expert. Analyze the following quiz and health data. Do NOT reference any photo or visual data.
        Your output MUST be a single JSON object. Do not include any text before or after the JSON, including markdown tags.

        --- User's General Profile ---
        {user_profile_str}
        {health_metrics_info}

        --- Overall Wellness Scores ---
        - Physical Vitality: {base_scores['physicalVitality']}% 
        - Emotional Health: {base_scores['emotionalHealth']}% 
        - Visual Appearance: {base_scores['visualAppearance']}% 

        --- Detailed Assessment Answers ---
        {detailed_answers_json}

        --- Context ---
        {country_specific_guidance}

        --- Instructions ---
        Based ONLY on the data above, return a JSON object with the following schema:
        {{
            "chronologicalAge": {additional_data.get('chronologicalAge', 'null')},
            "keyStrengths": [
                "<string, identify a key strength from the data with justification>",
                "<string, identify another key strength>"
            ],
            "keyRisks": [
                "<string, identify a key risk or area for improvement from the data with justification>",
                "<string, identify another key risk>"
            ],
            "categorySpecificInsights": {{
                "physicalVitality": "<string, summary of insights for this category based on quiz/health data>",
                "emotionalHealth": "<string, summary of insights for this category based on quiz/health data>",
                "visualAppearance": "<string, summary of insights for this category based on quiz/health data>"
            }},
            "quizDataSummary": "<string, a brief narrative summarizing the overall wellness picture from the quiz and health metrics>"
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
            
            return json.loads(json_str)
        except (json.JSONDecodeError, IndexError) as e:
            print(f"Error parsing quiz analysis response: {e}")
            return None 