import asyncio
import logging
import requests
from typing import Dict, Optional, Any, List
from datetime import datetime
import json
import uuid

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, 
    CommandHandler, 
    MessageHandler, 
    CallbackQueryHandler,
    ContextTypes, 
    filters
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.chat_message import ChatMessage as DBChatMessage
from app.models.assessment import UserAssessment
from app.services.leo_pydantic_agent import LeoPydanticAgent
from app.config.settings import settings
from clerk_backend_api import Clerk
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, UserPromptPart, TextPart

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class TelegramBotService:
    """
    Telegram bot service that integrates with Leo AI - IDENTICAL to AIChatScreen.tsx
    
    This service provides the EXACT SAME Leo experience as the web app:
    - Same welcome messages and prompts
    - Same intelligent conversation starters
    - Same personalized prompts based on user assessment data
    - Same Leo agent processing and responses
    - Same session management and chat history
    - Same therapeutic interventions and insights
    
    Users get a consistent Leo experience whether using the web app or Telegram.
    """
    
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.application = None
        self.leo_agent = LeoPydanticAgent()
        self.clerk_sdk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)
        
        # Store user sessions for Telegram (like localStorage in AIChatScreen.tsx)
        self.telegram_user_sessions: Dict[int, Dict[str, Any]] = {}
        
        # 🎯 INTELLIGENT PROMPT SYSTEM - IDENTICAL to AIChatScreen.tsx
        self.intelligent_prompts = [
            "Tell me what you've noticed about me, Leo.",
            "I feel anxious after seeing this report.",
            "Where do I even start to fix this?",
            "Ask Leo for a quick pep talk"
        ]
        
        # 🎯 PERSONALIZED PROBLEM-FOCUSED PROMPTS - IDENTICAL to AIChatScreen.tsx
        self.personalized_prompts = [
            "Leo, what problems do I have that I'm not even aware of?",
            "What's the biggest thing holding me back that I can't see?",
            "Tell me the hard truth about what needs to change in my life",
            "What should I focus on first to improve my wellness?"
        ]
        
        # 🎯 WELCOME MESSAGE - IDENTICAL to AIChatScreen.tsx
        self.welcome_message = "I'm Leo. Your future self asked me to help you get there."
        
    def _build_menu(self, buttons: List[InlineKeyboardButton], n_cols: int = 2, 
                   header_buttons: Optional[List[InlineKeyboardButton]] = None,
                   footer_buttons: Optional[List[InlineKeyboardButton]] = None) -> List[List[InlineKeyboardButton]]:
        """Build a clean menu layout with specified columns"""
        menu = [buttons[i:i + n_cols] for i in range(0, len(buttons), n_cols)]
        if header_buttons:
            menu.insert(0, header_buttons)
        if footer_buttons:
            menu.append(footer_buttons)
        return menu
        
    async def initialize(self):
        """Initialize the Telegram bot application"""
        if not self.bot_token:
            logger.error("TELEGRAM_BOT_TOKEN not configured")
            return
            
        self.application = Application.builder().token(self.bot_token).build()
        
        # Add handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("login", self.login_command))
        self.application.add_handler(CommandHandler("logout", self.logout_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        self.application.add_handler(CommandHandler("newchat", self.new_chat_command))
        self.application.add_handler(CommandHandler("prompts", self.prompts_command))
        
        # Handle text messages (chat with Leo)
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Handle button callbacks
        self.application.add_handler(CallbackQueryHandler(self.handle_button))
        
        # Add global error handler
        self.application.add_error_handler(self.error_handler)
        
        logger.info("Telegram bot initialized successfully")
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command - Enhanced UI/UX with better layout"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # Check if user is already logged in
        if chat_id in self.telegram_user_sessions:
            session = self.telegram_user_sessions[chat_id]
            user_name = session.get('user_name', user.first_name)
            
            # 🎯 Enhanced welcome message with better formatting
            welcome_message = (
                f"🌟 *Welcome back, {user_name}!*\n\n"
                f"*{self.welcome_message}*\n\n"
                f"I'm Leo, your AI wellness mentor. I'm here to help you on your transformation journey.\n\n"
                f"*What I can help you with:*\n"
                f"• 🧠 Personalized wellness insights\n"
                f"• 📅 Daily planning and habit tracking\n"
                f"• 🎯 Goal setting and progress monitoring\n"
                f"• 💭 Therapeutic conversations and support\n"
                f"• 🔍 Pattern recognition and hidden insights\n\n"
                f"*Quick Start:*\n"
                f"Just type your message to start chatting! Here are some ideas:\n\n"
                f"• *\"Tell me what you've noticed about me, Leo\"*\n"
                f"• *\"I feel anxious after seeing this report\"*\n"
                f"• *\"Where do I even start to fix this?\"*\n"
                f"• *\"Ask Leo for a quick pep talk\"*\n\n"
                f"Ready to transform? Let's begin! 💫"
            )
            
            # 🎯 Enhanced keyboard layout with better organization
            keyboard = self._build_menu([
                InlineKeyboardButton("🆕 New Chat", callback_data="newchat"),
                InlineKeyboardButton("💡 Smart Prompts", callback_data="prompts"),
                InlineKeyboardButton("📊 My Status", callback_data="status"),
                InlineKeyboardButton("❓ Help", callback_data="help")
            ], n_cols=2, footer_buttons=[
                InlineKeyboardButton("🔗 Visit oylan.me", url="https://oylan.me")
            ])
        else:
            welcome_message = (
                f"🌟 *Welcome to Leo, your AI wellness mentor!*\n\n"
                f"Hi {user.first_name}! I'm Leo, your future self's AI assistant designed to help you "
                f"achieve your wellness goals and personal growth.\n\n"
                f"*What I can help you with:*\n"
                f"• 🧠 Wellness insights and personalized advice\n"
                f"• 📅 Daily planning and habit tracking\n"
                f"• 🎯 Goal setting and progress monitoring\n"
                f"• 💭 Therapeutic conversations and support\n"
                f"• 🔍 Pattern recognition and hidden insights\n\n"
                f"*Getting Started:*\n"
                f"1. Connect your oylan.me account\n"
                f"2. Start chatting with me about your wellness journey\n"
                f"3. Get personalized insights and support\n\n"
                f"*Ready to begin your transformation?* Let's get you connected! 💫"
            )
            
            # 🎯 Enhanced keyboard for new users
            keyboard = self._build_menu([
                InlineKeyboardButton("🔗 Connect Account", callback_data="login"),
                InlineKeyboardButton("❓ Help", callback_data="help"),
                InlineKeyboardButton("📊 My Status", callback_data="status")
            ], n_cols=2, footer_buttons=[
                InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me")
            ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command - Enhanced with better organization"""
        help_text = (
            "*Leo Telegram Bot Commands:*\n\n"
            "*/start* - Welcome message and quick setup\n"
            "*/login* - Connect your oylan.me account\n"
            "*/logout* - Disconnect your account\n"
            "*/status* - Check your connection status\n"
            "*/newchat* - Start a fresh conversation\n"
            "*/prompts* - Get intelligent conversation starters\n"
            "*/help* - Show this help message\n\n"
            "*How to use:*\n"
            "• Simply type any message to chat with Leo\n"
            "• Ask about your wellness, goals, or daily plans\n"
            "• Leo will provide personalized insights and advice\n"
            "• Your conversation history is saved and synced\n\n"
            "*Need help?* Visit oylan.me for the full experience!"
        )
        
        # Add helpful buttons
        keyboard = self._build_menu([
            InlineKeyboardButton("🔗 Connect Account", callback_data="login"),
            InlineKeyboardButton("💡 Get Prompts", callback_data="prompts"),
            InlineKeyboardButton("📊 Check Status", callback_data="status")
        ], n_cols=2, footer_buttons=[
            InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me")
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            help_text, 
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def login_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /login command"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # Handle both regular messages and callback queries
        if update.callback_query:
            # This is a callback query (button press)
            query = update.callback_query
            message_text = query.data if query.data else ""
            reply_method = query.edit_message_text
        else:
            # This is a regular message
            message_text = update.message.text.strip() if update.message and update.message.text else ""
            reply_method = update.message.reply_text
        
        logger.info(f"Login command received from chat_id: {chat_id}, message: {message_text}")
        
        # Check if user is already logged in
        if chat_id in self.telegram_user_sessions:
            session = self.telegram_user_sessions[chat_id]
            if session.get('clerk_user_id'):
                await reply_method(
                    "✅ *You're already logged in!*\n\n"
                    f"Connected as: {session.get('user_name', 'User')}\n"
                    "You can start chatting with Leo right away!",
                    parse_mode='Markdown'
                )
                return
        
        # Check if user provided a login code or user ID
        if message_text.startswith('/login ') and len(message_text.split()) > 1:
            login_input = message_text.split(' ', 1)[1].strip()
            
            # Check if it's a 6-digit code (new method)
            if login_input.isdigit() and len(login_input) == 6:
                # Use the new login code method
                auth_data = {
                    "telegram_chat_id": chat_id,
                    "auth_method": "login_code",
                    "login_code": login_input
                }
                logger.info(f"Using login code method with code: {login_input}")
            else:
                # Legacy method: assume it's a clerk user ID
                auth_data = {
                    "telegram_chat_id": chat_id,
                    "auth_method": "user_id",
                    "clerk_user_id": login_input
                }
                logger.info(f"Using legacy user_id method with ID: {login_input}")
        elif message_text == "login":
            # Handle login button press - show easy login instructions
            login_message = (
                "*🔐 Connect Your oylan.me Account*\n\n"
                "Let's connect your account easily! Here's how:\n\n"
                "1. 🌐 Visit [oylan.me/telegram-login](https://oylan.me/telegram-login)\n"
                "2. 🔐 Sign in to your oylan.me account\n"
                "3. 📱 Copy the 6-digit code shown\n"
                "4. 💬 Send it to me here: `/login CODE`\n\n"
                "*Example:* `/login 123456`\n\n"
                "That's it! No developer tools needed. 🌟"
            )
            
            keyboard = self._build_menu([
                InlineKeyboardButton("🌐 Get Login Code", url="https://oylan.me/telegram-login"),
                InlineKeyboardButton("📋 Help", callback_data="get_user_id_help"),
                InlineKeyboardButton("❌ Cancel", callback_data="cancel_login")
            ], n_cols=2)
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await reply_method(
                login_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            return
        else:
            # No user ID provided, show login instructions
            login_message = (
                "*🔐 Connect Your oylan.me Account*\n\n"
                "To get personalized insights from Leo, you need to connect your oylan.me account.\n\n"
                "*Easy Method (Recommended):*\n"
                "1. 🌐 Visit [oylan.me/telegram-login](https://oylan.me/telegram-login)\n"
                "2. 🔐 Sign in to your account\n"
                "3. 📱 Copy the 6-digit code\n"
                "4. 💬 Send: `/login CODE`\n\n"
                "*Alternative Method:*\n"
                "Use `/login` to get step-by-step instructions\n\n"
                "Once connected, Leo will have access to your wellness data! 🌟"
            )
            
            keyboard = self._build_menu([
                InlineKeyboardButton("🌐 Get Login Code", url="https://oylan.me/telegram-login"),
                InlineKeyboardButton("📋 Detailed Help", callback_data="get_user_id_help"),
                InlineKeyboardButton("❌ Cancel", callback_data="cancel_login")
            ], n_cols=2)
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await reply_method(
                login_message,
                parse_mode='Markdown',
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            return
        
        # If we reach here, we have a login input to process
        # Validate user ID format (for legacy method)
        if auth_data.get("auth_method") == "user_id":
            clerk_user_id = auth_data.get("clerk_user_id")
            if not clerk_user_id.startswith('user_'):
                await reply_method(
                    "❌ *Invalid user ID format*\n\n"
                    "User ID should start with 'user_' followed by alphanumeric characters.\n"
                    "Example: `user_2abc123def456`\n\n"
                    "Please check your user ID and try again.",
                    parse_mode='Markdown'
                )
                return
        
        # Try to authenticate the user
        try:
            # Call the authentication endpoint
            import requests
            import json
            
            # Use localhost for local development, backend for Docker
            import os
            # Check if we're running in Docker (multiple ways to detect)
            is_docker = (
                os.getenv('DOCKER_ENV') or 
                os.path.exists('/.dockerenv') or 
                os.getenv('KUBERNETES_SERVICE_HOST') or
                'glowapp-telegram-bot' in os.getenv('HOSTNAME', '')
            )
            
            if is_docker:
                auth_url = "http://backend:8000/api/telegram/auth"
                logger.info("Detected Docker environment, using backend service URL")
            else:
                auth_url = "http://localhost:8000/api/telegram/auth"
                logger.info("Detected local environment, using localhost URL")
            
            logger.info(f"Calling auth endpoint: {auth_url}")
            logger.info(f"Auth data: {auth_data}")
            
            response = requests.post(auth_url, json=auth_data, timeout=10)
            logger.info(f"Auth response status: {response.status_code}")
            logger.info(f"Auth response content: {response.text}")
                
            if response.status_code == 200:
                result = response.json()
                
                # 🔧 CRITICAL FIX: Store session data locally in the bot service
                # This ensures the bot knows about the authenticated session
                self.telegram_user_sessions[chat_id] = {
                    'clerk_user_id': result.get('clerk_user_id') or auth_data.get('clerk_user_id'),
                    'internal_user_id': result.get('internal_user_id', 0),  # Will be set by the endpoint
                    'user_name': result.get('user_name', 'User'),
                    'session_id': result.get('session_id', f"telegram_session_{uuid.uuid4().hex}"),
                    'created_at': datetime.utcnow(),
                    'chat_history': []  # Initialize empty chat history
                }
                
                logger.info(f"✅ Session stored locally for chat_id {chat_id}: {self.telegram_user_sessions[chat_id]}")
                
                await reply_method(
                    f"✅ *Login successful!*\n\n"
                    f"Welcome back, {result.get('user_name', 'User')}! 🌟\n\n"
                    f"Leo now has access to your wellness data and can provide personalized insights.\n\n"
                    f"*You can now:*\n"
                    f"• Start chatting with Leo directly\n"
                    f"• Get personalized wellness advice\n"
                    f"• Track your progress\n"
                    f"• Use `/status` to check your connection\n"
                    f"• Use `/newchat` to start fresh conversations\n\n"
                    f"Just type your message to begin! 💫",
                    parse_mode='Markdown'
                )
            elif response.status_code == 404:
                await reply_method(
                    "❌ *Invalid login code*\n\n"
                    "The login code you provided is invalid or has expired.\n\n"
                    "*Please check:*\n"
                    "• You're using the correct 6-digit code\n"
                    "• The code hasn't expired (valid for 5 minutes)\n"
                    "• You're signed in to oylan.me\n\n"
                    "Visit [oylan.me/telegram-login](https://oylan.me/telegram-login) to get a new code.",
                    parse_mode='Markdown'
                )
            elif response.status_code == 410:
                await reply_method(
                    "⏰ *Login code expired*\n\n"
                    "The login code has expired. Login codes are valid for 5 minutes.\n\n"
                    "Please visit [oylan.me/telegram-login](https://oylan.me/telegram-login) to get a fresh code.",
                    parse_mode='Markdown'
                )
            else:
                await reply_method(
                    "❌ *Authentication failed*\n\n"
                    "There was an error connecting your account.\n\n"
                    "*Please try:*\n"
                    "• Checking your user ID again\n"
                    "• Making sure you're signed in to oylan.me\n"
                    "• Contacting support if the problem persists",
                    parse_mode='Markdown'
                )
                    
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling auth endpoint: {e}")
            await reply_method(
                "❌ *Connection error*\n\n"
                "Unable to connect to the authentication service.\n\n"
                "*Please try:*\n"
                "• Making sure the backend services are running\n"
                "• Checking your internet connection\n"
                "• Trying again in a few moments\n\n"
                "If the problem persists, please contact support.",
                parse_mode='Markdown'
            )
        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout calling auth endpoint: {e}")
            await reply_method(
                "⏰ *Request timeout*\n\n"
                "The authentication request took too long to complete.\n\n"
                "*Please try:*\n"
                "• Checking your internet connection\n"
                "• Trying again in a few moments\n"
                "• If the problem persists, contact support",
                parse_mode='Markdown'
            )
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error calling auth endpoint: {e}")
            await reply_method(
                "🔌 *Connection failed*\n\n"
                "Unable to reach the authentication service.\n\n"
                "*Please try:*\n"
                "• Making sure the backend services are running\n"
                "• Checking your internet connection\n"
                "• Trying again in a few moments",
                parse_mode='Markdown'
            )
        except Exception as e:
            logger.error(f"Unexpected error in login: {e}")
            await reply_method(
                "❌ *Unexpected error*\n\n"
                "Something went wrong during login.\n\n"
                "Please try again or contact support.",
                parse_mode='Markdown'
            )
        
        return
    
    async def logout_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /logout command - Enhanced with better UI"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        if chat_id in self.telegram_user_sessions:
            session = self.telegram_user_sessions[chat_id]
            user_name = session.get('user_name', 'User')
            
            # Clear session and chat history
            del self.telegram_user_sessions[chat_id]
            
            logout_message = (
                f"👋 *Goodbye, {user_name}!*\n\n"
                "You've been logged out successfully. Your conversation history has been cleared.\n\n"
                "Use `/login` to reconnect your account anytime!"
            )
            
            # Add reconnection buttons
            keyboard = self._build_menu([
                InlineKeyboardButton("🔗 Reconnect Account", callback_data="login"),
                InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me"),
                InlineKeyboardButton("❓ Help", callback_data="help")
            ], n_cols=2)
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                logout_message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
        else:
            await update.message.reply_text(
                "ℹ️ *Not logged in*\n\n"
                "You're not currently connected to any oylan.me account.\n"
                "Use `/login` to connect your account!",
                parse_mode='Markdown'
            )
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command - Enhanced with better UI"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        if chat_id in self.telegram_user_sessions:
            session = self.telegram_user_sessions[chat_id]
            clerk_user_id = session.get('clerk_user_id')
            user_name = session.get('user_name', 'User')
            session_id = session.get('session_id', 'Unknown')
            
            status_message = (
                f"✅ *Connected to oylan.me*\n\n"
                f"*👤 User:* {user_name}\n"
                f"*🆔 Session:* `{session_id[:12]}...`\n"
                f"*📊 Status:* Active and ready\n\n"
                f"Leo has access to your wellness data and can provide personalized insights! 🌟\n\n"
                f"*💬 Ready to chat?* Just type your message!"
            )
            
            # Add action buttons for connected users
            keyboard = self._build_menu([
                InlineKeyboardButton("🆕 New Chat", callback_data="newchat"),
                InlineKeyboardButton("💡 Get Prompts", callback_data="prompts"),
                InlineKeyboardButton("🔗 Visit oylan.me", url="https://oylan.me"),
                InlineKeyboardButton("🚪 Logout", callback_data="logout")
            ], n_cols=2)
            
        else:
            status_message = (
                "❌ *Not connected*\n\n"
                "You're not currently logged into any oylan.me account.\n\n"
                "*To get started:*\n"
                "• Connect your oylan.me account\n"
                "• Complete your wellness assessment\n"
                "• Get personalized insights from Leo\n\n"
                "*Ready to begin your transformation?* 🌟"
            )
            
            # Add action buttons for disconnected users
            keyboard = self._build_menu([
                InlineKeyboardButton("🔗 Connect Account", callback_data="login"),
                InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me"),
                InlineKeyboardButton("❓ Help", callback_data="help")
            ], n_cols=2)
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(status_message, parse_mode='Markdown', reply_markup=reply_markup)
    
    async def new_chat_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /newchat command - Enhanced with better UI"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        if chat_id in self.telegram_user_sessions:
            session = self.telegram_user_sessions[chat_id]
            
            # 🎯 Generate new session ID and clear chat history
            new_session_id = f"telegram_session_{uuid.uuid4().hex}"
            session['session_id'] = new_session_id
            session['chat_history'] = []  # Clear chat history
            
            new_chat_message = (
                "🆕 *New conversation started!*\n\n"
                "Your previous conversation history has been cleared.\n"
                "Leo is ready for a fresh start! 💫\n\n"
                "*Quick conversation starters:*\n"
                "• *\"Tell me what you've noticed about me, Leo\"*\n"
                "• *\"I feel anxious after seeing this report\"*\n"
                "• *\"Where do I even start to fix this?\"*\n"
                "• *\"Ask Leo for a quick pep talk\"*\n\n"
                "What would you like to discuss today?"
            )
            
            # Add helpful buttons for new chat
            keyboard = self._build_menu([
                InlineKeyboardButton("💡 Get Prompts", callback_data="prompts"),
                InlineKeyboardButton("📊 My Status", callback_data="status"),
                InlineKeyboardButton("🔗 Visit oylan.me", url="https://oylan.me")
            ], n_cols=2)
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                new_chat_message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
        else:
            await update.message.reply_text(
                "❌ *Please login first*\n\n"
                "You need to connect your oylan.me account before starting a conversation.\n"
                "Use `/login` to get started!",
                parse_mode='Markdown'
            )
    
    async def prompts_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /prompts command - Show intelligent conversation starters (like AIChatScreen.tsx)"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # Check if user is logged in
        if chat_id not in self.telegram_user_sessions:
            await update.message.reply_text(
                "❌ *Please login first*\n\n"
                "To get personalized prompts, you need to connect your oylan.me account.\n"
                "Use `/login` to get started!",
                parse_mode='Markdown'
            )
            return
        
        session = self.telegram_user_sessions[chat_id]
        clerk_user_id = session.get('clerk_user_id')
        
        if not clerk_user_id:
            await update.message.reply_text(
                "❌ *Login required*\n\n"
                "Your session is incomplete. Please use `/login` to connect your account.",
                parse_mode='Markdown'
            )
            return
        
        try:
            # 🎯 IDENTICAL to AIChatScreen.tsx - Fetch personalized prompts based on user data
            personalized_prompts = await self._get_personalized_prompts(clerk_user_id)
            
            # Combine intelligent prompts with personalized ones
            all_prompts = self.intelligent_prompts + personalized_prompts
            
            # 🎯 Enhanced prompts display with better formatting
            prompts_text = "*💡 Quick conversation starters:*\n\n"
            for i, prompt in enumerate(all_prompts[:4], 1):  # Show first 4 prompts like web app
                prompts_text += f"**{i}.** {prompt}\n\n"
            
            prompts_text += "*💬 Tap a button below to use a prompt, or copy and paste any of these to start chatting with Leo!*"
            
            # 🎯 Enhanced keyboard with better prompt buttons
            prompt_buttons = []
            for i, prompt in enumerate(all_prompts[:4], 1):
                # Create shorter, more readable button text
                if len(prompt) > 25:
                    button_text = prompt[:22] + "..."
                else:
                    button_text = prompt
                prompt_buttons.append(InlineKeyboardButton(f"💬 {button_text}", callback_data=f"prompt_{i}"))
            
            # Build menu with action buttons
            keyboard = self._build_menu(
                prompt_buttons,
                n_cols=1,  # Single column for better readability
                footer_buttons=[
                    InlineKeyboardButton("🆕 New Chat", callback_data="newchat"),
                    InlineKeyboardButton("❌ Close", callback_data="close_prompts")
                ]
            )
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                prompts_text,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
            
        except Exception as e:
            logger.error(f"Error fetching personalized prompts: {e}")
            # Fallback to basic prompts - IDENTICAL to AIChatScreen.tsx
            prompts_text = "*💡 Quick conversation starters:*\n\n"
            for i, prompt in enumerate(self.intelligent_prompts, 1):
                prompts_text += f"{i}. *{prompt}*\n\n"
            
            prompts_text += "*💬 Just copy and paste any of these to start chatting with Leo!*"
            
            await update.message.reply_text(
                prompts_text,
                parse_mode='Markdown'
            )
    
    async def _get_personalized_prompts(self, clerk_user_id: str) -> List[str]:
        """Get personalized prompts based on user's assessment data - IDENTICAL to AIChatScreen.tsx"""
        try:
            # 🎯 IDENTICAL to AIChatScreen.tsx - Use the same ai-mentor-prompts endpoint
            import requests
            import os
            
            # Check if we're running in Docker
            is_docker = (
                os.getenv('DOCKER_ENV') or 
                os.path.exists('/.dockerenv') or 
                os.getenv('KUBERNETES_SERVICE_HOST') or
                'glowapp-telegram-bot' in os.getenv('HOSTNAME', '')
            )
            
            if is_docker:
                api_url = "http://backend:8000/api/ai-mentor-prompts"
                logger.info("Detected Docker environment, using backend service URL")
            else:
                api_url = "http://localhost:8000/api/ai-mentor-prompts"
                logger.info("Detected local environment, using localhost URL")
            
            # Create a mock user object for the endpoint
            mock_user = {"user_id": clerk_user_id}
            
            # Call the same endpoint that AIChatScreen.tsx uses
            response = requests.get(api_url, headers={"Authorization": f"Bearer mock_token_for_telegram"})
            
            if response.status_code == 200:
                data = response.json()
                personalized_prompts = data.get('personalized_prompts', [])
                logger.info(f"✅ Fetched {len(personalized_prompts)} personalized prompts from ai-mentor-prompts endpoint")
                return personalized_prompts[:4]  # Return top 4 like web app
            else:
                logger.warning(f"Could not fetch personalized prompts from endpoint: {response.status_code}")
                return self.personalized_prompts
                
        except Exception as e:
            logger.error(f"Error getting personalized prompts: {e}")
            # Fallback to default personalized prompts - IDENTICAL to AIChatScreen.tsx
            return [
                "Leo, what problems do I have that I'm not even aware of?",
                "What's the biggest thing holding me back that I can't see?",
                "Tell me the hard truth about what needs to change in my life",
                "What should I focus on first to improve my wellness?"
            ]
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle text messages - chat with Leo (IDENTICAL to AIChatScreen.tsx)"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        message_text = update.message.text
        
        # Check if user is logged in
        if chat_id not in self.telegram_user_sessions:
            await update.message.reply_text(
                "❌ *Please login first*\n\n"
                "To chat with Leo, you need to connect your oylan.me account.\n"
                "Use `/login` to get started!",
                parse_mode='Markdown'
            )
            return
        
        session = self.telegram_user_sessions[chat_id]
        clerk_user_id = session.get('clerk_user_id')
        
        if not clerk_user_id:
            await update.message.reply_text(
                "❌ *Login required*\n\n"
                "Your session is incomplete. Please use `/login` to connect your account.",
                parse_mode='Markdown'
            )
            return
        
        # 🎯 IDENTICAL to AIChatScreen.tsx - Check if this is a new conversation
        chat_history = session.get('chat_history', [])
        is_new_conversation = len(chat_history) == 0
        
        # Send typing indicator
        await context.bot.send_chat_action(chat_id=chat_id, action="typing")
        
        try:
            logger.info(f"Processing message from user {clerk_user_id}: {message_text[:50]}...")
            
            # Process message with Leo
            response = await self.process_message_with_leo(
                message_text, 
                clerk_user_id, 
                session['session_id'],
                session['internal_user_id'],
                chat_history
            )
            
            logger.info(f"Received response from Leo: {len(response['content'])} characters")
            
            # 🎯 IDENTICAL to AIChatScreen.tsx - Update chat history
            chat_history.append({
                'role': 'user',
                'content': message_text,
                'timestamp': datetime.utcnow().isoformat()
            })
            chat_history.append({
                'role': 'assistant',
                'content': response['content'],
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Keep only last 20 messages to avoid memory issues (like AIChatScreen.tsx)
            if len(chat_history) > 20:
                chat_history = chat_history[-20:]
            
            session['chat_history'] = chat_history
            
            # Send Leo's main response
            await update.message.reply_text(
                response['content'],
                parse_mode='Markdown'
            )
            
            # Send additional insights if available
            await self._send_additional_insights(context, chat_id, response)
            
            # 🎯 IDENTICAL to AIChatScreen.tsx - Show intelligent prompts for new conversations
            if is_new_conversation and len(chat_history) == 2:  # After first exchange
                await self._show_intelligent_prompts(update, context, clerk_user_id)
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await update.message.reply_text(
                "❌ *Sorry, I'm having trouble right now*\n\n"
                "Please try again in a moment, or visit oylan.me for the full experience.",
                parse_mode='Markdown'
            )
    
    async def _send_additional_insights(self, context: ContextTypes.DEFAULT_TYPE, chat_id: int, response: dict):
        """Send additional insights from Leo's response (like WebSocket)"""
        try:
            # Send hidden patterns if available
            if response.get('hidden_patterns'):
                patterns_text = self._format_hidden_patterns(response['hidden_patterns'])
                if patterns_text:
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=patterns_text,
                        parse_mode='Markdown'
                    )
            
            # Send CBT intervention if available
            if response.get('cbt_intervention'):
                cbt_text = self._format_cbt_intervention(response['cbt_intervention'])
                if cbt_text:
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=cbt_text,
                        parse_mode='Markdown'
                    )
            
            # Send pattern insights if available
            if response.get('pattern_insights') and len(response['pattern_insights']) > 0:
                pattern_text = self._format_pattern_insights(response['pattern_insights'])
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=pattern_text,
                    parse_mode='Markdown'
                )
            
            # Send strength identification if available
            if response.get('strength_identification') and len(response['strength_identification']) > 0:
                strength_text = self._format_strength_identification(response['strength_identification'])
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=strength_text,
                    parse_mode='Markdown'
                )
            
            # Send growth opportunities if available
            if response.get('growth_opportunities') and len(response['growth_opportunities']) > 0:
                growth_text = self._format_growth_opportunities(response['growth_opportunities'])
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=growth_text,
                    parse_mode='Markdown'
                )
            
            # Send plan update notification if available
            if response.get('plan_updated') and response['plan_updated']:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text="📅 *Your plan has been updated by Leo!*\n\nVisit oylan.me to see the changes.",
                    parse_mode='Markdown'
                )
            
            # Send progress update notification if available
            if response.get('progress_updated') and response['progress_updated']:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text="📊 *Your progress has been updated by Leo!*\n\nVisit oylan.me to see your latest achievements.",
                    parse_mode='Markdown'
                )
                
        except Exception as e:
            logger.error(f"Error sending additional insights: {e}")

    async def _show_intelligent_prompts(self, update: Update, context: ContextTypes.DEFAULT_TYPE, clerk_user_id: str):
        """Show intelligent prompts after first conversation (like AIChatScreen.tsx)"""
        try:
            # Get personalized prompts
            personalized_prompts = await self._get_personalized_prompts(clerk_user_id)
            
            # Combine prompts
            all_prompts = self.intelligent_prompts + personalized_prompts
            
            # 🎯 Enhanced formatting for better UX
            prompts_text = "*💡 Quick conversation starters:*\n\n"
            for i, prompt in enumerate(all_prompts[:4], 1):  # Show first 4 prompts
                prompts_text += f"**{i}.** {prompt}\n\n"
            
            prompts_text += "*💬 Tap a button below to use a prompt, or copy and paste any of these to continue chatting!*"
            
            # 🎯 Enhanced keyboard with better prompt buttons
            prompt_buttons = []
            for i, prompt in enumerate(all_prompts[:4], 1):
                if len(prompt) > 25:
                    button_text = prompt[:22] + "..."
                else:
                    button_text = prompt
                prompt_buttons.append(InlineKeyboardButton(f"💬 {button_text}", callback_data=f"prompt_{i}"))
            
            # Build menu with action buttons
            keyboard = self._build_menu(
                prompt_buttons,
                n_cols=1,  # Single column for better readability
                footer_buttons=[
                    InlineKeyboardButton("❌ Close", callback_data="close_prompts")
                ]
            )
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                prompts_text,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
            
        except Exception as e:
            logger.error(f"Error showing intelligent prompts: {e}")
            # Fallback to basic prompts
            prompts_text = "*💡 Quick conversation starters:*\n\n"
            for i, prompt in enumerate(self.intelligent_prompts[:3], 1):
                prompts_text += f"**{i}.** {prompt}\n\n"
            
            prompts_text += "*💬 Just copy and paste any of these to continue chatting!*"
            
            await update.message.reply_text(
                prompts_text,
                parse_mode='Markdown'
            )
    
    async def handle_button(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle inline button callbacks (IDENTICAL to AIChatScreen.tsx interactions)"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "login":
            await self.login_command(update, context)
        elif query.data == "start":
            await self.start_command(update, context)
        elif query.data == "help":
            await self.help_command(update, context)
        elif query.data == "status":
            await self.status_command(update, context)
        elif query.data == "newchat":
            await self.new_chat_command(update, context)
        elif query.data == "prompts":
            await self.prompts_command(update, context)
        elif query.data.startswith("prompt_"):
            # Handle prompt selection with enhanced UX
            try:
                prompt_index = int(query.data.split("_")[1]) - 1
                all_prompts = self.intelligent_prompts + self.personalized_prompts
                
                if 0 <= prompt_index < len(all_prompts):
                    selected_prompt = all_prompts[prompt_index]
                    
                    # 🎯 Enhanced prompt selection with action buttons
                    prompt_message = (
                        f"*💡 Selected Prompt:*\n\n"
                        f"**{selected_prompt}**\n\n"
                        f"*💬 Ready to send this to Leo?*\n\n"
                        f"*📝 Or type your own message to continue the conversation.*"
                    )
                    
                    # Add action buttons for better UX
                    keyboard = self._build_menu([
                        InlineKeyboardButton("✅ Send to Leo", callback_data=f"send_prompt_{prompt_index}"),
                        InlineKeyboardButton("🔄 Choose Different", callback_data="prompts"),
                        InlineKeyboardButton("❌ Cancel", callback_data="close_prompts")
                    ], n_cols=2)
                    
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    await query.edit_message_text(
                        prompt_message,
                        parse_mode='Markdown',
                        reply_markup=reply_markup
                    )
                else:
                    await query.edit_message_text(
                        "❌ *Invalid prompt selection*\n\n"
                        "Please use `/prompts` to see available conversation starters.",
                        parse_mode='Markdown'
                    )
            except (ValueError, IndexError):
                await query.edit_message_text(
                    "❌ *Error selecting prompt*\n\n"
                    "Please use `/prompts` to see available conversation starters.",
                    parse_mode='Markdown'
                )
        elif query.data.startswith("send_prompt_"):
            # Handle sending selected prompt to Leo
            try:
                prompt_index = int(query.data.split("_")[2])
                all_prompts = self.intelligent_prompts + self.personalized_prompts
                
                if 0 <= prompt_index < len(all_prompts):
                    selected_prompt = all_prompts[prompt_index]
                    
                    # Get chat_id from the callback query
                    chat_id = query.message.chat.id
                    
                    # Check if user is logged in
                    if chat_id not in self.telegram_user_sessions:
                        await query.edit_message_text(
                            "❌ *Please login first*\n\n"
                            "To chat with Leo, you need to connect your oylan.me account.\n"
                            "Use `/login` to get started!",
                            parse_mode='Markdown'
                        )
                        return
                    
                    # Process the prompt with Leo
                    session = self.telegram_user_sessions[chat_id]
                    clerk_user_id = session.get('clerk_user_id')
                    
                    if not clerk_user_id:
                        await query.edit_message_text(
                            "❌ *Login required*\n\n"
                            "Your session is incomplete. Please use `/login` to connect your account.",
                            parse_mode='Markdown'
                        )
                        return
                    
                    # Send typing indicator
                    await context.bot.send_chat_action(chat_id=chat_id, action="typing")
                    
                    # Process with Leo
                    response = await self.process_message_with_leo(
                        selected_prompt,
                        clerk_user_id,
                        session['session_id'],
                        session['internal_user_id'],
                        session.get('chat_history', [])
                    )
                    
                    # Update chat history
                    chat_history = session.get('chat_history', [])
                    chat_history.append({
                        'role': 'user',
                        'content': selected_prompt,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    chat_history.append({
                        'role': 'assistant',
                        'content': response['content'],
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    # Keep only last 20 messages
                    if len(chat_history) > 20:
                        chat_history = chat_history[-20:]
                    
                    session['chat_history'] = chat_history
                    
                    # Send Leo's response
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=response['content'],
                        parse_mode='Markdown'
                    )
                    
                    # Send additional insights if available
                    await self._send_additional_insights(context, chat_id, response)
                    
                    # Update the prompt message to show it was sent
                    await query.edit_message_text(
                        f"✅ *Prompt sent to Leo!*\n\n"
                        f"**{selected_prompt}**\n\n"
                        f"*Check the message above for Leo's response.*",
                        parse_mode='Markdown'
                    )
                    
                else:
                    await query.edit_message_text(
                        "❌ *Invalid prompt selection*\n\n"
                        "Please use `/prompts` to see available conversation starters.",
                        parse_mode='Markdown'
                    )
            except Exception as e:
                logger.error(f"Error sending prompt: {e}")
                await query.edit_message_text(
                    "❌ *Error sending prompt*\n\n"
                    "Please try again or type your message directly.",
                    parse_mode='Markdown'
                )
        elif query.data == "close_prompts":
            await query.edit_message_text(
                "✅ *Prompts closed*\n\n"
                "You can use `/prompts` anytime to get intelligent conversation starters.",
                parse_mode='Markdown'
            )
        elif query.data == "get_user_id_help":
            help_message = (
                "*🔍 How to Get Your Clerk User ID*\n\n"
                "*Step-by-Step Instructions:*\n\n"
                "1. 🌐 Open your web browser and go to: https://oylan.me\n"
                "2. 🔐 Sign in to your account (or create one if you don't have it)\n"
                "3. 🖥️ Open Developer Tools:\n"
                "   • Press F12 or right-click → 'Inspect'\n"
                "   • Go to 'Console' tab\n"
                "4. 📝 Copy and paste this code in the console:\n"
                "   ```javascript\n"
                "   if (window.Clerk && window.Clerk.user) {\n"
                "       console.log('Your Clerk User ID:', window.Clerk.user.id);\n"
                "       alert('Your Clerk User ID: ' + window.Clerk.user.id);\n"
                "   } else {\n"
                "       console.log('Clerk not loaded or user not signed in');\n"
                "       alert('Please make sure you are signed in to oylan.me');\n"
                "   }\n"
                "   ```\n"
                "5. 🔑 Copy the user ID that appears (it looks like: user_2abc123def456)\n"
                "6. 💬 Go back to Telegram and send: `/login YOUR_USER_ID`\n"
                "   Example: `/login user_2abc123def456`\n\n"
                "*Alternative Method (if the above doesn't work):*\n"
                "1. Go to https://oylan.me\n"
                "2. Sign in\n"
                "3. Open Developer Tools → Network tab\n"
                "4. Refresh the page\n"
                "5. Look for requests to 'clerk' or 'users' endpoints\n"
                "6. Find your user ID in the response data\n\n"
                "❓ Need help? Contact support or check the documentation."
            )
            await query.edit_message_text(
                help_message,
                parse_mode='Markdown'
            )
        elif query.data == "logout":
            # Handle logout button press
            chat_id = query.message.chat.id
            
            if chat_id in self.telegram_user_sessions:
                session = self.telegram_user_sessions[chat_id]
                user_name = session.get('user_name', 'User')
                
                # Clear session and chat history
                del self.telegram_user_sessions[chat_id]
                
                logout_message = (
                    f"👋 *Goodbye, {user_name}!*\n\n"
                    "You've been logged out successfully. Your conversation history has been cleared.\n\n"
                    "Use `/login` to reconnect your account anytime!"
                )
                
                # Add reconnection buttons
                keyboard = self._build_menu([
                    InlineKeyboardButton("🔗 Reconnect Account", callback_data="login"),
                    InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me"),
                    InlineKeyboardButton("❓ Help", callback_data="help")
                ], n_cols=2)
                
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    logout_message,
                    parse_mode='Markdown',
                    reply_markup=reply_markup
                )
            else:
                await query.edit_message_text(
                    "ℹ️ *Not logged in*\n\n"
                    "You're not currently connected to any oylan.me account.\n"
                    "Use `/login` to connect your account!",
                    parse_mode='Markdown'
                )
        elif query.data == "cancel_login":
            await query.edit_message_text(
                "❌ *Login cancelled*\n\n"
                "You can use `/login` anytime to connect your account.",
                parse_mode='Markdown'
            )
    
    async def process_message_with_leo(
        self, 
        message: str, 
        clerk_user_id: str, 
        session_id: str,
        internal_user_id: int,
        chat_history: list = None
    ) -> dict:
        """
        Process a message with Leo AI and return structured response
        IDENTICAL to AIChatScreen.tsx WebSocket processing
        """
        db = None
        try:
            # Get database session
            db = next(get_db())
            
            # Convert chat history to the format expected by Leo agent
            message_history: Optional[List[ModelMessage]] = None
            if chat_history:
                message_history = []
                for msg in chat_history[-10:]:  # Last 10 messages for context
                    if msg['role'] == 'user':
                        message_history.append(ModelRequest(parts=[UserPromptPart(content=msg['content'])]))
                    elif msg['role'] == 'assistant':
                        message_history.append(ModelResponse(parts=[TextPart(content=msg['content'])]))
            
            logger.info(f"Processing message with Leo for user {clerk_user_id}, session {session_id}")
            
            # Process with Leo agent
            leo_response = await self.leo_agent.process_message(
                user_message=message,
                db=db,
                user_id=clerk_user_id,
                internal_user_id=internal_user_id,
                session_id=session_id,
                message_history=message_history
            )
            
            logger.info(f"Leo response received: {len(leo_response.content)} characters")
            
            # Return FULL structured response with all Leo data (like WebSocket)
            response = {
                'content': leo_response.content,
                'wellness_insights': leo_response.wellness_insights if hasattr(leo_response, 'wellness_insights') else [],
                'follow_up_questions': leo_response.follow_up_questions if hasattr(leo_response, 'follow_up_questions') else [],
                'crisis_alert': getattr(leo_response, 'crisis_alert', None),
                'hidden_patterns': getattr(leo_response, 'hidden_patterns', None),
                'cbt_intervention': getattr(leo_response, 'cbt_intervention', None),
                'motivational_questions': getattr(leo_response, 'motivational_questions', None),
                'therapeutic_approach': getattr(leo_response, 'therapeutic_approach', None),
                'emotional_state_detected': getattr(leo_response, 'emotional_state_detected', None),
                'pattern_insights': getattr(leo_response, 'pattern_insights', []),
                'strength_identification': getattr(leo_response, 'strength_identification', []),
                'growth_opportunities': getattr(leo_response, 'growth_opportunities', []),
                'tools_used': getattr(leo_response, 'tools_used', []),
                'plan_updated': getattr(leo_response, 'plan_updated', False),
                'progress_updated': getattr(leo_response, 'progress_updated', False),
                'refusal': getattr(leo_response, 'refusal', False)
            }
            
            # Add crisis alert to main content if needed
            if response['crisis_alert']:
                response['content'] += "\n\n⚠️ *Important:* I'm concerned about you right now. Please consider reaching out for professional support."
            
            return response
            
        except Exception as e:
            logger.error(f"Error in process_message_with_leo: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                'content': "I'm having trouble processing your message right now. Please try again or visit oylan.me for the full experience.",
                'wellness_insights': [],
                'follow_up_questions': [],
                'crisis_alert': None,
                'hidden_patterns': None,
                'cbt_intervention': None,
                'motivational_questions': None,
                'therapeutic_approach': None,
                'emotional_state_detected': None,
                'pattern_insights': [],
                'strength_identification': [],
                'growth_opportunities': [],
                'tools_used': [],
                'plan_updated': False,
                'progress_updated': False,
                'refusal': False
            }
        finally:
            # Close database session
            if db:
                db.close()
    
    def _format_hidden_patterns(self, patterns: dict) -> str:
        """Format hidden patterns for Telegram"""
        if not patterns:
            return ""
        
        text = "*🔍 Hidden Patterns Discovered:*\n\n"
        
        # Handle different pattern types
        for pattern_type, pattern_list in patterns.items():
            if pattern_list and isinstance(pattern_list, list):
                text += f"*{pattern_type.replace('_', ' ').title()}:*\n"
                for pattern in pattern_list[:2]:  # Limit to 2 patterns per type
                    if isinstance(pattern, dict):
                        description = pattern.get('description', '')
                        insight = pattern.get('hidden_insight', '')
                        if description:
                            text += f"• {description}\n"
                        if insight:
                            text += f"  💡 *Insight:* {insight}\n"
                text += "\n"
        
        return text.strip()
    
    def _format_cbt_intervention(self, intervention: dict) -> str:
        """Format CBT intervention for Telegram"""
        if not intervention:
            return ""
        
        text = "*🧠 Cognitive Behavioral Therapy:*\n\n"
        
        technique = intervention.get('technique_used', '')
        reframe = intervention.get('reframe_suggestion', '')
        questions = intervention.get('evidence_questions', [])
        homework = intervention.get('homework_suggestion', '')
        
        if technique:
            text += f"*Technique:* {technique}\n\n"
        
        if reframe:
            text += f"*Reframe:* {reframe}\n\n"
        
        if questions and len(questions) > 0:
            text += "*Evidence Questions:*\n"
            for i, question in enumerate(questions[:3], 1):  # Limit to 3 questions
                text += f"{i}. {question}\n"
            text += "\n"
        
        if homework:
            text += f"*Homework:* {homework}\n"
        
        return text.strip()
    
    def _format_pattern_insights(self, insights: list) -> str:
        """Format pattern insights for Telegram"""
        if not insights:
            return ""
        
        text = "*🔍 Key Pattern Insights:*\n\n"
        for i, insight in enumerate(insights[:3], 1):  # Limit to 3 insights
            text += f"{i}. {insight}\n"
        
        return text.strip()
    
    def _format_strength_identification(self, strengths: list) -> str:
        """Format strength identification for Telegram"""
        if not strengths:
            return ""
        
        text = "*💪 Your Strengths:*\n\n"
        for i, strength in enumerate(strengths[:3], 1):  # Limit to 3 strengths
            text += f"{i}. {strength}\n"
        
        return text.strip()
    
    def _format_growth_opportunities(self, opportunities: list) -> str:
        """Format growth opportunities for Telegram"""
        if not opportunities:
            return ""
        
        text = "*🌱 Growth Opportunities:*\n\n"
        for i, opportunity in enumerate(opportunities[:3], 1):  # Limit to 3 opportunities
            text += f"{i}. {opportunity}\n"
        
        return text.strip()
    
    def verify_clerk_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Clerk JWT token and return user info"""
        try:
            with Clerk(bearer_auth=str(settings.CLERK_SECRET_KEY)) as clerk:
                res = clerk.clients.verify(request={"token": token})
                if not res or not getattr(res, 'object', None):
                    return None
                
                user_id = getattr(res, 'id', None) or getattr(res, 'user_id', None)
                email = getattr(res, 'email_address', None) or getattr(res, 'email', None)
                first_name = getattr(res, 'first_name', None)
                last_name = getattr(res, 'last_name', None)
                
                if not user_id:
                    return None
                
                return {
                    "user_id": user_id,
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                }
        except Exception as e:
            logger.error(f"Error verifying Clerk token: {e}")
            return None
    
    async def start_polling(self):
        """Start the bot polling"""
        logger.info("Starting Telegram bot polling...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Global error handler for the Telegram bot - Enhanced with better UI"""
        try:
            # Log the error
            logger.error(f"Exception while handling an update: {context.error}")
            
            # Get the chat ID for sending error message
            chat_id = None
            if update and update.effective_chat:
                chat_id = update.effective_chat.id
            elif update and update.callback_query:
                chat_id = update.callback_query.message.chat.id
            
            if chat_id:
                # Send a user-friendly error message with helpful buttons
                try:
                    error_message = (
                        "❌ *Sorry, something went wrong*\n\n"
                        "I'm having trouble processing your request right now.\n"
                        "Please try again in a moment, or use the buttons below for help."
                    )
                    
                    # Add helpful buttons for error recovery
                    keyboard = self._build_menu([
                        InlineKeyboardButton("❓ Help", callback_data="help"),
                        InlineKeyboardButton("📊 Check Status", callback_data="status"),
                        InlineKeyboardButton("🔄 Try Again", callback_data="start"),
                        InlineKeyboardButton("🌐 Visit oylan.me", url="https://oylan.me")
                    ], n_cols=2)
                    
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=error_message,
                        parse_mode='Markdown',
                        reply_markup=reply_markup
                    )
                except Exception as send_error:
                    logger.error(f"Failed to send error message: {send_error}")
            
        except Exception as e:
            logger.error(f"Error in error handler: {e}")
    
    async def stop(self):
        """Stop the bot"""
        if self.application:
            await self.application.stop()
            logger.info("Telegram bot stopped")

# Global instance
telegram_bot_service = TelegramBotService() 