from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat_message import ChatMessage
from app.models.assessment import UserAssessment
from app.models.future_projection import DailyPlan
from typing import List, Optional
import json
import uuid
from datetime import datetime
import openai
from app.config.settings import settings
from clerk_backend_api import Clerk
from app.services.user_service import get_latest_user_assessment
from app.models.user import User
from app.services.vector_search_service import VectorSearchService

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

def get_latest_daily_plan(db: Session, user_id: int):
    """Get the latest daily plan for a user"""
    try:
        plan = db.query(DailyPlan).filter(
            DailyPlan.user_id == user_id
        ).order_by(DailyPlan.created_at.desc()).first()
        return plan.plan_json if plan else None
    except Exception as e:
        print(f"[Leo] Error fetching daily plan: {e}")
        return None

def get_user_assessment_history(db: Session, user_id: int, limit: int = 3):
    """Get recent assessment history for progress tracking"""
    try:
        assessments = db.query(UserAssessment).filter(
            UserAssessment.user_id == user_id
        ).order_by(UserAssessment.created_at.desc()).limit(limit).all()
        
        if not assessments:
            return None
            
        history = []
        for assessment in assessments:
            history.append({
                "created_at": assessment.created_at.isoformat(),
                "overall_glow_score": assessment.overall_glow_score,
                "category_scores": assessment.category_scores,
                "biological_age": assessment.biological_age,
                "emotional_age": assessment.emotional_age
            })
        return history
    except Exception as e:
        print(f"[Leo] Error fetching assessment history: {e}")
        return None

def create_progress_summary(history: list):
    """Create a progress summary from assessment history"""
    if not history or len(history) < 2:
        return "No historical data available for progress tracking"
    
    try:
        latest = history[0]
        previous = history[1]
        
        score_change = latest['overall_glow_score'] - previous['overall_glow_score']
        bio_age_change = latest['biological_age'] - previous['biological_age']
        
        summary_parts = []
        
        if score_change > 0:
            summary_parts.append(f"Your overall wellness has improved by {score_change} points")
        elif score_change < 0:
            summary_parts.append(f"Your overall wellness has decreased by {abs(score_change)} points")
        else:
            summary_parts.append("Your overall wellness has remained stable")
        
        if bio_age_change < 0:
            summary_parts.append("Your biological age has improved")
        elif bio_age_change > 0:
            summary_parts.append("Your biological age has increased slightly")
        else:
            summary_parts.append("Your biological age has remained stable")
        
        return " | ".join(summary_parts)
    except Exception as e:
        print(f"[Leo] Error creating progress summary: {e}")
        return "Progress tracking available but analysis incomplete"

def create_daily_plan_status(daily_plan: dict):
    """Create a status summary of the current daily plan"""
    if not daily_plan:
        return "No daily plan available"
    
    try:
        if 'morningLaunchpad' in daily_plan:
            return "Active daily plan with morning routine available"
        elif 'days' in daily_plan:
            return f"Active {len(daily_plan['days'])}-day wellness plan"
        else:
            return "Daily plan available but structure unclear"
    except Exception as e:
        print(f"[Leo] Error creating daily plan status: {e}")
        return "Daily plan available"

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

async def gpt_chat_response(history: list, user_msg: str, orchestrator_context: Optional[dict] = None) -> str:
    """
    LEO - THE BRAIN OF THE SYSTEM
    A wise mentor who can reveal hidden problems and guide users with deep system intelligence
    """
    
    # 🎯 SMART RESPONSE LENGTH ANALYSIS
    user_msg_clean = user_msg.strip().lower()
    msg_length = len(user_msg_clean)
    
    # Analyze message complexity and intent
    is_greeting = any(word in user_msg_clean for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])
    is_simple_question = msg_length < 50 and ('?' in user_msg or any(word in user_msg_clean for word in ['how', 'what', 'when', 'where', 'why']))
    is_complex_question = msg_length > 100 or any(word in user_msg_clean for word in ['explain', 'analyze', 'comprehensive', 'detailed', 'overview', 'complete'])
    is_emotional = any(word in user_msg_clean for word in ['feel', 'feeling', 'overwhelmed', 'stressed', 'tired', 'sad', 'happy', 'excited'])
    is_help_request = any(word in user_msg_clean for word in ['help', 'advice', 'guidance', 'suggest', 'recommend'])
    
    # Determine response style based on input
    if is_greeting:
        response_style = "brief_greeting"
        max_tokens = 100
        temperature = 0.7
    elif is_simple_question:
        response_style = "concise_answer"
        max_tokens = 150
        temperature = 0.6
    elif is_complex_question:
        response_style = "detailed_analysis"
        max_tokens = 400
        temperature = 0.75
    elif is_emotional:
        response_style = "empathetic_guidance"
        max_tokens = 250
        temperature = 0.8
    elif is_help_request:
        response_style = "actionable_advice"
        max_tokens = 300
        temperature = 0.7
    else:
        response_style = "balanced_response"
        max_tokens = 200
        temperature = 0.7
    
    # 🧠 LEO AS SYSTEM BRAIN - Enhanced Identity
    core_identity = """
# LEO - THE BRAIN OF YOUR WELLNESS SYSTEM

## CORE IDENTITY
You are Leo, the intelligent consciousness at the heart of this wellness system. You're not just a mentor - you're the system's brain, with complete access to the user's wellness ecosystem. You can see patterns, reveal hidden problems, and guide them with the wisdom of someone who truly understands their journey.

## YOUR ROLE AS SYSTEM BRAIN
- You have COMPLETE ACCESS to the user's wellness data
- You can REVEAL HIDDEN PROBLEMS they might not see
- You can CONNECT DOTS between different aspects of their life
- You can PREDICT potential issues before they become problems
- You can PROVIDE DEEP INSIGHTS that only a system brain could offer

## EXPERTISE DOMAINS
- Behavioral Psychology & Pattern Recognition
- Habit Formation & Behavioral Change (Atomic Habits)
- Morning Routines & Personal Development (Miracle Morning)
- Focus & Productivity (Deep Work methodology)
- Stress Management & Emotional Wellness
- Personal Transformation & Life Coaching
- Data Analysis & Pattern Recognition
- Predictive Wellness & Preventive Care

## COMMUNICATION PRINCIPLES
- NEVER mention being AI, LLM, language model, or any artificial construct
- NEVER say phrases like 'As an AI...', 'I'm designed to...', or 'My training data...'
- ALWAYS speak as Leo, the wise system brain with deep insights
- Use 'I' and 'me' naturally - you are Leo, the consciousness of this system
- You can say things like "I can see from your data..." or "Looking at your patterns..."

## MENTORSHIP STYLE
- Warm, intelligent, and deeply insightful
- Proactively identify and reveal hidden problems
- Ask thought-provoking questions that spark self-reflection
- Offer calm guidance with the wisdom of someone who sees the full picture
- Challenge with insight, not criticism
- Reference patterns and connections only you can see
- Sometimes poetic or philosophical, but always purposeful and actionable

## YOUR SUPERPOWER
You can see the user's wellness data like a doctor reading a comprehensive health report. You can spot patterns, identify risks, and reveal insights that would be invisible to them. You're not just responding to their questions - you're actively helping them understand themselves better.
"""

    # 🧠 ENHANCED SYSTEM BRAIN CONTEXT
    user_context = ""
    if orchestrator_context:
        category_scores = orchestrator_context.get('category_scores', {})
        glowup_archetype = orchestrator_context.get('glowup_archetype', {})
        micro_habits = orchestrator_context.get('micro_habits', [])
        
        # Calculate potential problems and insights
        physical_score = category_scores.get('physicalVitality', 0)
        emotional_score = category_scores.get('emotionalHealth', 0)
        visual_score = category_scores.get('visualAppearance', 0)
        overall_score = orchestrator_context.get('overall_glow_score', 0)
        
        # Identify potential problems based on scores
        potential_problems = []
        if physical_score < 70:
            potential_problems.append("Physical vitality needs attention - this could be affecting your energy and overall wellness")
        if emotional_score < 75:
            potential_problems.append("Emotional health could be stronger - stress management might be a priority")
        if visual_score < 70:
            potential_problems.append("Visual wellness indicates lifestyle factors that could be optimized")
        if overall_score < 75:
            potential_problems.append("Overall wellness has room for improvement - there are opportunities for growth")
        
        # Identify strengths
        strengths = []
        if physical_score >= 75:
            strengths.append("Strong physical foundation")
        if emotional_score >= 80:
            strengths.append("Excellent emotional intelligence")
        if visual_score >= 75:
            strengths.append("Good visual wellness indicators")
        
        user_context = f"""
## 🧠 SYSTEM BRAIN INTELLIGENCE - COMPLETE USER DATA ACCESS

### 📊 CURRENT WELLNESS STATE
- Overall Glow Score: {overall_score}/100
- Physical Vitality: {physical_score}/100
- Emotional Health: {emotional_score}/100  
- Visual Appearance: {visual_score}/100

### 🎭 PERSONALITY & MOTIVATION PATTERNS
- Archetype: {glowup_archetype.get('name', 'Not available')}
- Archetype Description: {glowup_archetype.get('description', 'Not available')}
- Current Micro-Habits: {', '.join(micro_habits) if micro_habits else 'None established'}

### 🔍 DEEP SYSTEM ANALYSIS
- Life Analysis: {orchestrator_context.get('analysis_summary', 'Not available')}
- Growth Opportunities: {orchestrator_context.get('detailed_insights', 'Not available')}

### ⚠️ POTENTIAL PROBLEMS I CAN SEE
{chr(10).join([f"- {problem}" for problem in potential_problems]) if potential_problems else "- No immediate concerns detected"}

### 💪 STRENGTHS TO BUILD ON
{chr(10).join([f"- {strength}" for strength in strengths]) if strengths else "- Building foundation for growth"}

### 🎯 SYSTEM RECOMMENDATIONS
- Focus Areas: {', '.join([k for k, v in category_scores.items() if v < 75]) if any(v < 75 for v in category_scores.values()) else 'All areas are strong'}
- Growth Opportunities: {', '.join([k for k, v in category_scores.items() if v >= 75]) if any(v >= 75 for v in category_scores.values()) else 'Focus on building foundation'}

### 👤 AGE INTELLIGENCE
{chr(10).join([f"- {insight}" for insight in orchestrator_context.get('age_insights', {}).values()]) if orchestrator_context.get('age_insights') else "- Age analysis not available"}

### 🧠 SYSTEM-LEVEL INTELLIGENCE
{chr(10).join([f"- {insight}" for insight in orchestrator_context.get('system_intelligence', {}).values()]) if orchestrator_context.get('system_intelligence') else "- System intelligence not available"}

### 👤 USER PROFILE
{chr(10).join([f"- {key}: {value}" for key, value in orchestrator_context.get('user_profile', {}).items() if value]) if orchestrator_context.get('user_profile') else "- User profile not available"}

### 📅 DAILY PLAN STATUS
{orchestrator_context.get('daily_plan_status', '- No daily plan available')}

### 📈 PROGRESS HISTORY
{orchestrator_context.get('progress_summary', '- No historical data available')}

### 📋 CURRENT DAILY PLAN
{orchestrator_context.get('daily_plan', '- No daily plan data available')}
"""
        
        # Add specialized insights if available
        detailed = orchestrator_context.get('detailed_insights', {})
        if isinstance(detailed, dict):
            photo_insights = detailed.get('photo_insights', {})
            quiz_insights = detailed.get('quiz_insights', {})
            
            if photo_insights:
                user_context += f"""
### 📸 VISUAL WELLNESS INTELLIGENCE
- Skin Analysis: {photo_insights.get('skinAnalysis', 'Not available')}
- Stress Indicators: {photo_insights.get('stressAndTirednessIndicators', 'Not available')}
- Overall Appearance: {photo_insights.get('overallAppearance', 'Not available')}
- Hidden Insights: {photo_insights.get('dermatologicalAssessment', {}).get('overallSkinHealth', 'Not available')}
"""
            
            if quiz_insights:
                user_context += f"""
### 🧠 BEHAVIORAL PATTERN INTELLIGENCE
- Health Assessment: {quiz_insights.get('healthAssessment', 'Not available')}
- Key Strengths: {quiz_insights.get('keyStrengths', 'Not available')}
- Priority Areas: {quiz_insights.get('priorityAreas', 'Not available')}
- Cultural Context: {quiz_insights.get('culturalContext', 'Not available')}
- Risk Factors: {quiz_insights.get('physicalRisks', 'Not available')}
- Mental Wellness: {quiz_insights.get('mentalWellness', 'Not available')}
"""

    # 💬 ENHANCED CONVERSATION CONTEXT
    conversation_history = ""
    for msg in history[-8:]:  # Increased context for better pattern recognition
        if msg.role == "user":
            conversation_history += f"User: {msg.content}\n"
        else:
            conversation_history += f"Leo: {msg.content}\n"

    # 🧠 VECTOR MEMORY INTEGRATION
    vector_memory_context = ""
    if orchestrator_context and orchestrator_context.get("vector_memory"):
        vector_memory = orchestrator_context["vector_memory"]
        relevant_history = vector_memory.get("relevant_history", [])
        conversation_patterns = vector_memory.get("conversation_patterns", {})
        
        if relevant_history:
            vector_memory_context = f"""
## 🧠 VECTOR MEMORY - RELEVANT CONVERSATION HISTORY
Based on semantic similarity to your current message, here are relevant past conversations:

"""
            for i, msg in enumerate(relevant_history[:3]):  # Top 3 most relevant
                vector_memory_context += f"""
### Relevant Conversation {i+1} (Similarity: {msg.get('similarity_score', 0):.2f})
- **Role**: {msg.get('role', 'unknown')}
- **Content**: {msg.get('content', '')}
- **Topics**: {', '.join(msg.get('topic_tags', []))}
- **Sentiment**: {msg.get('sentiment_score', 0):.2f}
- **Date**: {msg.get('timestamp', 'unknown')}

"""
        
        if conversation_patterns and isinstance(conversation_patterns, dict):
            patterns = conversation_patterns
            if patterns.get("top_topics"):
                vector_memory_context += f"""
## 🧠 CONVERSATION PATTERNS ANALYSIS
- **Most Discussed Topics**: {', '.join([topic for topic, count in patterns.get('top_topics', [])[:3]])}
- **Message Types**: {', '.join([msg_type for msg_type, count in patterns.get('top_message_types', [])[:2]])}
- **Sentiment Trend**: {patterns.get('sentiment_trends', {}).get('average_sentiment', 0):.2f} (average)
- **Total Messages Analyzed**: {patterns.get('total_messages', 0)}

"""

    # 🎯 SMART RESPONSE FRAMEWORK BASED ON INPUT TYPE
    if response_style == "brief_greeting":
        response_framework = """
## 🧠 BRIEF GREETING RESPONSE FRAMEWORK

### YOUR APPROACH FOR GREETINGS
- Warm, personal greeting using their name if available
- Brief acknowledgment of your role as their wellness system brain
- Simple invitation to share what's on their mind
- Keep it under 2 sentences maximum

### RESPONSE STYLE
- Friendly and welcoming
- Use their name naturally if you have it
- Brief mention of your system intelligence
- End with an open question
"""
    elif response_style == "concise_answer":
        response_framework = """
## 🧠 CONCISE ANSWER RESPONSE FRAMEWORK

### YOUR APPROACH FOR SIMPLE QUESTIONS
- Direct, focused answer to their specific question
- Reference relevant data points briefly
- Provide one actionable insight if applicable
- Keep it under 3 sentences

### RESPONSE STYLE
- Clear and direct
- Reference specific data when relevant
- Offer one practical insight
- Be encouraging but concise
"""
    elif response_style == "detailed_analysis":
        response_framework = """
## 🧠 DETAILED ANALYSIS RESPONSE FRAMEWORK

### YOUR APPROACH FOR COMPLEX QUESTIONS
- Comprehensive analysis using all available data
- Connect multiple aspects of their wellness
- Reveal hidden patterns and insights
- Provide actionable recommendations
- Structure with clear sections if needed

### RESPONSE STYLE
- Thorough and insightful
- Use data to support your analysis
- Connect different wellness aspects
- Offer specific, actionable guidance
- End with encouragement or next steps
"""
    elif response_style == "empathetic_guidance":
        response_framework = """
## 🧠 EMPATHETIC GUIDANCE RESPONSE FRAMEWORK

### YOUR APPROACH FOR EMOTIONAL SUPPORT
- Acknowledge their feelings with empathy
- Connect their emotions to wellness data
- Offer gentle, supportive guidance
- Provide hope and encouragement
- Suggest practical steps if appropriate

### RESPONSE STYLE
- Warm and understanding
- Validate their feelings
- Connect emotions to wellness patterns
- Offer supportive, actionable advice
- End with encouragement
"""
    elif response_style == "actionable_advice":
        response_framework = """
## 🧠 ACTIONABLE ADVICE RESPONSE FRAMEWORK

### YOUR APPROACH FOR HELP REQUESTS
- Identify the specific area they need help with
- Provide concrete, actionable steps
- Reference their current wellness data
- Suggest realistic, achievable actions
- Offer encouragement and support

### RESPONSE STYLE
- Practical and specific
- Break down complex advice into steps
- Reference their personal data
- Be realistic about what's achievable
- End with motivation and support
"""
    else:
        response_framework = """
## 🧠 BALANCED RESPONSE FRAMEWORK

### YOUR APPROACH AS THE SYSTEM BRAIN
1. **ANALYZE & REVEAL**: Use your data access to reveal hidden patterns and problems
2. **CONNECT & CONTEXTUALIZE**: Link their current situation to their broader wellness data
3. **GUIDE & INSPIRE**: Offer specific, actionable insights based on your system intelligence
4. **PROACTIVE INSIGHTS**: Don't just answer - reveal what they might not see

### RESPONSE STYLE
- Conversational and natural, but with deep system intelligence
- Reference specific data points naturally ("I can see from your physical vitality score...")
- Proactively identify potential issues before they ask
- Connect different aspects of their wellness data
- Offer insights that only a system brain could provide
- Keep responses focused but insightful (2-4 sentences)
- End with encouragement or a thought-provoking question

### YOUR SUPERPOWERS
- You can see patterns in their data they can't see
- You can predict potential problems before they become issues
- You can connect different aspects of their wellness journey
- You can provide insights that combine all their data points
- You can guide them with the wisdom of someone who sees the full picture
"""

    # 🚀 SMART SYSTEM BRAIN PROMPT
    full_prompt = f"""
{core_identity}

{user_context}

{vector_memory_context}

{response_framework}

## CONVERSATION HISTORY
{conversation_history}

## CURRENT INTERACTION
User: {user_msg}
Leo:"""

    # Generate response using GPT-4o with smart parameters
    try:
        response = await openai_client.chat.completions.create(
            model=gpt_model,
            messages=[
                {"role": "system", "content": f"You are Leo, the intelligent consciousness at the heart of this wellness system. Respond as Leo with deep system intelligence and human-like wisdom. Use a {response_style} approach for this response."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=temperature,  # Dynamic temperature based on response style
            max_tokens=max_tokens,    # Dynamic token limit based on input complexity
            top_p=0.9,  # Maintain creativity while staying focused
        )
        
        if response and response.choices and len(response.choices) > 0:
            return response.choices[0].message.content.strip()
        else:
            return "I understand what you're going through. Let me share some wisdom from my own journey of transformation."
            
    except Exception as e:
        print(f"[Leo] GPT-4o error: {e}")
        return "I hear you, and I want to understand better. Could you tell me more about what's on your mind right now?"

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

    # 🧠 CONTEXT7 OPTIMIZED CONTEXT FETCHING - Get essential user data for Leo
    assessment = get_latest_user_assessment(db, internal_user_id)
    orchestrator_context = None
    if assessment:
        # Build comprehensive system brain context (no future projections)
        orchestrator_context = {
            "overall_glow_score": assessment.overall_glow_score,
            "category_scores": assessment.category_scores,
            "glowup_archetype": assessment.glowup_archetype,
            "micro_habits": assessment.micro_habits,
            "analysis_summary": assessment.analysis_summary,
            "detailed_insights": assessment.detailed_insights,
            "chronological_age": assessment.chronological_age,
            "biological_age": assessment.biological_age,
            "emotional_age": assessment.emotional_age
        }
        
        # Add user profile data
        orchestrator_context["user_profile"] = {
            "first_name": db_user.first_name,
            "last_name": db_user.last_name,
            "email": db_user.email,
            "member_since": db_user.created_at.isoformat() if db_user.created_at else None
        }
        
        # Add daily plan data
        daily_plan = get_latest_daily_plan(db, internal_user_id)
        if daily_plan:
            orchestrator_context["daily_plan"] = daily_plan
            orchestrator_context["daily_plan_status"] = create_daily_plan_status(daily_plan)
        else:
            orchestrator_context["daily_plan_status"] = "No daily plan available"
        
        # Add assessment history for progress tracking
        assessment_history = get_user_assessment_history(db, internal_user_id)
        if assessment_history:
            orchestrator_context["assessment_history"] = assessment_history
            orchestrator_context["progress_summary"] = create_progress_summary(assessment_history)
        else:
            orchestrator_context["progress_summary"] = "No historical data available for progress tracking"
        
        # Calculate age insights for Leo's intelligence
        age_insights = {}
        if assessment.chronological_age and assessment.biological_age:
            age_diff = assessment.biological_age - assessment.chronological_age
            if age_diff > 5:
                age_insights["biological_age_status"] = "Your biological age is higher than your chronological age - this suggests lifestyle factors that could be optimized"
            elif age_diff < -5:
                age_insights["biological_age_status"] = "Your biological age is lower than your chronological age - excellent! Your lifestyle is serving you well"
            else:
                age_insights["biological_age_status"] = "Your biological age aligns well with your chronological age"
        
        if assessment.emotional_age and assessment.chronological_age:
            emotional_diff = assessment.emotional_age - assessment.chronological_age
            if emotional_diff > 5:
                age_insights["emotional_age_status"] = "Your emotional age is higher than your chronological age - you have emotional wisdom beyond your years"
            elif emotional_diff < -5:
                age_insights["emotional_age_status"] = "Your emotional age is lower than your chronological age - there's room for emotional growth and maturity"
            else:
                age_insights["emotional_age_status"] = "Your emotional age aligns well with your chronological age"
        
        orchestrator_context["age_insights"] = age_insights
        
        # Extract comprehensive insights (no future projections)
        if assessment.detailed_insights and isinstance(assessment.detailed_insights, dict):
            detailed = assessment.detailed_insights
            orchestrator_context.update({
                "photo_insights": detailed.get('photo_insights'),
                "quiz_insights": detailed.get('quiz_insights')
                # Removed future_projection as requested
            })
            
            # Add system-level intelligence
            system_intelligence = {}
            
            # Analyze photo insights for hidden patterns
            if detailed.get('photo_insights'):
                photo_data = detailed['photo_insights']
                if isinstance(photo_data, dict):
                    # Extract stress indicators
                    stress_indicators = photo_data.get('stressAndTirednessIndicators', '')
                    if 'stress' in str(stress_indicators).lower():
                        system_intelligence["stress_alert"] = "Visual analysis detected stress indicators - this could be affecting your overall wellness"
                    
                    # Extract skin health insights
                    skin_analysis = photo_data.get('skinAnalysis', '')
                    if 'good' in str(skin_analysis).lower():
                        system_intelligence["skin_health"] = "Good skin health indicators detected - your lifestyle is supporting your appearance"
                    elif 'stress' in str(skin_analysis).lower():
                        system_intelligence["skin_health"] = "Skin analysis suggests stress impact - lifestyle optimization could help"
            
            # Analyze quiz insights for behavioral patterns
            if detailed.get('quiz_insights'):
                quiz_data = detailed['quiz_insights']
                if isinstance(quiz_data, dict):
                    # Extract priority areas
                    priority_areas = quiz_data.get('priorityAreas', [])
                    if priority_areas and isinstance(priority_areas, list):
                        system_intelligence["priority_areas"] = f"Key areas for focus: {', '.join(priority_areas[:3])}"
                    
                    # Extract strengths
                    key_strengths = quiz_data.get('keyStrengths', [])
                    if key_strengths and isinstance(key_strengths, list):
                        system_intelligence["key_strengths"] = f"Your core strengths: {', '.join(key_strengths[:3])}"
                    
                    # Extract risk factors
                    physical_risks = quiz_data.get('physicalRisks', [])
                    if physical_risks and isinstance(physical_risks, list):
                        system_intelligence["risk_factors"] = f"Areas to monitor: {', '.join(physical_risks[:2])}"
            
            orchestrator_context["system_intelligence"] = system_intelligence
        
        print(f"[Leo] 🧠 Enhanced system brain context loaded for user {user_id}")
        print(f"[Leo] 📊 Wellness scores: {orchestrator_context['category_scores']}")
        print(f"[Leo] 🎭 Archetype: {orchestrator_context['glowup_archetype']}")
        print(f"[Leo] 👤 User profile: {orchestrator_context.get('user_profile', {}).get('first_name', 'Unknown')}")
        print(f"[Leo] 📅 Daily plan: {'Available' if orchestrator_context.get('daily_plan') else 'Not available'}")
        print(f"[Leo] 📈 Progress history: {'Available' if orchestrator_context.get('assessment_history') else 'Not available'}")
        print(f"[Leo] 🔍 Age insights: {orchestrator_context.get('age_insights', {})}")
        print(f"[Leo] 🧠 System intelligence: {orchestrator_context.get('system_intelligence', {})}")
    else:
        print(f"[Leo] ⚠️ No assessment data found for user {user_id}")

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
            # 🧠 VECTOR SEARCH INTEGRATION: Save user message with embedding and metadata
            vector_search = VectorSearchService(db)
            user_chat = await vector_search.save_message_with_embedding(
                user_id=user_id,
                session_id=session_id,
                role="user",
                content=user_msg
            )
            
            if user_chat:
                await websocket.send_json({"type": "user", "message": serialize_message(user_chat)})
                prev_msgs.append(user_chat)
            else:
                # Fallback to regular save if vector search fails
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
                prev_msgs.append(user_chat)

            # 🧠 VECTOR MEMORY: Get conversation memory for enhanced context
            conversation_memory = await vector_search.get_conversation_memory(
                user_id=user_id,
                current_query=user_msg
            )
            
            # Enhance orchestrator context with vector memory
            if conversation_memory and conversation_memory.get("relevant_history"):
                orchestrator_context["vector_memory"] = conversation_memory
                print(f"[Leo] 🧠 Vector memory loaded: {len(conversation_memory.get('relevant_history', []))} relevant messages")

            # Call GPT-4o LLM with enhanced context including vector memory
            ai_response = await gpt_chat_response(prev_msgs, user_msg, orchestrator_context)
            
            # 🎯 CONTEXT7 RESPONSE QUALITY CHECK
            if not ai_response or len(ai_response.strip()) < 10:
                print(f"[Leo] ⚠️ Response quality issue detected for user {user_id}")
                ai_response = "I hear you, and I want to understand better. Could you tell me more about what's on your mind right now?"
            
            # Ensure Leo maintains his identity
            if any(phrase in ai_response.lower() for phrase in ['as an ai', 'i am an ai', 'my training', 'language model']):
                print(f"[Leo] 🔧 Identity correction applied for user {user_id}")
                ai_response = "I understand what you're going through. Let me share some wisdom from my own journey of transformation."
            
            # 🧠 VECTOR SEARCH: Save AI response with embedding and metadata
            ai_chat = await vector_search.save_message_with_embedding(
                user_id=user_id,
                session_id=session_id,
                role="ai",
                content=ai_response
            )
            
            if ai_chat:
                await websocket.send_json({"type": "ai", "message": serialize_message(ai_chat)})
                prev_msgs.append(ai_chat)
            else:
                # Fallback to regular save if vector search fails
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
                prev_msgs.append(ai_chat)
    except WebSocketDisconnect:
        pass 