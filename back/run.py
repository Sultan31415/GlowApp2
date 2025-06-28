#!/usr/bin/env python3
"""
Entry point for the GlowApp API
"""
import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,  # Disabled auto-reload to reduce continuous file watching
        log_level="info"
    ) 