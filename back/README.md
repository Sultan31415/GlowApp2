# GlowApp Backend API

A FastAPI-based backend for the GlowApp wellness assessment platform with AI-powered analysis using Google's Gemini AI and Azure OpenAI.

## Project Structure

```
back/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application setup
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py        # API route definitions
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py         # Configuration and environment variables
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for request/response
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py       # AI analysis service using Gemini
│       └── scoring_service.py  # Quiz scoring calculations
├── run.py                      # Application entry point
├── test_photo_processing.py    # Test script for photo processing
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

- **API Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic for scoring and AI analysis
- **Model Layer**: Defines data structures and validation
- **Config Layer**: Manages application configuration

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   Create a `.env` file in the `back/` directory with:
   ```
   # Gemini AI (for quiz analysis and orchestration)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Azure OpenAI (for photo analysis and orchestration)
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   
   # Separate deployment names for different models (required in Azure OpenAI)
   AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
   AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini
   
   # Optional: Specific model versions (use latest available in your region)
   AZURE_OPENAI_GPT4O_DEPLOYMENT_VERSION=2024-05-13
   AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_VERSION=2024-07-18
   
   # Optional: Deployment capacity in thousands of tokens per minute (adjust based on needs)
   AZURE_OPENAI_GPT4O_DEPLOYMENT_CAPACITY=30
   AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_CAPACITY=30
   
   # Database
   DATABASE_URL=postgresql://glowuser:glowpassword@localhost:5433/glowdb
   
   # Clerk Authentication
   CLERK_SECRET_KEY=your_clerk_secret_key
   JWT_KEY=your_jwt_key
   ```

3. **Test Azure OpenAI configuration** (recommended):
   ```bash
   python3 test_azure_openai_config.py
   ```

4. **Test photo processing** (optional):
   ```bash
   python3 test_photo_processing.py
   ```

5. **Run the application**:
   ```bash
   python3 run.py
   ```

   Or alternatively:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `POST /api/assess` - Main assessment endpoint

### Assessment Endpoint

**POST** `/api/assess`

Request body:
```json
{
  "answers": [
    {
      "questionId": "q1",
      "value": 4,
      "label": "Sleep quality"
    }
  ],
  "photo_url": "data:image/jpeg;base64,...",
  "chronological_age": 25
}
```

Response:
```json
{
  "overallGlowScore": 75,
  "categoryScores": {
    "physicalVitality": 80,
    "emotionalHealth": 70,
    "visualAppearance": 75
  },
  "biologicalAge": 23,
  "emotionalAge": 28,
  "chronologicalAge": 25,
  "glowUpArchetype": {
    "name": "The Balanced Bloomer",
    "description": "You're on a great path..."
  },
  "microHabits": [
    "Drink 8 glasses of water daily",
    "Take 10,000 steps per day"
  ],
  "avatarUrls": {
    "before": "data:image/jpeg;base64,...",
    "after": "https://example.com/after.jpg"
  }
}
```

## Features

- **Quiz Scoring**: Automated calculation of wellness scores across three categories
- **AI Analysis**: Integration with Google Gemini AI for personalized insights and quiz analysis
- **Photo Analysis**: Azure OpenAI GPT-4o Vision for advanced facial image analysis with fallback handling
- **AI Orchestration**: Azure OpenAI GPT-4o Mini for intelligent synthesis of photo and quiz insights
- **Age Estimation**: Biological and emotional age estimation using multi-modal AI
- **Personalized Recommendations**: AI-generated micro-habits and archetypes

## Recent Updates

### Azure OpenAI Multi-Model Support (Latest)
- **Enhancement**: Added proper support for separate Azure OpenAI deployments
- **Configuration**: Now supports different deployment names for GPT-4o and GPT-4o mini
- **Orchestration**: Updated orchestrator to use GPT-4o mini with fallback to Gemini
- **Documentation**: Added comprehensive Azure OpenAI setup guide

### Photo Processing Issue (Fixed)
- **Problem**: Photo processing was failing with `TypeError: Could not create Blob`
- **Solution**: Implemented robust photo processing with temporary file creation
- **Fallback**: If photo processing fails, analysis continues without image
- **Testing**: Added `test_photo_processing.py` for verification

## Development

The codebase is organized for easy maintenance and extension:

- Add new endpoints in `app/api/endpoints.py`
- Create new services in `app/services/`
- Define new models in `app/models/schemas.py`
- Update configuration in `app/config/settings.py`

## Azure OpenAI Setup

### Deployment Configuration
In Azure OpenAI, each model requires a separate deployment. You need to create deployments for:

1. **GPT-4o** (for photo analysis) - Set `AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME`
2. **GPT-4o mini** (for orchestration) - Set `AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME`

### Creating Azure OpenAI Deployments
1. Go to Azure OpenAI Studio
2. Navigate to "Deployments" → "Create new deployment"
3. Create two deployments:
   - **Model**: gpt-4o, **Deployment name**: `gpt-4o` (or your preferred name)
   - **Model**: gpt-4o-mini, **Deployment name**: `gpt-4o-mini` (or your preferred name)
4. Update your `.env` file with the actual deployment names

### Model Versions and Capacity
- Use the latest available model versions in your region
- Adjust capacity based on your expected usage (default: 30K TPM)
- For free tier accounts, use lower capacity values (e.g., 1-10K TPM)

## Troubleshooting

### Photo Processing Issues
If you encounter photo processing errors:
1. Check that your Azure OpenAI API key and endpoint are valid
2. Ensure your GPT-4o deployment is properly configured in Azure
3. Verify the photo is in a supported format (JPEG, PNG, max 20MB)
4. Check the base64 encoding is correct
5. Run `python3 test_photo_processing.py` to test the functionality

### Azure OpenAI Issues
Common Azure OpenAI configuration problems:
1. **Deployment not found**: Verify deployment names match your Azure configuration
2. **Rate limiting**: Check your deployment capacity and usage
3. **API version**: Ensure you're using a supported API version
4. **Region availability**: Some models may not be available in all regions

**Quick Fix**: Run `python3 test_azure_openai_config.py` to test your configuration

### API Key Issues
Make sure your `.env` file contains all required keys:
```
# Required for quiz analysis
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Required for Azure OpenAI (photo analysis and orchestration)
AZURE_OPENAI_API_KEY=your_actual_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=your_gpt4o_deployment_name
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=your_gpt4o_mini_deployment_name

# Required for authentication
CLERK_SECRET_KEY=your_clerk_secret_key
``` 