# Import all models here for Alembic to detect them
from .user import User
from .assessment import UserAssessment
from .chat_message import ChatMessage
from .future_projection import FutureProjection, DailyPlan
from .progress_tracking import HabitCompletion, ProgressSnapshot

__all__ = [
    "User",
    "UserAssessment", 
    "ChatMessage",
    "FutureProjection",
    "DailyPlan",
    "HabitCompletion",
    "ProgressSnapshot"
] 