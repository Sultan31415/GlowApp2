from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    AI = "ai"

class MessageType(str, Enum):
    GREETING = "greeting"
    QUESTION = "question"
    ANSWER = "answer"
    WELLNESS_TIP = "wellness_tip"
    CONCERN = "concern"
    CELEBRATION = "celebration"
    REFLECTION = "reflection"
    GENERAL = "general"

class WellnessDomain(str, Enum):
    PHYSICAL = "physical"
    EMOTIONAL = "emotional"
    MENTAL = "mental"
    SOCIAL = "social"
    SPIRITUAL = "spiritual"
    GENERAL = "general"

class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ChatMessage(BaseModel):
    """Pydantic model for chat messages"""
    id: Optional[int] = None
    user_id: str
    session_id: str
    role: MessageRole
    content: str
    timestamp: datetime
    message_type: Optional[MessageType] = MessageType.GENERAL
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0)
    topic_tags: Optional[List[str]] = []
    wellness_domain: Optional[WellnessDomain] = WellnessDomain.GENERAL
    urgency_level: Optional[UrgencyLevel] = UrgencyLevel.LOW
    requires_followup: Optional[bool] = False

class UserProfile(BaseModel):
    """Pydantic model for user profile data"""
    id: int
    user_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime
    member_since_days: Optional[int] = None

class CategoryScores(BaseModel):
    """Pydantic model for wellness category scores"""
    physicalVitality: float = Field(..., ge=0, le=100)
    emotionalHealth: float = Field(..., ge=0, le=100)
    visualAppearance: float = Field(..., ge=0, le=100)

class GlowUpArchetype(BaseModel):
    """Pydantic model for user archetype"""
    name: str
    description: str
    characteristics: Optional[List[str]] = []

class UserAssessment(BaseModel):
    """Pydantic model for user assessment data"""
    id: int
    user_id: int
    created_at: datetime
    overall_glow_score: int = Field(..., ge=0, le=100)
    biological_age: int
    emotional_age: int
    chronological_age: int
    category_scores: CategoryScores
    glowup_archetype: GlowUpArchetype
    micro_habits: List[str] = []
    analysis_summary: Optional[str] = None
    detailed_insights: Optional[Dict[str, Any]] = None

class DailyPlan(BaseModel):
    """Pydantic model for daily plan data"""
    id: int
    user_id: int
    assessment_id: Optional[int] = None
    created_at: datetime
    plan_type: str = "7-day"
    plan_json: Dict[str, Any]

class FutureProjection(BaseModel):
    """Pydantic model for future projection data"""
    id: int
    user_id: int
    assessment_id: Optional[int] = None
    created_at: datetime
    orchestrator_output: Dict[str, Any]
    quiz_insights: Optional[Dict[str, Any]] = None
    photo_insights: Optional[Dict[str, Any]] = None
    projection_result: Dict[str, Any]
    weekly_plan: Optional[Dict[str, Any]] = None

class ConversationContext(BaseModel):
    """Pydantic model for conversation context"""
    user_profile: UserProfile
    current_assessment: Optional[UserAssessment] = None
    assessment_history: List[UserAssessment] = []
    daily_plan: Optional[DailyPlan] = None
    future_projection: Optional[FutureProjection] = None
    recent_messages: List[ChatMessage] = []
    conversation_summary: Optional[str] = None

class AgentTool(BaseModel):
    """Pydantic model for agent tools"""
    name: str
    description: str
    parameters: Dict[str, Any]
    required: bool = False

class AgentResponse(BaseModel):
    """Pydantic model for agent responses"""
    content: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    tools_used: List[str] = []
    context_references: List[str] = []
    follow_up_questions: Optional[List[str]] = []
    wellness_insights: Optional[Dict[str, Any]] = None

class WellnessInsight(BaseModel):
    """Pydantic model for wellness insights"""
    category: str
    insight: str
    confidence: float
    actionable: bool = True
    priority: str = "medium"  # low, medium, high
    related_data: Optional[Dict[str, Any]] = None 