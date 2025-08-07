#!/usr/bin/env python3
"""
Debug script for complete Telegram authentication flow
This script helps test the entire authentication process step by step
"""

import asyncio
import requests
import json
import sys
import os
import time

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def print_step(step_num, title):
    """Print a formatted step header"""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*60}")

def print_success(message):
    """Print a success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print an error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print an info message"""
    print(f"ℹ️ {message}")

def check_backend_health():
    """Check if the backend is running and healthy"""
    print_step(1, "Checking Backend Health")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("Backend is running and healthy")
            print_info(f"Leo System: {data.get('leo_system', 'Unknown')}")
            return True
        else:
            print_error(f"Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Backend is not running on localhost:8000")
        print_info("Please start the backend with: python run.py")
        return False
    except Exception as e:
        print_error(f"Error checking backend: {e}")
        return False

def check_telegram_endpoints():
    """Check if Telegram endpoints are accessible"""
    print_step(2, "Checking Telegram Endpoints")
    
    endpoints = [
        ("POST", "/api/telegram/generate-login-code"),
        ("POST", "/api/telegram/auth"),
        ("GET", "/api/telegram/status/123456789")
    ]
    
    for method, endpoint in endpoints:
        try:
            if method == "POST":
                response = requests.post(f"http://localhost:8000{endpoint}", 
                                       json={}, timeout=5)
            else:
                response = requests.get(f"http://localhost:8000{endpoint}", 
                                      timeout=5)
            
            print_info(f"{method} {endpoint}: {response.status_code}")
            
            # 401/403 is expected for unauthenticated requests
            if response.status_code in [401, 403]:
                print_success("Endpoint exists (authentication required)")
            elif response.status_code == 404:
                print_error("Endpoint not found")
            else:
                print_info(f"Response: {response.text[:100]}...")
                
        except Exception as e:
            print_error(f"Error testing {method} {endpoint}: {e}")

def check_telegram_codes_file():
    """Check the telegram codes file"""
    print_step(3, "Checking Telegram Codes File")
    
    codes_file = "telegram_login_codes.json"
    
    if os.path.exists(codes_file):
        try:
            with open(codes_file, 'r') as f:
                codes = json.load(f)
            print_success(f"Codes file exists with {len(codes)} codes")
            
            if codes:
                print_info("Current codes:")
                for code, data in codes.items():
                    user_name = data.get('user_name', 'Unknown')
                    expires_at = data.get('expires_at', 0)
                    is_expired = time.time() > expires_at
                    status = "EXPIRED" if is_expired else "VALID"
                    print(f"  • {code}: {user_name} ({status})")
            else:
                print_info("No codes currently stored")
                
        except Exception as e:
            print_error(f"Error reading codes file: {e}")
    else:
        print_info("Codes file does not exist (will be created when needed)")

def simulate_login_flow():
    """Simulate the login flow"""
    print_step(4, "Simulating Login Flow")
    
    # Test data
    test_chat_id = 123456789
    test_code = "123456"
    
    print_info(f"Testing with chat_id: {test_chat_id}")
    print_info(f"Testing with code: {test_code}")
    
    # Test the auth endpoint
    auth_data = {
        "telegram_chat_id": test_chat_id,
        "auth_method": "login_code",
        "login_code": test_code
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/telegram/auth",
            json=auth_data,
            timeout=10
        )
        
        print_info(f"Auth response status: {response.status_code}")
        print_info(f"Auth response: {response.text}")
        
        if response.status_code == 404:
            print_success("Expected response - code not found (since we used a test code)")
        elif response.status_code == 200:
            print_success("Authentication successful!")
        else:
            print_info("Unexpected response")
            
    except Exception as e:
        print_error(f"Error testing auth: {e}")

def check_telegram_bot_service():
    """Check if the telegram bot service is properly configured"""
    print_step(5, "Checking Telegram Bot Service")
    
    try:
        from app.services.telegram_bot_service import telegram_bot_service
        from app.config.settings import settings
        
        print_info("Telegram bot service imported successfully")
        
        # Check if bot token is configured
        if settings.TELEGRAM_BOT_TOKEN:
            print_success("Bot token is configured")
            print_info(f"Token starts with: {settings.TELEGRAM_BOT_TOKEN[:10]}...")
        else:
            print_error("Bot token is not configured")
            print_info("Set TELEGRAM_BOT_TOKEN in your .env file")
        
        # Check if clerk secret is configured
        if settings.CLERK_SECRET_KEY:
            print_success("Clerk secret key is configured")
        else:
            print_error("Clerk secret key is not configured")
            print_info("Set CLERK_SECRET_KEY in your .env file")
        
        # Check if the service has the required attributes
        if hasattr(telegram_bot_service, 'telegram_user_sessions'):
            print_success("Telegram user sessions storage initialized")
        else:
            print_error("Telegram user sessions storage not found")
            
        if hasattr(telegram_bot_service, 'leo_agent'):
            print_success("Leo agent initialized")
        else:
            print_error("Leo agent not found")
            
    except ImportError as e:
        print_error(f"Error importing telegram bot service: {e}")
    except Exception as e:
        print_error(f"Error checking telegram bot service: {e}")

def provide_troubleshooting_tips():
    """Provide troubleshooting tips"""
    print_step(6, "Troubleshooting Tips")
    
    print_info("If you're having issues with the Telegram bot:")
    print("")
    print("1. 🔧 Backend Issues:")
    print("   • Make sure the backend is running: python run.py")
    print("   • Check the logs for any errors")
    print("   • Verify all environment variables are set")
    print("")
    print("2. 🤖 Telegram Bot Issues:")
    print("   • Make sure TELEGRAM_BOT_TOKEN is set in .env")
    print("   • Run the bot separately: python run_telegram_bot.py")
    print("   • Check if the bot is responding to /start")
    print("")
    print("3. 🔐 Authentication Issues:")
    print("   • Make sure CLERK_SECRET_KEY is set in .env")
    print("   • Verify the frontend is accessible at oylan.me/telegram-login")
    print("   • Check if login codes are being generated")
    print("")
    print("4. 🗄️ Database Issues:")
    print("   • Make sure the database is running")
    print("   • Check if user tables exist")
    print("   • Verify database connection settings")
    print("")
    print("5. 🔍 Debug Commands:")
    print("   • Test endpoints: python test_telegram_auth.py")
    print("   • Check bot status: python check_telegram_bot.py")
    print("   • View logs: tail -f telegram_bot.log")

def main():
    """Main debug function"""
    print("🚀 Telegram Authentication Flow Debug")
    print("This script will help you identify issues with the Telegram bot authentication")
    
    # Run all checks
    backend_ok = check_backend_health()
    
    if backend_ok:
        check_telegram_endpoints()
        check_telegram_codes_file()
        simulate_login_flow()
        check_telegram_bot_service()
    else:
        print_error("Skipping other checks due to backend issues")
    
    provide_troubleshooting_tips()
    
    print(f"\n{'='*60}")
    print("🎯 Debug Complete!")
    print("Check the output above for any issues and follow the troubleshooting tips.")
    print(f"{'='*60}")

if __name__ == "__main__":
    main() 