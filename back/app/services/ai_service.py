import google.generativeai as genai
import json
import base64
import traceback
import re
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

from app.models.schemas import QuizAnswer
from app.config.settings import settings

class AIService:
    """Service for AI analysis using Gemini"""
    
    def __init__(self):
        """Initialize Gemini AI service"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    def get_ai_analysis(
        self, 
        answers: List[QuizAnswer], 
        base_scores: Dict[str, float], 
        chronological_age: Optional[int], 
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Get AI analysis of the assessment results using Gemini"""
        try:
            print(f"Received chronological_age in get_ai_analysis: {chronological_age}")
            print(f"Received photo_url in get_ai_analysis: {photo_url[:50]}..." if photo_url else "No photo_url received")
            
            age_info = ''
            if chronological_age is not None:
                age_info = f"Chronological Age: {chronological_age} years\n\n"

            # Prepare the prompt for Gemini
            text_prompt = self._build_prompt(answers, base_scores, age_info)
            print("Gemini Prompt:", text_prompt)
            
            contents = [text_prompt]
            
            # Process photo if provided
            photo_processed = False
            if photo_url:
                photo_part = self._process_photo(photo_url)
                if photo_part is not None:
                    contents.append(photo_part)
                    photo_processed = True
                    print("Photo successfully added to Gemini request")
                else:
                    print("Photo processing failed, continuing without image")
                    # Add note to prompt about photo processing failure
                    photo_note = "\n\nNote: A photo was provided but could not be processed for analysis. Please provide insights based on the quiz answers only."
                    contents[0] = contents[0] + photo_note

            # Get AI response
            response = self.model.generate_content(contents)
            print("Raw Gemini Response:", response.text)
            
            # Parse the AI response
            ai_analysis = self._parse_ai_response(response.text)
            print("Parsed AI Analysis:", json.dumps(ai_analysis, indent=2))
            
            # Combine base scores with AI analysis
            return self._format_response(ai_analysis, base_scores, chronological_age, photo_url)
            
        except Exception as e:
            print("Error in get_ai_analysis:", traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    def _build_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], age_info: str) -> str:
        """Build the prompt for Gemini AI"""
        return f"""
        You are an expert wellness and personal development coach. Analyze these assessment results and provide insights.
        
        Base Scores:
        - Physical Vitality: {base_scores['physicalVitality']}%
        - Emotional Health: {base_scores['emotionalHealth']}%
        - Visual Appearance: {base_scores['visualAppearance']}%
        
        Detailed Answers:
        {json.dumps([{"questionId": a.questionId, "value": a.value, "label": a.label} for a in answers], indent=2)}
        
        {age_info}
        Please provide a JSON response with the following structure:
        {{
            "overallGlowScore": <number between 0-100>,
            "biologicalAge": <estimated biological age>,
            "emotionalAge": <estimated emotional age>,
            "chronologicalAge": <actual chronological age as a number>,
            "glowUpArchetype": {{
                "name": "<archetype name>",
                "description": "<detailed description>"
            }},
            "microHabits": [
                "<specific habit 1>",
                "<specific habit 2>",
                "<specific habit 3>",
                "<specific habit 4>",
                "<specific habit 5>"
            ]
        }}

        Make sure to:
        1. Calculate overallGlowScore based on the base scores and answers
        2. Estimate biological age considering physical vitality and lifestyle factors
        3. Estimate emotional age based on emotional health and relationship patterns
        4. Create a meaningful archetype name and description
        5. Provide specific, actionable micro-habits
        6. For chronologicalAge, use the provided chronological age if available, otherwise make a reasonable guess.
        """
    
    def _process_photo(self, photo_url: str):
        """Process photo for Gemini AI"""
        try:
            # photo_url is typically 'data:image/png;base64,...' or 'data:image/jpeg;base64,...'
            header, encoded = photo_url.split(',', 1)
            data = base64.b64decode(encoded)
            mime_type = header.split(':')[1].split(';')[0]
            
            print(f"Processing photo with mime type: {mime_type}")
            print(f"Decoded data size: {len(data)} bytes")
            
            # Create a temporary file
            import tempfile
            import os
            
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
                file_part = genai.upload_file(tmp_file_path, mime_type=mime_type)
                print(f"Photo successfully uploaded to Gemini")
                return file_part
            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_file_path)
                except:
                    pass  # Ignore cleanup errors
            
        except Exception as e:
            print(f"Error processing photo for Gemini: {e}")
            return None
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and extract JSON"""
        try:
            # Try to parse the response as JSON
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON from the text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not parse AI response as JSON")
    
    def _format_response(
        self, 
        ai_analysis: Dict[str, Any], 
        base_scores: Dict[str, float], 
        chronological_age: Optional[int], 
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Format the final response"""
        return {
            "overallGlowScore": ai_analysis["overallGlowScore"],
            "categoryScores": base_scores,
            "biologicalAge": ai_analysis["biologicalAge"],
            "emotionalAge": ai_analysis["emotionalAge"],
            "chronologicalAge": chronological_age if chronological_age is not None else ai_analysis.get("chronologicalAge", settings.DEFAULT_AGE),
            "glowUpArchetype": ai_analysis["glowUpArchetype"],
            "microHabits": ai_analysis["microHabits"],
            "avatarUrls": {
                "before": photo_url if photo_url else settings.DEFAULT_AVATAR_BEFORE,
                "after": settings.DEFAULT_AVATAR_AFTER
            }
        } 