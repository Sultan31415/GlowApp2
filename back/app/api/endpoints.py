import traceback
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from app.models.schemas import AssessmentRequest, AssessmentResponse, UserAssessmentCreate, UserAssessmentResponse
from app.services.scoring_service import ScoringService, AdvancedScoringService
from app.services.ai_service import AIService
from app.data.quiz_data import quiz_data
from app.utils.auth import get_current_user
from app.services.user_service import get_or_create_user, save_user_assessment, get_latest_user_assessment
from app.db.session import SessionLocal, get_db
from sqlalchemy.orm import Session
import logging
from app.services.future_self_service import FutureSelfService
from app.models.future_projection import FutureProjection
from app.models.future_projection import DailyPlan
from app.services.knowledge_based_plan_service import KnowledgeBasedPlanService

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
    try:
        db_user = get_or_create_user(db, user)  # Should update info if changed
        
        # Initialize advanced scoring service
        scoring_service = AdvancedScoringService()
        
        # Extract demographic data for advanced scoring
        demographics = scoring_service._extract_demographics(request.answers)
        chronological_age = request.chronological_age or demographics.get("age", 30)
        
        # Calculate advanced scores with demographic normalization
        advanced_scores = scoring_service.calculate_advanced_scores(
            answers=request.answers,
            age=chronological_age,
            gender=demographics.get("gender"),
            country=demographics.get("country")
        )
        
        # Calculate overall glow score and biological age estimates
        overall_glow_score = scoring_service.calculate_overall_glow_score(advanced_scores)
        biological_age = scoring_service.estimate_biological_age(
            advanced_scores, chronological_age, request.answers
        )

        # Extract additional data for AI analysis context (backward compatibility)
        additional_data = ScoringService.extract_additional_data(request.answers)
        additional_data['chronologicalAge'] = chronological_age
        additional_data['advancedScores'] = advanced_scores
        additional_data['calculatedGlowScore'] = overall_glow_score
        additional_data['calculatedBiologicalAge'] = biological_age
        # Add user name fields for downstream personalization
        additional_data['first_name'] = db_user.first_name
        additional_data['last_name'] = db_user.last_name

        # Get AI analysis with enhanced data
        assessment = ai_service.get_ai_analysis(
            answers=request.answers, 
            base_scores=advanced_scores,  # Use advanced scores instead of basic ones
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
        assessment_obj = save_user_assessment(db, db_user.id, assessment_create)
        # --- End save ---

        # --- Save dual timeframe projection to DB ---
        future_projection = assessment.get("future_projection")
        if future_projection:
            future_self_service = FutureSelfService()
            future_self_service.save_future_projection(
                user_id=db_user.id,
                assessment_id=assessment_obj.id,
                orchestrator_output=assessment.get("ai_analysis"),
                quiz_insights=assessment.get("quiz_insights"),
                photo_insights=assessment.get("photo_insights"),
                projection_result=future_projection
            )
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
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
    }

@router.post("/refresh-user")
async def refresh_user_data(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Force refresh user data from Clerk. Useful for updating users with null email/name data."""
    db_user = get_or_create_user(db, user)
    
    return {
        "message": "User data refreshed successfully",
        "user": {
            "id": db_user.id,
            "user_id": db_user.user_id,
            "email": db_user.email,
            "first_name": db_user.first_name,
            "last_name": db_user.last_name,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
        }
    }

@router.post("/scoring-analysis")
async def get_detailed_scoring_analysis(
    request: AssessmentRequest,
    user=Depends(get_current_user)
):
    """
    Get detailed scoring analysis without AI processing.
    Useful for understanding how the new scoring system works.
    """
    try:
        scoring_service = AdvancedScoringService()
        
        # Extract demographics
        demographics = scoring_service._extract_demographics(request.answers)
        chronological_age = request.chronological_age or demographics.get("age", 30)
        
        # Calculate raw scores (before demographic adjustments)
        raw_scores = scoring_service._calculate_raw_scores(request.answers)
        
        # Calculate advanced scores (with demographic adjustments)
        advanced_scores = scoring_service.calculate_advanced_scores(
            answers=request.answers,
            age=chronological_age,
            gender=demographics.get("gender"),
            country=demographics.get("country")
        )
        
        # Calculate overall metrics
        overall_glow_score = scoring_service.calculate_overall_glow_score(advanced_scores)
        biological_age = scoring_service.estimate_biological_age(
            advanced_scores, chronological_age, request.answers
        )
        
        # Get country modifiers used
        country_mods = scoring_service.COUNTRY_HEALTH_MODIFIERS.get(
            demographics.get("country", "OTHER"), 
            scoring_service.COUNTRY_HEALTH_MODIFIERS["OTHER"]
        )
        
        # Age adjustments
        age_adjustments = scoring_service._calculate_age_adjustment(chronological_age)
        
        return {
            "demographics": demographics,
            "chronological_age": chronological_age,
            "raw_scores": raw_scores,
            "advanced_scores": advanced_scores,
            "overall_glow_score": overall_glow_score,
            "biological_age": biological_age,
            "adjustments_applied": {
                "country_modifiers": country_mods,
                "age_adjustments": age_adjustments,
                "gender": demographics.get("gender", "other")
            },
            "score_improvements": {
                "physical_vitality": round(advanced_scores["physicalVitality"] - raw_scores["physicalVitality"], 2),
                "emotional_health": round(advanced_scores["emotionalHealth"] - raw_scores["emotionalHealth"], 2),
                "visual_appearance": round(advanced_scores["visualAppearance"] - raw_scores["visualAppearance"], 2)
            }
        }
        
    except Exception as e:
        logger.error("[ERROR] Exception in /scoring-analysis endpoint: %s", e)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scoring-system-info")
async def get_scoring_system_info():
    """
    Get information about the advanced scoring system.
    Useful for understanding the methodology and improvements.
    """
    scoring_service = AdvancedScoringService()
    
    return {
        "system_overview": {
            "name": "Advanced Evidence-Based Scoring System",
            "version": "2.0",
            "total_questions": 17,
            "scored_questions": 14,
            "demographic_questions": 3
        },
        "key_improvements": [
            "Country-specific health baseline adjustments",
            "Age-normalized scoring with exponential decay curves",
            "Gender-specific health factor adjustments", 
            "Impact-weighted question scoring",
            "Non-linear scoring curves for high-impact questions",
            "Advanced biological age estimation",
            "Sophisticated alcohol scoring with J-curve",
            "Exponential tobacco health impact scoring"
        ],
        "category_weights": {
            "overall_glow_score": {
                "physicalVitality": 0.40,
                "emotionalHealth": 0.35,
                "visualAppearance": 0.25
            }
        },
        "supported_countries": list(scoring_service.COUNTRY_HEALTH_MODIFIERS.keys()),
        "age_decline_rates": scoring_service.AGE_DECLINE_RATES,
        "question_categories": {
            qid: {"category": mapping["category"], "weight": mapping["base_weight"]}
            for qid, mapping in scoring_service.CATEGORY_MAPPING.items()
        }
    } 

@router.get("/future-projection")
async def get_future_projection(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch the latest future projection for the authenticated user."""
    db_user = get_or_create_user(db, user)
    
    # Query for the latest future projection for this user
    projection = db.query(FutureProjection).filter(
        FutureProjection.user_id == db_user.id
    ).order_by(FutureProjection.created_at.desc()).first()
    
    if not projection:
        raise HTTPException(status_code=404, detail="No future projection found for user.")
    
    return {
        "id": projection.id,
        "user_id": projection.user_id,
        "assessment_id": projection.assessment_id,
        "created_at": projection.created_at.isoformat(),
        "orchestrator_output": projection.orchestrator_output,
        "quiz_insights": projection.quiz_insights,
        "photo_insights": projection.photo_insights,
        "projection_result": projection.projection_result
    }

@router.post("/generate-future-projection")
async def generate_future_projection(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a future projection for the user's latest assessment if it doesn't exist."""
    try:
        db_user = get_or_create_user(db, user)
        
        # Check if user already has a future projection
        existing_projection = db.query(FutureProjection).filter(
            FutureProjection.user_id == db_user.id
        ).order_by(FutureProjection.created_at.desc()).first()
        
        if existing_projection:
            return {
                "message": "Future projection already exists",
                "projection_id": existing_projection.id,
                "created_at": existing_projection.created_at.isoformat()
            }
        
        # Get the latest assessment
        assessment = get_latest_user_assessment(db, db_user.id)
        if not assessment:
            raise HTTPException(status_code=404, detail="No assessment found for user. Please complete an assessment first.")
        
        # Mock the data structure that would come from a full assessment pipeline
        # This is a simplified version for generating the projection retroactively
        mock_orchestrator_output = {
            "overallGlowScore": assessment.overall_glow_score,
            "adjustedCategoryScores": assessment.category_scores,
            "biologicalAge": assessment.biological_age,
            "emotionalAge": assessment.emotional_age,
            "chronologicalAge": assessment.chronological_age,
            "glowUpArchetype": assessment.glowup_archetype,
            "analysisSummary": assessment.analysis_summary or "Assessment completed successfully."
        }
        
        # Generate the future projection
        future_self_service = FutureSelfService()
        projection_result = await future_self_service.get_dual_timeframe_projection(
            orchestrator_output=mock_orchestrator_output,
            quiz_insights=None,  # Not available from saved assessment
            photo_insights=None  # Not available from saved assessment
        )
        
        # Save the projection
        future_self_service.save_future_projection(
            user_id=db_user.id,
            assessment_id=assessment.id,
            orchestrator_output=mock_orchestrator_output,
            quiz_insights=None,
            photo_insights=None,
            projection_result=projection_result
        )
        
        return {
            "message": "Future projection generated successfully",
            "projection_result": projection_result
        }
        
    except Exception as e:
        logger.error("[ERROR] Exception in /generate-future-projection endpoint: %s", e)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 

@router.post("/generate-daily-plan")
async def generate_daily_plan(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized 7-day daily plan for the user's latest assessment and save it to the database."""
    db_user = get_or_create_user(db, user)
    assessment = get_latest_user_assessment(db, db_user.id)
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for user. Please complete an assessment first.")

    # Prepare the data for the LLM
    orchestrator_output = {
        "overallGlowScore": assessment.overall_glow_score,
        "adjustedCategoryScores": assessment.category_scores,
        "biologicalAge": assessment.biological_age,
        "emotionalAge": assessment.emotional_age,
        "chronologicalAge": assessment.chronological_age,
        "glowUpArchetype": assessment.glowup_archetype,
        "analysisSummary": assessment.analysis_summary or "Assessment completed successfully."
    }
    quiz_insights = None
    photo_insights = None
    user_name = db_user.first_name

    plan_service = KnowledgeBasedPlanService()
    daily_plan = await plan_service.generate_7_day_plan(
        orchestrator_output=orchestrator_output,
        quiz_insights=quiz_insights,
        photo_insights=photo_insights,
        user_name=user_name
    )

    # Save the plan to the database (reuse save_daily_plan from FutureSelfService for now)
    future_self_service = FutureSelfService()
    saved_plan = future_self_service.save_daily_plan(
        user_id=db_user.id,
        assessment_id=assessment.id,
        plan_json=daily_plan,
        plan_type="7-day"
    )

    return {
        "message": "7-day daily plan generated and saved successfully.",
        "plan_id": saved_plan.id,
        "daily_plan": daily_plan
    } 

@router.get("/daily-plan")
async def get_latest_daily_plan(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch the latest saved daily plan for the authenticated user."""
    db_user = get_or_create_user(db, user)
    plan = db.query(DailyPlan).filter(
        DailyPlan.user_id == db_user.id
    ).order_by(DailyPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No daily plan found for user.")

    # The plan_json should be the LLM object (with morningLaunchpad and days)
    return plan.plan_json 