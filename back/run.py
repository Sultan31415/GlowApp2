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
        log_level="info",
        # WebSocket specific configurations
        ws_ping_interval=30,  # Send ping every 30 seconds
        ws_ping_timeout=60,   # Wait 60 seconds for pong response
        timeout_keep_alive=30, # Keep-alive timeout
        timeout_graceful_shutdown=30, # Graceful shutdown timeout
    ) 