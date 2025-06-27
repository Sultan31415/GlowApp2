import traceback
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.schemas import AssessmentRequest, AssessmentResponse, UserAssessmentCreate, UserAssessmentResponse
from app.services.scoring_service import ScoringService
from app.services.ai_service import AIService
from app.data.quiz_data import quiz_data
from app.utils.auth import get_current_user
from app.services.user_service import get_or_create_user, save_user_assessment, get_latest_user_assessment
from app.db.session import SessionLocal, get_db
from sqlalchemy.orm import Session
import logging

# Initialize router
router = APIRouter()

# Initialize services
ai_service = AIService()

logger = logging.getLogger(__name__)

@router.get("/quiz", response_model=List[Dict[str, Any]])
async def get_quiz_data():
    """Return the quiz structure and questions"""
    return quiz_data

@router.post("/assess", response_model=AssessmentResponse)
async def assess_results(
    request: AssessmentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
) -> AssessmentResponse:
    """Analyze quiz results and return assessment. Requires authentication. Also saves the assessment to the database."""
    logger.debug("[DEBUG] User info received from Clerk: %s", user)
    try:
        db_user = get_or_create_user(db, user)  # Should update info if changed
        logger.debug(f"[DEBUG] Saving assessment for user_id: {db_user.id}, clerk_user_id: {user.get('user_id')}")
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

        # --- Save assessment to DB ---
        assessment_create = UserAssessmentCreate(
            overall_glow_score=assessment["overallGlowScore"],
            biological_age=assessment["biologicalAge"],
            emotional_age=assessment["emotionalAge"],
            chronological_age=assessment["chronologicalAge"],
            category_scores=assessment["categoryScores"],
            glowup_archetype=assessment["glowUpArchetype"],
            micro_habits=assessment["microHabits"],
            avatar_urls=assessment.get("avatarUrls"),
            analysis_summary=assessment.get("analysisSummary"),
            detailed_insights=assessment.get("detailedInsightsPerCategory")
        )
        save_user_assessment(db, db_user.id, assessment_create)
        # --- End save ---

        return assessment
        
    except Exception as e:
        logger.error("[ERROR] Exception in /assess endpoint: %s", e)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessment", response_model=UserAssessmentResponse)
async def save_assessment(
    assessment: UserAssessmentCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = get_or_create_user(db, user)
    saved = save_user_assessment(db, db_user.id, assessment)
    return saved

@router.get("/assessment", response_model=UserAssessmentResponse)
async def get_assessment(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = get_or_create_user(db, user)
    assessment = get_latest_user_assessment(db, db_user.id)
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for user.")
    return assessment

@router.get("/results", response_model=AssessmentResponse)
async def get_latest_results(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch the latest saved assessment for the authenticated user, formatted for dashboard display."""
    db_user = get_or_create_user(db, user)
    logger.debug(f"[DEBUG] Fetching assessment for user_id: {db_user.id}, clerk_user_id: {user.get('user_id')}")
    assessment = get_latest_user_assessment(db, db_user.id)
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for user.")

    # Map DB model to AssessmentResponse schema
    return AssessmentResponse(
        overallGlowScore=assessment.overall_glow_score,
        categoryScores=assessment.category_scores,
        biologicalAge=assessment.biological_age,
        emotionalAge=assessment.emotional_age,
        chronologicalAge=assessment.chronological_age,
        glowUpArchetype=assessment.glowup_archetype,
        microHabits=assessment.micro_habits,
        avatarUrls=assessment.avatar_urls or {},
    )

@router.get("/me")
async def ensure_user_in_db(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ensure the current Clerk user exists in the database. Returns basic user info."""
    db_user = get_or_create_user(db, user)
    return {
        "id": db_user.id,
        "user_id": db_user.user_id,
        "email": db_user.email,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "created_at": db_user.created_at,
    }

@router.post("/refresh-user")
async def refresh_user_data(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Force refresh user data from Clerk. Useful for updating users with null email/name data."""
    logger.debug(f"[DEBUG] Refreshing user data for user_id: {user.get('user_id')}")
    logger.debug(f"[DEBUG] User data from Clerk: {user}")
    
    db_user = get_or_create_user(db, user)
    
    return {
        "message": "User data refreshed successfully",
        "user": {
            "id": db_user.id,
            "user_id": db_user.user_id,
            "email": db_user.email,
            "first_name": db_user.first_name,
            "last_name": db_user.last_name,
            "created_at": db_user.created_at,
        }
    } 