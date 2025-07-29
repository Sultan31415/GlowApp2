from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserPreferences(Base):
    """Model for storing user preferences and custom habits"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Custom habits and routines
    custom_morning_routine = Column(JSON, nullable=True)  # List of custom morning activities
    custom_evening_routine = Column(JSON, nullable=True)  # List of custom evening activities
    custom_habits = Column(JSON, nullable=True)  # List of custom habits with triggers/actions/rewards
    
    # Preferences
    preferred_wake_time = Column(String(10), nullable=True)  # e.g., "05:30"
    preferred_sleep_time = Column(String(10), nullable=True)  # e.g., "22:00"
    preferred_exercise_time = Column(String(20), nullable=True)  # e.g., "morning", "afternoon", "evening"
    preferred_exercise_intensity = Column(String(20), nullable=True)  # e.g., "beginner", "intermediate", "advanced"
    
    # Lifestyle preferences
    work_schedule = Column(JSON, nullable=True)  # Work hours, days off, etc.
    family_obligations = Column(JSON, nullable=True)  # Family commitments, childcare, etc.
    dietary_preferences = Column(JSON, nullable=True)  # Dietary restrictions, preferences
    cultural_context = Column(JSON, nullable=True)  # Cultural background, traditions
    
    # Wellness goals and focus areas
    primary_goals = Column(JSON, nullable=True)  # List of primary wellness goals
    focus_areas = Column(JSON, nullable=True)  # Areas they want to focus on
    avoid_areas = Column(JSON, nullable=True)  # Areas they want to avoid or struggle with
    
    # Communication preferences
    preferred_motivation_style = Column(String(20), nullable=True)  # e.g., "encouraging", "challenging", "gentle"
    preferred_planning_style = Column(String(20), nullable=True)  # e.g., "detailed", "flexible", "structured"
    
    # Relationships
    user = relationship("User", backref="preferences")

class CustomHabit(Base):
    """Model for storing user-created custom habits"""
    __tablename__ = "custom_habits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Habit details
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), nullable=False)  # e.g., "physical", "mental", "social", "spiritual"
    
    # Atomic Habits structure
    trigger = Column(String(200), nullable=True)  # What triggers this habit
    action = Column(String(200), nullable=False)  # What action to take
    reward = Column(String(200), nullable=True)  # What reward to give
    
    # Difficulty and frequency
    difficulty_level = Column(String(20), nullable=True)  # e.g., "easy", "medium", "hard"
    frequency = Column(String(20), nullable=True)  # e.g., "daily", "weekly", "monthly"
    estimated_duration = Column(String(20), nullable=True)  # e.g., "5 minutes", "30 minutes"
    
    # Status
    is_active = Column(String(10), nullable=False, default="active")  # "active", "inactive", "completed"
    last_completed = Column(DateTime(timezone=True), nullable=True)
    completion_count = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", backref="custom_habits") 