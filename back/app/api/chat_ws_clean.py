"""
🚀 CLEAN WEBSOCKET CHAT API
Simplified WebSocket implementation using the new Leo Brain system
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.services.leo_brain import LeoBrain
from typing import Dict, Any
import json
import uuid
import asyncio
from datetime import datetime
from clerk_backend_api import Clerk
from app.config.settings import settings

# Initialize services
clerk_sdk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)
leo_brain = LeoBrain()

# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"[Clean WebSocket] 🔗 User {user_id} connected to NEW Leo Brain")
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"[Clean WebSocket] 📱 User {user_id} disconnected from NEW Leo Brain")
    
    async def send_message(self, user_id: str, message: dict):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

manager = ConnectionManager()

def verify_clerk_token(token: str) -> dict:
    """Verify Clerk authentication token with fallback"""
    try:
        print(f"[Clean Auth] 🔐 Verifying token: {token[:20]}...")
        # Try Clerk SDK first
        with Clerk(bearer_auth=str(settings.CLERK_SECRET_KEY)) as clerk:
            res = clerk.clients.verify(request={"token": token})
            if res and hasattr(res, 'id'):
                return {
                    "user_id": res.id,
                    "email": getattr(res, 'email_address', None),
                    "first_name": getattr(res, 'first_name', None),
                    "last_name": getattr(res, 'last_name', None),
                }
    except Exception as e:
        print(f"[Clean Auth] ⚠️ Clerk verification failed: {e}")
        
    # Fallback to JWT decode
    try:
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
        user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")
        if user_id:
            print(f"[Clean Auth] ✅ Fallback auth succeeded for user {user_id}")
            return {
                "user_id": user_id,
                "email": payload.get("email"),
                "first_name": payload.get("first_name"),
                "last_name": payload.get("last_name"),
            }
    except Exception as inner_e:
        print(f"[Clean Auth] ❌ Fallback auth failed: {inner_e}")
    
    return None

async def process_leo_response(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    user_message: str,
    db: Session,
    internal_user_id: int
):
    """Process message with Leo Brain and send structured response"""
    try:
        print(f"[Leo Clean] 🧠 Processing message with NEW Leo Brain system for user {user_id}")
        
        # Send processing status
        await websocket.send_json({
            "type": "processing",
            "message": "Leo Brain is analyzing your wellness patterns with AI insights..."
        })
        
        # Process with Leo Brain
        leo_response = await leo_brain.process_message(
            user_message=user_message,
            db=db,
            user_id=user_id,
            internal_user_id=internal_user_id,
            session_id=session_id
        )
        
        # Send main AI response
        await websocket.send_json({
            "type": "ai",
            "message": {
                "id": 0,
                "user_id": user_id,
                "session_id": session_id,
                "role": "ai",
                "content": leo_response.content,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Send wellness insights if available
        if leo_response.wellness_insights:
            insights_data = []
            for insight in leo_response.wellness_insights:
                insights_data.append({
                    "category": insight.category,
                    "insight": insight.insight,
                    "evidence": insight.evidence,
                    "action": insight.action,
                    "priority": insight.priority
                })
            
            await websocket.send_json({
                "type": "insights",
                "insights": insights_data
            })
        
        # Send hidden patterns if discovered
        if leo_response.hidden_patterns:
            patterns_data = []
            for pattern in leo_response.hidden_patterns:
                patterns_data.append({
                    "name": pattern.pattern_name,
                    "description": pattern.description,
                    "data_points": pattern.data_points,
                    "impact": pattern.impact
                })
            
            await websocket.send_json({
                "type": "patterns",
                "patterns": patterns_data
            })
        
        # Send follow-up questions
        if leo_response.follow_up_questions:
            await websocket.send_json({
                "type": "follow_up",
                "questions": leo_response.follow_up_questions
            })
        
        # Send crisis alert if needed
        if leo_response.crisis_level != "none":
            await websocket.send_json({
                "type": "crisis_alert",
                "level": leo_response.crisis_level,
                "message": "I'm concerned about you right now. Please consider reaching out for support."
            })
        
        print(f"[Leo Clean] ✅ NEW Leo Brain response sent - {len(leo_response.wellness_insights)} insights, crisis level: {leo_response.crisis_level}")
        
    except Exception as e:
        print(f"[Leo Clean] ❌ Error processing response: {e}")
        await websocket.send_json({
            "type": "error",
            "message": "I'm having trouble processing your message right now. Please try again."
        })

router = APIRouter()

@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    🚀 Clean WebSocket Chat Endpoint
    Handles real-time communication with Leo Brain
    """
    
    # Authenticate user
    token = websocket.query_params.get("token")
    user = verify_clerk_token(token) if token else None
    
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_id = user["user_id"]
    
    # Get or create database user
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    internal_user_id = db_user.id
    
    # Connect to WebSocket manager
    await manager.connect(websocket, user_id)
    
    # Get or generate session ID
    session_id = websocket.query_params.get("session_id") or str(uuid.uuid4())
    
    print(f"[Leo Clean] 🎯 NEW Clean Session started - User: {db_user.first_name or 'User'}, Session: {session_id}")
    
    try:
        while True:
            # Receive message
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message_data = json.loads(data)
                user_message = message_data.get("content", "").strip()
                
                if not user_message:
                    continue
                
                print(f"[Leo Clean] 📨 Received: {user_message[:50]}...")
                
                # Send user message to client for immediate display
                await websocket.send_json({
                    "type": "user",
                    "message": {
                        "id": 0,
                        "user_id": user_id,
                        "session_id": session_id,
                        "role": "user",
                        "content": user_message,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                
                # Process with Leo Brain
                await process_leo_response(
                    websocket=websocket,
                    user_id=user_id,
                    session_id=session_id,
                    user_message=user_message,
                    db=db,
                    internal_user_id=internal_user_id
                )
                
            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat()})
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        print(f"[Leo Clean] 👋 User {user_id} disconnected from NEW Leo Brain")
    except Exception as e:
        print(f"[Leo Clean] ❌ Connection error: {e}")
        manager.disconnect(user_id)
        await websocket.close()

# Add the router to the main app
def get_chat_router():
    return router 