# Telegram Bot Setup Guide for Leo AI

This guide will help you set up the Leo Telegram bot so users can authenticate and chat with Leo directly from Telegram.

## Prerequisites

1. **Telegram Bot Token**: You need to create a bot with @BotFather
2. **Python Environment**: Make sure you have Python 3.8+ installed
3. **Dependencies**: Install the required packages

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Leo AI Wellness Mentor")
4. Choose a username (e.g., "Leo_Oylan_bot") - must end with "bot"
5. BotFather will give you a token like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Save this token - you'll need it for the next step

## Step 2: Configure Environment Variables

1. Open your `.env` file in the `back/` directory
2. Add your Telegram bot token:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

3. Make sure you also have these other required variables:
```bash
# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_KEY=your_jwt_key

# Database
DATABASE_URL=postgresql://glowuser:glowpassword@localhost:5433/glowdb

# OpenAI/Azure Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
```

## Step 3: Install Dependencies

Make sure you have the required packages:

```bash
cd back
pip install python-telegram-bot python-dotenv requests
```

## Step 4: Test Bot Configuration

Run the configuration check script:

```bash
python3 check_telegram_bot.py
```

This will verify:
- ✅ Bot token is configured
- ✅ Bot token is valid
- ✅ Can connect to Telegram API
- ✅ Bot information is accessible

## Step 5: Start the Backend Server

Make sure your main backend server is running:

```bash
python3 run.py
```

This starts the FastAPI server that the Telegram bot needs for authentication.

## Step 6: Start the Telegram Bot

In a new terminal, start the Telegram bot:

```bash
python3 run_telegram_bot.py
```

You should see output like:
```
🚀 Starting Leo Telegram Bot...
✅ Bot token configured
🤖 Bot will respond to: @Leo_Oylan_bot
Telegram bot initialized successfully
Starting Telegram bot polling...
```

## Step 7: Test the Bot

1. Open Telegram and search for your bot username (e.g., `@Leo_Oylan_bot`)
2. Send `/start` to the bot
3. You should see the welcome message

## Step 8: Test Authentication Flow

1. Visit `http://localhost:5173/telegram-login` (or your frontend URL)
2. Sign in to your oylan.me account
3. Generate a login code
4. Go back to Telegram and send `/login CODE` (replace CODE with the actual code)
5. The bot should authenticate you and allow you to chat with Leo

## Troubleshooting

### Bot Not Responding

1. **Check if bot is running**:
   ```bash
   ps aux | grep -i telegram
   ```

2. **Check bot token**:
   ```bash
   python3 check_telegram_bot.py
   ```

3. **Check logs**:
   Look for error messages in the terminal where you started the bot

### Authentication Issues

1. **Backend server not running**:
   Make sure `python3 run.py` is running in another terminal

2. **Network connectivity**:
   The bot tries to call `http://localhost:8000/api/telegram/auth`
   Make sure this endpoint is accessible

3. **Login codes not working**:
   - Codes expire after 5 minutes
   - Generate a fresh code from the frontend
   - Check the backend logs for authentication errors

### Common Error Messages

- **"TELEGRAM_BOT_TOKEN not configured"**: Add the token to your `.env` file
- **"Invalid bot token"**: Check your token with @BotFather
- **"Connection error"**: Make sure the backend server is running
- **"Invalid login code"**: Generate a fresh code from the frontend

## Production Deployment

For production, consider:

1. **Use Redis** instead of file storage for login codes
2. **Set up proper logging** to a file
3. **Use environment variables** for all configuration
4. **Set up monitoring** for the bot process
5. **Use a process manager** like PM2 or systemd

## Bot Commands

Once the bot is working, users can use these commands:

- `/start` - Welcome message and setup
- `/login` - Connect oylan.me account
- `/logout` - Disconnect account
- `/status` - Check connection status
- `/newchat` - Start fresh conversation
- `/help` - Show help message

## Security Considerations

1. **Never share your bot token** - it's like a password
2. **Use HTTPS** in production for the authentication endpoint
3. **Validate all user input** in the bot handlers
4. **Rate limit** bot responses to prevent abuse
5. **Log suspicious activity** for monitoring

## Support

If you're still having issues:

1. Check the logs in both terminals (backend and bot)
2. Verify all environment variables are set
3. Make sure both servers are running
4. Test the authentication endpoint directly: `curl -X POST http://localhost:8000/api/telegram/generate-login-code`
5. Check that your database is accessible and contains user data 