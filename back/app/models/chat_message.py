from sqlalchemy import Column, Integer, String, Text, DateTime, func, Float, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.db.session import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)  # Clerk user id
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Legacy embedding field (JSONB) - kept for backward compatibility but not used
    embedding = Column(JSONB, nullable=True)
    
    # Message analysis fields for agent system
    message_type = Column(String(50), nullable=True)  # e.g., 'question', 'answer', 'greeting', 'wellness_tip'
    sentiment_score = Column(Float, nullable=True)  # Sentiment analysis score (-1 to 1)
    topic_tags = Column(JSONB, nullable=True)  # Extracted topics and tags for categorization
    wellness_domain = Column(String(20), nullable=True)  # physical, emotional, mental, social, spiritual
    urgency_level = Column(String(10), nullable=True)  # low, medium, high
    requires_followup = Column(Boolean, nullable=True)  # true, false 