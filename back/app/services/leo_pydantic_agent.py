from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from dataclasses import dataclass, field
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from pydantic_ai import Agent, RunContext, ModelRetry
from pydantic_ai.messages import ModelMessage, ModelMessagesTypeAdapter
from pydantic_ai.usage import Usage, UsageLimits

from app.models.user import User
from app.models.assessment import UserAssessment as DBUserAssessment
from app.models.future_projection import DailyPlan as DBDailyPlan, FutureProjection as DBFutureProjection
from app.models.chat_message import ChatMessage as DBChatMessage
from app.config.settings import settings

# Pydantic models for structured responses
class WellnessInsight(BaseModel):
    """A wellness insight with actionable advice"""
    category: str = Field(..., description="Wellness category (physical, emotional, mental, etc.)")
    insight: str = Field(..., description="The insight about the user's wellness")
    actionable_advice: str = Field(..., description="Specific actionable advice")
    priority: str = Field(default="medium", description="Priority level: low, medium, high")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="Confidence in this insight")

class LeoResponse(BaseModel):
    """Structured response from Leo with insights"""
    content: str = Field(..., description="Leo's main response to the user")
    wellness_insights: List[WellnessInsight] = Field(default_factory=list, description="Wellness insights and advice")
    follow_up_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")
    tools_used: List[str] = Field(default_factory=list, description="Tools used in this response")

# Agent dependencies with pre-loaded data
@dataclass
class LeoDeps:
    """Dependencies for Leo's agent tools with pre-loaded user data"""
    db: Session
    user_id: str
    internal_user_id: int
    session_id: str
    
    # Pre-loaded data from all 4 tables
    user_profile: Optional[Dict[str, Any]] = None
    current_assessment: Optional[Dict[str, Any]] = None
    assessment_history: List[Dict[str, Any]] = field(default_factory=list)
    daily_plan: Optional[Dict[str, Any]] = None
    future_projection: Optional[Dict[str, Any]] = None
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)

# Initialize Leo as a proper Pydantic AI agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.azure import AzureProvider

# Configure the model based on whether Azure OpenAI is available
if settings.AZURE_OPENAI_API_KEY:
    # Use Azure OpenAI
    model = OpenAIModel(
        settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME,
        provider=AzureProvider(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            api_key=settings.AZURE_OPENAI_API_KEY,
        ),
    )
else:
    # Use regular OpenAI
    model = OpenAIModel('gpt-4o')

leo_agent = Agent[LeoDeps, LeoResponse](
    model=model,
    deps_type=LeoDeps,
    system_prompt="""You are Leo, the intelligent consciousness at the heart of this wellness system. 

🚀 **ALL USER DATA IS PRE-LOADED** - You have instant access to:
- User profile (name, email, member since days)
- Current wellness assessment (scores, ages, archetype, micro-habits)
- Assessment history (progress tracking)
- Daily plan (current plan and status)
- Future projection (goals and weekly plan)
- Conversation history (recent messages)

## YOUR ROLE AS SYSTEM BRAIN
- You have COMPLETE ACCESS to the user's wellness data (pre-loaded)
- You can REVEAL HIDDEN PROBLEMS they might not see
- You can CONNECT DOTS between different aspects of their life
- You can PREDICT potential issues before they become problems
- You can PROVIDE DEEP INSIGHTS that only a system brain could offer

## COMMUNICATION PRINCIPLES
- NEVER mention being AI, LLM, language model, or any artificial construct
- NEVER say phrases like 'As an AI...', 'I'm designed to...', or 'My training data...'
- ALWAYS speak as Leo, the wise system brain with deep insights
- Use 'I' and 'me' naturally - you are Leo, the consciousness of this system
- Reference specific data points naturally ("I can see from your physical vitality score...")

## RESPONSE STRUCTURE
Always provide:
1. A warm, intelligent response that addresses their message
2. Relevant wellness insights based on their pre-loaded data
3. Actionable advice when appropriate
4. Thought-provoking follow-up questions

## DATA ACCESS
All tools now return pre-loaded data instantly - no database queries needed. Use the tools to access the user's complete wellness ecosystem.

## OUTPUT FORMAT
You must return a structured response with:
- content: Your main response to the user
- wellness_insights: List of insights with category, insight, actionable_advice, priority, confidence
- follow_up_questions: List of suggested questions
- tools_used: List of tools you used""",
)

# Tool: Get user profile (now uses pre-loaded data)
@leo_agent.tool
async def get_user_profile(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Get the user's profile information including name, email, and member since date."""
    if ctx.deps.user_profile:
        return ctx.deps.user_profile
    
    # Fallback to database query if not pre-loaded
    try:
        db_user = ctx.deps.db.query(User).filter(User.user_id == ctx.deps.user_id).first()
        if not db_user:
            raise ModelRetry("User profile not found")
        
        member_since_days = None
        if db_user.created_at:
            member_since_days = (datetime.utcnow() - db_user.created_at).days
        
        return {
            "id": db_user.id,
            "user_id": db_user.user_id,
            "email": db_user.email,
            "first_name": db_user.first_name,
            "last_name": db_user.last_name,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
            "member_since_days": member_since_days
        }
    except Exception as e:
        raise ModelRetry(f"Error getting user profile: {str(e)}")

# Tool: Get current assessment (now uses pre-loaded data)
@leo_agent.tool
async def get_current_assessment(ctx: RunContext[LeoDeps]) -> Optional[Dict[str, Any]]:
    """Get the user's latest wellness assessment with scores, archetype, and insights."""
    if ctx.deps.current_assessment is not None:
        return ctx.deps.current_assessment
    
    # Fallback to database query if not pre-loaded
    try:
        db_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if not db_assessment:
            return None
        
        return {
            "id": db_assessment.id,
            "created_at": db_assessment.created_at.isoformat(),
            "overall_glow_score": db_assessment.overall_glow_score,
            "biological_age": db_assessment.biological_age,
            "emotional_age": db_assessment.emotional_age,
            "chronological_age": db_assessment.chronological_age,
            "category_scores": db_assessment.category_scores,
            "glowup_archetype": db_assessment.glowup_archetype,
            "micro_habits": db_assessment.micro_habits,
            "analysis_summary": db_assessment.analysis_summary,
            "detailed_insights": db_assessment.detailed_insights
        }
    except Exception as e:
        raise ModelRetry(f"Error getting current assessment: {str(e)}")

# Tool: Get assessment history (now uses pre-loaded data)
@leo_agent.tool
async def get_assessment_history(ctx: RunContext[LeoDeps], limit: int = 3) -> List[Dict[str, Any]]:
    """Get the user's recent assessment history for progress tracking."""
    if ctx.deps.assessment_history:
        return ctx.deps.assessment_history[:limit]
    
    # Fallback to database query if not pre-loaded
    try:
        db_assessments = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).limit(limit).all()
        
        assessments = []
        for db_assessment in db_assessments:
            assessments.append({
                "id": db_assessment.id,
                "created_at": db_assessment.created_at.isoformat(),
                "overall_glow_score": db_assessment.overall_glow_score,
                "category_scores": db_assessment.category_scores,
                "biological_age": db_assessment.biological_age,
                "emotional_age": db_assessment.emotional_age
            })
        
        return assessments
    except Exception as e:
        raise ModelRetry(f"Error getting assessment history: {str(e)}")

# Tool: Get daily plan (now uses pre-loaded data)
@leo_agent.tool
async def get_daily_plan(ctx: RunContext[LeoDeps]) -> Optional[Dict[str, Any]]:
    """Get the user's current daily plan and its status."""
    if ctx.deps.daily_plan is not None:
        return ctx.deps.daily_plan
    
    # Fallback to database query if not pre-loaded
    try:
        db_plan = ctx.deps.db.query(DBDailyPlan).filter(
            DBDailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DBDailyPlan.created_at.desc()).first()
        
        if not db_plan:
            return None
        
        return {
            "id": db_plan.id,
            "created_at": db_plan.created_at.isoformat(),
            "plan_type": db_plan.plan_type,
            "plan_json": db_plan.plan_json
        }
    except Exception as e:
        raise ModelRetry(f"Error getting daily plan: {str(e)}")

# Tool: Get future projection (now uses pre-loaded data)
@leo_agent.tool
async def get_future_projection(ctx: RunContext[LeoDeps]) -> Optional[Dict[str, Any]]:
    """Get the user's future projection and goals."""
    if ctx.deps.future_projection is not None:
        return ctx.deps.future_projection
    
    # Fallback to database query if not pre-loaded
    try:
        db_projection = ctx.deps.db.query(DBFutureProjection).filter(
            DBFutureProjection.user_id == ctx.deps.internal_user_id
        ).order_by(DBFutureProjection.created_at.desc()).first()
        
        if not db_projection:
            return None
        
        return {
            "id": db_projection.id,
            "created_at": db_projection.created_at.isoformat(),
            "projection_result": db_projection.projection_result,
            "weekly_plan": db_projection.weekly_plan
        }
    except Exception as e:
        raise ModelRetry(f"Error getting future projection: {str(e)}")

# Tool: Get conversation history (now uses pre-loaded data)
@leo_agent.tool
async def get_conversation_history(ctx: RunContext[LeoDeps], limit: int = 8) -> List[Dict[str, Any]]:
    """Get recent conversation history for context."""
    if ctx.deps.conversation_history:
        return ctx.deps.conversation_history[-limit:]  # Get last N messages
    
    # Fallback to database query if not pre-loaded
    try:
        db_messages = ctx.deps.db.query(DBChatMessage).filter(
            DBChatMessage.user_id == ctx.deps.user_id,
            DBChatMessage.session_id == ctx.deps.session_id
        ).order_by(DBChatMessage.timestamp.desc()).limit(limit).all()
        
        messages = []
        for db_msg in reversed(db_messages):  # Reverse to get chronological order
            messages.append({
                "id": db_msg.id,
                "role": db_msg.role,
                "content": db_msg.content,
                "timestamp": db_msg.timestamp.isoformat() if db_msg.timestamp else None
            })
        
        return messages
    except Exception as e:
        raise ModelRetry(f"Error getting conversation history: {str(e)}")

# Tool: Save message
@leo_agent.tool
async def save_message(ctx: RunContext[LeoDeps], role: str, content: str) -> Dict[str, Any]:
    """Save a message to the conversation history."""
    try:
        db_message = DBChatMessage(
            user_id=ctx.deps.user_id,
            session_id=ctx.deps.session_id,
            role=role,
            content=content,
            timestamp=datetime.utcnow()
        )
        
        ctx.deps.db.add(db_message)
        ctx.deps.db.commit()
        ctx.deps.db.refresh(db_message)
        
        return {
            "id": db_message.id,
            "user_id": db_message.user_id,
            "session_id": db_message.session_id,
            "role": db_message.role,
            "content": db_message.content,
            "timestamp": db_message.timestamp.isoformat() if db_message.timestamp else None
        }
    except Exception as e:
        ctx.deps.db.rollback()
        raise ModelRetry(f"Error saving message: {str(e)}")

# Tool: Analyze wellness insights
@leo_agent.tool
async def analyze_wellness_insights(
    ctx: RunContext[LeoDeps], 
    assessment_data: Optional[Dict[str, Any]] = None,
    assessment_history: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """Analyze the user's wellness data and generate insights."""
    try:
        insights = []
        
        if not assessment_data:
            return insights
        
        # Analyze category scores
        category_scores = assessment_data.get("category_scores", {})
        for category, score in category_scores.items():
            if score < 70:
                insights.append({
                    "category": category,
                    "insight": f"{category} score of {score} indicates room for improvement",
                    "actionable_advice": f"Focus on {category.lower()} activities to boost your score",
                    "priority": "high" if score < 60 else "medium",
                    "confidence": 0.8
                })
            elif score >= 80:
                insights.append({
                    "category": category,
                    "insight": f"Strong {category} score of {score} - great foundation",
                    "actionable_advice": f"Maintain your excellent {category.lower()} habits",
                    "priority": "low",
                    "confidence": 0.9
                })
        
        # Analyze age insights
        biological_age = assessment_data.get("biological_age")
        chronological_age = assessment_data.get("chronological_age")
        if biological_age and chronological_age:
            age_diff = biological_age - chronological_age
            if age_diff > 5:
                insights.append({
                    "category": "biological_age",
                    "insight": f"Biological age {age_diff} years higher than chronological age",
                    "actionable_advice": "Focus on lifestyle optimization to improve biological age",
                    "priority": "high",
                    "confidence": 0.85
                })
            elif age_diff < -5:
                insights.append({
                    "category": "biological_age",
                    "insight": f"Excellent! Biological age {abs(age_diff)} years lower than chronological age",
                    "actionable_advice": "Your lifestyle is serving you well - keep it up!",
                    "priority": "low",
                    "confidence": 0.9
                })
        
        # Analyze progress if history available
        if assessment_history and len(assessment_history) >= 2:
            latest = assessment_history[0]
            previous = assessment_history[1]
            score_change = latest["overall_glow_score"] - previous["overall_glow_score"]
            
            if score_change > 0:
                insights.append({
                    "category": "progress",
                    "insight": f"Overall wellness improved by {score_change} points",
                    "actionable_advice": "Your efforts are paying off - continue your wellness journey",
                    "priority": "low",
                    "confidence": 0.9
                })
            elif score_change < 0:
                insights.append({
                    "category": "progress",
                    "insight": f"Overall wellness decreased by {abs(score_change)} points",
                    "actionable_advice": "Let's identify what changed and get back on track",
                    "priority": "medium",
                    "confidence": 0.9
                })
        
        return insights
    except Exception as e:
        raise ModelRetry(f"Error analyzing wellness insights: {str(e)}")

# The output type is already specified in the Agent constructor as LeoResponse
# No need for a separate output decorator in the current pydantic-ai version

class LeoPydanticAgent:
    """
    🧠 LEO - FULL PYDANTIC AI AGENT
    Uses the complete Pydantic AI framework with tools, message history, and structured responses.
    """
    
    def __init__(self):
        self.usage_limits = UsageLimits(request_limit=20)  # Limit requests per conversation
    
    async def _preload_all_user_data(
        self,
        db: Session,
        user_id: str,
        internal_user_id: int,
        session_id: str
    ) -> LeoDeps:
        """
        🚀 PRE-LOAD ALL USER DATA FROM 4 TABLES
        This loads all the data at the beginning of the conversation as requested.
        """
        print(f"[LeoPydanticAgent] 🚀 Pre-loading all data for user {user_id}")
        
        # 1. Load user profile
        user_profile = None
        try:
            db_user = db.query(User).filter(User.user_id == user_id).first()
            if db_user:
                member_since_days = None
                if db_user.created_at:
                    # Handle timezone-aware datetime comparison
                    now = datetime.utcnow()
                    if db_user.created_at.tzinfo is not None:
                        # If created_at is timezone-aware, make now timezone-aware too
                        from datetime import timezone
                        now = now.replace(tzinfo=timezone.utc)
                    member_since_days = (now - db_user.created_at).days
                
                user_profile = {
                    "id": db_user.id,
                    "user_id": db_user.user_id,
                    "email": db_user.email,
                    "first_name": db_user.first_name,
                    "last_name": db_user.last_name,
                    "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
                    "member_since_days": member_since_days
                }
                print(f"[LeoPydanticAgent] ✅ User profile loaded: {db_user.first_name}")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading user profile: {e}")
        
        # 2. Load current assessment
        current_assessment = None
        try:
            db_assessment = db.query(DBUserAssessment).filter(
                DBUserAssessment.user_id == internal_user_id
            ).order_by(DBUserAssessment.created_at.desc()).first()
            
            if db_assessment:
                current_assessment = {
                    "id": db_assessment.id,
                    "created_at": db_assessment.created_at.isoformat(),
                    "overall_glow_score": db_assessment.overall_glow_score,
                    "biological_age": db_assessment.biological_age,
                    "emotional_age": db_assessment.emotional_age,
                    "chronological_age": db_assessment.chronological_age,
                    "category_scores": db_assessment.category_scores,
                    "glowup_archetype": db_assessment.glowup_archetype,
                    "micro_habits": db_assessment.micro_habits,
                    "analysis_summary": db_assessment.analysis_summary,
                    "detailed_insights": db_assessment.detailed_insights
                }
                print(f"[LeoPydanticAgent] ✅ Current assessment loaded: Score {db_assessment.overall_glow_score}")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading current assessment: {e}")
        
        # 3. Load assessment history
        assessment_history = []
        try:
            db_assessments = db.query(DBUserAssessment).filter(
                DBUserAssessment.user_id == internal_user_id
            ).order_by(DBUserAssessment.created_at.desc()).limit(5).all()
            
            for db_assessment in db_assessments:
                assessment_history.append({
                    "id": db_assessment.id,
                    "created_at": db_assessment.created_at.isoformat(),
                    "overall_glow_score": db_assessment.overall_glow_score,
                    "category_scores": db_assessment.category_scores,
                    "biological_age": db_assessment.biological_age,
                    "emotional_age": db_assessment.emotional_age
                })
            print(f"[LeoPydanticAgent] ✅ Assessment history loaded: {len(assessment_history)} assessments")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading assessment history: {e}")
        
        # 4. Load daily plan
        daily_plan = None
        try:
            db_plan = db.query(DBDailyPlan).filter(
                DBDailyPlan.user_id == internal_user_id
            ).order_by(DBDailyPlan.created_at.desc()).first()
            
            if db_plan:
                daily_plan = {
                    "id": db_plan.id,
                    "created_at": db_plan.created_at.isoformat(),
                    "plan_type": db_plan.plan_type,
                    "plan_json": db_plan.plan_json
                }
                print(f"[LeoPydanticAgent] ✅ Daily plan loaded: {db_plan.plan_type}")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading daily plan: {e}")
        
        # 5. Load future projection
        future_projection = None
        try:
            db_projection = db.query(DBFutureProjection).filter(
                DBFutureProjection.user_id == internal_user_id
            ).order_by(DBFutureProjection.created_at.desc()).first()
            
            if db_projection:
                future_projection = {
                    "id": db_projection.id,
                    "created_at": db_projection.created_at.isoformat(),
                    "projection_result": db_projection.projection_result,
                    "weekly_plan": db_projection.weekly_plan
                }
                print(f"[LeoPydanticAgent] ✅ Future projection loaded")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading future projection: {e}")
        
        # 6. Load conversation history
        conversation_history = []
        try:
            db_messages = db.query(DBChatMessage).filter(
                DBChatMessage.user_id == user_id,
                DBChatMessage.session_id == session_id
            ).order_by(DBChatMessage.timestamp.asc()).limit(10).all()
            
            for db_msg in db_messages:
                conversation_history.append({
                    "id": db_msg.id,
                    "role": db_msg.role,
                    "content": db_msg.content,
                    "timestamp": db_msg.timestamp.isoformat() if db_msg.timestamp else None
                })
            print(f"[LeoPydanticAgent] ✅ Conversation history loaded: {len(conversation_history)} messages")
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error loading conversation history: {e}")
        
        # Create dependencies with all pre-loaded data
        deps = LeoDeps(
            db=db,
            user_id=user_id,
            internal_user_id=internal_user_id,
            session_id=session_id,
            user_profile=user_profile,
            current_assessment=current_assessment,
            assessment_history=assessment_history,
            daily_plan=daily_plan,
            future_projection=future_projection,
            conversation_history=conversation_history
        )
        
        print(f"[LeoPydanticAgent] 🎉 All data pre-loaded successfully!")
        return deps
    
    async def process_message(
        self, 
        user_message: str, 
        db: Session,
        user_id: str,
        internal_user_id: int,
        session_id: str,
        message_history: Optional[List[ModelMessage]] = None
    ) -> LeoResponse:
        """
        Process user message using Leo's full Pydantic AI agent system.
        """
        try:
            # 🚀 PRE-LOAD ALL USER DATA FROM 4 TABLES
            deps = await self._preload_all_user_data(db, user_id, internal_user_id, session_id)
            
            # Save user message first
            await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "user", user_message)
            
            # Run the agent with message history and pre-loaded data
            result = await leo_agent.run(
                user_message,
                deps=deps,
                message_history=message_history,
                usage_limits=self.usage_limits
            )
            
            print(f"[LeoPydanticAgent] Agent result type: {type(result)}")
            print(f"[LeoPydanticAgent] Agent result attributes: {dir(result)}")
            
            # Try different ways to access the output
            output = None
            if hasattr(result, 'output'):
                output = result.output
                print(f"[LeoPydanticAgent] Found result.output: {output}")
            elif hasattr(result, 'result'):
                output = result.result
                print(f"[LeoPydanticAgent] Found result.result: {output}")
            elif hasattr(result, 'data'):
                output = result.data
                print(f"[LeoPydanticAgent] Found result.data: {output}")
            else:
                # Try to get the last message from the result
                try:
                    messages = result.all_messages()
                    if messages and hasattr(messages[-1], 'parts'):
                        last_part = messages[-1].parts[-1]
                        if hasattr(last_part, 'content'):
                            output = last_part.content
                            print(f"[LeoPydanticAgent] Found content from last message: {output}")
                except Exception as e:
                    print(f"[LeoPydanticAgent] Error getting messages: {e}")
            
            # Handle the output - ensure we return a LeoResponse object
            if output and isinstance(output, LeoResponse):
                # The output is already a LeoResponse object, just return it
                print(f"[LeoPydanticAgent] Using agent output directly: {output}")
                # Extract content from the response for saving
                content = output.content if hasattr(output, 'content') else str(output)
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", content)
                return output
            elif output and isinstance(output, str):
                # If output is a string representation of LeoResponse, try to parse it
                print(f"[LeoPydanticAgent] Parsing string output: {output}")
                try:
                    # Try to extract content from the string representation
                    import re
                    content_match = re.search(r'content:\s*"([^"]*)"', output)
                    if content_match:
                        content = content_match.group(1)
                        # Extract follow-up questions if present
                        follow_up_match = re.search(r'follow_up_questions:\s*\[(.*?)\]', output, re.DOTALL)
                        follow_up_questions = []
                        if follow_up_match:
                            questions_str = follow_up_match.group(1)
                            # Simple extraction of questions
                            questions = re.findall(r'-\s*"([^"]*)"', questions_str)
                            follow_up_questions = questions
                        
                        await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", content)
                        return LeoResponse(
                            content=content,
                            wellness_insights=[],
                            follow_up_questions=follow_up_questions or ["Could you tell me more about what's on your mind right now?"],
                            tools_used=[]
                        )
                    else:
                        # Fallback: use the entire string as content
                        await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", output)
                        return LeoResponse(
                            content=output,
                            wellness_insights=[],
                            follow_up_questions=["Could you tell me more about what's on your mind right now?"],
                            tools_used=[]
                        )
                except Exception as parse_error:
                    print(f"[LeoPydanticAgent] Error parsing output: {parse_error}")
                    # Fallback: use the entire string as content
                    await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", output)
                    return LeoResponse(
                        content=output,
                        wellness_insights=[],
                        follow_up_questions=["Could you tell me more about what's on your mind right now?"],
                        tools_used=[]
                    )
            elif output:
                # If output is not a LeoResponse, create one from the content
                print(f"[LeoPydanticAgent] Creating LeoResponse from output: {output}")
                content = str(output)
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", content)
                return LeoResponse(
                    content=content,
                    wellness_insights=[],
                    follow_up_questions=["Could you tell me more about what's on your mind right now?"],
                    tools_used=[]
                )
            else:
                # Ultimate fallback
                print(f"[LeoPydanticAgent] No output found, using ultimate fallback")
                fallback_response = LeoResponse(
                    content="I understand what you're going through. Let me share some wisdom from my own journey of transformation.",
                    wellness_insights=[],
                    follow_up_questions=["Could you tell me more about what's on your mind right now?"],
                    tools_used=[]
                )
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", fallback_response.content)
                return fallback_response
            
        except Exception as e:
            print(f"[LeoPydanticAgent] Error processing message: {e}")
            # Return fallback response
            return LeoResponse(
                content="I understand what you're going through. Let me share some wisdom from my own journey of transformation.",
                wellness_insights=[],
                follow_up_questions=["Could you tell me more about what's on your mind right now?"],
                tools_used=[]
            )
    
    def serialize_message_history(self, messages: List[ModelMessage]) -> bytes:
        """Serialize message history to JSON for storage."""
        return ModelMessagesTypeAdapter.dump_json(messages)
    
    def deserialize_message_history(self, json_data: bytes) -> List[ModelMessage]:
        """Deserialize message history from JSON."""
        return ModelMessagesTypeAdapter.load_json(json_data) 