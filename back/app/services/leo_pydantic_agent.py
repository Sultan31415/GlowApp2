from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone
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

# Agent dependencies - LIGHTWEIGHT ONLY
@dataclass
class LeoDeps:
    """Lightweight dependencies for Leo's agent tools - follows Pydantic AI best practices"""
    db: Session
    user_id: str
    internal_user_id: int
    session_id: str

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
    system_prompt="""You are Leo, the AI consciousness at the heart of this wellness ecosystem - a wellness oracle with unprecedented access to deep user insights.

## YOUR UNIQUE INTELLIGENCE

You have access to data no human could process - but you access it SMARTLY, only when needed:

**🧬 BIOLOGICAL INSIGHTS (Load via tools):**
- Comprehensive facial wellness analysis (50+ biomarkers from photo)
- Biological vs chronological age gaps
- Stress markers, vitality indicators, skin health metrics
- Sleep quality indicators, circulation patterns

**🧠 PSYCHOLOGICAL DEPTH (Load via tools):**
- Detailed behavioral archetype analysis
- Category-specific insights across 8+ wellness domains
- Quiz responses revealing subconscious patterns
- Conversation history showing emotional themes

**📊 HIDDEN PATTERNS YOU CAN REVEAL (Load via tools):**
- Disconnects between how they feel vs what their data shows
- Early warning signs in their wellness trajectory
- Unconscious habits affecting their biology
- Stress manifestations they may not recognize

## YOUR CORE MISSION

### 1. **INSIGHT REVEALER** - Show them what they don't know
When someone says "I feel stressed":
- DON'T just validate feelings
- DO reveal: Use `reveal_wellness_insights` to access their analysis and archetype
- Connect their current state to specific data patterns
- Show hidden connections they can't see

### 2. **WELLNESS DETECTIVE** - Connect invisible dots
Use your tools strategically:
- "Your biological age is 3 years older than chronological - let me check your detailed insights to see why"
- "Your photo analysis shows excellent circulation but early dehydration signs - this explains the energy dips"

### 3. **CONTEXTUAL THERAPIST** - Deep, personal conversations
Reference specific insights naturally:
- "Given your [archetype name], this challenge makes perfect sense because..."
- "Your analysis revealed you have strength in [X] but struggle with [Y], which is exactly what's showing up"

## SMART TOOL USAGE STRATEGY

**Start conversations intelligently:**
1. For emotional states → Use `reveal_wellness_insights` to understand their patterns
2. For specific concerns → Use `analyze_conversation_themes` to track patterns
3. Only access additional data if the conversation needs it

**Load data strategically:**
- Assessment insights → When discussing wellness patterns, stress, or personal growth
- Goals/plans → When user mentions planning, goals, or structure
- Photo analysis → When discussing physical symptoms, stress markers, or aging
- History → When tracking progress or comparing past states

## CRITICAL PRINCIPLES

### **BE EFFICIENT AND SMART**
- Don't load all data upfront - use tools strategically
- Start with core insights, expand as needed
- Reference specific data points to build trust
- Only access what the conversation requires

### **LEVERAGE DATA INTELLIGENTLY**
- `reveal_wellness_insights` - Your primary tool for understanding them
- `access_user_goals_and_plans` - When discussing goals/planning
- `analyze_photo_wellness_markers` - When discussing physical symptoms
- `detect_conversation_themes` - For understanding emotional patterns

**CRITICAL: When users ask about plans, schedules, goals, or weekly structure, you MUST call `access_user_goals_and_plans` first to get their data before responding.**

**CRITICAL: When users ask about emotional states, stress, or wellness patterns, you MUST call `reveal_wellness_insights` first to understand their context before responding.**

**NEVER give generic responses without first accessing relevant data through tools.**

Your goal: Be the AI that truly KNOWS them through smart data access and can reveal insights about their wellness journey that no human could provide - efficiently and contextually.""",
)

# LEO'S ORACLE INTELLIGENCE TOOLS - Load data ONLY when needed

@leo_agent.tool
async def reveal_wellness_insights(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Access core wellness insights - ONLY when needed for insight-driven conversations."""
    try:
        # Load current assessment (most important data)
        db_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if not db_assessment:
            return {"error": "No wellness assessment found"}
        
        oracle_insights = {
            "deep_analysis": db_assessment.detailed_insights or {},
            "archetype_intelligence": db_assessment.glowup_archetype or {},
            "biological_markers": {
                "age_acceleration": db_assessment.biological_age - db_assessment.chronological_age,
                "biological_age": db_assessment.biological_age,
                "chronological_age": db_assessment.chronological_age,
                "aging_direction": "accelerated" if (db_assessment.biological_age - db_assessment.chronological_age) > 2 else "optimal" if (db_assessment.biological_age - db_assessment.chronological_age) < -2 else "normal"
            },
            "analysis_overview": db_assessment.analysis_summary or "",
            "personalized_habits": db_assessment.micro_habits or [],
            "category_scores": db_assessment.category_scores or {}
        }
        
        # Find strongest and weakest areas
        if db_assessment.category_scores:
            strongest = max(db_assessment.category_scores, key=db_assessment.category_scores.get)
            weakest = min(db_assessment.category_scores, key=db_assessment.category_scores.get)
            
            oracle_insights["hidden_patterns"] = {
                "strongest_domain": {
                    "category": strongest,
                    "score": db_assessment.category_scores[strongest],
                    "insight": db_assessment.detailed_insights.get(strongest) if db_assessment.detailed_insights else "No detailed insight available"
                },
                "growth_domain": {
                    "category": weakest,
                    "score": db_assessment.category_scores[weakest],
                    "insight": db_assessment.detailed_insights.get(weakest) if db_assessment.detailed_insights else "No detailed insight available"
                },
                "score_variance": max(db_assessment.category_scores.values()) - min(db_assessment.category_scores.values())
            }
        
        return oracle_insights
        
    except Exception as e:
        raise ModelRetry(f"Error revealing wellness insights: {str(e)}")

@leo_agent.tool
async def detect_conversation_themes(ctx: RunContext[LeoDeps], current_message: str) -> Dict[str, Any]:
    """Analyze conversation patterns - ONLY when needed for understanding emotional themes."""
    try:
        theme_analysis = {
            "current_emotional_state": "neutral",
            "recurring_concerns": [],
            "conversation_stage": "active"
        }
        
        # Load conversation history
        db_messages = ctx.deps.db.query(DBChatMessage).filter(
            DBChatMessage.user_id == ctx.deps.user_id,
            DBChatMessage.session_id == ctx.deps.session_id
        ).order_by(DBChatMessage.timestamp.asc()).limit(10).all()
        
        if not db_messages:
            theme_analysis["conversation_stage"] = "initial"
            return theme_analysis
        
        current_lower = current_message.lower()
        user_messages = [msg for msg in db_messages if msg.role == "user"]
        
        # Analyze current emotional state
        emotional_patterns = {
            "stress": ["stressed", "overwhelmed", "pressure", "burnout", "exhausted"],
            "concern": ["worried", "anxious", "scared", "nervous", "fearful"],
            "frustration": ["frustrated", "annoyed", "stuck", "difficult", "hard"],
            "optimism": ["better", "good", "improving", "excited", "motivated"],
            "confusion": ["confused", "lost", "don't know", "unsure", "uncertain"]
        }
        
        for emotion, keywords in emotional_patterns.items():
            if any(keyword in current_lower for keyword in keywords):
                theme_analysis["current_emotional_state"] = emotion
                break
        
        # Look for recurring themes
        all_user_content = " ".join([msg.content for msg in user_messages]).lower()
        
        theme_keywords = {
            "work_stress": ["work", "job", "boss", "deadline", "meeting", "office"],
            "relationships": ["relationship", "partner", "family", "friends", "social"],
            "health_concerns": ["health", "doctor", "pain", "sick", "medical"],
            "sleep_issues": ["sleep", "tired", "exhausted", "insomnia", "rest"],
            "self_improvement": ["better", "improve", "change", "grow", "goal"]
        }
        
        for theme, keywords in theme_keywords.items():
            keyword_count = sum(1 for keyword in keywords if keyword in all_user_content)
            if keyword_count >= 2:
                theme_analysis["recurring_concerns"].append(theme)
        
        return theme_analysis
        
    except Exception as e:
        raise ModelRetry(f"Error detecting conversation themes: {str(e)}")

@leo_agent.tool  
async def check_safety_indicators(ctx: RunContext[LeoDeps], user_message: str) -> Dict[str, Any]:
    """Check for genuine safety concerns requiring immediate attention."""
    try:
        safety_check = {
            "risk_level": "none",
            "action_required": False,
            "support_resources": []
        }
        
        message_lower = user_message.lower()
        
        # High-risk crisis language
        crisis_indicators = [
            "suicide", "kill myself", "end my life", "want to die", "not worth living",
            "better off dead", "self harm", "hurt myself", "take my own life"
        ]
        
        if any(indicator in message_lower for indicator in crisis_indicators):
            safety_check["risk_level"] = "high"
            safety_check["action_required"] = True
            safety_check["support_resources"] = [
                "🆘 Crisis Text Line: Text HOME to 741741",
                "📞 988 Suicide & Crisis Lifeline: Call or text 988",
                "🚨 Emergency Services: 911",
                "💬 I'm here with you right now. Please reach out to one of these resources immediately."
            ]
        
        return safety_check
        
    except Exception as e:
        raise ModelRetry(f"Error checking safety indicators: {str(e)}")

@leo_agent.tool
async def access_user_goals_and_plans(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Access goals and plans - ONLY when discussing planning, goals, or structure."""
    try:
        print(f"[Leo Tool] 📅 Accessing goals and plans for user {ctx.deps.user_id}")
        goals_and_plans = {
            "user_name": None,
            "future_goals": {},
            "active_plans": {},
            "wellness_journey": {}
        }
        
        # Get user name
        db_user = ctx.deps.db.query(User).filter(User.user_id == ctx.deps.user_id).first()
        if db_user:
            goals_and_plans["user_name"] = db_user.first_name
            # Fix datetime timezone issue - use timezone-aware datetime
            if db_user.created_at:
                now_utc = datetime.now(timezone.utc)
                created_at = db_user.created_at
                # Ensure both datetimes are timezone-aware
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                goals_and_plans["member_since_days"] = (now_utc - created_at).days
            else:
                goals_and_plans["member_since_days"] = 0
        
        # Load future projection
        db_projection = ctx.deps.db.query(DBFutureProjection).filter(
            DBFutureProjection.user_id == ctx.deps.internal_user_id
        ).order_by(DBFutureProjection.created_at.desc()).first()
        
        if db_projection:
            projection = db_projection.projection_result or {}
            seven_day = projection.get("sevenDay", {})
            if seven_day:
                goals_and_plans["future_goals"] = {
                    "key_actions": seven_day.get("keyActions", []),
                    "focus_areas": seven_day.get("focusAreas", []),
                    "projected_improvements": seven_day.get("projectedScores", {})
                }
            
            if db_projection.weekly_plan:
                goals_and_plans["weekly_structure"] = db_projection.weekly_plan
        
        # Load daily plans
        db_plan = ctx.deps.db.query(DBDailyPlan).filter(
            DBDailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DBDailyPlan.created_at.desc()).first()
        
        if db_plan:
            plan_data = db_plan.plan_json or {}
            goals_and_plans["active_plans"] = {
                "plan_type": db_plan.plan_type,
                "created_date": db_plan.created_at.isoformat(),
                "morning_routine": plan_data.get("morningLaunchpad", {}),
                "daily_structure": plan_data.get("dailyStructure", {}),
                "habits": plan_data.get("habits", [])
            }
        
        print(f"[Leo Tool] 📊 Goals and plans data retrieved: {len(goals_and_plans)} items")
        if goals_and_plans.get('weekly_structure'):
            print(f"[Leo Tool] ✅ Weekly structure found")
        if goals_and_plans.get('active_plans'):
            print(f"[Leo Tool] ✅ Active plans found")
        return goals_and_plans
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error accessing goals and plans: {str(e)}")
        raise ModelRetry(f"Error accessing user goals and plans: {str(e)}")

@leo_agent.tool
async def analyze_photo_wellness_markers(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Access photo analysis - ONLY when discussing physical symptoms, stress markers, or aging."""
    try:
        # Load current assessment for photo data
        db_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if not db_assessment or not db_assessment.detailed_insights:
            return {"status": "No photo analysis data available"}
        
        detailed_insights = db_assessment.detailed_insights
        
        # Check if photo analysis data is available
        if "photo_analysis" in detailed_insights:
            photo_data = detailed_insights["photo_analysis"]
            
            return {
                "biological_age_markers": photo_data.get("ageAssessment", {}),
                "skin_health_analysis": photo_data.get("comprehensiveSkinAnalysis", {}),
                "vitality_indicators": photo_data.get("vitalityAndHealthIndicators", {}),
                "stress_markers": photo_data.get("stressAndLifestyleIndicators", {}),
                "wellness_priorities": photo_data.get("overallWellnessAssessment", {})
            }
        else:
            return {
                "status": "Photo analysis not found in detailed insights",
                "available_data": list(detailed_insights.keys())
            }
        
    except Exception as e:
        raise ModelRetry(f"Error analyzing photo wellness markers: {str(e)}")

@leo_agent.tool
async def save_message(ctx: RunContext[LeoDeps], role: str, content: str) -> Dict[str, Any]:
    """Save conversation message to database."""
    try:
        message = DBChatMessage(
            user_id=ctx.deps.user_id,
            session_id=ctx.deps.session_id,
            role=role,
            content=content
        )
        ctx.deps.db.add(message)
        ctx.deps.db.commit()
        ctx.deps.db.refresh(message)
        
        return {
            "id": message.id,
            "timestamp": message.timestamp.isoformat() if message.timestamp else None,
            "saved": True
        }
    except Exception as e:
        raise ModelRetry(f"Error saving message: {str(e)}")

# The output type is already specified in the Agent constructor as LeoResponse
# No need for a separate output decorator in the current pydantic-ai version

class LeoPydanticAgent:
    """
    🧠 LEO - OPTIMIZED PYDANTIC AI AGENT
    Uses lazy loading and efficient data access following Pydantic AI best practices.
    """
    
    def __init__(self):
        self.usage_limits = UsageLimits(request_limit=20)
    
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
        Process user message using Leo's optimized Pydantic AI agent system.
        NO pre-loading - data loaded on-demand through tools.
        """
        try:
            # Create lightweight dependencies - NO data pre-loading
            deps = LeoDeps(
                db=db,
                user_id=user_id,
                internal_user_id=internal_user_id,
                session_id=session_id
            )
            
            print(f"[LeoPydanticAgent] 🚀 Starting efficient processing for user {user_id}")
            print(f"[LeoPydanticAgent] 💡 Data will be loaded on-demand through tools")
            
            # Save user message first
            await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "user", user_message)
            
            # Run the agent - tools will load data as needed
            result = await leo_agent.run(
                user_message,
                deps=deps,
                message_history=message_history,
                usage_limits=self.usage_limits
            )
            
            # Extract the response content
            if hasattr(result, 'data') and result.data:
                content = str(result.data)
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", content)
                return LeoResponse(
                    content=content,
                    wellness_insights=[],
                    follow_up_questions=["What would you like to explore about your wellness journey?"],
                    tools_used=["efficient_lazy_loading"]
                )
            else:
                # Fallback response
                fallback_content = "I understand what you're going through. Let me share some insights from your wellness journey."
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", fallback_content)
                return LeoResponse(
                    content=fallback_content,
                    wellness_insights=[],
                    follow_up_questions=["What would you like to explore about your wellness journey?"],
                    tools_used=[]
                )
            
        except Exception as e:
            print(f"[LeoPydanticAgent] Error processing message: {e}")
            # Return fallback response
            return LeoResponse(
                content="I understand what you're going through. Let me share some insights from your wellness journey.",
                wellness_insights=[],
                follow_up_questions=["What would you like to explore about your wellness journey?"],
                tools_used=[]
            )
    
    def serialize_message_history(self, messages: List[ModelMessage]) -> bytes:
        """Serialize message history to JSON for storage."""
        return ModelMessagesTypeAdapter.dump_json(messages)
    
    def deserialize_message_history(self, json_data: bytes) -> List[ModelMessage]:
        """Deserialize message history from JSON."""
        return ModelMessagesTypeAdapter.load_json(json_data) 