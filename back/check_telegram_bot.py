#!/usr/bin/env python3
"""
Check Telegram Bot Configuration
This script verifies that the Telegram bot is properly configured and can connect to the Telegram API.
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings
from telegram import Bot
from telegram.error import InvalidToken, Unauthorized, NetworkError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def check_telegram_bot():
    """Check if the Telegram bot is properly configured"""
    try:
        logger.info("🔍 Checking Telegram bot configuration...")
        
        # Check if bot token is configured
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.error("❌ TELEGRAM_BOT_TOKEN not configured in environment variables")
            logger.error("Please set TELEGRAM_BOT_TOKEN in your .env file")
            return False
        
        logger.info("✅ Bot token found in configuration")
        
        # Test connection to Telegram API
        logger.info("🌐 Testing connection to Telegram API...")
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        
        # Get bot info
        bot_info = await bot.get_me()
        logger.info(f"✅ Bot connection successful!")
        logger.info(f"🤖 Bot name: {bot_info.first_name}")
        logger.info(f"👤 Bot username: @{bot_info.username}")
        logger.info(f"🆔 Bot ID: {bot_info.id}")
        logger.info(f"🔗 Bot link: https://t.me/{bot_info.username}")
        
        return True
        
    except InvalidToken:
        logger.error("❌ Invalid bot token")
        logger.error("Please check your TELEGRAM_BOT_TOKEN in the .env file")
        return False
    except Unauthorized:
        logger.error("❌ Bot token is unauthorized")
        logger.error("Please check your TELEGRAM_BOT_TOKEN with @BotFather")
        return False
    except NetworkError as e:
        logger.error(f"❌ Network error: {e}")
        logger.error("Please check your internet connection")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return False

async def main():
    """Main function"""
    try:
        # Load environment variables
        load_dotenv()
        
        success = await check_telegram_bot()
        
        if success:
            logger.info("🎉 Telegram bot configuration is valid!")
            logger.info("You can now run the bot with: python3 run_telegram_bot.py")
        else:
            logger.error("💥 Telegram bot configuration failed!")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 