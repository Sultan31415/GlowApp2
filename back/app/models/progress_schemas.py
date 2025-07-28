from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HabitCompletionRequest(BaseModel):
    """Schema for habit completion request"""
    habit_type: str = Field(..., description="Type of habit: morning_routine, system_building, deep_focus, evening_reflection, weekly_challenge")
    habit_content: str = Field(..., description="Content/description of the habit")
    day_date: Optional[date] = Field(default_factory=date.today, description="Date of completion (defaults to today)")
    notes: Optional[str] = Field(None, description="Optional notes about the completion")


class HabitCompletionResponse(BaseModel):
    """Schema for habit completion response"""
    id: int
    user_id: int
    habit_type: str
    habit_content: str
    completed_at: datetime
    day_date: date
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProgressSnapshotRequest(BaseModel):
    """Schema for progress snapshot request"""
    snapshot_date: Optional[date] = Field(default_factory=date.today, description="Date of snapshot (defaults to today)")
    notes: Optional[str] = Field(None, description="Optional notes about the snapshot")


class ProgressSnapshotResponse(BaseModel):
    """Schema for progress snapshot response"""
    id: int
    user_id: int
    snapshot_date: date
    overall_glow_score: Optional[int] = None
    category_scores: Optional[Dict[str, float]] = None
    biological_age: Optional[int] = None
    emotional_age: Optional[int] = None
    chronological_age: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class HabitStreak(BaseModel):
    """Schema for habit streak information"""
    habit_type: str
    current_streak: int
    longest_streak: int
    total_completions: int
    last_completion_date: Optional[date] = None


class ProgressHistoryResponse(BaseModel):
    """Schema for progress history response"""
    habit_completions: List[HabitCompletionResponse]
    progress_snapshots: List[ProgressSnapshotResponse]
    streaks: List[HabitStreak]
    completion_stats: Dict[str, Any]
    progress_trends: Dict[str, Any]


class DailyProgressResponse(BaseModel):
    """Schema for daily progress response"""
    date: date
    completed_habits: List[HabitCompletionResponse]
    total_habits_available: int
    completion_rate: float
    streak_info: Dict[str, int]
    notes: Optional[str] = None


class WeeklyProgressResponse(BaseModel):
    """Schema for weekly progress response"""
    week_start: date
    week_end: date
    daily_progress: List[DailyProgressResponse]
    weekly_completion_rate: float
    weekly_goals_met: int
    weekly_goals_total: int
    streak_improvements: Dict[str, int] 