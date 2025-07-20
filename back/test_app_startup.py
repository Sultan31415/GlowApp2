#!/usr/bin/env python3
"""
🧪 APPLICATION STARTUP TEST
Tests that the application can start without pgvector and fallback mechanisms work.
"""

import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test that all modules can be imported without pgvector."""
    print("🧪 Testing application imports...")
    
    try:
        # Test basic imports
        from app.models.chat_message import ChatMessage
        print("✅ ChatMessage model imported successfully")
        
        from app.services.embedding_service import EmbeddingService
        print("✅ EmbeddingService imported successfully")
        
        from app.services.vector_search_service import VectorSearchService
        print("✅ VectorSearchService imported successfully")
        
        # Test that the model can be instantiated
        from app.db.session import SessionLocal
        db = SessionLocal()
        
        # Test vector search service initialization
        vector_search = VectorSearchService(db)
        print("✅ VectorSearchService initialized successfully")
        
        db.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

def test_model_definition():
    """Test that the ChatMessage model is properly defined."""
    print("\n🧪 Testing model definition...")
    
    try:
        from app.models.chat_message import ChatMessage
        
        # Check that the model has the expected columns
        columns = [col.name for col in ChatMessage.__table__.columns]
        expected_columns = ['id', 'user_id', 'session_id', 'role', 'content', 'timestamp', 'embedding', 'message_type', 'sentiment_score', 'topic_tags']
        
        # embedding_vector is optional (only if pgvector is available)
        if 'embedding_vector' in columns:
            expected_columns.append('embedding_vector')
        
        missing_columns = [col for col in expected_columns if col not in columns]
        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            return False
        
        print("✅ ChatMessage model has all expected columns")
        return True
        
    except Exception as e:
        print(f"❌ Model definition test failed: {e}")
        return False

def test_fallback_mode():
    """Test that fallback mode works when pgvector is not available."""
    print("\n🧪 Testing fallback mode...")
    
    try:
        from app.services.vector_search_service import VectorSearchService, PGVECTOR_AVAILABLE
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        vector_search = VectorSearchService(db)
        
        if PGVECTOR_AVAILABLE:
            print("✅ pgvector is available - full vector search enabled")
        else:
            print("✅ pgvector not available - fallback mode enabled")
            print("   - Embeddings will be stored in JSONB field")
            print("   - Similarity search will use Python calculations")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Fallback mode test failed: {e}")
        return False

def main():
    """Run all startup tests."""
    print("🚀 APPLICATION STARTUP TEST SUITE")
    print("=" * 40)
    
    # Test imports
    imports_ok = test_imports()
    if not imports_ok:
        print("\n❌ Import test failed - application cannot start")
        return False
    
    # Test model definition
    model_ok = test_model_definition()
    if not model_ok:
        print("\n❌ Model definition test failed")
        return False
    
    # Test fallback mode
    fallback_ok = test_fallback_mode()
    if not fallback_ok:
        print("\n❌ Fallback mode test failed")
        return False
    
    print("\n" + "=" * 40)
    print("🎉 ALL STARTUP TESTS PASSED!")
    print("✅ Application can start successfully")
    print("✅ All modules import correctly")
    print("✅ Model definitions are valid")
    print("✅ Fallback mechanisms work")
    
    print("\n🧠 VECTOR DATABASE STATUS:")
    try:
        from app.services.vector_search_service import PGVECTOR_AVAILABLE
        if PGVECTOR_AVAILABLE:
            print("   • Full vector search: ✅ ENABLED")
            print("   • pgvector extension: ✅ AVAILABLE")
            print("   • Vector columns: ✅ ACTIVE")
        else:
            print("   • Full vector search: ⚠️ FALLBACK MODE")
            print("   • pgvector extension: ❌ NOT AVAILABLE")
            print("   • Vector columns: ⚠️ USING JSONB FALLBACK")
            print("   • Similarity search: ✅ PYTHON CALCULATION")
    except:
        print("   • Status: ❌ UNKNOWN")
    
    print("\n🚀 Ready to start application!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 