#!/usr/bin/env python3
"""
Test script for Telegram authentication flow
This script helps debug the authentication process
"""

import asyncio
import requests
import json
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings

def test_generate_login_code():
    """Test generating a login code"""
    print("🔍 Testing login code generation...")
    
    try:
        # This would normally require authentication, but we'll test the endpoint structure
        response = requests.post(
            "http://localhost:8000/api/telegram/generate-login-code",
            headers={"Authorization": "Bearer test_token"},  # This will fail but we can see the structure
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_telegram_auth_endpoint():
    """Test the telegram auth endpoint"""
    print("\n🔍 Testing telegram auth endpoint...")
    
    # Test data
    test_data = {
        "telegram_chat_id": 123456789,
        "auth_method": "login_code",
        "login_code": "123456"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/telegram/auth",
            json=test_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_telegram_status_endpoint():
    """Test the telegram status endpoint"""
    print("\n🔍 Testing telegram status endpoint...")
    
    try:
        response = requests.get(
            "http://localhost:8000/api/telegram/status/123456789",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def check_telegram_codes_file():
    """Check if the telegram codes file exists and is readable"""
    print("\n🔍 Checking telegram codes file...")
    
    codes_file = "telegram_login_codes.json"
    
    if os.path.exists(codes_file):
        try:
            with open(codes_file, 'r') as f:
                codes = json.load(f)
            print(f"✅ Codes file exists with {len(codes)} codes")
            for code, data in codes.items():
                print(f"  Code: {code}, User: {data.get('user_name', 'Unknown')}")
        except Exception as e:
            print(f"❌ Error reading codes file: {e}")
    else:
        print("❌ Codes file does not exist")

def main():
    """Main test function"""
    print("🚀 Telegram Authentication Flow Test")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("⚠️ Backend responded but not healthy")
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running on localhost:8000")
        print("Please start the backend first with: python run.py")
        return
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
        return
    
    # Run tests
    test_generate_login_code()
    test_telegram_auth_endpoint()
    test_telegram_status_endpoint()
    check_telegram_codes_file()
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print("1. If you see 401/403 errors, that's expected for unauthenticated requests")
    print("2. If you see 404 errors, the endpoints exist but may have issues")
    print("3. If you see connection errors, make sure the backend is running")
    print("4. Check the telegram_login_codes.json file for stored codes")

if __name__ == "__main__":
    main() 