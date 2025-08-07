#!/usr/bin/env python3
"""
Test script to verify Telegram bot authentication fix
"""

import requests
import json
import time

def test_telegram_auth():
    """Test the telegram authentication endpoint"""
    
    # Test data
    test_data = {
        "telegram_chat_id": 1849840870,  # Your chat ID from the logs
        "auth_method": "login_code",
        "login_code": "298391"  # The code from your logs
    }
    
    print("🧪 Testing Telegram Authentication Fix...")
    print(f"📤 Sending auth request: {json.dumps(test_data, indent=2)}")
    
    try:
        # Call the auth endpoint
        response = requests.post(
            "http://localhost:8000/api/telegram/auth",
            json=test_data,
            timeout=10
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response content: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Authentication successful!")
            print(f"   User: {result.get('user_name')}")
            print(f"   Session ID: {result.get('session_id')}")
            print(f"   Clerk User ID: {result.get('clerk_user_id')}")
            print(f"   Internal User ID: {result.get('internal_user_id')}")
            
            # Test the status endpoint
            print("\n🔍 Testing status endpoint...")
            status_response = requests.get(
                f"http://localhost:8000/api/telegram/status/{test_data['telegram_chat_id']}",
                timeout=10
            )
            
            print(f"📥 Status response: {status_response.status_code}")
            print(f"📥 Status content: {status_response.text}")
            
            if status_response.status_code == 200:
                status_result = status_response.json()
                if status_result.get('authenticated'):
                    print("✅ Status check successful - user is authenticated!")
                else:
                    print("❌ Status check failed - user not authenticated")
            else:
                print("❌ Status endpoint error")
                
        else:
            print("❌ Authentication failed")
            
    except Exception as e:
        print(f"❌ Error testing authentication: {e}")

if __name__ == "__main__":
    test_telegram_auth() 