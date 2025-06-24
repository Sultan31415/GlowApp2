from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class QuizAnswer(BaseModel):
    """Schema for individual quiz answer"""
    questionId: str
    value: Any
    label: str

class AssessmentRequest(BaseModel):
    """Schema for assessment request"""
    answers: List[QuizAnswer]
    photo_url: Optional[str] = None
    chronological_age: Optional[int] = None

class GlowUpArchetype(BaseModel):
    """Schema for glow up archetype"""
    name: str
    description: str

class AssessmentResponse(BaseModel):
    """Schema for assessment response"""
    overallGlowScore: int
    categoryScores: Dict[str, float]
    biologicalAge: int
    emotionalAge: int
    chronologicalAge: int
    glowUpArchetype: GlowUpArchetype
    microHabits: List[str]
    avatarUrls: Dict[str, str]

class UserAssessmentCreate(BaseModel):
    overall_glow_score: int
    biological_age: int
    emotional_age: int
    chronological_age: int
    category_scores: Dict[str, float]
    glowup_archetype: Dict[str, str]
    micro_habits: List[str]
    avatar_urls: Optional[Dict[str, str]] = None
    analysis_summary: Optional[str] = None
    detailed_insights: Optional[Dict[str, Any]] = None

class UserAssessmentResponse(UserAssessmentCreate):
    id: int
    created_at: str

    class Config:
        orm_mode = True 