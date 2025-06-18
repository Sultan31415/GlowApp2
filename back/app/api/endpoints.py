import traceback
from fastapi import APIRouter, HTTPException
from app.models.schemas import AssessmentRequest, AssessmentResponse
from app.services.scoring_service import ScoringService
from app.services.ai_service import AIService

# Initialize router
router = APIRouter()

# Initialize services
ai_service = AIService()

@router.post("/assess", response_model=AssessmentResponse)
async def assess_results(request: AssessmentRequest):
    """Analyze quiz results and return assessment"""
    try:
        # Calculate base scores
        base_scores = ScoringService.calculate_base_scores(request.answers)

        # Extract chronological age from answers
        chronological_age = ScoringService.extract_chronological_age(request.answers)
        
        # Use provided chronological age if available
        if request.chronological_age is not None:
            chronological_age = request.chronological_age

        # Get AI analysis
        assessment = ai_service.get_ai_analysis(
            request.answers, 
            base_scores, 
            chronological_age, 
            request.photo_url
        )

        return assessment
        
    except Exception as e:
        print("Error in assess_results endpoint:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 