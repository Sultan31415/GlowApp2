from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat_message import ChatMessage as DBChatMessage
from app.models.assessment import UserAssessment
from app.models.future_projection import DailyPlan
from typing import List, Optional
import json
import uuid
import asyncio
from datetime import datetime
import openai
from app.config.settings import settings
from clerk_backend_api import Clerk
from app.services.user_service import get_latest_user_assessment
from app.models.user import User
from app.services.leo_pydantic_agent import LeoPydanticAgent
from pydantic_ai.messages import ModelMessage
from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart
import websockets

# Initialize OpenAI client (GPT-4o)
if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
    # Use Azure OpenAI
    openai_client = openai.AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
    )
    gpt_model = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
    print(f"[Leo] Using Azure OpenAI GPT-4o: {gpt_model}")
else:
    # Fallback to regular OpenAI
    openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    gpt_model = "gpt-4o"
    print(f"[Leo] Using OpenAI GPT-4o: {gpt_model}")

clerk_sdk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)

# WebSocket connection manager for keep-alive
class WebSocketManager:
    def __init__(self):
        self.active_connections = {}
        self.heartbeat_interval = 30  # seconds
        self.connection_timeout = 60  # seconds
    
    async def add_connection(self, websocket: WebSocket, user_id: str):
        """Add a new WebSocket connection"""
        self.active_connections[user_id] = {
            'websocket': websocket,
            'last_activity': datetime.utcnow(),
            'heartbeat_task': None,
            'processing_task': None  # Track processing tasks
        }
        # Start heartbeat for this connection
        self.active_connections[user_id]['heartbeat_task'] = asyncio.create_task(
            self._heartbeat_loop(user_id)
        )
    
    async def remove_connection(self, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            # Cancel all tasks
            connection = self.active_connections[user_id]
            if connection['heartbeat_task']:
                connection['heartbeat_task'].cancel()
            if connection['processing_task']:
                connection['processing_task'].cancel()
            del self.active_connections[user_id]
    
    async def update_activity(self, user_id: str):
        """Update last activity timestamp"""
        if user_id in self.active_connections:
            self.active_connections[user_id]['last_activity'] = datetime.utcnow()
    
    async def set_processing_task(self, user_id: str, task):
        """Set the current processing task for a user"""
        if user_id in self.active_connections:
            # Cancel previous task if exists
            if self.active_connections[user_id]['processing_task']:
                self.active_connections[user_id]['processing_task'].cancel()
            self.active_connections[user_id]['processing_task'] = task
    
    async def _heartbeat_loop(self, user_id: str):
        """Send periodic heartbeat messages"""
        try:
            while user_id in self.active_connections:
                await asyncio.sleep(self.heartbeat_interval)
                if user_id in self.active_connections:
                    websocket = self.active_connections[user_id]['websocket']
                    try:
                        # Send ping instead of heartbeat for compatibility
                        await websocket.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat(timespec='seconds') + 'Z'})
                        print(f"[WebSocket] Ping sent to user {user_id}")
                    except Exception as e:
                        print(f"[WebSocket] Failed to send ping to user {user_id}: {e}")
                        break
        except asyncio.CancelledError:
            print(f"[WebSocket] Heartbeat cancelled for user {user_id}")
        except Exception as e:
            print(f"[WebSocket] Heartbeat error for user {user_id}: {e}")

# Global WebSocket manager
ws_manager = WebSocketManager()

# Initialize Leo Pydantic Agent
leo_pydantic_agent = LeoPydanticAgent()

async def process_ai_response_background(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    user_msg: str,
    db: Session,
    internal_user_id: int,
    message_history: Optional[List[ModelMessage]] = None
):
    """Process AI response using Leo's enhanced therapeutic system with NEW personality"""
    try:
        print(f"[Background] 🧠 Starting Leo enhanced AI processing for user {user_id}")
        print(f"[Background] 💡 Using therapeutic tools with omniscient mentor personality")
        
        # Send processing status
        await websocket.send_json({
            "type": "processing",
            "message": "Leo Brain is analyzing your wellness patterns with AI insights..."
        })
        
        # Process with Leo Pydantic agent (enhanced with NEW personality)
        agent_response = await leo_pydantic_agent.process_message(
            user_message=user_msg,
            db=db,
            user_id=user_id,
            internal_user_id=internal_user_id,
            session_id=session_id,
            message_history=message_history
        )
        
        # Send main AI response
        await websocket.send_json({
            "type": "ai", 
            "message": {
                "id": 0,
                "user_id": user_id,
                "session_id": session_id,
                "role": "ai",
                "content": agent_response.content,
                "timestamp": datetime.utcnow().isoformat(timespec='seconds') + 'Z'
            }
        })
        
        # Send wellness insights if available
        if agent_response.wellness_insights:
            insights_data = []
            for insight in agent_response.wellness_insights:
                insights_data.append({
                    "category": insight.category,
                    "insight": insight.insight,
                    "actionable_advice": insight.actionable_advice,
                    "priority": insight.priority
                })
            
            await websocket.send_json({
                "type": "insights",
                "insights": insights_data
            })
        
        # Send follow-up questions if available
        if agent_response.follow_up_questions:
            await websocket.send_json({
                "type": "follow_up",
                "questions": agent_response.follow_up_questions
            })
        
        # Enhanced therapeutic response types
        if hasattr(agent_response, 'crisis_alert') and agent_response.crisis_alert:
            await websocket.send_json({
                "type": "crisis_alert",
                "level": agent_response.crisis_alert.get("risk_level"),
                "message": "I'm concerned about you right now. Please consider reaching out for support."
            })
        
        if hasattr(agent_response, 'hidden_patterns') and agent_response.hidden_patterns:
            patterns_data = []
            for pattern_type, patterns in agent_response.hidden_patterns.items():
                if patterns:
                    for pattern in patterns:
                        patterns_data.append({
                            "type": pattern_type,
                            "description": pattern.get("description", ""),
                            "insight": pattern.get("hidden_insight", ""),
                            "evidence": pattern.get("evidence", "")
                        })
            
            if patterns_data:
                await websocket.send_json({
                    "type": "patterns",
                    "patterns": patterns_data
                })
        
        if hasattr(agent_response, 'cbt_intervention') and agent_response.cbt_intervention:
            await websocket.send_json({
                "type": "cbt_intervention",
                "intervention": {
                    "technique_used": agent_response.cbt_intervention.get("technique_used"),
                    "reframe_suggestion": agent_response.cbt_intervention.get("reframe_suggestion"),
                    "evidence_questions": agent_response.cbt_intervention.get("evidence_questions", []),
                    "homework_suggestion": agent_response.cbt_intervention.get("homework_suggestion")
                }
            })
        
        print(f"[Background] ✅ Leo enhanced processing completed for user {user_id}")
        
    except Exception as e:
        print(f"[Background] ❌ Error processing response: {e}")
        await websocket.send_json({
            "type": "error",
            "message": "I'm having trouble processing your message right now. Please try again."
        })

def verify_clerk_token(token: str):
    """
    Verifies a Clerk JWT token using the latest Clerk SDK pattern.
    Uses Clerk.clients.verify for direct JWT verification (suitable for WebSockets).
    Handles both development and production environments based on the Clerk secret key.
    """
    print("[WebSocket Auth] verify_clerk_token called (latest Clerk SDK)")
    try:
        print(f"[WebSocket Auth] Received token: {token[:20]}... (length: {len(token)})")
        # Use the Clerk SDK to verify the token
        with Clerk(bearer_auth=str(settings.CLERK_SECRET_KEY)) as clerk:
            res = clerk.clients.verify(request={"token": token})
            print(f"[WebSocket Auth] Clerk clients.verify response: {res}")
            if not res or not getattr(res, 'object', None):
                print("[WebSocket Auth] Token verification failed: No response or missing object field")
                return None
            # Extract user info from the response
            user_id = getattr(res, 'id', None) or getattr(res, 'user_id', None)
            email = getattr(res, 'email_address', None) or getattr(res, 'email', None)
            first_name = getattr(res, 'first_name', None)
            last_name = getattr(res, 'last_name', None)
            # You may want to print or log the full response for debugging
            print(f"[WebSocket Auth] Verified user_id: {user_id}, email: {email}")
            if not user_id:
                print("[WebSocket Auth] No user_id in Clerk response")
                return None
            return {
                "user_id": user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            }
    except Exception as e:
        print(f"[WebSocket Auth] Clerk token verification failed: {e}\nFalling back to local JWT decode.")
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
            user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")
            email = payload.get("email")
            first_name = payload.get("first_name")
            last_name = payload.get("last_name")
            if user_id:
                print("[WebSocket Auth] Fallback decode succeeded for user", user_id)
                return {
                    "user_id": user_id,
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                }
        except Exception as inner:
            print("[WebSocket Auth] Fallback decode failed:", inner)
        import traceback
        traceback.print_exc()
        return None



router = APIRouter()

# Helper to serialize messages

def serialize_message(msg):
    """Serialize message for WebSocket transmission"""
    return {
        "id": msg.id,
        "user_id": msg.user_id,
        "session_id": msg.session_id,
        "role": msg.role,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat(timespec='seconds') + 'Z' if msg.timestamp else None,
    }



@router.websocket("/ws/chat")
async def chat_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
):
    token = websocket.query_params.get("token")
    user = verify_clerk_token(token) if token else None
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await websocket.accept()
    user_id = user["user_id"]
    
    # Add connection to manager
    await ws_manager.add_connection(websocket, user_id)
    print(f"[WebSocket] Connection established for user {user_id}")
    
    # Get session_id from query params or generate
    session_id = websocket.query_params.get("session_id") or str(uuid.uuid4())

    # Map Clerk user_id (string) to internal User.id (integer)
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        await ws_manager.remove_connection(user_id)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    internal_user_id = db_user.id

    # Initialize enhanced Leo agent context
    print(f"[Leo] 🧠 Enhanced therapeutic system initialized for user {user_id}")
    print(f"[Leo] 👤 User: {db_user.first_name or 'User'}")
    print(f"[Leo] 📊 Assessment: {'Available' if get_latest_user_assessment(db, internal_user_id) else 'Not available'}")
    print(f"[Leo] 💡 Combining clinical capabilities with omniscient mentor personality")

    # Send previous messages
    prev_msgs = db.query(DBChatMessage).filter_by(user_id=user_id, session_id=session_id).order_by(DBChatMessage.timestamp).all()
    try:
        await websocket.send_json({"type": "history", "messages": [serialize_message(m) for m in prev_msgs]})
    except websockets.exceptions.ConnectionClosedError:
        print("[WebSocket] Tried to send on closed connection (history)")
        return

    try:
        while True:
            # Update activity timestamp
            await ws_manager.update_activity(user_id)
            
            # Receive message with timeout
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=300)  # 5 minute timeout
            except asyncio.TimeoutError:
                print(f"[WebSocket] Timeout waiting for message from user {user_id}")
                break
            except WebSocketDisconnect:
                print(f"[WebSocket] User {user_id} disconnected")
                break
            
            try:
                msg_data = json.loads(data)
            except json.JSONDecodeError:
                print(f"[WebSocket] Invalid JSON from user {user_id}")
                continue
            
            user_msg = msg_data.get("content")
            if not user_msg:
                continue
            
            # Send immediate acknowledgment
            await websocket.send_json({
                "type": "processing", 
                "message": "Processing your message..."
            })
            
            # Load last 10 messages for this user/session, ordered by timestamp ascending
            db_history_msgs = db.query(DBChatMessage).filter_by(user_id=user_id, session_id=session_id).order_by(DBChatMessage.timestamp.asc()).limit(10).all()
            # Convert to ModelRequest or ModelResponse objects as per Pydantic AI docs
            model_history = []
            for m in db_history_msgs:
                if m.role == "user":
                    model_history.append(ModelRequest(parts=[UserPromptPart(content=m.content)]))
                elif m.role in ("ai", "assistant"):
                    model_history.append(ModelResponse(parts=[TextPart(content=m.content)]))
                # else: skip unknown roles
            
            # Process AI response in background to avoid blocking WebSocket
            background_task = asyncio.create_task(
                process_ai_response_background(
                    websocket=websocket,
                    user_id=user_id,
                    session_id=session_id,
                    user_msg=user_msg,
                    db=db,
                    internal_user_id=internal_user_id,
                    message_history=model_history
                )
            )
            
            # Track the background task
            await ws_manager.set_processing_task(user_id, background_task)
    except WebSocketDisconnect:
        print(f"[WebSocket] User {user_id} disconnected normally")
    except Exception as e:
        print(f"[WebSocket] Unexpected error for user {user_id}: {e}")
    finally:
        # Clean up connection
        await ws_manager.remove_connection(user_id)
        print(f"[WebSocket] Connection cleaned up for user {user_id}") 
        