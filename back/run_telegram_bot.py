#!/usr/bin/env python3
"""
Telegram Bot Runner for Leo AI
This script runs the Telegram bot that integrates with the Leo AI system.
"""

import asyncio
import logging
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.telegram_bot_service import telegram_bot_service
from app.config.settings import settings
from telegram.ext import CommandHandler, MessageHandler, CallbackQueryHandler, filters

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('telegram_bot.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main function to run the Telegram bot"""
    try:
        logger.info("🚀 Starting Leo Telegram Bot...")
        
        # Check if bot token is configured
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.error("❌ TELEGRAM_BOT_TOKEN not configured in environment variables")
            logger.error("Please set TELEGRAM_BOT_TOKEN in your .env file")
            return
        
        logger.info("✅ Bot token configured")
        logger.info(f"🤖 Bot will respond to: @Leo_Oylan_bot")
        
        # Create and configure the application
        from telegram.ext import Application
        
        application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
        
        # Add handlers
        application.add_handler(CommandHandler("start", telegram_bot_service.start_command))
        application.add_handler(CommandHandler("help", telegram_bot_service.help_command))
        application.add_handler(CommandHandler("login", telegram_bot_service.login_command))
        application.add_handler(CommandHandler("logout", telegram_bot_service.logout_command))
        application.add_handler(CommandHandler("status", telegram_bot_service.status_command))
        application.add_handler(CommandHandler("newchat", telegram_bot_service.new_chat_command))
        
        # Handle text messages (chat with Leo)
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, telegram_bot_service.handle_message))
        
        # Handle button callbacks
        application.add_handler(CallbackQueryHandler(telegram_bot_service.handle_button))
        
        logger.info("Telegram bot initialized successfully")
        logger.info("Starting Telegram bot polling...")
        
        # Start the bot
        application.run_polling()
        
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user (Ctrl+C)")
    except Exception as e:
        logger.error(f"❌ Error running bot: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1) 