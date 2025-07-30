from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String, func, Text
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

class PlanVersionHistory(Base):
    """Track version history of plan changes for backup and restoration"""
    __tablename__ = "plan_version_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("daily_plans.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)  # Sequential version number
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Plan data at this version
    plan_json = Column(JSON, nullable=False)  # Complete plan snapshot
    plan_type = Column(String(32), nullable=False, default="7-day")
    
    # Change tracking
    change_type = Column(String(50), nullable=False)  # "morning_routine", "specific_day", "multi_day", "weekly_challenges", "regenerate"
    change_description = Column(Text, nullable=True)  # Human-readable description of what changed
    changed_fields = Column(JSON, nullable=True)  # Specific fields that were modified
    previous_values = Column(JSON, nullable=True)  # Values before the change
    new_values = Column(JSON, nullable=True)  # Values after the change
    
    # Metadata
    changed_by = Column(String(50), nullable=False, default="user")  # "user", "leo", "system"
    is_active = Column(Integer, nullable=False, default=1)  # 1 = active, 0 = deleted
    
    class Config:
        orm_mode = True 