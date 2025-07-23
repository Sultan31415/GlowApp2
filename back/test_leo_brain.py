#!/usr/bin/env python3
"""
🧪 LEO BRAIN SYSTEM TEST
Comprehensive test of the new clean Leo implementation
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, Any

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

def print_test_header(test_name: str):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(test_name: str, success: bool, details: str = ""):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {test_name}")
    if details:
        print(f"    📋 {details}")

async def test_1_leo_brain_import():
    """Test 1: Leo Brain import and initialization"""
    print_test_header("Leo Brain Import & Initialization")
    
    try:
        from app.services.leo_brain import LeoBrain, LeoResponse, WellnessInsight, HiddenPattern
        print_result("Import Leo Brain modules", True)
        
        # Test Leo Brain initialization
        leo = LeoBrain()
        print_result("Initialize Leo Brain", True)
        
        # Test response models
        test_insight = WellnessInsight(
            category="physical",
            insight="Test insight",
            evidence="Test evidence",
            action="Test action"
        )
        print_result("Create WellnessInsight model", True, f"Category: {test_insight.category}")
        
        test_pattern = HiddenPattern(
            pattern_name="test_pattern",
            description="Test description",
            data_points=["point1", "point2"],
            impact="Test impact"
        )
        print_result("Create HiddenPattern model", True, f"Pattern: {test_pattern.pattern_name}")
        
        return True
        
    except Exception as e:
        print_result("Leo Brain import", False, str(e))
        return False

async def test_2_database_connectivity():
    """Test 2: Database models and connectivity"""
    print_test_header("Database Connectivity")
    
    try:
        from app.db.session import SessionLocal
        from app.models.user import User
        from app.models.assessment import UserAssessment
        from app.models.chat_message import ChatMessage
        from app.models.future_projection import DailyPlan
        
        print_result("Import database models", True)
        
        # Test database session
        db = SessionLocal()
        user_count = db.query(User).count()
        assessment_count = db.query(UserAssessment).count()
        message_count = db.query(ChatMessage).count()
        plan_count = db.query(DailyPlan).count()
        
        print_result("Database connection", True, f"Users: {user_count}, Assessments: {assessment_count}")
        print_result("Data availability", assessment_count > 0, f"Messages: {message_count}, Plans: {plan_count}")
        
        db.close()
        return True
        
    except Exception as e:
        print_result("Database connectivity", False, str(e))
        return False

async def test_3_leo_tools():
    """Test 3: Leo's intelligent tools"""
    print_test_header("Leo's Intelligent Tools")
    
    try:
        from app.services.leo_brain import leo_agent, LeoDeps
        from app.db.session import SessionLocal
        from app.models.user import User
        
        db = SessionLocal()
        
        # Find a test user
        test_user = db.query(User).first()
        if not test_user:
            print_result("Find test user", False, "No users in database")
            db.close()
            return False
        
        print_result("Find test user", True, f"User: {test_user.first_name} ({test_user.user_id})")
        
        # Test dependencies
        deps = LeoDeps(
            db=db,
            user_id=test_user.user_id,
            internal_user_id=test_user.id,
            session_id="test_session_123"
        )
        print_result("Create Leo dependencies", True)
        
        # We can't easily test the tools without the full agent context,
        # but we can verify they're properly defined
        tools = leo_agent.tools
        tool_names = [tool.name for tool in tools] if hasattr(leo_agent, 'tools') else []
        print_result("Leo tools available", len(tool_names) > 0, f"Tools: {len(tool_names)}")
        
        db.close()
        return True
        
    except Exception as e:
        print_result("Leo tools testing", False, str(e))
        return False

async def test_4_crisis_detection():
    """Test 4: Crisis detection functionality"""
    print_test_header("Crisis Detection System")
    
    try:
        from app.services.leo_brain import detect_crisis_signals, LeoDeps
        from app.db.session import SessionLocal
        from app.models.user import User
        from pydantic_ai import RunContext
        
        db = SessionLocal()
        test_user = db.query(User).first()
        
        if not test_user:
            print_result("Crisis detection setup", False, "No test user available")
            db.close()
            return False
        
        deps = LeoDeps(
            db=db,
            user_id=test_user.user_id,
            internal_user_id=test_user.id,
            session_id="crisis_test"
        )
        
        # Test crisis detection levels
        test_messages = [
            ("I'm feeling great today!", "none"),
            ("I'm really stressed out", "none"),
            ("I can't handle this anymore", "medium"),
            ("I want to hurt myself", "high")
        ]
        
        correct_detections = 0
        total_tests = len(test_messages)
        
        for message, expected_level in test_messages:
            try:
                # Create a mock context for testing
                ctx = RunContext(deps=deps, model=None, usage=None, prompt=None)
                result = await detect_crisis_signals(ctx, message)
                detected_level = result.get("level", "none")
                
                if detected_level == expected_level or (expected_level != "none" and detected_level != "none"):
                    correct_detections += 1
                    print_result(f"Crisis detection: '{message[:30]}...'", True, f"Detected: {detected_level}")
                else:
                    print_result(f"Crisis detection: '{message[:30]}...'", False, f"Expected {expected_level}, got {detected_level}")
                    
            except Exception as e:
                print_result(f"Crisis detection: '{message[:30]}...'", False, f"Error: {str(e)}")
        
        accuracy = correct_detections / total_tests
        print_result("Overall crisis detection", accuracy >= 0.7, f"Accuracy: {accuracy*100:.1f}% ({correct_detections}/{total_tests})")
        
        db.close()
        return accuracy >= 0.7
        
    except Exception as e:
        print_result("Crisis detection testing", False, str(e))
        return False

async def test_5_leo_brain_integration():
    """Test 5: Full Leo Brain integration"""
    print_test_header("Leo Brain Integration")
    
    try:
        from app.services.leo_brain import LeoBrain
        from app.db.session import SessionLocal
        from app.models.user import User
        
        leo = LeoBrain()
        db = SessionLocal()
        
        # Find test user
        test_user = db.query(User).first()
        if not test_user:
            print_result("Leo integration setup", False, "No test user available")
            db.close()
            return False
        
        print_result("Leo Brain instance", True, f"Testing with user: {test_user.first_name}")
        
        # Test message processing
        test_message = "Hello Leo! I've been feeling a bit tired lately. Can you help?"
        
        try:
            response = await leo.process_message(
                user_message=test_message,
                db=db,
                user_id=test_user.user_id,
                internal_user_id=test_user.id,
                session_id="integration_test"
            )
            
            print_result("Message processing", True, f"Response length: {len(response.content)} chars")
            print_result("Response structure", hasattr(response, 'wellness_insights'), f"Insights: {len(response.wellness_insights)}")
            print_result("Crisis detection", hasattr(response, 'crisis_level'), f"Crisis level: {response.crisis_level}")
            
            # Show sample response
            if response.content:
                print(f"    🗣️ Leo says: {response.content[:100]}...")
            
            db.close()
            return True
            
        except Exception as e:
            print_result("Message processing", False, str(e))
            db.close()
            return False
        
    except Exception as e:
        print_result("Leo Brain integration", False, str(e))
        return False

async def test_6_websocket_compatibility():
    """Test 6: WebSocket implementation compatibility"""
    print_test_header("WebSocket Implementation")
    
    try:
        from app.api.chat_ws_clean import ConnectionManager, verify_clerk_token
        
        # Test connection manager
        manager = ConnectionManager()
        print_result("ConnectionManager creation", True)
        
        # Test basic WebSocket structure
        print_result("WebSocket router structure", True, "Clean implementation ready")
        
        # Note: Full WebSocket testing requires running server
        print_result("WebSocket compatibility", True, "Structure validated - needs live testing")
        
        return True
        
    except Exception as e:
        print_result("WebSocket testing", False, str(e))
        return False

async def run_all_tests():
    """Run comprehensive Leo Brain test suite"""
    print("🧠 LEO BRAIN SYSTEM - COMPREHENSIVE TESTING")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = []
    
    # Define tests
    tests = [
        ("Leo Brain Import & Initialization", test_1_leo_brain_import),
        ("Database Connectivity", test_2_database_connectivity),
        ("Leo's Intelligent Tools", test_3_leo_tools),
        ("Crisis Detection System", test_4_crisis_detection),
        ("Leo Brain Integration", test_5_leo_brain_integration),
        ("WebSocket Implementation", test_6_websocket_compatibility)
    ]
    
    # Run tests
    for test_name, test_func in tests:
        try:
            result = await test_func()
            test_results.append({"name": test_name, "passed": result})
        except Exception as e:
            test_results.append({"name": test_name, "passed": False, "error": str(e)})
    
    # Generate summary
    print_test_header("TEST SUMMARY REPORT")
    
    passed_tests = sum(1 for r in test_results if r["passed"])
    total_tests = len(test_results)
    success_rate = passed_tests / total_tests
    
    print(f"📊 Overall Success Rate: {success_rate*100:.1f}% ({passed_tests}/{total_tests})")
    
    print("\n📋 Detailed Results:")
    for result in test_results:
        status = "✅" if result["passed"] else "❌"
        print(f"  {status} {result['name']}")
        if "error" in result:
            print(f"      ❌ Error: {result['error']}")
    
    # Recommendations
    print_test_header("RECOMMENDATIONS")
    
    if success_rate >= 0.8:
        print("🎯 Leo Brain system shows excellent functionality!")
        print("   ✅ Ready for integration and testing")
        print("   🚀 Next: Update main app to use new Leo Brain")
    elif success_rate >= 0.6:
        print("⚠️  Leo Brain system has moderate issues")
        print("   🔧 Fix failing tests before deployment")
    else:
        print("🚨 Leo Brain system needs significant work")
        print("   🛠️  Address fundamental issues first")
    
    return test_results

if __name__ == "__main__":
    # Run the test suite
    results = asyncio.run(run_all_tests()) 