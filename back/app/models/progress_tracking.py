from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from app.db.session import Base


class HabitCompletion(Base):
    """Model for tracking daily habit completions"""
    __tablename__ = "habit_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("user_assessments.id"), nullable=True, index=True)
    daily_plan_id = Column(Integer, ForeignKey("daily_plans.id"), nullable=True, index=True)
    habit_type = Column(String(50), nullable=False)  # 'morning_routine', 'system_building', 'deep_focus', 'evening_reflection', 'weekly_challenge'
    habit_content = Column(Text, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    day_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", backref="habit_completions")
    assessment = relationship("UserAssessment", backref="habit_completions")
    daily_plan = relationship("DailyPlan", backref="habit_completions")


class ProgressSnapshot(Base):
    """Model for tracking progress snapshots over time"""
    __tablename__ = "progress_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("user_assessments.id"), nullable=True, index=True)
    snapshot_date = Column(Date, nullable=False)
    overall_glow_score = Column(Integer, nullable=True)
    category_scores = Column(JSON, nullable=True)
    biological_age = Column(Integer, nullable=True)
    emotional_age = Column(Integer, nullable=True)
    chronological_age = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="progress_snapshots")
    assessment = relationship("UserAssessment", backref="progress_snapshots") 