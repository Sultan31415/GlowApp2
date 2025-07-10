from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String, func
from app.db.session import Base

class FutureProjection(Base):
    __tablename__ = "future_projections"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("user_assessments.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    orchestrator_output = Column(JSON, nullable=False)
    quiz_insights = Column(JSON, nullable=True)
    photo_insights = Column(JSON, nullable=True)
    projection_result = Column(JSON, nullable=False) 
    weekly_plan = Column(JSON, nullable=True)  # Structured 4-week plan 

class DailyPlan(Base):
    __tablename__ = "daily_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("user_assessments.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    plan_type = Column(String(32), nullable=False, default="7-day")
    plan_json = Column(JSON, nullable=False)  # The actual daily plan JSON 