#!/usr/bin/env python3
"""
Start Leo AI System
This script starts both the backend server and Telegram bot for development.
"""

import os
import sys
import time
import subprocess
import signal
import threading
from pathlib import Path

def start_backend():
    """Start the backend server"""
    print("🚀 Starting Leo Backend Server...")
    try:
        # Start the backend server
        backend_process = subprocess.Popen([
            sys.executable, "run.py"
        ], cwd=Path(__file__).parent)
        
        print("✅ Backend server started (PID: {})".format(backend_process.pid))
        return backend_process
    except Exception as e:
        print(f"❌ Failed to start backend server: {e}")
        return None

def start_telegram_bot():
    """Start the Telegram bot"""
    print("🤖 Starting Leo Telegram Bot...")
    try:
        # Start the Telegram bot
        bot_process = subprocess.Popen([
            sys.executable, "run_telegram_bot.py"
        ], cwd=Path(__file__).parent)
        
        print("✅ Telegram bot started (PID: {})".format(bot_process.pid))
        return bot_process
    except Exception as e:
        print(f"❌ Failed to start Telegram bot: {e}")
        return None

def check_telegram_config():
    """Check if Telegram bot is properly configured"""
    print("🔍 Checking Telegram bot configuration...")
    try:
        result = subprocess.run([
            sys.executable, "check_telegram_bot.py"
        ], cwd=Path(__file__).parent, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Telegram bot configuration is valid")
            return True
        else:
            print("❌ Telegram bot configuration failed:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Failed to check Telegram configuration: {e}")
        return False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\n🛑 Shutting down Leo AI System...")
    sys.exit(0)

def main():
    """Main function"""
    print("🌟 Starting Leo AI System...")
    print("=" * 50)
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Check Telegram configuration first
    if not check_telegram_config():
        print("💥 Cannot start system - Telegram bot configuration is invalid")
        print("Please fix the configuration and try again")
        sys.exit(1)
    
    # Start backend server
    backend_process = start_backend()
    if not backend_process:
        print("💥 Cannot start system - Backend server failed to start")
        sys.exit(1)
    
    # Wait a bit for backend to start
    print("⏳ Waiting for backend server to initialize...")
    time.sleep(3)
    
    # Start Telegram bot
    bot_process = start_telegram_bot()
    if not bot_process:
        print("💥 Cannot start system - Telegram bot failed to start")
        backend_process.terminate()
        sys.exit(1)
    
    print("=" * 50)
    print("🎉 Leo AI System is running!")
    print("📱 Backend Server: http://localhost:8000")
    print("🤖 Telegram Bot: Check your bot username")
    print("🌐 Frontend: http://localhost:5173")
    print("=" * 50)
    print("Press Ctrl+C to stop all services")
    
    try:
        # Keep the main process alive
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend server stopped unexpectedly")
                break
                
            if bot_process.poll() is not None:
                print("❌ Telegram bot stopped unexpectedly")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Received shutdown signal...")
    finally:
        # Cleanup
        print("🧹 Cleaning up processes...")
        
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
                print("✅ Backend server stopped")
            except subprocess.TimeoutExpired:
                backend_process.kill()
                print("⚠️ Backend server force killed")
        
        if bot_process:
            bot_process.terminate()
            try:
                bot_process.wait(timeout=5)
                print("✅ Telegram bot stopped")
            except subprocess.TimeoutExpired:
                bot_process.kill()
                print("⚠️ Telegram bot force killed")
        
        print("👋 Leo AI System shutdown complete")

if __name__ == "__main__":
    main() 