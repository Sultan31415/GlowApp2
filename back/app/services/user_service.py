from sqlalchemy.orm import Session
from app.models.user import User
from app.models.assessment import UserAssessment
from app.models.schemas import UserAssessmentCreate

def get_or_create_user(db: Session, user_info: dict):
    user = db.query(User).filter(User.user_id == user_info["user_id"]).first()
    if not user:
        user = User(
            user_id=user_info["user_id"],
            email=user_info.get("email"),
            first_name=user_info.get("first_name"),
            last_name=user_info.get("last_name"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if user.email != user_info.get("email"):
            user.email = user_info.get("email")
            updated = True
        if user.first_name != user_info.get("first_name"):
            user.first_name = user_info.get("first_name")
            updated = True
        if user.last_name != user_info.get("last_name"):
            user.last_name = user_info.get("last_name")
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
    return user

def save_user_assessment(db: Session, user_id: int, assessment_data: UserAssessmentCreate):
    assessment = UserAssessment(
        user_id=user_id,
        overall_glow_score=assessment_data.overall_glow_score,
        biological_age=assessment_data.biological_age,
        emotional_age=assessment_data.emotional_age,
        chronological_age=assessment_data.chronological_age,
        category_scores=assessment_data.category_scores,
        glowup_archetype=assessment_data.glowup_archetype,
        micro_habits=assessment_data.micro_habits,
        avatar_urls=assessment_data.avatar_urls,
        analysis_summary=assessment_data.analysis_summary,
        detailed_insights=assessment_data.detailed_insights,
        quiz_answers=assessment_data.quiz_answers,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

def get_latest_user_assessment(db: Session, user_id: int):
    return db.query(UserAssessment).filter(UserAssessment.user_id == user_id).order_by(UserAssessment.created_at.desc()).first()