from sqlalchemy import Column, Integer, String, Text, DateTime, func, Float
from sqlalchemy.dialects.postgresql import JSONB
from app.db.session import Base

# Import VECTOR type from pgvector extension
try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    # Fallback for when pgvector is not installed
    Vector = None
    PGVECTOR_AVAILABLE = False

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)  # Clerk user id
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Legacy embedding field (JSONB) - kept for backward compatibility
    embedding = Column(JSONB, nullable=True)
    
    # New vector database fields
    embedding_vector = Column(Vector(1536), nullable=True) if PGVECTOR_AVAILABLE else None  # Vector representation for semantic search
    message_type = Column(String(50), nullable=True)  # e.g., 'question', 'answer', 'greeting', 'wellness_tip'
    sentiment_score = Column(Float, nullable=True)  # Sentiment analysis score (-1 to 1)
    topic_tags = Column(JSONB, nullable=True)  # Extracted topics and tags for categorization 