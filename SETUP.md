# 🚀 GlowApp Setup Guide

## Quick Start

Get GlowApp running on your local machine in under 10 minutes!

## Prerequisites

### Required Software
- **Python 3.9+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 15+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Required Accounts
- **Azure OpenAI** - [Sign up here](https://azure.microsoft.com/en-us/services/openai/)
- **Google Gemini** - [Sign up here](https://makersuite.google.com/app/apikey)
- **Clerk** - [Sign up here](https://clerk.com/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/glowapp.git
cd glowapp
```

## Step 2: Backend Setup

### Install Python Dependencies
```bash
cd back
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your API keys
nano .env
```

**Required Environment Variables:**
```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini

# Database
DATABASE_URL=postgresql://glowuser:glowpassword@localhost:5433/glowdb

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here
JWT_KEY=your_jwt_key_here
```

### Setup Database
```bash
# Create database
createdb glowdb

# Run migrations
alembic upgrade head

# Optional: Add sample data
python cleanup_sample_data.py
```

### Test Backend
```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/leo/status
```

## Step 3: Frontend Setup

### Install Node.js Dependencies
```bash
cd ../front
npm install
```

### Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables:**
```bash
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/chat

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

### Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application!

## Step 4: Azure OpenAI Setup

### Create Azure OpenAI Resource
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new "Azure OpenAI" resource
3. Note your endpoint URL and API key

### Deploy Models
1. Go to Azure OpenAI Studio
2. Navigate to "Deployments" → "Create new deployment"
3. Create two deployments:
   - **Model**: `gpt-4o`, **Deployment name**: `gpt-4o`
   - **Model**: `gpt-4o-mini`, **Deployment name**: `gpt-4o-mini`

### Update Environment Variables
```bash
# In back/.env
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini
```

## Step 5: Clerk Authentication Setup

### Create Clerk Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Configure authentication methods (Email, Google, etc.)

### Get API Keys
1. Go to "API Keys" in your Clerk dashboard
2. Copy the "Publishable Key" and "Secret Key"

### Update Environment Variables
```bash
# In back/.env
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# In front/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Step 6: Google Gemini Setup

### Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### Update Environment Variables
```bash
# In back/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 7: Test the Complete System

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "leo_system": "Enhanced Leo Brain Active"}
```

### 2. Test Leo Status
```bash
curl http://localhost:8000/leo/status
# Expected: Leo system status with capabilities
```

### 3. Test Frontend
1. Open `http://localhost:5173`
2. Sign up/login with Clerk
3. Complete the wellness assessment
4. Chat with Leo AI

### 4. Test AI Features
1. Upload a photo for analysis
2. Complete the wellness quiz
3. View personalized insights
4. Chat with Leo about your plan

## Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Database connection error
# Solution: Check DATABASE_URL and ensure PostgreSQL is running
sudo systemctl start postgresql

# AI API errors
# Solution: Verify API keys and endpoints
python test_azure_openai_config.py

# Migration errors
# Solution: Reset database and run migrations
dropdb glowdb
createdb glowdb
alembic upgrade head
```

#### Frontend Issues
```bash
# Build errors
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# API connection errors
# Solution: Check VITE_API_URL and backend status
curl http://localhost:8000/health

# Authentication errors
# Solution: Verify Clerk configuration
echo $VITE_CLERK_PUBLISHABLE_KEY
```

#### AI Service Issues
```bash
# Photo analysis failing
# Solution: Check Azure OpenAI configuration
python test_photo_processing.py

# Quiz analysis failing
# Solution: Check Gemini API key
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models

# Leo chat not working
# Solution: Check WebSocket connection
# Open browser dev tools and check WebSocket status
```

### Performance Optimization

#### Backend Performance
```bash
# Enable response caching
export ENABLE_CACHE=true

# Increase worker processes
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000

# Monitor performance
python -m cProfile -o profile.stats app/main.py
```

#### Frontend Performance
```bash
# Build for production
npm run build

# Analyze bundle size
npm run build -- --analyze

# Enable service worker for caching
# Add service worker configuration in vite.config.ts
```

## Development Workflow

### Backend Development
```bash
cd back

# Run tests
pytest

# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Frontend Development
```bash
cd front

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

### Database Development
```bash
cd back

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Production Deployment

### Docker Deployment
```bash
# Build images
docker build -t glowapp-backend ./back
docker build -t glowapp-frontend ./front

# Run with docker-compose
docker-compose up -d
```

### Environment Variables for Production
```bash
# Production .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/glowdb
AZURE_OPENAI_API_KEY=your_prod_key
GEMINI_API_KEY=your_prod_key
CLERK_SECRET_KEY=your_prod_key
```

## Monitoring & Logging

### Backend Logging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Monitor logs
tail -f logs/backend.log
```

### Frontend Monitoring
```bash
# Enable error tracking
# Add Sentry configuration in main.tsx

# Monitor performance
# Add performance monitoring in App.tsx
```

## Support

- **Documentation**: [docs.glowapp.com](https://docs.glowapp.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/glowapp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/glowapp/discussions)
- **Email**: support@glowapp.com

---

**🎉 Congratulations! You now have a fully functional GlowApp development environment!**

Start building amazing wellness features and contributing to the future of AI-powered health support. 