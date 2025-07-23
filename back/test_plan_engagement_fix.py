#!/usr/bin/env python3
"""
Test Leo's plan engagement assessment to prevent confusion about unused plans
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

async def test_plan_engagement_scenarios():
    """Test different plan engagement scenarios"""
    print("🧪 TESTING: Plan Engagement Assessment")
    print("=" * 60)
    
    try:
        from app.services.leo_pydantic_agent import LeoDeps
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        
        # Scenario 1: User has plan but never mentioned it (CRITICAL FIX)
        print("\n📋 SCENARIO 1: Plan exists but user never mentioned it")
        print("=" * 50)
        
        scenario_1_deps = LeoDeps(
            db=db,
            user_id='test_user_scenario_1',
            internal_user_id=1001,
            session_id='test_session_1',
            daily_plan={
                'id': 1,
                'created_at': '2024-01-10T14:00:00',  # 2 weeks ago
                'plan_type': '7-day',
                'plan_json': {'morningLaunchpad': {'meditation': '10 minutes'}}
            },
            conversation_history=[
                {
                    'role': 'user',
                    'content': 'I feel stressed',
                    'timestamp': '2024-01-24T14:00:00'
                }
                # No plan mentions in conversation history!
            ]
        )
        
        # Test the assessment
        from app.services.leo_pydantic_agent import assess_plan_engagement
        from pydantic_ai import RunContext
        
        ctx = RunContext(deps=scenario_1_deps, model=None, usage=None, prompt=None)
        result_1 = await assess_plan_engagement(ctx)
        
        print(f"✅ Plan Status: {result_1['plan_status']}")
        print(f"✅ Engagement Level: {result_1['engagement_level']}")
        print(f"✅ Communication Approach: {result_1['communication_approach']}")
        print(f"✅ Questions to Ask: {result_1['questions_to_ask']}")
        
        if result_1['plan_status'] in ['dormant_or_forgotten', 'likely_stale']:
            print("🎉 CORRECT: Leo will NOT mention the 7-day plan")
            print("   Will ask: 'What does your current wellness routine look like?'")
        else:
            print("❌ PROBLEM: Leo might still reference unused plan")
        
        # Scenario 2: User actively mentions tracking
        print("\n📋 SCENARIO 2: User actively mentions plan tracking")
        print("=" * 50)
        
        scenario_2_deps = LeoDeps(
            db=db,
            user_id='test_user_scenario_2',
            internal_user_id=1002,
            session_id='test_session_2',
            daily_plan={
                'id': 2,
                'created_at': '2024-01-24T14:00:00',  # Today - very recent
                'plan_type': '7-day',
                'plan_json': {'morningLaunchpad': {'meditation': '10 minutes'}}
            },
            conversation_history=[
                {
                    'role': 'user',
                    'content': 'I completed my morning routine today',
                    'timestamp': '2024-01-24T09:00:00'
                },
                {
                    'role': 'user',
                    'content': 'Day 3 of my plan is going well',
                    'timestamp': '2024-01-24T14:00:00'
                }
            ]
        )
        
        ctx_2 = RunContext(deps=scenario_2_deps, model=None, usage=None, prompt=None)
        result_2 = await assess_plan_engagement(ctx_2)
        
        print(f"✅ Plan Status: {result_2['plan_status']}")
        print(f"✅ Engagement Level: {result_2['engagement_level']}")
        print(f"✅ Communication Approach: {result_2['communication_approach']}")
        
        if result_2['engagement_level'] == 'actively_tracking':
            print("🎉 CORRECT: Leo can confidently reference plan progress")
            print("   Can ask: 'How has day 3 of your plan been going?'")
        else:
            print("❌ PROBLEM: Leo not detecting active engagement")
        
        # Scenario 3: Old plan (should be considered stale)
        print("\n📋 SCENARIO 3: Very old plan (should offer fresh start)")
        print("=" * 50)
        
        scenario_3_deps = LeoDeps(
            db=db,
            user_id='test_user_scenario_3',
            internal_user_id=1003,
            session_id='test_session_3',
            daily_plan={
                'id': 3,
                'created_at': '2023-12-01T14:00:00',  # 2 months ago
                'plan_type': '7-day',
                'plan_json': {'morningLaunchpad': {'meditation': '10 minutes'}}
            },
            conversation_history=[
                {
                    'role': 'user',
                    'content': 'I need to get back on track',
                    'timestamp': '2024-01-24T14:00:00'
                }
            ]
        )
        
        ctx_3 = RunContext(deps=scenario_3_deps, model=None, usage=None, prompt=None)
        result_3 = await assess_plan_engagement(ctx_3)
        
        print(f"✅ Plan Status: {result_3['plan_status']}")
        print(f"✅ Communication Approach: {result_3['communication_approach']}")
        
        if result_3['plan_status'] == 'likely_stale':
            print("🎉 CORRECT: Leo will offer fresh start instead of referencing old plan")
        else:
            print("❌ PROBLEM: Leo might reference very old plan")
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 PLAN ENGAGEMENT ASSESSMENT SUMMARY")
        print("=" * 60)
        
        scenarios_passed = 0
        if result_1['plan_status'] in ['dormant_or_forgotten', 'likely_stale']:
            scenarios_passed += 1
        if result_2['engagement_level'] == 'actively_tracking':
            scenarios_passed += 1
        if result_3['plan_status'] == 'likely_stale':
            scenarios_passed += 1
        
        print(f"✅ Scenarios Passed: {scenarios_passed}/3")
        
        if scenarios_passed == 3:
            print("🎉 EXCELLENT: Plan engagement assessment working correctly!")
            print("   ✅ Won't confuse users with unused plans")
            print("   ✅ Detects active engagement properly")
            print("   ✅ Handles stale plans appropriately")
            print("   📈 READY FOR TESTING")
        else:
            print("⚠️  NEEDS REFINEMENT: Some scenarios not handled correctly")
        
        db.close()
        return scenarios_passed == 3
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def show_expected_responses():
    """Show what Leo should say in each scenario"""
    print("\n" + "=" * 60)
    print("💭 EXPECTED RESPONSES AFTER FIX")
    print("=" * 60)
    
    print("\n👤 USER: 'I feel stressed' (has unused 7-day plan in database)")
    print("\n❌ OLD LEO:")
    print("'From analyzing your patterns, I see you're actively working within a 7-day wellness plan you recently created...'")
    print("→ USER THINKS: 'What 7-day plan? When did I create that?'")
    
    print("\n✅ NEW LEO (Fixed):")
    print("'I can hear the stress in your message, and that's completely valid. Looking at your wellness data, I notice your emotional health score has been fluctuating recently.")
    print()
    print("What does your current wellness routine look like? I'm curious about what you've been doing to take care of yourself lately.'")
    print("→ USER THINKS: 'This makes sense, he's asking about my actual routine'")
    
    print("\n🎯 KEY IMPROVEMENT:")
    print("   ❌ Don't assume plans are being used")
    print("   ✅ Ask about current routines first")  
    print("   ❌ Don't reference data user might not remember")
    print("   ✅ Explore organically what they're actually doing")

if __name__ == "__main__":
    # Test plan engagement
    result = asyncio.run(test_plan_engagement_scenarios())
    
    if result:
        asyncio.run(show_expected_responses())
        print("\n🚀 CRITICAL FIX IMPLEMENTED!")
        print("   Restart server and test 'I feel stressed' again")
        print("   Should see much more appropriate response")
    else:
        print("\n🔧 NEEDS MORE WORK")
        print("   Plan engagement assessment not working correctly") 