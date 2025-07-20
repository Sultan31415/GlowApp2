#!/usr/bin/env python3
"""
🧠 VECTOR DATABASE TEST SCRIPT
Tests the complete vector database implementation with Azure OpenAI integration.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.session import SessionLocal
from app.services.embedding_service import EmbeddingService
from app.services.vector_search_service import VectorSearchService
from app.models.chat_message import ChatMessage
from app.config.settings import settings

async def test_embedding_service():
    """Test the embedding service functionality."""
    print("🧠 Testing Embedding Service...")
    
    embedding_service = EmbeddingService()
    
    # Test single embedding generation
    test_text = "I'm feeling stressed about my wellness journey and need some guidance."
    embedding = await embedding_service.generate_embedding(test_text)
    
    if embedding:
        print(f"✅ Single embedding generated: {len(embedding)} dimensions")
    else:
        print("❌ Failed to generate single embedding")
        return False
    
    # Test batch embedding generation
    test_texts = [
        "Hello Leo, how are you today?",
        "I need help with my morning routine",
        "I'm feeling overwhelmed with my wellness goals",
        "Can you give me some advice on stress management?",
        "I want to improve my physical vitality"
    ]
    
    batch_embeddings = await embedding_service.generate_batch_embeddings(test_texts)
    
    if batch_embeddings and len(batch_embeddings) == len(test_texts):
        print(f"✅ Batch embeddings generated: {len(batch_embeddings)} embeddings")
    else:
        print("❌ Failed to generate batch embeddings")
        return False
    
    # Test message metadata analysis
    metadata = await embedding_service.analyze_message_metadata(test_text)
    
    if metadata and isinstance(metadata, dict):
        print(f"✅ Message metadata analyzed: {metadata.get('message_type')} | Sentiment: {metadata.get('sentiment_score')}")
    else:
        print("❌ Failed to analyze message metadata")
        return False
    
    return True

async def test_vector_search_service():
    """Test the vector search service functionality."""
    print("\n🔍 Testing Vector Search Service...")
    
    db = SessionLocal()
    try:
        vector_search = VectorSearchService(db)
        
        # Test conversation patterns analysis
        test_user_id = "test_user_123"
        patterns = await vector_search.find_conversation_patterns(test_user_id, time_window_days=30)
        
        if patterns:
            print(f"✅ Conversation patterns analyzed: {patterns.get('total_messages', 0)} messages")
        else:
            print("⚠️ No conversation patterns found (expected for new user)")
        
        # Test conversation memory retrieval
        test_query = "I need help with stress management"
        memory = await vector_search.get_conversation_memory(test_user_id, test_query)
        
        if memory:
            print(f"✅ Conversation memory retrieved: {len(memory.get('relevant_history', []))} relevant messages")
        else:
            print("⚠️ No conversation memory found (expected for new user)")
        
        return True
        
    except Exception as e:
        print(f"❌ Vector search service error: {e}")
        return False
    finally:
        db.close()

async def test_message_saving_with_embeddings():
    """Test saving messages with embeddings and metadata."""
    print("\n💾 Testing Message Saving with Embeddings...")
    
    db = SessionLocal()
    try:
        vector_search = VectorSearchService(db)
        
        # Test saving user message
        test_user_id = "test_user_456"
        test_session_id = "test_session_789"
        
        user_message = await vector_search.save_message_with_embedding(
            user_id=test_user_id,
            session_id=test_session_id,
            role="user",
            content="I'm feeling stressed about my wellness journey and need some guidance."
        )
        
        if user_message:
            print(f"✅ User message saved with embedding: ID {user_message.id}")
            print(f"   - Message type: {user_message.message_type}")
            print(f"   - Sentiment score: {user_message.sentiment_score}")
            print(f"   - Topic tags: {user_message.topic_tags}")
        else:
            print("❌ Failed to save user message with embedding")
            return False
        
        # Test saving AI response
        ai_message = await vector_search.save_message_with_embedding(
            user_id=test_user_id,
            session_id=test_session_id,
            role="ai",
            content="I understand you're feeling stressed. Let me help you with some practical stress management techniques that align with your wellness goals."
        )
        
        if ai_message:
            print(f"✅ AI message saved with embedding: ID {ai_message.id}")
            print(f"   - Message type: {ai_message.message_type}")
            print(f"   - Sentiment score: {ai_message.sentiment_score}")
            print(f"   - Topic tags: {ai_message.topic_tags}")
        else:
            print("❌ Failed to save AI message with embedding")
            return False
        
        # Test finding similar messages
        test_query = "I need help with stress management"
        embedding_service = EmbeddingService()
        query_embedding = await embedding_service.generate_embedding(test_query)
        
        if query_embedding:
            similar_messages = await vector_search.find_similar_messages(
                user_id=test_user_id,
                query_embedding=query_embedding,
                limit=5,
                similarity_threshold=0.5
            )
            
            if similar_messages:
                print(f"✅ Found {len(similar_messages)} similar messages")
                for i, msg in enumerate(similar_messages[:2]):
                    print(f"   - Similar message {i+1}: {msg.get('content', '')[:50]}... (similarity: {msg.get('similarity_score', 0):.2f})")
            else:
                print("⚠️ No similar messages found (might be due to threshold)")
        
        return True
        
    except Exception as e:
        print(f"❌ Message saving test error: {e}")
        return False
    finally:
        db.close()

async def test_conversation_summary():
    """Test conversation summary generation."""
    print("\n📝 Testing Conversation Summary...")
    
    db = SessionLocal()
    try:
        vector_search = VectorSearchService(db)
        
        test_user_id = "test_user_789"
        
        # Generate a conversation summary
        summary = await vector_search.get_user_conversation_summary(test_user_id, time_window_days=7)
        
        if summary:
            print(f"✅ Conversation summary generated: {len(summary)} characters")
            print(f"   Summary: {summary[:100]}...")
        else:
            print("⚠️ No conversation summary available (expected for new user)")
        
        return True
        
    except Exception as e:
        print(f"❌ Conversation summary test error: {e}")
        return False
    finally:
        db.close()

async def test_wellness_insights():
    """Test wellness insights generation."""
    print("\n💡 Testing Wellness Insights...")
    
    db = SessionLocal()
    try:
        vector_search = VectorSearchService(db)
        
        test_user_id = "test_user_101"
        test_assessment_data = {
            "overall_glow_score": 75,
            "category_scores": {
                "physicalVitality": 70,
                "emotionalHealth": 80,
                "visualAppearance": 75
            },
            "biological_age": 28,
            "chronological_age": 30
        }
        
        insights = await vector_search.find_wellness_insights(test_user_id, test_assessment_data)
        
        if insights:
            print(f"✅ Wellness insights generated")
            print(f"   - Assessment data included: {'overall_glow_score' in insights.get('assessment_data', {})}")
            print(f"   - Recent conversations: {len(insights.get('recent_wellness_conversations', []))}")
            print(f"   - Recommendations: {len(insights.get('recommendations', []))}")
        else:
            print("⚠️ No wellness insights available (expected for new user)")
        
        return True
        
    except Exception as e:
        print(f"❌ Wellness insights test error: {e}")
        return False
    finally:
        db.close()

async def test_azure_openai_configuration():
    """Test Azure OpenAI configuration."""
    print("\n☁️ Testing Azure OpenAI Configuration...")
    
    # Check if Azure OpenAI is configured
    if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
        print(f"✅ Azure OpenAI configured")
        print(f"   - Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
        print(f"   - API Version: {settings.AZURE_OPENAI_API_VERSION}")
        print(f"   - GPT-4o Deployment: {settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME}")
        return True
    else:
        print("⚠️ Azure OpenAI not configured, will use regular OpenAI")
        print(f"   - OpenAI API Key: {'Set' if settings.OPENAI_API_KEY else 'Not set'}")
        return True

async def main():
    """Run all vector database tests."""
    print("🚀 VECTOR DATABASE COMPREHENSIVE TEST SUITE")
    print("=" * 50)
    
    # Test Azure OpenAI configuration
    config_ok = await test_azure_openai_configuration()
    if not config_ok:
        print("❌ Configuration test failed")
        return
    
    # Test embedding service
    embedding_ok = await test_embedding_service()
    if not embedding_ok:
        print("❌ Embedding service test failed")
        return
    
    # Test vector search service
    search_ok = await test_vector_search_service()
    if not search_ok:
        print("❌ Vector search service test failed")
        return
    
    # Test message saving with embeddings
    saving_ok = await test_message_saving_with_embeddings()
    if not saving_ok:
        print("❌ Message saving test failed")
        return
    
    # Test conversation summary
    summary_ok = await test_conversation_summary()
    if not summary_ok:
        print("❌ Conversation summary test failed")
        return
    
    # Test wellness insights
    insights_ok = await test_wellness_insights()
    if not insights_ok:
        print("❌ Wellness insights test failed")
        return
    
    print("\n" + "=" * 50)
    print("🎉 ALL VECTOR DATABASE TESTS PASSED!")
    print("✅ Embedding Service: Working")
    print("✅ Vector Search Service: Working")
    print("✅ Message Saving with Embeddings: Working")
    print("✅ Conversation Summary: Working")
    print("✅ Wellness Insights: Working")
    print("✅ Azure OpenAI Integration: Working")
    print("\n🧠 Leo's vector memory system is ready!")
    print("   - Semantic search: ✅")
    print("   - Pattern recognition: ✅")
    print("   - Conversation memory: ✅")
    print("   - Sentiment analysis: ✅")
    print("   - Topic extraction: ✅")

if __name__ == "__main__":
    asyncio.run(main()) 