"""
🚀 ENHANCED GLOW APP API
Main application entry point using Enhanced Leo Brain system.

Integration Status: OLD system (clinical capabilities) + NEW system (personality & efficiency)
- Therapeutic tools: CBT, MI, Solution-focused therapy, Crisis intervention  
- Enhanced personality: Omniscient mentor with warm engagement
- Performance: Efficient data loading and streamlined responses
- Capabilities: 12 specialized tools + comprehensive wellness analysis
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config.settings import settings
from app.api.endpoints import router
from app.api.chat_ws import router as chat_router
from app.db.session import Base, engine
from app.models.user import User # Import model to register with Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.1.0",
    description="Enhanced AI wellness assessment API with Leo Brain - combining clinical capabilities with engaging mentorship"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes (REST)
app.include_router(router, prefix=settings.API_V1_STR)

# Include Enhanced Leo WebSocket routes (no prefix so path stays /ws/*)
app.include_router(chat_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to GlowApp Enhanced API", 
        "version": "1.1.0",
        "leo_system": "Enhanced - Clinical capabilities with engaging mentorship",
        "features": ["Therapeutic AI", "Pattern Recognition", "Wellness Insights", "Crisis Support"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "leo_system": "Enhanced Leo Brain Active"}

@app.get("/leo/status")
async def leo_status():
    """Leo Brain system status"""
    return {
        "leo_version": "Enhanced v1.1",
        "system_type": "Integrated (OLD clinical + NEW personality)",
        "capabilities": {
            "therapeutic": {
                "cbt": "Cognitive Behavioral Therapy techniques",
                "motivational_interviewing": "Change-focused conversations",
                "solution_focused": "Strength-based interventions",
                "crisis_support": "Safety detection and resources"
            },
            "intelligence": {
                "pattern_recognition": "Cross-domain wellness patterns",
                "problem_detection": "Hidden health issues identification",
                "insight_generation": "AI-powered wellness analysis",
                "personalization": "User-specific guidance"
            },
            "personality": {
                "omniscient_mentor": "Wise, all-seeing guide",
                "warm_engagement": "Personal, name-based interaction",
                "evidence_based": "Data-driven insights",
                "supportive": "Empathetic wellness companion"
            }
        },
        "tools_available": 12,
        "data_sources": ["Assessment", "Photo Analysis", "Quiz Insights", "Chat History", "Plans & Goals"],
        "status": "Fully Operational"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=False  # Disabled auto-reload to reduce continuous file watching
    ) 