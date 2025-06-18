from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import traceback
import base64
import uvicorn

# Load environment variables
load_dotenv()

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizAnswer(BaseModel):
    questionId: str
    value: Any
    label: str

class AssessmentRequest(BaseModel):
    answers: List[QuizAnswer]
    photo_url: Optional[str] = None
    chronological_age: Optional[int] = None

def calculate_base_scores(answers: List[QuizAnswer]) -> Dict[str, float]:
    """Calculate base scores from quiz answers"""
    scores = {
        "physicalVitality": 0,
        "emotionalHealth": 0,
        "visualAppearance": 0
    }
    
    # Map questions to categories and their weights
    question_categories = {
        # Daily Vitality & Habits
        "q1": ("physicalVitality", 0.15),  # Sleep quality
        "q2": ("physicalVitality", 0.15),  # Sleep duration
        "q3": ("physicalVitality", 0.1),   # Water intake
        "q4": ("physicalVitality", 0.2),   # Physical activity
        "q5": ("physicalVitality", 0.15),  # Diet
        "q6": ("physicalVitality", 0.1),   # Smoking
        "q7": ("physicalVitality", 0.15),  # Alcohol
        
        # Inner Balance & Connection
        "q8": ("emotionalHealth", 0.2),    # Stress level
        "q9": ("emotionalHealth", 0.2),    # Happiness
        "q10": ("emotionalHealth", 0.15),  # Socializing
        "q11": ("emotionalHealth", 0.25),  # Relationships
        "q12": ("emotionalHealth", 0.2),   # Screen time
        
        # Self-Perception
        "q13": ("visualAppearance", 1.0),  # Self-confidence
    }
    
    # Calculate scores
    for answer in answers:
        if answer.questionId in question_categories:
            category, weight = question_categories[answer.questionId]
            # Convert answer value to a score between 0 and 1
            if isinstance(answer.value, (int, float)):
                score = answer.value / 5.0  # Assuming max value is 5
            else:
                # Handle string values (e.g., smoking status)
                score_mapping = {
                    "never": 1.0,
                    "quit-10+": 0.9,
                    "quit-5-10": 0.8,
                    "quit-1-5": 0.7,
                    "occasionally": 0.4,
                    "daily": 0.1,
                    "rarely-never": 1.0,
                    "couple-per-month": 0.8,
                    "couple-per-week": 0.6,
                    "1-2-per-day": 0.4,
                    "3+-per-day": 0.2,
                }
                score = score_mapping.get(answer.value, 0.5)
            
            scores[category] += score * weight
    
    # Normalize scores to percentages
    for category in scores:
        scores[category] = round(scores[category] * 100)
    
    return scores

def get_ai_analysis(answers: List[QuizAnswer], base_scores: Dict[str, float], chronological_age: Optional[int], photo_url: Optional[str]) -> Dict[str, Any]:
    """Get AI analysis of the assessment results using Gemini"""
    try:
        print(f"Received chronological_age in get_ai_analysis: {chronological_age}")
        print(f"Received photo_url in get_ai_analysis: {photo_url[:50]}..." if photo_url else "No photo_url received")
        
        age_info = ''
        if chronological_age is not None:
            age_info = f"Chronological Age: {chronological_age} years\n\n"

        # Prepare the prompt for Gemini
        text_prompt = f"""
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
        print("Gemini Prompt:", text_prompt)
        
        contents = [text_prompt]
        if photo_url:
            # Decode base64 image and create a GenerativeContent.Part
            try:
                # photo_url is typically 'data:image/png;base64,...' or 'data:image/jpeg;base64,...'
                header, encoded = photo_url.split(',', 1)
                data = base64.b64decode(encoded)
                mime_type = header.split(':')[1].split(';')[0]
                contents.append(genai.upload_file(data, mime_type=mime_type))
                print(f"Image data prepared for Gemini with mime type: {mime_type}")
            except Exception as e:
                print(f"Error processing photo for Gemini: {e}")
                # Continue without image if processing fails

        # Get AI response
        response = model.generate_content(contents)
        print("Raw Gemini Response:", response.text)
        
        # Parse the AI response
        try:
            # Try to parse the response as JSON
            ai_analysis = json.loads(response.text)
            print("Parsed AI Analysis:", json.dumps(ai_analysis, indent=2))
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON from the text
            import re
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                ai_analysis = json.loads(json_match.group())
                print("Extracted and Parsed AI Analysis (from regex):", json.dumps(ai_analysis, indent=2))
            else:
                raise ValueError("Could not parse AI response as JSON")
        
        # Combine base scores with AI analysis
        return {
            "overallGlowScore": ai_analysis["overallGlowScore"],
            "categoryScores": base_scores,
            "biologicalAge": ai_analysis["biologicalAge"],
            "emotionalAge": ai_analysis["emotionalAge"],
            "chronologicalAge": chronological_age if chronological_age is not None else ai_analysis.get("chronologicalAge", 30), # Prioritize actual age, then AI, then default
            "glowUpArchetype": ai_analysis["glowUpArchetype"],
            "microHabits": ai_analysis["microHabits"],
            "avatarUrls": {
                "before": photo_url if photo_url else "https://example.com/before.jpg",  # Use uploaded photo
                "after": "https://example.com/after.jpg" # This would be generated by a separate image gen model
            }
        }
        
    except Exception as e:
        print("Error in get_ai_analysis:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.post("/api/assess")
async def assess_results(request: AssessmentRequest):
    """Analyze quiz results and return assessment"""
    try:
        # Calculate base scores
        base_scores = calculate_base_scores(request.answers)

        # Extract chronological age from answers
        chronological_age = None
        for answer in request.answers:
            if answer.questionId == "q19": # Assuming q19 is the age question
                if isinstance(answer.value, int):
                    chronological_age = answer.value
                break

        # Get AI analysis
        assessment = get_ai_analysis(request.answers, base_scores, chronological_age, request.photo_url)

        return assessment
        
    except Exception as e:
        print("Error in assess_results endpoint:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 