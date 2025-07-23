#!/usr/bin/env python3

"""
🧪 DAILY PLAN ACCESS TEST
Test that Leo can properly access and display user's actual daily plans
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.session import get_db
from app.models.user import User
from app.services.leo_pydantic_agent import LeoPydanticAgent
from app.services.user_service import get_latest_user_assessment

async def test_daily_plan_access():
    """Test that Leo can access and display user's actual daily plans"""
    
    print("=" * 80)
    print("🧪 DAILY PLAN ACCESS TEST")
    print("Testing Leo's ability to access and display specific daily plans")
    print("=" * 80)
    
    # Get database session
    db = next(get_db())
    
    # Find test user
    test_user = db.query(User).filter(User.email.like('%test%')).first()
    if not test_user:
        test_user = db.query(User).first()
    
    if not test_user:
        print("❌ No test user found")
        return
    
    print(f"✅ Test user found: {test_user.first_name} (ID: {test_user.user_id})")
    
    # Initialize Leo agent
    leo_agent = LeoPydanticAgent()
    
    # Test queries about daily plans
    plan_queries = [
        "What's my plan for Monday?",
        "Show me my Monday plan",
        "What should I do today if it's Monday?",
        "Can you give me my plan for day 1?",
        "What's my morning routine and Monday activities?"
    ]
    
    print("\n" + "=" * 50)
    print("🎯 TESTING DAILY PLAN QUERIES")
    print("=" * 50)
    
    for i, query in enumerate(plan_queries, 1):
        print(f"\n📝 Test {i}: {query}")
        print("-" * 40)
        
        try:
            response = await leo_agent.process_message(
                user_message=query,
                db=db,
                user_id=test_user.user_id,
                internal_user_id=test_user.id,
                session_id="test_daily_plan_session"
            )
            
            print(f"✅ Response generated")
            print(f"📄 Content length: {len(response.content)} characters")
            
            # Check if response contains plan-specific content
            plan_indicators = [
                "mainFocus", "main focus", "system building", "deep focus", 
                "evening reflection", "morning routine", "Monday", "day 1"
            ]
            
            plan_content_found = any(indicator.lower() in response.content.lower() 
                                   for indicator in plan_indicators)
            
            if plan_content_found:
                print("✅ Plan content detected in response")
            else:
                print("⚠️  No specific plan content detected")
            
            # Show a preview of the response
            preview = response.content[:200] + "..." if len(response.content) > 200 else response.content
            print(f"📋 Response preview: {preview}")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 VALIDATION SUMMARY")
    print("=" * 50)
    print("✅ Daily plan access test completed")
    print("🧠 Leo should now show actual plan content, not generic advice")
    print("📅 Enhanced system integrates OLD clinical + NEW efficiency")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_daily_plan_access()) 