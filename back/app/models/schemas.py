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