#!/usr/bin/env python3
"""
Helper script to get Clerk user ID for Telegram bot authentication
This script helps users find their Clerk user ID to connect with the Telegram bot.
"""

import sys
import os
import requests
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings

def get_user_info_from_token(token):
    """Get user info from a Clerk JWT token"""
    try:
        # Use Clerk's verify endpoint
        url = "https://api.clerk.com/v1/verify"
        headers = {
            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        data = {"token": token}
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting user info: {e}")
        return None

def main():
    """Main function to help users get their Clerk user ID"""
    print("🔍 Leo Telegram Bot - User ID Helper")
    print("=" * 50)
    print("This script helps you find your Clerk user ID to connect with the Telegram bot.")
    print()
    
    # Check if Clerk secret key is configured
    if not settings.CLERK_SECRET_KEY:
        print("❌ Clerk secret key not configured")
        print("💡 Make sure CLERK_SECRET_KEY is set in your .env file")
        return
    
    print("📝 To get your Clerk user ID, you need to:")
    print("1. Go to oylan.me and sign in")
    print("2. Open your browser's Developer Tools (F12)")
    print("3. Go to the Console tab")
    print("4. Run this JavaScript code:")
    print()
    print("```javascript")
    print("// Get your Clerk user ID")
    print("const token = await window.Clerk.session.getToken();")
    print("console.log('Your Clerk token:', token);")
    print("```")
    print()
    print("5. Copy the token and paste it below:")
    print()
    
    # Get token from user
    token = input("🔑 Paste your Clerk token here: ").strip()
    
    if not token:
        print("❌ No token provided")
        return
    
    print("\n🔍 Verifying token...")
    
    # Get user info
    user_info = get_user_info_from_token(token)
    
    if user_info and user_info.get('sub'):
        user_id = user_info['sub']
        email = user_info.get('email', 'Not provided')
        first_name = user_info.get('first_name', 'Not provided')
        last_name = user_info.get('last_name', 'Not provided')
        
        print("\n✅ Token verified successfully!")
        print("=" * 30)
        print(f"👤 Name: {first_name} {last_name}")
        print(f"📧 Email: {email}")
        print(f"🆔 User ID: {user_id}")
        print()
        print("🎯 Now you can use this in Telegram:")
        print(f"   /login {user_id}")
        print()
        print("📱 Steps to connect:")
        print("1. Open Telegram")
        print("2. Find @Leo_Oylan_bot")
        print("3. Send: /start")
        print(f"4. Send: /login {user_id}")
        print("5. Start chatting with Leo! 🌟")
        
    else:
        print("\n❌ Failed to verify token")
        print("💡 Make sure:")
        print("   - You're signed in to oylan.me")
        print("   - The token is copied correctly")
        print("   - Your Clerk configuration is correct")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1) 