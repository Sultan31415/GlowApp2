import google.generativeai as genai
import json
import base64
import traceback
import re
import os
import tempfile
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

from app.models.schemas import QuizAnswer
from app.config.settings import settings
# Assuming quiz_data is directly importable or passed into the service
# For this example, let's assume it's available globally or passed in during initialization.
from app.data.quiz_data import quiz_data # This is essential now!

class AIService:
    """Service for AI analysis using Gemini."""
    
    def __init__(self):
        """Initialize Gemini AI service."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        # Pre-process quiz_data for easy lookup by question ID
        self.question_map = self._build_question_map(quiz_data)
    
    def _build_question_map(self, q_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Builds a map from question ID to its full question details."""
        q_map = {}
        for section in q_data:
            for question in section['questions']:
                q_map[question['id']] = question
        return q_map

    def get_ai_analysis(
        self, 
        answers: List[QuizAnswer], 
        base_scores: Dict[str, float], 
        additional_data: Dict[str, Any], # Contains chronologicalAge, biologicalSex, countryOfResidence, health metrics
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Get AI analysis of the assessment results using Gemini."""
        try:
            print(f"Received chronological_age in get_ai_analysis: {additional_data.get('chronologicalAge')}")
            print(f"Received photo_url in get_ai_analysis: {photo_url[:50]}..." if photo_url else "No photo_url received")
            
            # Prepare the prompt for Gemini
            text_prompt = self._build_prompt(answers, base_scores, additional_data)
            print("Gemini Prompt (first 1000 chars):", text_prompt[:1000]) # Print truncated prompt for logs
            
            contents = [text_prompt]
            
            # Process photo if provided
            if photo_url:
                photo_part = self._process_photo(photo_url)
                if photo_part is not None:
                    contents.append(photo_part)
                    print("Photo successfully added to Gemini request")
                else:
                    print("Photo processing failed, continuing without image")
                    # Add note to prompt about photo processing failure
                    photo_note = "\n\nNote: A photo was provided but could not be processed for analysis. Please provide insights based on the quiz answers and provided data only."
                    contents[0] = contents[0] + photo_note

            # Get AI response
            response = self.model.generate_content(contents)
            print("Raw Gemini Response:", response.text)
            
            # Parse the AI response
            ai_analysis = self._parse_ai_response(response.text)
            print("Parsed AI Analysis:", json.dumps(ai_analysis, indent=2))
            
            # Combine base scores with AI analysis and additional data
            return self._format_response(ai_analysis, base_scores, additional_data.get('chronologicalAge'), photo_url)
            
        except Exception as e:
            print("Error in get_ai_analysis:", traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    def _build_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any]) -> str:
        """
        Builds the comprehensive prompt for the Gemini AI based on all available user data.
        """
        # --- Data Preparation ---
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
            q_detail = self.question_map.get(ans.questionId)
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
            When analyzing *every relevant question* and providing recommendations, you must infer and apply considerations based on {country}'s context (cultural, lifestyle, climate, nutrition, health risks, and healthcare norms). Integrate these insights deeply into your analysis."""
        else:
            country_specific_guidance = "No specific country of residence provided. Base analysis on general global wellness trends."

        # --- Prompt Template using .format() for Safety and Clarity ---
        # Note: Literal braces are escaped by doubling them (e.g., {{). Single braces are for placeholders.
        prompt_template = """You are an extremely knowledgeable and empathetic expert wellness and personal development coach. Your primary goal is to provide a comprehensive, highly personalized, and actionable analysis of the user's wellness assessment results. Leverage *all* provided data points for a nuanced understanding.

--- User's General Profile ---
{user_profile}
{health_metrics}

--- Overall Wellness Scores ---
- Physical Vitality: {physical_vitality_score}%
- Emotional Health: {emotional_health_score}%
- Visual Appearance: {visual_appearance_score}%

--- Detailed Assessment Answers ---
{detailed_answers}

--- Specific Contextual Guidance ---
{country_guidance}

--- Detailed Instructions for Your Analysis ---
You MUST provide a JSON response with the following structure. Each section should be richly detailed and directly reflective of the provided data:

{{
    "overallGlowScore": <number between 0-100, calculated holistically. Explain in summary.>,
    "biologicalAge": <estimated biological age. Justify based on physical vitality, health metrics, and lifestyle factors.>,
    "emotionalAge": <estimated emotional age. Justify based on emotional health, relationships, stress, and happiness.>,
    "chronologicalAge": {chronological_age},
    "glowUpArchetype": {{
        "name": "<Creative, inspiring archetype name capturing user's state and potential.>",
        "description": "<Detailed, empathetic description (150-250 words) synthesizing all data (scores, answers, metrics, context).>"
    }},
    "microHabits": [
        "<**1. Specific, Actionable Habit:** Connect to a specific quiz answer/metric. Make it quantifiable. Consider country context: If from {country}, is this habit feasible?>",
        "<**2. Specific, Actionable Habit:** (as above)>",
        "<**3. Specific, Actionable Habit:** (as above)>",
        "<**4. Specific, Actionable Habit:** (as above)>",
        "<**5. Specific, Actionable Habit:** (as above)>"
    ],
    "analysisSummary": "<Comprehensive narrative (200-400 words). Explain scores, integrate detailed answers, health metrics, and context ({country}). End with an empowering message.>",
    "detailedInsightsPerCategory": {{
        "physicalVitalityInsights": [
            "<Analyze q1-q7, q17-q20. For each, state question, answer, and interpretation. E.g., 'Your 8+ glasses of water (q3) is excellent.' or 'Occasional smoking (q6) is a key area for improvement.' Compare to norms in {country}.>",
            "<Insight 2 for Physical Vitality>",
            "<Insight 3 for Physical Vitality>"
        ],
        "emotionalHealthInsights": [
            "<Analyze q8-q12. For each, state question, answer, and interpretation. E.g., 'High stress (q8) suggests need for management techniques.' Compare to norms in {country}.>",
            "<Insight 2 for Emotional Health>",
            "<Insight 3 for Emotional Health>"
        ],
        "visualAppearanceInsights": [
            "<Analyze q13. State question, answer, and interpretation of self-perception. Compare to norms in {country}.>"
        ]
    }}
}}

Ensure all estimations are precise and justified. Micro-habits must be hyper-specific. The analysis must be a personalized, empathetic narrative using all context, especially the country.
"""
        
        # --- Final Assembly ---
        return prompt_template.format(
            user_profile=user_profile_str,
            health_metrics=health_metrics_info,
            physical_vitality_score=base_scores['physicalVitality'],
            emotional_health_score=base_scores['emotionalHealth'],
            visual_appearance_score=base_scores['visualAppearance'],
            detailed_answers=detailed_answers_json,
            country_guidance=country_specific_guidance,
            chronological_age=additional_data.get('chronologicalAge', '"Not provided"'),
            country=country
        )

    def _process_photo(self, photo_url: str):
        """Process photo for Gemini AI"""
        try:
            # photo_url is typically 'data:image/png;base64,...' or 'data:image/jpeg;base64,...'
            header, encoded = photo_url.split(',', 1)
            data = base64.b64decode(encoded)
            mime_type = header.split(':')[1].split(';')[0]
            
            print(f"Processing photo with mime type: {mime_type}")
            
            # Determine file extension from mime type
            if 'png' in mime_type:
                suffix = '.png'
            elif 'jpeg' in mime_type or 'jpg' in mime_type:
                suffix = '.jpg'
            else:
                suffix = '.jpg'  # default
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(data)
                tmp_file_path = tmp_file.name
            
            try:
                # Use a specific file name for Gemini, though tempfile already handles uniqueness
                file_part = genai.upload_file(tmp_file_path, mime_type=mime_type, display_name=f"user_photo_{os.path.basename(tmp_file_path)}")
                print(f"Photo successfully uploaded to Gemini: {file_part.uri}")
                return file_part
            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_file_path)
                except Exception as e:
                    print(f"Error cleaning up temp file {tmp_file_path}: {e}")
            
        except Exception as e:
            print(f"Error processing photo for Gemini: {e}")
            return None
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response, extract JSON, and ensure a valid structure is always returned.
        This function is designed to be resilient to malformed AI responses.
        """
        
        def _validate_and_default(parsed: Dict[str, Any]) -> Dict[str, Any]:
            """Ensures all required keys exist in the parsed dictionary, providing defaults if not."""
            required_toplevel_keys = ["overallGlowScore", "biologicalAge", "emotionalAge", "chronologicalAge", "glowUpArchetype", "microHabits", "analysisSummary", "detailedInsightsPerCategory"]
            for key in required_toplevel_keys:
                if key not in parsed:
                    print(f"Warning: Missing critical top-level key '{key}' in AI response. Providing default.")
                    if key == "glowUpArchetype":
                        parsed[key] = {"name": "Undefined Archetype", "description": "No description provided."}
                    elif key == "microHabits":
                        parsed[key] = []
                    elif key == "overallGlowScore":
                        parsed[key] = 0
                    elif key == "detailedInsightsPerCategory":
                        parsed[key] = {"physicalVitalityInsights": [], "emotionalHealthInsights": [], "visualAppearanceInsights": []}
                    else:
                        parsed[key] = None
            
            if "glowUpArchetype" in parsed and (
                "name" not in parsed["glowUpArchetype"] or "description" not in parsed["glowUpArchetype"]
            ):
                print("Warning: Missing name or description in glowUpArchetype. Providing defaults.")
                parsed["glowUpArchetype"]["name"] = parsed["glowUpArchetype"].get("name", "Undefined Archetype")
                parsed["glowUpArchetype"]["description"] = parsed["glowUpArchetype"].get("description", "No description provided.")
            return parsed

        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                print(f"Warning: Could not find any JSON-like structure in AI response. Raw text was: {response_text}")
                return _validate_and_default({})

            json_str = json_match.group()
            parsed_data = json.loads(json_str)
            return _validate_and_default(parsed_data)

        except json.JSONDecodeError:
            print(f"Error: Failed to parse JSON from AI response. Raw text was: {response_text}")
            return _validate_and_default({})
        except Exception as e:
            print(f"An unexpected error occurred during AI response parsing: {e}")
            return _validate_and_default({})
    
    def _format_response(
        self, 
        ai_analysis: Dict[str, Any], 
        base_scores: Dict[str, float], 
        chronological_age: Optional[int], # This is the original chronological age from additional_data
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Format the final response, including all new AI analysis fields."""
        
        # Use the chronologicalAge from the input if provided, otherwise fall back to AI's guess or default
        final_chronological_age = chronological_age if chronological_age is not None else ai_analysis.get("chronologicalAge", settings.DEFAULT_AGE)

        return {
            "overallGlowScore": ai_analysis.get("overallGlowScore", 0), # Provide default for safety
            "categoryScores": base_scores,
            "biologicalAge": ai_analysis.get("biologicalAge", final_chronological_age), # Default to chronological if AI fails
            "emotionalAge": ai_analysis.get("emotionalAge", final_chronological_age),   # Default to chronological if AI fails
            "chronologicalAge": final_chronological_age,
            "glowUpArchetype": ai_analysis.get("glowUpArchetype", {"name": "Unknown", "description": "No archetype provided."}),
            "microHabits": ai_analysis.get("microHabits", []),
            "analysisSummary": ai_analysis.get("analysisSummary", "A comprehensive summary of your wellness journey will be provided here based on a detailed AI analysis."),
            "detailedInsightsPerCategory": ai_analysis.get("detailedInsightsPerCategory", {
                "physicalVitalityInsights": [],
                "emotionalHealthInsights": [],
                "visualAppearanceInsights": []
            }), # New field for granular insights
            "avatarUrls": {
                "before": photo_url if photo_url else settings.DEFAULT_AVATAR_BEFORE,
                "after": settings.DEFAULT_AVATAR_AFTER
            }
        }