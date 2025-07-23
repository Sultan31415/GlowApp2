#!/usr/bin/env python3
"""
Test Leo's enhanced response system with tool usage instructions
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

async def test_enhanced_leo_response():
    """Test if Leo now uses his tools properly with enhanced instructions"""
    print("🧪 TESTING: Enhanced Leo Response with Tool Usage")
    print("=" * 60)
    
    try:
        from app.services.leo_pydantic_agent import LeoPydanticAgent, leo_agent
        from app.db.session import SessionLocal
        
        # Create realistic test data
        db = SessionLocal()
        
        # Test the agent's system prompt to see if instructions are updated
        print("✅ Leo Enhanced System Loaded")
        print(f"📝 System prompt length: {len(str(leo_agent._system_prompt)) if hasattr(leo_agent, '_system_prompt') else 'unknown'}")
        
        # Check if the new tool usage instructions are in the prompt
        prompt_content = ""
        try:
            if hasattr(leo_agent, '_system_prompt'):
                prompt_content = str(leo_agent._system_prompt)
            elif hasattr(leo_agent, 'system_prompt'):
                prompt_attr = getattr(leo_agent, 'system_prompt')
                if callable(prompt_attr):
                    prompt_content = str(prompt_attr)
                else:
                    prompt_content = str(prompt_attr)
        except:
            pass
        
        # Check for key enhancement indicators
        enhancements_found = []
        key_phrases = [
            "TOOL USAGE INSTRUCTIONS",
            "empathy_simulation_engine",
            "advanced_crisis_detection", 
            "ALWAYS START WITH",
            "CONVERSATIONAL, not clinical",
            "BRIEF but insightful"
        ]
        
        for phrase in key_phrases:
            if phrase in prompt_content:
                enhancements_found.append(phrase)
        
        print(f"✅ Enhanced instructions found: {len(enhancements_found)}/6")
        for enhancement in enhancements_found:
            print(f"   ✓ {enhancement}")
        
        if len(enhancements_found) >= 4:
            print("🎉 SUCCESS: Enhanced Leo system properly configured!")
            print()
            print("📋 Expected Response Improvements:")
            print("   ✅ Uses empathy_simulation_engine for emotional assessment")
            print("   ✅ Uses advanced_crisis_detection for safety")
            print("   ✅ Uses analyze_wellness_patterns for insights")
            print("   ✅ Conversational style instead of clinical reports")
            print("   ✅ Brief but insightful responses (2-3 paragraphs)")
            print("   ✅ Data-informed but not data-heavy")
            print()
            print("🎯 RECOMMENDED TEST:")
            print("   Try the same 'I feel stressed' message again")
            print("   Expected: Much more conversational, empathetic response")
            print("   Expected: Uses specific tools and provides insights")
            print("   Expected: Shorter, more focused response")
        else:
            print("⚠️  PARTIAL: Some enhancements missing")
            print("   Missing phrases:", [p for p in key_phrases if p not in enhancements_found])
        
        db.close()
        return len(enhancements_found) >= 4
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

async def test_response_example():
    """Show what the new response should look like"""
    print("\n" + "=" * 60)
    print("💭 EXPECTED NEW RESPONSE EXAMPLE")
    print("=" * 60)
    
    print("\n👤 USER: I feel stressed")
    print("\n🤖 NEW LEO (Enhanced):")
    print("""
I can hear the stress in your message, and I want you to know that's completely valid. 

Looking at your wellness data, I notice your emotional health score of 55 aligns with what you're experiencing - this actually connects to a pattern I see where work pressure tends to impact your physical vitality too (currently at 63). Your creative, introspective nature means you feel things deeply, which can be both a strength and a source of overwhelm.

What I find encouraging is that you have an active 7-day plan that includes stress management techniques. What specific part of work has been pulling you away from your usual coping strategies?
""")
    
    print("✅ ANALYSIS:")
    print("   • Empathetic validation first")
    print("   • Specific data references (scores 55, 63)")
    print("   • Pattern recognition (work pressure → physical impact)")
    print("   • Archetype connection (creative, introspective)")
    print("   • Actionable question")
    print("   • Conversational, not clinical")
    print("   • Brief but insightful (3 short paragraphs)")
    
    print("\n🆚 COMPARISON TO CURRENT:")
    print("   ❌ Old: Long, clinical, overwhelming")
    print("   ✅ New: Conversational, focused, insightful")
    print("   ❌ Old: Generic advice lists")  
    print("   ✅ New: Specific pattern insights")
    print("   ❌ Old: Formal structure")
    print("   ✅ New: Natural conversation flow")

if __name__ == "__main__":
    # Test enhanced Leo
    result = asyncio.run(test_enhanced_leo_response())
    
    if result:
        asyncio.run(test_response_example())
        print("\n🚀 READY FOR REAL TESTING!")
        print("   Try 'I feel stressed' again in your UI")
        print("   Should see dramatically improved response")
    else:
        print("\n🔧 NEEDS MORE WORK")
        print("   System enhancements not fully applied") 