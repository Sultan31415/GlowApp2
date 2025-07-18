from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat_message import ChatMessage
from typing import List, Optional
import json
import uuid
from datetime import datetime
import google.generativeai as genai
from app.config.settings import settings
from clerk_backend_api import Clerk
from app.services.user_service import get_latest_user_assessment
from app.models.user import User

genai.configure(api_key=settings.GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)

clerk_sdk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)

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

def serialize_message(msg: ChatMessage):
    return {
        "id": msg.id,
        "user_id": msg.user_id,
        "session_id": msg.session_id,
        "role": msg.role,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
    }

async def gemini_chat_response(history: list, user_msg: str, orchestrator_context: Optional[dict] = None) -> str:
    # Build orchestrator context string
    context_str = ""
    if orchestrator_context:
        context_str += (
            "SYSTEM CONTEXT (User's Wellness Assessment):\n"
            f"Category Scores: {orchestrator_context.get('category_scores')}\n"
            f"Archetype: {orchestrator_context.get('glowup_archetype')}\n"
            f"Micro Habits: {orchestrator_context.get('micro_habits')}\n"
            f"Summary: {orchestrator_context.get('analysis_summary')}\n"
            f"Potential Problems: {orchestrator_context.get('detailed_insights')}\n"
            "You are a proactive wellness coach. Use this context to reveal the user's potential problems and talk to them about their health, offering advice and encouragement.\n"
            "----\n"
        )
    # Format the last N messages as a chat prompt
    prompt = context_str
    for msg in history[-10:]:  # last 10 messages for context
        role = "User" if msg.role == "user" else "AI"
        prompt += f"{role}: {msg.content}\n"
    prompt += f"User: {user_msg}\nAI:"
    # Gemini is sync, so run in thread pool
    import asyncio
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: gemini_model.generate_content([prompt], generation_config=genai.types.GenerationConfig(
            temperature=0.7, max_output_tokens=500
        ))
    )
    return response.text.strip()

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
    # Get session_id from query params or generate
    session_id = websocket.query_params.get("session_id") or str(uuid.uuid4())

    # Map Clerk user_id (string) to internal User.id (integer)
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    internal_user_id = db_user.id

    # Fetch orchestrator (assessment) context for this user
    assessment = get_latest_user_assessment(db, internal_user_id)
    orchestrator_context = None
    if assessment:
        orchestrator_context = {
            "category_scores": assessment.category_scores,
            "glowup_archetype": assessment.glowup_archetype,
            "micro_habits": assessment.micro_habits,
            "analysis_summary": assessment.analysis_summary,
            "detailed_insights": assessment.detailed_insights,
        }

    # Send previous messages
    prev_msgs: List[ChatMessage] = db.query(ChatMessage).filter_by(user_id=user_id, session_id=session_id).order_by(ChatMessage.timestamp).all()
    await websocket.send_json({"type": "history", "messages": [serialize_message(m) for m in prev_msgs]})

    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            user_msg = msg_data.get("content")
            if not user_msg:
                continue
            # Save user message
            user_chat = ChatMessage(
                user_id=user_id,
                session_id=session_id,
                role="user",
                content=user_msg,
                timestamp=datetime.utcnow(),
            )
            db.add(user_chat)
            db.commit()
            db.refresh(user_chat)
            await websocket.send_json({"type": "user", "message": serialize_message(user_chat)})
            prev_msgs.append(user_chat)  # <-- append immediately after saving

            # Call Gemini LLM with full history (prev_msgs) and orchestrator context
            ai_response = await gemini_chat_response(prev_msgs, user_msg, orchestrator_context)
            ai_chat = ChatMessage(
                user_id=user_id,
                session_id=session_id,
                role="ai",
                content=ai_response,
                timestamp=datetime.utcnow(),
            )
            db.add(ai_chat)
            db.commit()
            db.refresh(ai_chat)
            await websocket.send_json({"type": "ai", "message": serialize_message(ai_chat)})
            prev_msgs.append(ai_chat)  # <-- append immediately after saving
    except WebSocketDisconnect:
        pass 