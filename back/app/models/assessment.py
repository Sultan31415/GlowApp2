from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserAssessment(Base):
    __tablename__ = "user_assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Core assessment fields
    overall_glow_score = Column(Integer, nullable=False)
    biological_age = Column(Integer, nullable=False)
    emotional_age = Column(Integer, nullable=False)
    chronological_age = Column(Integer, nullable=False)
    # JSON fields for flexible data
    category_scores = Column(JSON, nullable=False)
    glowup_archetype = Column(JSON, nullable=False)
    micro_habits = Column(JSON, nullable=False)
    avatar_urls = Column(JSON, nullable=True)
    analysis_summary = Column(String, nullable=True)
    detailed_insights = Column(JSON, nullable=True)
    quiz_answers = Column(JSON, nullable=True)

    user = relationship("User", backref="assessments") 