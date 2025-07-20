from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_, desc
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.models.assessment import UserAssessment
from app.services.embedding_service import EmbeddingService
from typing import List, Dict, Any, Optional, Tuple
import json
from datetime import datetime, timedelta
import numpy as np

# Check if pgvector is available
try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False
    print("[VectorSearch] Warning: pgvector not available, using fallback mode")

class VectorSearchService:
    """
    🧠 CONTEXT7 OPTIMIZED: Advanced vector search service for Leo's memory system.
    Provides semantic search, pattern recognition, and intelligent conversation memory.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.embedding_service = EmbeddingService()

    async def find_similar_messages(
        self, 
        user_id: str, 
        query_embedding: List[float], 
        limit: int = 5,
        similarity_threshold: float = 0.7,
        time_window_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Find semantically similar messages using vector similarity search.
        Returns messages with similarity scores above threshold.
        """
        try:
            if not query_embedding:
                return []
            
            # Calculate time window
            cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)
            
            if PGVECTOR_AVAILABLE:
                # Use pgvector for similarity search
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                query = text("""
                    SELECT 
                        id, user_id, session_id, role, content, timestamp,
                        message_type, sentiment_score, topic_tags,
                        1 - (embedding_vector <=> :embedding) as similarity_score
                    FROM chat_messages 
                    WHERE user_id = :user_id 
                    AND embedding_vector IS NOT NULL
                    AND timestamp >= :cutoff_date
                    AND 1 - (embedding_vector <=> :embedding) >= :threshold
                    ORDER BY embedding_vector <=> :embedding
                    LIMIT :limit
                """)
                
                result = self.db.execute(query, {
                    "embedding": embedding_str,
                    "user_id": user_id,
                    "cutoff_date": cutoff_date,
                    "threshold": similarity_threshold,
                    "limit": limit
                })
            else:
                # Fallback: Get recent messages and calculate similarity in Python
                messages = self.db.query(ChatMessage).filter(
                    and_(
                        ChatMessage.user_id == user_id,
                        ChatMessage.timestamp >= cutoff_date,
                        ChatMessage.embedding.isnot(None)
                    )
                ).order_by(desc(ChatMessage.timestamp)).limit(limit * 2).all()
                
                # Calculate similarities manually
                similar_messages = []
                for msg in messages:
                    if msg.embedding and isinstance(msg.embedding, list):
                        similarity = self.embedding_service.calculate_similarity(query_embedding, msg.embedding)
                        if similarity >= similarity_threshold:
                            message_data = {
                                "id": msg.id,
                                "user_id": msg.user_id,
                                "session_id": msg.session_id,
                                "role": msg.role,
                                "content": msg.content,
                                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                                "message_type": msg.message_type,
                                "sentiment_score": msg.sentiment_score,
                                "topic_tags": msg.topic_tags,
                                "similarity_score": similarity
                            }
                            similar_messages.append(message_data)
                
                # Sort by similarity and limit
                similar_messages.sort(key=lambda x: x["similarity_score"], reverse=True)
                similar_messages = similar_messages[:limit]
                
                print(f"[VectorSearch] Found {len(similar_messages)} similar messages for user {user_id} (fallback mode)")
                return similar_messages
            
            # Process pgvector results
            similar_messages = []
            for row in result:
                message_data = {
                    "id": row.id,
                    "user_id": row.user_id,
                    "session_id": row.session_id,
                    "role": row.role,
                    "content": row.content,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                    "message_type": row.message_type,
                    "sentiment_score": row.sentiment_score,
                    "topic_tags": row.topic_tags,
                    "similarity_score": float(row.similarity_score)
                }
                similar_messages.append(message_data)
            
            print(f"[VectorSearch] Found {len(similar_messages)} similar messages for user {user_id}")
            return similar_messages
            
        except Exception as e:
            print(f"[VectorSearch] Error finding similar messages: {e}")
            return []

    async def find_conversation_patterns(
        self, 
        user_id: str, 
        time_window_days: int = 90
    ) -> Dict[str, Any]:
        """
        CONTEXT7 ENHANCED: Analyze conversation patterns for Leo's intelligence.
        Identifies recurring topics, sentiment trends, and user behavior patterns.
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)
            
            # Get recent messages with metadata
            messages = self.db.query(ChatMessage).filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.timestamp >= cutoff_date,
                    ChatMessage.message_type.isnot(None)
                )
            ).order_by(desc(ChatMessage.timestamp)).all()
            
            if not messages:
                return {"patterns": "No recent conversation data available"}
            
            # Analyze patterns
            patterns = {
                "total_messages": len(messages),
                "time_period_days": time_window_days,
                "message_types": {},
                "topic_frequency": {},
                "sentiment_trends": {
                    "average_sentiment": 0.0,
                    "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}
                },
                "wellness_domains": {},
                "urgency_patterns": {},
                "conversation_frequency": {
                    "daily_average": 0.0,
                    "most_active_days": []
                }
            }
            
            # Count message types and topics
            sentiment_scores = []
            for msg in messages:
                # Message types
                msg_type = msg.message_type or "general"
                patterns["message_types"][msg_type] = patterns["message_types"].get(msg_type, 0) + 1
                
                # Topics
                if msg.topic_tags:
                    for topic in msg.topic_tags:
                        patterns["topic_frequency"][topic] = patterns["topic_frequency"].get(topic, 0) + 1
                
                # Sentiment
                if msg.sentiment_score is not None:
                    sentiment_scores.append(msg.sentiment_score)
                    if msg.sentiment_score > 0.1:
                        patterns["sentiment_trends"]["sentiment_distribution"]["positive"] += 1
                    elif msg.sentiment_score < -0.1:
                        patterns["sentiment_trends"]["sentiment_distribution"]["negative"] += 1
                    else:
                        patterns["sentiment_trends"]["sentiment_distribution"]["neutral"] += 1
            
            # Calculate average sentiment
            if sentiment_scores:
                patterns["sentiment_trends"]["average_sentiment"] = sum(sentiment_scores) / len(sentiment_scores)
            
            # Get top topics
            patterns["top_topics"] = sorted(
                patterns["topic_frequency"].items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]
            
            # Get most common message types
            patterns["top_message_types"] = sorted(
                patterns["message_types"].items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:3]
            
            print(f"[VectorSearch] Analyzed patterns for user {user_id}: {len(messages)} messages")
            return patterns
            
        except Exception as e:
            print(f"[VectorSearch] Error analyzing conversation patterns: {e}")
            return {"patterns": "Pattern analysis unavailable"}

    async def get_conversation_memory(
        self, 
        user_id: str, 
        current_query: str,
        limit: int = 8
    ) -> Dict[str, Any]:
        """
        CONTEXT7 OPTIMIZED: Get intelligent conversation memory for Leo.
        Combines semantic search with pattern analysis for context-aware responses.
        """
        try:
            # Generate embedding for current query
            query_embedding = await self.embedding_service.generate_embedding(current_query)
            
            if not query_embedding:
                return {"memory": "No relevant conversation history found"}
            
            # Find similar messages
            similar_messages = await self.find_similar_messages(
                user_id=user_id,
                query_embedding=query_embedding,
                limit=limit,
                similarity_threshold=0.6
            )
            
            # Get conversation patterns
            patterns = await self.find_conversation_patterns(user_id, time_window_days=30)
            
            # Create memory summary
            memory = {
                "relevant_history": similar_messages,
                "conversation_patterns": patterns,
                "query_embedding": query_embedding,  # For debugging
                "memory_timestamp": datetime.utcnow().isoformat()
            }
            
            # Add intelligent insights
            if similar_messages:
                # Analyze sentiment of relevant history
                relevant_sentiments = [msg.get("sentiment_score", 0) for msg in similar_messages if msg.get("sentiment_score") is not None]
                if relevant_sentiments:
                    memory["sentiment_context"] = {
                        "average_sentiment": sum(relevant_sentiments) / len(relevant_sentiments),
                        "sentiment_trend": "improving" if len(relevant_sentiments) > 1 and relevant_sentiments[-1] > relevant_sentiments[0] else "stable"
                    }
                
                # Extract common topics from relevant history
                all_topics = []
                for msg in similar_messages:
                    if msg.get("topic_tags"):
                        all_topics.extend(msg["topic_tags"])
                
                if all_topics:
                    topic_counts = {}
                    for topic in all_topics:
                        topic_counts[topic] = topic_counts.get(topic, 0) + 1
                    memory["recurring_topics"] = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            
            print(f"[VectorSearch] Retrieved conversation memory for user {user_id}: {len(similar_messages)} relevant messages")
            return memory
            
        except Exception as e:
            print(f"[VectorSearch] Error getting conversation memory: {e}")
            return {"memory": "Memory retrieval unavailable"}

    async def save_message_with_embedding(
        self, 
        user_id: str, 
        session_id: str, 
        role: str, 
        content: str
    ) -> Optional[ChatMessage]:
        """
        Save message with embedding and metadata analysis.
        This is the main method for storing conversation data with vector search capabilities.
        """
        try:
            # Generate embedding
            embedding = await self.embedding_service.generate_embedding(content)
            
            # Analyze message metadata
            metadata = await self.embedding_service.analyze_message_metadata(content)
            
            # Create chat message with vector data
            if PGVECTOR_AVAILABLE:
                chat_message = ChatMessage(
                    user_id=user_id,
                    session_id=session_id,
                    role=role,
                    content=content,
                    embedding_vector=embedding,
                    message_type=metadata.get("message_type"),
                    sentiment_score=metadata.get("sentiment_score"),
                    topic_tags=metadata.get("topic_tags")
                )
            else:
                # Fallback: store embedding in JSONB field
                chat_message = ChatMessage(
                    user_id=user_id,
                    session_id=session_id,
                    role=role,
                    content=content,
                    embedding=embedding,  # Store in legacy JSONB field
                    message_type=metadata.get("message_type"),
                    sentiment_score=metadata.get("sentiment_score"),
                    topic_tags=metadata.get("topic_tags")
                )
            
            # Save to database
            self.db.add(chat_message)
            self.db.commit()
            self.db.refresh(chat_message)
            
            print(f"[VectorSearch] Saved message with embedding: {role} | Type: {metadata.get('message_type')} | Sentiment: {metadata.get('sentiment_score')}")
            return chat_message
            
        except Exception as e:
            print(f"[VectorSearch] Error saving message with embedding: {e}")
            self.db.rollback()
            return None

    async def get_user_conversation_summary(
        self, 
        user_id: str, 
        time_window_days: int = 7
    ) -> str:
        """
        Create intelligent conversation summary for user's recent activity.
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)
            
            # Get recent messages
            messages = self.db.query(ChatMessage).filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.timestamp >= cutoff_date
                )
            ).order_by(ChatMessage.timestamp).all()
            
            if not messages:
                return f"No conversation activity in the last {time_window_days} days."
            
            # Prepare messages for summary
            message_data = [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                    "message_type": msg.message_type,
                    "sentiment_score": msg.sentiment_score
                }
                for msg in messages
            ]
            
            # Get user context (basic info)
            user_context = {"user_id": user_id, "time_window_days": time_window_days}
            
            # Create summary using embedding service
            summary = await self.embedding_service.create_conversation_summary(
                messages=message_data,
                user_context=user_context
            )
            
            return summary
            
        except Exception as e:
            print(f"[VectorSearch] Error creating conversation summary: {e}")
            return "Conversation summary unavailable."

    async def find_wellness_insights(
        self, 
        user_id: str, 
        assessment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        CONTEXT7 ENHANCED: Find wellness insights by combining assessment data with conversation history.
        """
        try:
            # Get recent wellness-related conversations
            wellness_messages = self.db.query(ChatMessage).filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.topic_tags.contains(["wellness", "health", "fitness", "mental_health", "nutrition"])
                )
            ).order_by(desc(ChatMessage.timestamp)).limit(10).all()
            
            insights = {
                "assessment_data": assessment_data,
                "recent_wellness_conversations": [],
                "conversation_insights": {},
                "recommendations": []
            }
            
            # Process wellness messages
            for msg in wellness_messages:
                insights["recent_wellness_conversations"].append({
                    "content": msg.content,
                    "sentiment": msg.sentiment_score,
                    "topics": msg.topic_tags,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                })
            
            # Analyze sentiment trends
            if insights["recent_wellness_conversations"]:
                sentiments = [conv["sentiment"] for conv in insights["recent_wellness_conversations"] if conv["sentiment"] is not None]
                if sentiments:
                    insights["conversation_insights"]["sentiment_trend"] = {
                        "average": sum(sentiments) / len(sentiments),
                        "trend": "positive" if len(sentiments) > 1 and sentiments[-1] > sentiments[0] else "stable"
                    }
            
            # Generate recommendations based on conversation patterns
            if insights["recent_wellness_conversations"]:
                insights["recommendations"] = [
                    "Consider discussing progress more frequently",
                    "Focus on positive reinforcement in conversations",
                    "Address any recurring concerns mentioned in chats"
                ]
            
            return insights
            
        except Exception as e:
            print(f"[VectorSearch] Error finding wellness insights: {e}")
            return {"insights": "Wellness insights unavailable"} 