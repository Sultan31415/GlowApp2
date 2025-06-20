import traceback
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.models.schemas import AssessmentRequest, AssessmentResponse
from app.services.scoring_service import ScoringService
from app.services.ai_service import AIService
from app.data.quiz_data import quiz_data

# Initialize router
router = APIRouter()

# Initialize services
ai_service = AIService()


@router.get("/quiz", response_model=List[Dict[str, Any]])
async def get_quiz_data():
    """Return the quiz structure and questions"""
    return quiz_data

@router.post("/assess", response_model=AssessmentResponse)
async def assess_results(request: AssessmentRequest):
    """Analyze quiz results and return assessment"""
    try:
        # Calculate base scores
        base_scores = ScoringService.calculate_base_scores(request.answers)

        # Extract additional data for AI analysis context
        additional_data = ScoringService.extract_additional_data(request.answers)
        
        # Override chronological age if provided directly in the request
        if request.chronological_age is not None:
            additional_data['chronologicalAge'] = request.chronological_age

        # Get AI analysis
        assessment = ai_service.get_ai_analysis(
            answers=request.answers, 
            base_scores=base_scores, 
            additional_data=additional_data, 
            photo_url=request.photo_url
        )

        return assessment
        
    except Exception as e:
        print("Error in assess_results endpoint:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 