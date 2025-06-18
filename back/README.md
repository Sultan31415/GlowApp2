# GlowApp Backend API

A FastAPI-based backend for the GlowApp wellness assessment platform with AI-powered analysis using Google's Gemini AI.

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
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Test photo processing** (optional):
   ```bash
   python3 test_photo_processing.py
   ```

4. **Run the application**:
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
- **AI Analysis**: Integration with Google Gemini AI for personalized insights
- **Photo Analysis**: Support for image upload and analysis with fallback handling
- **Age Estimation**: Biological and emotional age estimation
- **Personalized Recommendations**: AI-generated micro-habits and archetypes

## Recent Fixes

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

## Troubleshooting

### Photo Processing Issues
If you encounter photo processing errors:
1. Check that your Gemini API key is valid
2. Ensure the photo is in a supported format (JPEG, PNG)
3. Verify the base64 encoding is correct
4. Run `python3 test_photo_processing.py` to test the functionality

### API Key Issues
Make sure your `.env` file contains:
```
GEMINI_API_KEY=your_actual_api_key_here
``` 