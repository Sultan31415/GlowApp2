#!/usr/bin/env python3
"""
Test script for Leo Telegram Bot
This script tests the bot configuration and basic functionality.
"""

import asyncio
import sys
import os
import requests

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings
from app.services.telegram_bot_service import telegram_bot_service

async def test_bot_configuration():
    """Test bot configuration and basic setup"""
    print("🧪 Testing Leo Telegram Bot Configuration...")
    print("=" * 50)
    
    # Test 1: Check bot token
    print("1. Checking bot token...")
    if settings.TELEGRAM_BOT_TOKEN:
        print("   ✅ Bot token is configured")
        print(f"   📝 Token: {settings.TELEGRAM_BOT_TOKEN[:20]}...")
    else:
        print("   ❌ Bot token is not configured")
        print("   💡 Add TELEGRAM_BOT_TOKEN to your .env file")
        return False
    
    # Test 2: Check Clerk configuration
    print("\n2. Checking Clerk configuration...")
    if settings.CLERK_SECRET_KEY:
        print("   ✅ Clerk secret key is configured")
    else:
        print("   ❌ Clerk secret key is not configured")
        print("   💡 Add CLERK_SECRET_KEY to your .env file")
        return False
    
    # Test 3: Test bot initialization
    print("\n3. Testing bot initialization...")
    try:
        await telegram_bot_service.initialize()
        print("   ✅ Bot initialized successfully")
    except Exception as e:
        print(f"   ❌ Bot initialization failed: {e}")
        return False
    
    # Test 4: Test bot info
    print("\n4. Testing bot info...")
    try:
        bot_info = await telegram_bot_service.application.bot.get_me()
        print(f"   ✅ Bot info retrieved successfully")
        print(f"   🤖 Bot name: {bot_info.first_name}")
        print(f"   📝 Bot username: @{bot_info.username}")
        print(f"   🆔 Bot ID: {bot_info.id}")
    except Exception as e:
        print(f"   ❌ Failed to get bot info: {e}")
        return False
    
    # Test 5: Test database connection (if available)
    print("\n5. Testing database connection...")
    try:
        from app.db.session import get_db
        db = next(get_db())
        print("   ✅ Database connection successful")
    except Exception as e:
        print(f"   ⚠️  Database connection failed: {e}")
        print("   💡 Make sure your database is running")
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed!")
    return True

async def test_telegram_api():
    """Test Telegram API directly"""
    print("\n🌐 Testing Telegram API...")
    print("=" * 30)
    
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        print("❌ No bot token available")
        return False
    
    try:
        # Test getMe endpoint
        url = f"https://api.telegram.org/bot{token}/getMe"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                bot_info = data['result']
                print(f"✅ API test successful")
                print(f"   🤖 Bot: {bot_info['first_name']}")
                print(f"   📝 Username: @{bot_info['username']}")
                print(f"   🆔 ID: {bot_info['id']}")
                return True
            else:
                print(f"❌ API returned error: {data}")
                return False
        else:
            print(f"❌ API request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 Leo Telegram Bot Test Suite")
    print("=" * 50)
    
    # Test configuration
    config_ok = await test_bot_configuration()
    
    # Test Telegram API
    api_ok = await test_telegram_api()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Configuration: {'✅ PASS' if config_ok else '❌ FAIL'}")
    print(f"   Telegram API: {'✅ PASS' if api_ok else '❌ FAIL'}")
    
    if config_ok and api_ok:
        print("\n🎉 All tests passed! Your bot is ready to run.")
        print("💡 Run: python run_telegram_bot.py")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration.")
        print("📖 See TELEGRAM_BOT_SETUP.md for setup instructions")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1) 