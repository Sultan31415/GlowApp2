#!/usr/bin/env python3
"""
Helper script to get your Clerk user ID from oylan.me
This will help you connect your Telegram bot to your oylan.me account
"""

import os
import sys
import json
from pathlib import Path

def main():
    print("🔍 How to Get Your Clerk User ID from oylan.me")
    print("=" * 50)
    print()
    
    print("📋 Step-by-Step Instructions:")
    print()
    print("1. 🌐 Open your web browser and go to: https://oylan.me")
    print("2. 🔐 Sign in to your account (or create one if you don't have it)")
    print("3. 🖥️ Open Developer Tools:")
    print("   • Press F12 or right-click → 'Inspect'")
    print("   • Go to 'Console' tab")
    print("4. 📝 Copy and paste this code in the console:")
    print()
    print("   // Get your Clerk user ID")
    print("   if (window.Clerk && window.Clerk.user) {")
    print("       console.log('Your Clerk User ID:', window.Clerk.user.id);")
    print("       alert('Your Clerk User ID: ' + window.Clerk.user.id);")
    print("   } else {")
    print("       console.log('Clerk not loaded or user not signed in');")
    print("       alert('Please make sure you are signed in to oylan.me');")
    print("   }")
    print()
    print("5. 🔑 Copy the user ID that appears (it looks like: user_2abc123def456)")
    print("6. 💬 Go back to Telegram and send: /login YOUR_USER_ID")
    print("   Example: /login user_2abc123def456")
    print()
    print("🎯 Alternative Method (if the above doesn't work):")
    print("1. Go to https://oylan.me")
    print("2. Sign in")
    print("3. Open Developer Tools → Network tab")
    print("4. Refresh the page")
    print("5. Look for requests to 'clerk' or 'users' endpoints")
    print("6. Find your user ID in the response data")
    print()
    print("❓ Need help? Contact support or check the documentation.")
    print()
    
    # Check if .env file exists
    env_file = Path("../.env")
    if env_file.exists():
        print("✅ Found .env file")
        print("📝 Make sure TELEGRAM_BOT_TOKEN is set in your .env file")
    else:
        print("⚠️  No .env file found")
        print("📝 Create a .env file with your TELEGRAM_BOT_TOKEN")
    
    print()
    print("🚀 Once you have your user ID, you can:")
    print("   • Use /login YOUR_USER_ID in Telegram")
    print("   • Start chatting with Leo!")
    print("   • Get personalized wellness insights")

if __name__ == "__main__":
    main() 