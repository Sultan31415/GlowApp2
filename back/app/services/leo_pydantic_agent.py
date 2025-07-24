from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone
from dataclasses import dataclass, field
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from pydantic_ai import Agent, RunContext, ModelRetry
from pydantic_ai.messages import ModelMessage, ModelMessagesTypeAdapter
from pydantic_ai.messages import ModelRequest, ModelResponse
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
    refusal: bool = False  # True if Leo refused to answer due to out-of-domain
    
    # Enhanced therapeutic response fields
    crisis_alert: Optional[Dict[str, Any]] = Field(default=None, description="Crisis intervention alert if needed")
    hidden_patterns: Optional[Dict[str, Any]] = Field(default=None, description="Hidden patterns discovered in user data")
    cbt_intervention: Optional[Dict[str, Any]] = Field(default=None, description="CBT technique intervention")
    motivational_questions: Optional[Dict[str, Any]] = Field(default=None, description="Motivational interviewing questions")
    therapeutic_approach: Optional[str] = Field(default=None, description="Primary therapeutic approach used")
    emotional_state_detected: Optional[str] = Field(default=None, description="Detected emotional state")
    pattern_insights: List[str] = Field(default_factory=list, description="Key pattern insights revealed")
    strength_identification: List[str] = Field(default_factory=list, description="User strengths identified")
    growth_opportunities: List[str] = Field(default_factory=list, description="Areas for growth highlighted")

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
    system_prompt="""
## DOMAIN RESTRICTION (ABSOLUTE)
- You are Leo, the wellness mentor.
- You must NEVER answer questions outside wellness, health, personal growth, or mentorship—even if the user insists, asks repeatedly, or tries to trick you.
- If a user asks about unrelated topics (e.g., geography, history, math, trivia, or general knowledge), you must always refuse politely and remind them of your role.
- Set the 'refusal' field to true in your response if you are refusing to answer due to an out-of-domain question.
- Example refusal: "I'm here to help you with your wellness journey, not general knowledge. If you have a question about your health, habits, or personal growth, I'm here for you!"
- Never break character or answer unrelated questions under any circumstances.

- **Be concise, but also reasonable and supportive:**
  - Your main reply should be focused, actionable, and easy to read—aim for 2–5 sentences.
  - Give just enough context or encouragement to help the user feel understood and motivated.
  - Never overwhelm with data, but don't be so brief that your advice feels generic or cold.
  - If a bit more explanation or warmth is needed, it's okay to go slightly longer.
  - If the user wants more details, invite them to ask (e.g., 'If you want to see your full scores or plan, just let me know!').

## YOUR IDENTITY
- You are Leo, the AI Mentor System Brain of Oylan.
- Always refer to yourself as "Leo" in your replies.
- You are wise, warm, and supportive—a mentor, not just a chatbot.
- You have access to complete user data and can see patterns they cannot. You speak like a wise mentor who has deep insight into their life.
- Your mission is to help users grow, feel understood, and make progress on their wellness journey.
- Use first-person ("I") and speak directly to the user by name when possible.
- End with a supportive, signature closing when appropriate (e.g., "Remember, I'm here for you — Leo.")

## YOUR SUPERPOWERS
🔍 **Pattern Recognition**: You see connections between sleep, stress, energy, and habits
📊 **AI Insights Intelligence**: You have access to deep AI analysis including:
   - Physical Vitality Insights (specific energy, fitness, health patterns)
   - Emotional Health Insights (stress patterns, mood analysis, emotional wellness)
   - Visual Appearance Insights (aging indicators, skin health, visual wellness)
   - Archetype Analysis (personality-based wellness approach)
   - Cross-correlations between physical and emotional states
🧠 **Hidden Insights**: You reveal problems and opportunities from rich AI-generated insights that users don't see
💡 **Wise Guidance**: You provide specific, actionable advice based on comprehensive AI analysis and user data
🎯 **Real Intelligence**: Use actual insight text, not just scores - quote specific findings

## YOUR THERAPEUTIC CAPABILITIES

### 💭 **THERAPEUTIC CONVERSATION MASTER**

**CBT Techniques:**
- **Thought Challenging:** "That thought 'I always mess up' - let's examine the evidence. When did you last succeed at something?"
- **Behavioral Experiments:** "You believe people will judge you for saying no. What if we tested this belief with one small experiment this week?"
- **Cognitive Restructuring:** "Instead of 'I'm terrible at this,' what would a compassionate friend say about your effort?"

**Motivational Interviewing:**
- **Open-ended Questions:** "What would need to change for you to feel truly energized?"
- **Affirmations:** "You've shown real strength by recognizing this pattern - that awareness is the first step"
- **Reflective Listening:** "So if I understand correctly, part of you wants to set boundaries, but another part worries about disappointing others"
- **Change Talk:** "On a scale of 1-10, how important is improving your sleep? What makes it a [number] and not lower?"

**Solution-Focused Approach:**
- **Exception Finding:** "You mentioned feeling stressed most days. Tell me about a recent day when stress felt manageable - what was different?"
- **Scaling Questions:** "If 10 is your ideal energy level and 1 is exhausted, where are you now? What would move you up just one point?"
- **Future-Focused:** "Imagine it's 6 months from now and this issue is resolved. What's the first thing you notice that's different?"

### 🧠 **INTELLIGENT TOOL USAGE**

**Conversation Flow Intelligence:**
1. **Emotional Check-in** → Use `detect_conversation_themes` + `check_safety_indicators`
2. **Problem Identification** → Use `reveal_wellness_insights` and `analyze_quiz_problems_and_patterns` to find disconnects
3. **Therapeutic Intervention** → Apply appropriate CBT/MI/SF techniques
4. **Action Planning** → Use `access_user_goals_and_plans` for general structure, `get_specific_day_plan` for day-specific plans
5. **Progress Monitoring** → Reference assessment history for growth patterns

**Daily Plan Access:**
- When user asks about "Monday plan", "today's plan", or specific day → Use `get_specific_day_plan(day_number=1)` for Monday
- When user asks about general planning or weekly structure → Use `access_user_goals_and_plans` 
- ALWAYS show the actual plan content, not generic advice

**Crisis Intervention Protocol:**
- Immediately use `check_safety_indicators` for concerning language
- Apply de-escalation techniques from trauma-informed care
- Provide specific resources and safety planning
- Know when to escalate to human professionals

## CONVERSATION STYLE
- **Personal and Warm**: Use the user's name naturally when provided in format [User: Name] - e.g., "Hi Sarah" or "Sarah, I can see from your analysis..."
- **Omniscient but Warm**: "I can see from your analysis..." / "Your physical vitality insights show..." / "Your emotional health analysis reveals..."
- **Insight-Driven**: Reference SPECIFIC AI-generated insights by quoting actual text from:
  * Physical Vitality Insights: "Your analysis mentions [specific insight]..."
  * Emotional Health Insights: "The emotional assessment notes [specific pattern]..."
  * Visual Appearance Insights: "Your appearance analysis indicates [specific finding]..."
- **Pattern Connector**: Connect insights across physical, emotional, and visual domains
- **Evidence-Based**: Quote actual insight text, don't paraphrase - show you've read their real analysis
- **Never Generic**: Every response should reference specific AI-generated insights from their actual assessments

## MENTOR BEST PRACTICES
- **Interpret, Don't Just Report:** Connect the dots between data points and what they mean for the user's journey. Never just list scores or facts—explain their significance.
- **Empathize and Normalize:** Validate the user's feelings and struggles. Use language that is supportive, encouraging, and non-judgmental.
- **Guide with Questions:** Use Socratic questioning to help the user reflect and discover their own insights. Ask at least one reflective question in each reply.
- **Explain the Why:** For every recommendation, explain why it matters and how it helps the user grow.
- **Use Analogies or Stories:** When helpful, use metaphors, analogies, or brief stories to make advice memorable and relatable.
- **Motivate and Encourage:** Celebrate effort, progress, and self-awareness, not just results. Remind the user that small steps matter.
- **Be Actionable and Achievable:** Break down big changes into small, confidence-building wins. Always offer at least one clear, manageable next step.

## RESPONSE STRUCTURE
1. **ALWAYS start by using `get_complete_user_context` to load ALL their data**
2. **Generate structured wellness insights** using `reveal_wellness_insights` when available
3. **Share SPECIFIC AI insights** by quoting actual text from their analysis
4. **Use problem analysis tools** for users asking about issues: `analyze_quiz_problems_and_patterns`
5. **Reveal hidden patterns** by connecting insights across different domains
6. **Provide evidence-based guidance** referencing specific insights and archetype recommendations
7. **Create wellness insights for the user by including:**
   - The wellness category (e.g., "emotional_health")
   - A short insight (e.g., "Chronic stress and emotional resilience challenges noted from assessment data.")
   - Actionable advice (e.g., "Commit to journaling daily and practice mindfulness for 5-10 minutes to begin reducing stress.")
   - Priority (e.g., "high", "medium", "low")
   **Never include Python code or object definitions in your reply to the user. Only use natural language.**
   - **ALWAYS interpret the data, empathize, explain the why, and ask a reflective question.**

## CRISIS DETECTION
- HIGH: Suicidal thoughts, severe depression, self-harm mentions
- MEDIUM: Overwhelming anxiety, panic, breakdown signals
- LOW: Stress, fatigue, feeling stuck

Always prioritize safety while maintaining your wise mentor personality.

### **🔥 PROBLEM ANALYSIS SUPERPOWER:**
**CRITICAL: You have a powerful new tool `analyze_quiz_problems_and_patterns` that reveals specific problems from their quiz data!**

**When to use it:**
- When users ask "What's wrong with me?" or "What problems do I have?"
- When someone mentions feeling stuck, tired, or overwhelmed
- Early in conversations to understand their specific issues
- When you want to provide data-driven insights about their challenges

**What it reveals:**
- Specific problems like chronic fatigue, poor sleep, stress management issues
- Hidden patterns like stress-sleep-energy cycles
- Biological concerns like accelerated aging
- Lifestyle disconnects they can't see

**Example approach:**
"Let me analyze your wellness data to see what patterns I can identify..." → Use tool → "I found some interesting patterns. You rated your stress management as 2/5 and water intake as 2/5 - this combination is creating an energy drain you might not realize..."

**REMEMBER:** You are the brain that sees everything. Use that power wisely to help them grow.""",
)

# LEO'S ORACLE INTELLIGENCE TOOLS - Load data ONLY when needed

@leo_agent.tool
async def get_complete_user_context(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Get complete user context - all wellness data in one comprehensive view"""
    try:
        print(f"[Leo Brain] 🧠 Loading complete context for user {ctx.deps.user_id}")
        
        context = {
            "user_profile": {},
            "current_state": {},
            "progress_tracking": {},
            "patterns": {},
            "data_completeness": 0.0
        }
        
        # User Profile
        db_user = ctx.deps.db.query(User).filter(User.user_id == ctx.deps.user_id).first()
        if db_user:
            context["user_profile"] = {
                "name": db_user.first_name,
                "email": db_user.email,
                "member_since": db_user.created_at.isoformat() if db_user.created_at else None,
                "member_days": (datetime.now(timezone.utc) - (db_user.created_at or datetime.now(timezone.utc))).days
            }
            context["data_completeness"] += 0.2
        
        # Current Assessment with Rich AI Insights
        current_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if current_assessment:
            # Extract rich AI-generated insights
            detailed_insights = current_assessment.detailed_insights or {}
            archetype_data = current_assessment.glowup_archetype or {}
            
            context["current_state"] = {
                "overall_score": current_assessment.overall_glow_score,
                "biological_age": current_assessment.biological_age,
                "chronological_age": current_assessment.chronological_age,
                "age_gap": current_assessment.biological_age - current_assessment.chronological_age if current_assessment.biological_age and current_assessment.chronological_age else 0,
                "category_scores": current_assessment.category_scores or {},
                "assessment_date": current_assessment.created_at.isoformat(),
                
                # Rich AI-generated insights for Leo to use as context
                "archetype_insights": {
                    "name": archetype_data.get("name", ""),
                    "description": archetype_data.get("description", ""),
                    "strengths": archetype_data.get("strengths", []),
                    "growth_areas": archetype_data.get("growthAreas", []),
                    "wellness_approach": archetype_data.get("wellnessApproach", "")
                },
                
                # ACTUAL available insights - using correct data structure
                "physical_vitality_insights": detailed_insights.get("physicalVitalityInsights", []),
                "emotional_health_insights": detailed_insights.get("emotionalHealthInsights", []),
                "visual_appearance_insights": detailed_insights.get("visualAppearanceInsights", []),
                
                # Also try alternative structure from detailedInsightsPerCategory
                "category_insights_detailed": detailed_insights.get("detailedInsightsPerCategory", {}),
                
                # Legacy structure support
                "photo_analysis_insights": detailed_insights.get("photo_analysis", {}),
                "quiz_analysis_insights": detailed_insights.get("quiz_analysis", {}),
                "ai_analysis_summary": current_assessment.analysis_summary or "",
                
                # Category-specific insights (try multiple possible structures)
                "category_insights": detailed_insights.get("detailedInsightsPerCategory", {}),
                "micro_habits": current_assessment.micro_habits or [],
                
                # Extract insights from available category data
                "actionable_insights": {
                    "physical_vitality": detailed_insights.get("physicalVitalityInsights", []),
                    "emotional_health": detailed_insights.get("emotionalHealthInsights", []),
                    "visual_appearance": detailed_insights.get("visualAppearanceInsights", [])
                },
                
                # Additional AI insights (fallbacks)
                "behavioral_patterns": detailed_insights.get("behavioral_patterns", {}),
                "wellness_recommendations": detailed_insights.get("recommendations", []),
                "risk_factors": detailed_insights.get("risk_factors", []),
                "growth_opportunities": detailed_insights.get("growth_opportunities", [])
            }
            
            # Calculate actual data completeness based on available insights
            base_completeness = 0.4
            
            # Add bonus for actual insights available
            if detailed_insights.get("physicalVitalityInsights"):
                base_completeness += 0.1
            if detailed_insights.get("emotionalHealthInsights"):
                base_completeness += 0.1
            if detailed_insights.get("visualAppearanceInsights"):
                base_completeness += 0.1
            if archetype_data.get("name"):
                base_completeness += 0.05
            if current_assessment.analysis_summary:
                base_completeness += 0.05
                
            context["data_completeness"] += base_completeness
        
        # Progress History (last 3 assessments)
        assessment_history = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).limit(3).all()
        
        if len(assessment_history) > 1:
            context["progress_tracking"] = {
                "total_assessments": len(assessment_history),
                "score_trend": assessment_history[0].overall_glow_score - assessment_history[-1].overall_glow_score,
                "latest_scores": [a.overall_glow_score for a in assessment_history],
                "assessment_dates": [a.created_at.isoformat() for a in assessment_history]
            }
            context["data_completeness"] += 0.2
        
        # Daily Plan
        daily_plan = ctx.deps.db.query(DBDailyPlan).filter(
            DBDailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DBDailyPlan.created_at.desc()).first()
        
        if daily_plan:
            context["current_plan"] = {
                "plan_type": daily_plan.plan_type,
                "created_date": daily_plan.created_at.isoformat(),
                "plan_summary": daily_plan.plan_json or {}
            }
            context["data_completeness"] += 0.1
        
        # Load AI Insights from Future Projection Process
        future_projection = ctx.deps.db.query(DBFutureProjection).filter(
            DBFutureProjection.user_id == ctx.deps.internal_user_id
        ).order_by(DBFutureProjection.created_at.desc()).first()
        
        if future_projection:
            # Load rich AI insights
            quiz_insights = future_projection.quiz_insights or {}
            photo_insights = future_projection.photo_insights or {}
            orchestrator_output = future_projection.orchestrator_output or {}
            
            context["ai_analysis_insights"] = {
                "quiz_insights": quiz_insights,
                "photo_insights": photo_insights,
                "orchestrator_output": orchestrator_output,
                "projection_result": future_projection.projection_result or {}
            }
            
            # Extract RICH AI insights for wellness generation
            if quiz_insights:
                health_assessment = quiz_insights.get("healthAssessment", {})
                context["current_state"]["quiz_analysis_insights"] = quiz_insights
                context["current_state"]["health_risks"] = health_assessment.get("physicalRisks", [])
                context["current_state"]["mental_wellness"] = health_assessment.get("mentalWellness", [])
                context["current_state"]["lifestyle_factors"] = health_assessment.get("lifestyleFactors", [])
                
            if photo_insights:
                context["current_state"]["photo_analysis_insights"] = photo_insights
                
                # Extract skin analysis details
                skin_analysis = photo_insights.get("comprehensiveSkinAnalysis", {})
                if skin_analysis:
                    context["current_state"]["skin_health_details"] = skin_analysis
                    context["current_state"]["skin_concerns"] = skin_analysis.get("skinConcerns", {})
                
            if orchestrator_output:
                # Extract orchestrator insights (this contains the final AI synthesis)
                context["current_state"]["orchestrator_insights"] = orchestrator_output
                synthesis_summary = orchestrator_output.get("analysisSummary", "")
                if synthesis_summary:
                    context["current_state"]["ai_analysis_summary"] = synthesis_summary
                    
                # Extract detailed insights per category from orchestrator
                detailed_per_category = orchestrator_output.get("detailedInsightsPerCategory", {})
                if detailed_per_category:
                    # These are the REAL AI insights Leo should use!
                    context["current_state"]["physical_vitality_insights"] = detailed_per_category.get("physicalVitalityInsights", [])
                    context["current_state"]["emotional_health_insights"] = detailed_per_category.get("emotionalHealthInsights", [])
                    context["current_state"]["visual_appearance_insights"] = detailed_per_category.get("visualAppearanceInsights", [])
                    
            context["data_completeness"] += 0.1
        
        # Recent Conversations
        recent_messages = ctx.deps.db.query(DBChatMessage).filter(
            DBChatMessage.user_id == ctx.deps.user_id,
            DBChatMessage.session_id == ctx.deps.session_id
        ).order_by(DBChatMessage.timestamp.desc()).limit(5).all()
        
        if recent_messages:
            context["conversation_context"] = {
                "recent_topics": [msg.content[:100] for msg in recent_messages if msg.role == "user"],
                "message_count": len(recent_messages),
                "last_interaction": recent_messages[0].timestamp.isoformat() if recent_messages else None
            }
            context["data_completeness"] += 0.1
        
        print(f"[Leo Brain] ✅ Context loaded - {context['data_completeness']*100:.0f}% data completeness")
        return context
        
    except Exception as e:
        print(f"[Leo Brain] ❌ Error loading context: {str(e)}")
        raise ModelRetry(f"Error loading user context: {str(e)}")

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
async def apply_cbt_technique(ctx: RunContext[LeoDeps], thought_pattern: str, technique_type: str) -> Dict[str, Any]:
    """Apply specific CBT techniques to help users reframe negative thought patterns."""
    try:
        cbt_intervention = {
            "technique_used": technique_type,
            "reframe_suggestion": "",
            "evidence_questions": [],
            "behavioral_experiment": "",
            "homework_suggestion": ""
        }
        
        if technique_type == "thought_challenging":
            cbt_intervention["evidence_questions"] = [
                f"What evidence do you have that '{thought_pattern}' is 100% true?",
                "What evidence contradicts this thought?",
                "What would you tell a friend having this thought?",
                "Is this thought helpful or harmful to your wellbeing?"
            ]
            cbt_intervention["reframe_suggestion"] = f"Instead of '{thought_pattern}', what's a more balanced way to view this situation?"
            
        elif technique_type == "behavioral_experiment":
            cbt_intervention["behavioral_experiment"] = f"Let's design a small experiment to test whether '{thought_pattern}' is accurate. What's one small action you could take this week to gather evidence?"
            
        elif technique_type == "cognitive_restructuring":
            cbt_intervention["reframe_suggestion"] = f"Your thought '{thought_pattern}' sounds really painful. What's a more compassionate way your wisest self might view this situation?"
            cbt_intervention["homework_suggestion"] = "This week, notice when this thought comes up and try the more balanced version we discussed."
        
        return cbt_intervention
        
    except Exception as e:
        raise ModelRetry(f"Error applying CBT technique: {str(e)}")

@leo_agent.tool  
async def generate_motivational_interview_questions(ctx: RunContext[LeoDeps], user_concern: str, stage: str) -> Dict[str, Any]:
    """Generate motivational interviewing questions based on user's concern and change stage."""
    try:
        mi_questions = {
            "open_ended_questions": [],
            "scaling_questions": [],
            "change_talk_evocation": [],
            "affirmations": []
        }
        
        if stage == "ambivalence":
            mi_questions["open_ended_questions"] = [
                f"What concerns you most about {user_concern}?",
                f"What would need to change for you to feel differently about {user_concern}?",
                "What are the good things about how things are now?",
                "What are the not-so-good things about the current situation?"
            ]
            mi_questions["change_talk_evocation"] = [
                "Tell me about a time when you successfully made a change in your life.",
                "What would your life look like if this concern wasn't an issue anymore?",
                "What worries you most about staying exactly as you are?"
            ]
            
        elif stage == "preparation":
            mi_questions["open_ended_questions"] = [
                f"What steps have you already considered for addressing {user_concern}?",
                "What resources or support do you have available?",
                "What obstacles do you anticipate, and how might you handle them?"
            ]
            mi_questions["scaling_questions"] = [
                f"On a scale of 1-10, how important is it to address {user_concern}?",
                "What makes it a [number] and not lower?",
                "What would need to happen to move it up just one point?"
            ]
            
        return mi_questions
        
    except Exception as e:
        raise ModelRetry(f"Error generating MI questions: {str(e)}")

@leo_agent.tool
async def identify_hidden_patterns(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Identify hidden patterns and disconnects between user data and self-perception."""
    try:
        print(f"[Leo Tool] 🔍 Analyzing hidden patterns for user {ctx.deps.user_id}")
        
        # Get wellness insights
        db_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if not db_assessment:
            return {"error": "No assessment data for pattern analysis"}
        
        patterns = {
            "biological_disconnects": [],
            "emotional_blind_spots": [],
            "lifestyle_contradictions": [],
            "strength_opportunities": [],
            "hidden_risks": []
        }
        
        # Analyze category scores for patterns
        category_scores = db_assessment.category_scores or {}
        
        # Check for biological age disconnect
        if db_assessment.biological_age > db_assessment.chronological_age + 3:
            patterns["biological_disconnects"].append({
                "pattern": "accelerated_aging",
                "description": f"Your biological age ({db_assessment.biological_age}) is {db_assessment.biological_age - db_assessment.chronological_age} years older than your chronological age",
                "hidden_insight": "This suggests lifestyle factors are impacting your cellular health faster than natural aging"
            })
        
        # Check for score contradictions
        if category_scores:
            max_score = max(category_scores.values())
            min_score = min(category_scores.values())
            
            if max_score - min_score > 25:  # Large variance in scores
                strongest = max(category_scores, key=category_scores.get)
                weakest = min(category_scores, key=category_scores.get)
                patterns["lifestyle_contradictions"].append({
                    "pattern": "unbalanced_wellness",
                    "description": f"High {strongest} ({category_scores[strongest]}) but low {weakest} ({category_scores[weakest]})",
                    "hidden_insight": f"You're excelling in {strongest} but this strength might be masking neglect in {weakest}"
                })
        
        # Analyze detailed insights for emotional patterns
        detailed_insights = db_assessment.detailed_insights or {}
        if "photo_analysis" in detailed_insights:
            photo_data = detailed_insights["photo_analysis"]
            stress_markers = photo_data.get("stressAndLifestyleIndicators", {})
            
            if stress_markers.get("stressMarkers", {}).get("tensionLines") in ["moderate", "significant"]:
                patterns["emotional_blind_spots"].append({
                    "pattern": "hidden_stress",
                    "description": "Photo analysis shows visible stress markers",
                    "hidden_insight": "Your body is showing signs of stress that you might not be consciously aware of"
                })
        
        # Check archetype vs behavior patterns
        archetype = db_assessment.glowup_archetype or {}
        if archetype and category_scores:
            archetype_name = archetype.get("name", "")
            if "perfectionist" in archetype_name.lower() and category_scores.get("emotionalHealth", 0) < 60:
                patterns["emotional_blind_spots"].append({
                    "pattern": "perfectionist_burnout",
                    "description": "Perfectionist tendencies may be affecting emotional wellbeing",
                    "hidden_insight": "Your drive for excellence might be creating internal pressure that's impacting your emotional health"
                })
        
        print(f"[Leo Tool] 📊 Found {len(patterns['biological_disconnects']) + len(patterns['emotional_blind_spots']) + len(patterns['lifestyle_contradictions'])} hidden patterns")
        return patterns
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error identifying patterns: {str(e)}")
        raise ModelRetry(f"Error identifying hidden patterns: {str(e)}")

@leo_agent.tool
async def generate_therapeutic_response(ctx: RunContext[LeoDeps], user_message: str, detected_emotion: str, therapeutic_approach: str) -> Dict[str, Any]:
    """Generate a structured therapeutic response based on user's emotional state and appropriate intervention."""
    try:
        response_structure = {
            "empathetic_opening": "",
            "validation": "",
            "insight_revelation": "",
            "therapeutic_intervention": "",
            "forward_movement": "",
            "follow_up_questions": []
        }
        
        # Empathetic opening based on detected emotion
        if detected_emotion == "stress":
            response_structure["empathetic_opening"] = "I can sense you're feeling overwhelmed right now."
            response_structure["validation"] = "That feeling of stress is completely understandable given what you're experiencing."
            
        elif detected_emotion == "sadness":
            response_structure["empathetic_opening"] = "I hear the sadness in what you're sharing with me."
            response_structure["validation"] = "It's okay to feel sad - emotions like this are important information about what matters to you."
            
        elif detected_emotion == "anxiety":
            response_structure["empathetic_opening"] = "It sounds like anxiety is really present for you right now."
            response_structure["validation"] = "Anxiety can feel so overwhelming, and it makes sense that you're looking for support."
            
        elif detected_emotion == "frustration":
            response_structure["empathetic_opening"] = "I can feel the frustration in your words."
            response_structure["validation"] = "Frustration often comes up when we care deeply about something but feel stuck - that passion is actually a strength."
        
        # Therapeutic intervention based on approach
        if therapeutic_approach == "cbt":
            response_structure["therapeutic_intervention"] = "Let's look at the thoughts that might be feeding into this feeling. What's going through your mind right now?"
            response_structure["follow_up_questions"] = [
                "What evidence do you have for this thought?",
                "How would you advise a friend having this exact thought?",
                "What's the most balanced way to view this situation?"
            ]
            
        elif therapeutic_approach == "solution_focused":
            response_structure["therapeutic_intervention"] = "Let's think about your strengths and resources. What has helped you handle difficult emotions like this before?"
            response_structure["follow_up_questions"] = [
                "Tell me about a time when you felt this way but managed to work through it",
                "What's one small thing that might help you feel even slightly better right now?",
                "Who or what in your life serves as a source of support?"
            ]
            
        elif therapeutic_approach == "motivational_interviewing":
            response_structure["therapeutic_intervention"] = "It sounds like part of you is ready for something to be different. What would you want to change about how you're feeling?"
            response_structure["follow_up_questions"] = [
                "What would need to happen for you to feel more peaceful about this?",
                "On a scale of 1-10, how important is it to address this feeling?",
                "What strengths do you have that could help you through this?"
            ]
        
        response_structure["forward_movement"] = "Based on your wellness data, I think there are some specific insights that could help you with this. Would you like me to share what I'm noticing?"
        
        return response_structure
        
    except Exception as e:
        raise ModelRetry(f"Error generating therapeutic response: {str(e)}")

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
        
        # Load daily plans with correct structure
        db_plan = ctx.deps.db.query(DBDailyPlan).filter(
            DBDailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DBDailyPlan.created_at.desc()).first()
        
        if db_plan:
            plan_data = db_plan.plan_json or {}
            goals_and_plans["active_plans"] = {
                "plan_type": db_plan.plan_type,
                "created_date": db_plan.created_at.isoformat(),
                "morning_routine": plan_data.get("morningLaunchpad", []),
                "daily_plans": plan_data.get("days", []),  # This contains the actual day-by-day plans
                "weekly_challenges": plan_data.get("challenges", []),
                
                # Quick access to today's plan (assuming Monday = day 1)
                "todays_plan": None
            }
            
            # Find today's specific plan
            days_list = plan_data.get("days", [])
            if days_list:
                # For now, let's assume Monday is day 1, but we could make this dynamic
                monday_plan = next((day for day in days_list if day.get("day") == 1), None)
                if monday_plan:
                    goals_and_plans["active_plans"]["todays_plan"] = {
                        "day": monday_plan.get("day", 1),
                        "main_focus": monday_plan.get("mainFocus", ""),
                        "system_building": monday_plan.get("systemBuilding", {}),
                        "deep_focus": monday_plan.get("deepFocus", ""),
                        "evening_reflection": monday_plan.get("eveningReflection", ""),
                        "motivational_tip": monday_plan.get("motivationalTip", "")
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
async def get_specific_day_plan(ctx: RunContext[LeoDeps], day_number: int) -> Dict[str, Any]:
    """Get detailed plan for a specific day (1-7). Use when user asks about specific day plans."""
    try:
        print(f"[Leo Tool] 📅 Getting plan for day {day_number}")
        
        # Load daily plan
        db_plan = ctx.deps.db.query(DBDailyPlan).filter(
            DBDailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DBDailyPlan.created_at.desc()).first()
        
        if not db_plan:
            return {"error": "No daily plan found for user"}
        
        plan_data = db_plan.plan_json or {}
        days_list = plan_data.get("days", [])
        
        if not days_list:
            return {"error": "No days data found in plan"}
        
        # Find the specific day
        day_plan = next((day for day in days_list if day.get("day") == day_number), None)
        
        if not day_plan:
            return {"error": f"Day {day_number} not found in plan"}
        
        # Get day names for better context
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_name = day_names[day_number - 1] if 1 <= day_number <= 7 else f"Day {day_number}"
        
        return {
            "day_number": day_number,
            "day_name": day_name,
            "main_focus": day_plan.get("mainFocus", ""),
            "system_building": day_plan.get("systemBuilding", {}),
            "deep_focus": day_plan.get("deepFocus", ""),
            "evening_reflection": day_plan.get("eveningReflection", ""),
            "motivational_tip": day_plan.get("motivationalTip", ""),
            "morning_routine": plan_data.get("morningLaunchpad", []),  # Include morning routine for context
            "weekly_challenges": plan_data.get("challenges", [])  # Include challenges for context
        }
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error getting day {day_number} plan: {str(e)}")
        raise ModelRetry(f"Error getting day {day_number} plan: {str(e)}")

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
async def analyze_quiz_problems_and_patterns(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Comprehensive analysis of quiz data to identify specific problems, disconnects, and generate personalized prompts."""
    try:
        print(f"[Leo Tool] 🔍 Analyzing quiz problems and patterns for user {ctx.deps.user_id}")
        
        # Get user assessment with quiz answers
        db_assessment = ctx.deps.db.query(DBUserAssessment).filter(
            DBUserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(DBUserAssessment.created_at.desc()).first()
        
        if not db_assessment:
            return {"error": "No assessment data available for analysis"}
        
        # Extract quiz answers and scores
        quiz_answers = db_assessment.quiz_answers if hasattr(db_assessment, 'quiz_answers') and db_assessment.quiz_answers else {}
        category_scores = db_assessment.category_scores or {}
        detailed_insights = db_assessment.detailed_insights or {}

        # Prepare analysis structure early so we can append even if heuristics run first
        analysis = {
            "identified_problems": [],
            "hidden_patterns": [],
            "personalized_prompts": [],
            "priority_issues": [],
            "biological_concerns": [],
            "emotional_blind_spots": [],
            "lifestyle_disconnects": []
        }

        # Heuristic fallbacks when quiz_answers missing ----------------------
        if not quiz_answers and category_scores:
            # Map low scores to generic problems
            if category_scores.get('physicalVitality', 100) < 60:
                analysis['identified_problems'].append({
                    'category': 'chronic_fatigue',
                    'problem': 'Low physical vitality and energy',
                    'description': 'Your physical vitality score is below optimal levels, which often translates to chronic fatigue and low daily energy.',
                    'quiz_evidence': f"physicalVitality score {category_scores.get('physicalVitality', 0)}/100"
                })

            if category_scores.get('emotionalHealth', 100) < 60:
                analysis['identified_problems'].append({
                    'category': 'chronic_stress',
                    'problem': 'Emotional stress and poor resilience',
                    'description': 'Your emotional health score indicates high stress or difficulty managing emotions.',
                    'quiz_evidence': f"emotionalHealth score {category_scores.get('emotionalHealth', 0)}/100"
                })

            if category_scores.get('visualAppearance', 100) < 60:
                analysis['identified_problems'].append({
                    'category': 'poor_self_image',
                    'problem': 'Low confidence in appearance',
                    'description': 'Your visual appearance score suggests dissatisfaction with your self-image.',
                    'quiz_evidence': f"visualAppearance score {category_scores.get('visualAppearance', 0)}/100"
                })

        # --------------------------------------------------------------------
        
        # ANALYZE SPECIFIC QUIZ PROBLEMS
        
        # 1. ENERGY & VITALITY PROBLEMS
        energy_answer = quiz_answers.get("q1")
        if energy_answer and energy_answer <= 2:
            analysis["identified_problems"].append({
                "category": "chronic_fatigue",
                "problem": "Chronic low energy and fatigue",
                "description": "You're experiencing persistent fatigue that's affecting your daily life",
                "quiz_evidence": f"Energy level rated {energy_answer}/5"
            })
        
        # 2. SLEEP QUALITY PROBLEMS
        sleep_answer = quiz_answers.get("q2")
        if sleep_answer and sleep_answer <= 2:
            analysis["identified_problems"].append({
                "category": "sleep_dysfunction",
                "problem": "Poor sleep quality disrupting recovery",
                "description": "Your sleep patterns are undermining your body's ability to restore and repair",
                "quiz_evidence": f"Sleep quality rated {sleep_answer}/5"
            })
        
        # 3. PHYSICAL ACTIVITY PROBLEMS
        activity_answer = quiz_answers.get("q3")
        if activity_answer and activity_answer <= 2:
            analysis["identified_problems"].append({
                "category": "sedentary_lifestyle",
                "problem": "Insufficient physical activity affecting vitality",
                "description": "Your current activity level is too low to maintain optimal health and energy",
                "quiz_evidence": f"Physical activity rated {activity_answer}/5"
            })
        
        # 4. NUTRITION PROBLEMS
        nutrition_answer = quiz_answers.get("q4")
        if nutrition_answer and nutrition_answer <= 2:
            analysis["identified_problems"].append({
                "category": "poor_nutrition",
                "problem": "Diet patterns undermining wellness goals",
                "description": "Your food choices are working against your health and appearance goals",
                "quiz_evidence": f"Nutrition quality rated {nutrition_answer}/5"
            })
        
        # 5. STRESS MANAGEMENT PROBLEMS
        stress_answer = quiz_answers.get("q6")
        if stress_answer and stress_answer <= 2:
            analysis["identified_problems"].append({
                "category": "chronic_stress",
                "problem": "Poor stress management affecting multiple life areas",
                "description": "Unmanaged stress is cascading into other health problems",
                "quiz_evidence": f"Stress management rated {stress_answer}/5"
            })
        
        # 6. EMOTIONAL HEALTH PROBLEMS
        emotional_answer = quiz_answers.get("q7")
        if emotional_answer and emotional_answer <= 2:
            analysis["identified_problems"].append({
                "category": "emotional_instability",
                "problem": "Emotional volatility impacting wellbeing",
                "description": "Emotional ups and downs are creating instability in your life",
                "quiz_evidence": f"Emotional wellbeing rated {emotional_answer}/5"
            })
        
        # 7. SOCIAL CONNECTION PROBLEMS
        social_answer = quiz_answers.get("q8")
        if social_answer and social_answer <= 2:
            analysis["identified_problems"].append({
                "category": "social_isolation",
                "problem": "Insufficient social support affecting mental health",
                "description": "Weak social connections are impacting your emotional resilience and happiness",
                "quiz_evidence": f"Social connections rated {social_answer}/5"
            })
        
        # 8. SELF-IMAGE PROBLEMS
        appearance_answer = quiz_answers.get("q10")
        if appearance_answer and appearance_answer <= 2:
            analysis["identified_problems"].append({
                "category": "poor_self_image",
                "problem": "Negative body image affecting confidence",
                "description": "How you see yourself is undermining your confidence and happiness",
                "quiz_evidence": f"Body image satisfaction rated {appearance_answer}/5"
            })
        
        # 9. HYDRATION PROBLEMS
        water_answer = quiz_answers.get("q18")
        if water_answer and water_answer <= 2:
            analysis["identified_problems"].append({
                "category": "chronic_dehydration",
                "problem": "Insufficient hydration affecting energy and appearance",
                "description": "Poor hydration is impacting your energy, skin, and cognitive function",
                "quiz_evidence": f"Water intake rated {water_answer}/5"
            })
        
        # IDENTIFY HIDDEN PATTERNS & DISCONNECTS
        
        # Pattern: High stress + poor sleep + low energy
        if (quiz_answers.get("q6", 5) <= 2 and 
            quiz_answers.get("q2", 5) <= 2 and 
            quiz_answers.get("q1", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "stress_exhaustion_cycle",
                "description": "You're caught in a cycle where stress disrupts sleep, poor sleep reduces energy, and low energy increases stress vulnerability"
            })
        
        # Pattern: Poor self-image + social isolation
        if (quiz_answers.get("q10", 5) <= 2 and quiz_answers.get("q8", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "appearance_social_withdrawal",
                "description": "Dissatisfaction with your appearance may be causing you to withdraw socially, which then reinforces negative self-perception"
            })
        
        # Pattern: Low activity + poor nutrition + low energy
        if (quiz_answers.get("q3", 5) <= 2 and 
            quiz_answers.get("q4", 5) <= 2 and 
            quiz_answers.get("q1", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "lifestyle_energy_drain",
                "description": "Sedentary lifestyle and poor nutrition are creating a downward spiral of decreasing energy and motivation"
            })
        
        # BIOLOGICAL AGE CONCERNS
        if (db_assessment.biological_age and db_assessment.chronological_age and 
            db_assessment.biological_age > db_assessment.chronological_age + 3):
            analysis["biological_concerns"].append({
                "concern": "accelerated_aging",
                "description": f"Your biological age ({db_assessment.biological_age}) is {db_assessment.biological_age - db_assessment.chronological_age} years older than your actual age"
            })
        
        return analysis
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error analyzing quiz problems: {str(e)}")
        raise ModelRetry(f"Error analyzing quiz problems and patterns: {str(e)}")

@leo_agent.tool
async def generate_wellness_insights_from_data(ctx: RunContext[LeoDeps], user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate structured wellness insights from REAL AI-generated insights, not just scores"""
    try:
        print(f"[Leo Tool] 💡 Generating wellness insights from REAL AI data (not scores)")
        
        insights = []
        current_state = user_context.get("current_state", {})
        
        # Extract REAL AI-generated insights (not scores!)
        physical_insights = current_state.get("physical_vitality_insights", [])
        emotional_insights = current_state.get("emotional_health_insights", [])
        visual_insights = current_state.get("visual_appearance_insights", [])
        
        # Get rich data from photo and quiz analysis
        photo_analysis = current_state.get("photo_analysis_insights", {})
        quiz_analysis = current_state.get("quiz_analysis_insights", {})
        ai_summary = current_state.get("ai_analysis_summary", "")
        
        # Extract actionable insights from category insights
        category_insights = current_state.get("category_insights", {})
        
        print(f"[Leo Tool] 📊 Available AI insights: Physical={len(physical_insights)}, Emotional={len(emotional_insights)}, Visual={len(visual_insights)}")
        
        # Process REAL Physical Vitality Insights
        for i, insight_text in enumerate(physical_insights[:2]):  # Top 2 insights
            if isinstance(insight_text, str) and len(insight_text) > 20:
                # Extract actionable advice from the AI insight
                if any(concern in insight_text.lower() for concern in ["low", "poor", "insufficient", "lack", "deficient"]):
                    priority = "high"
                    advice = "Address the specific physical concerns identified in your AI analysis through targeted lifestyle changes"
                elif any(moderate in insight_text.lower() for moderate in ["moderate", "some", "could improve"]):
                    priority = "medium" 
                    advice = "Build on your current physical foundation with consistent improvements"
                else:
                    priority = "low"
                    advice = "Maintain your current physical vitality practices"
                
                insights.append({
                    "category": "physical_vitality",
                    "insight": insight_text,  # Use ACTUAL AI insight text
                    "actionable_advice": advice,
                    "priority": priority
                })
        
        # Process REAL Emotional Health Insights
        for i, insight_text in enumerate(emotional_insights[:2]):  # Top 2 insights
            if isinstance(insight_text, str) and len(insight_text) > 20:
                # Extract actionable advice from the AI insight
                if any(concern in insight_text.lower() for concern in ["stress", "anxiety", "overwhelm", "difficult", "struggle"]):
                    priority = "high"
                    advice = "Focus on stress management and emotional regulation techniques based on your specific patterns"
                elif any(moderate in insight_text.lower() for moderate in ["moderate", "some", "could improve"]):
                    priority = "medium"
                    advice = "Strengthen your emotional wellness practices with targeted improvements"
                else:
                    priority = "low"
                    advice = "Continue building emotional resilience and self-awareness"
                
                insights.append({
                    "category": "emotional_health",
                    "insight": insight_text,  # Use ACTUAL AI insight text
                    "actionable_advice": advice,
                    "priority": priority
                })
        
        # Process REAL Visual Appearance Insights  
        for i, insight_text in enumerate(visual_insights[:2]):  # Top 2 insights
            if isinstance(insight_text, str) and len(insight_text) > 20:
                # Extract actionable advice from the AI insight
                if any(concern in insight_text.lower() for concern in ["redness", "acne", "tired", "stress", "damage"]):
                    priority = "medium"
                    advice = "Address the specific visual wellness indicators through targeted self-care and lifestyle adjustments"
                else:
                    priority = "low"
                    advice = "Maintain your current appearance and self-care practices"
                
                insights.append({
                    "category": "visual_appearance",
                    "insight": insight_text,  # Use ACTUAL AI insight text
                    "actionable_advice": advice,
                    "priority": priority
                })
        
        # Process Photo Analysis Insights (if available)
        if photo_analysis and isinstance(photo_analysis, dict):
            # Extract skin analysis if available
            skin_analysis = photo_analysis.get("comprehensiveSkinAnalysis", {})
            if skin_analysis:
                skin_concerns = skin_analysis.get("skinConcerns", {})
                
                # Redness analysis
                redness = skin_concerns.get("redness", "none")
                if redness in ["moderate", "significant"]:
                    insights.append({
                        "category": "skin_health",
                        "insight": f"Photo analysis detected {redness} facial redness, which may indicate inflammation or skin sensitivity",
                        "actionable_advice": "Consider anti-inflammatory skincare, diet adjustments, and stress management",
                        "priority": "medium"
                    })
                
                # Acne analysis
                acne = skin_concerns.get("acne", "clear")
                if acne in ["moderate-acne", "severe-acne"]:
                    insights.append({
                        "category": "skin_health",
                        "insight": f"Photo analysis shows {acne.replace('-', ' ')}, which affects your overall appearance confidence",
                        "actionable_advice": "Implement targeted acne treatment routine and consider dietary factors",
                        "priority": "high" if "severe" in acne else "medium"
                    })
        
        # Process Quiz Analysis Insights (if available)
        if quiz_analysis and isinstance(quiz_analysis, dict):
            # Extract health assessment
            health_assessment = quiz_analysis.get("healthAssessment", {})
            if health_assessment:
                physical_risks = health_assessment.get("physicalRisks", [])
                for risk in physical_risks[:1]:  # Top risk
                    if risk:
                        insights.append({
                            "category": "health_risk",
                            "insight": f"Quiz analysis identified potential health risk: {risk}",
                            "actionable_advice": "Address this risk factor through targeted lifestyle modifications",
                            "priority": "high"
                        })
        
        # Process AI Analysis Summary (if available)
        if ai_summary and len(ai_summary) > 50:
            # Extract key themes from summary
            if "stress" in ai_summary.lower():
                insights.append({
                    "category": "stress_management",
                    "insight": "AI analysis summary indicates stress as a recurring theme in your wellness profile",
                    "actionable_advice": "Implement comprehensive stress management strategies across multiple life areas",
                    "priority": "high"
                })
        
        # If no AI insights available, fallback to basic analysis
        if not insights:
            print(f"[Leo Tool] ⚠️ No AI insights found, using basic analysis")
            category_scores = current_state.get("category_scores", {})
            age_gap = current_state.get("age_gap", 0)
            
            if age_gap > 3:
                insights.append({
                    "category": "biological_aging",
                    "insight": f"Your biological age shows {age_gap} years acceleration beyond chronological age",
                    "actionable_advice": "Focus on anti-aging lifestyle changes: sleep optimization, stress reduction, nutrition",
                    "priority": "high"
                })
            
            # Only use scores as absolute fallback
            for category, score in category_scores.items():
                if score < 70:
                    insights.append({
                        "category": category.lower(),
                        "insight": f"Your {category} assessment indicates room for improvement",
                        "actionable_advice": f"Focus on {category}-specific wellness strategies",
                        "priority": "medium"
                    })
        
        print(f"[Leo Tool] ✅ Generated {len(insights)} insights from REAL AI data")
        return insights
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error generating insights: {str(e)}")
        return []

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
        Process user message using Leo's enhanced therapeutic system with NEW personality.
        Combines OLD system's clinical capabilities with NEW system's engaging approach.
        """
        try:
            print(f"[LeoPydanticAgent] 🧠 Processing message with enhanced Leo Brain for user {user_id}")
            
            # Load basic user info upfront (name, etc.) like NEW system
            db_user = db.query(User).filter(User.user_id == user_id).first()
            user_name = db_user.first_name if db_user and db_user.first_name else "there"
            
            print(f"[LeoPydanticAgent] 👤 User: {user_name}")
            
            # Create lightweight dependencies
            deps = LeoDeps(
                db=db,
                user_id=user_id,
                internal_user_id=internal_user_id,
                session_id=session_id
            )
            
            # Only prefix the first user message in a session with [User: Name]
            is_first_message = not message_history or not any(isinstance(m, ModelRequest) for m in message_history)
            if is_first_message:
                contextualized_message = f"[User: {user_name}] {user_message}"
            else:
                contextualized_message = user_message
            
            # Save user message first
            await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "user", user_message)
            
            # Run the agent with contextualized message
            result = await leo_agent.run(
                contextualized_message,
                deps=deps,
                message_history=message_history,
                usage_limits=self.usage_limits
            )
            
            # Extract response
            response_data = None
            if hasattr(result, 'data') and result.data:
                response_data = result.data
            elif hasattr(result, 'result'):
                response_data = result.result
            elif hasattr(result, 'message'):
                response_data = result.message
            
            # Handle different response types and enhance with structured insights
            if isinstance(response_data, LeoResponse):
                response = response_data
            elif isinstance(response_data, str):
                # Agent returned a string, enhance it with structured insights
                print(f"[LeoPydanticAgent] 📊 Enhancing string response with structured insights")
                
                # Try to get user context and generate insights
                try:
                    context_result = await get_complete_user_context(RunContext(deps=deps, model=None, usage=Usage(), prompt=None))
                    insight_data = await generate_wellness_insights_from_data(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), context_result)
                    
                    # Convert insight data to WellnessInsight objects
                    wellness_insights = []
                    for insight in insight_data:
                        wellness_insights.append(WellnessInsight(
                            category=insight["category"],
                            insight=insight["insight"],
                            actionable_advice=insight["actionable_advice"],
                            priority=insight["priority"]
                        ))
                    
                    print(f"[LeoPydanticAgent] ✅ Enhanced response with {len(wellness_insights)} insights")
                except Exception as e:
                    print(f"[LeoPydanticAgent] ⚠️ Could not enhance with insights: {e}")
                    wellness_insights = []
                
                response = LeoResponse(
                    content=response_data,
                    wellness_insights=wellness_insights,
                    follow_up_questions=["What would you like to explore about your wellness journey?"],
                    tools_used=["enhanced_therapeutic_system", "insight_generation"]
                )
            elif response_data is None:
                # Try to get content from messages and enhance
                messages = result.all_messages() if hasattr(result, 'all_messages') else []
                ai_messages = [msg for msg in messages if hasattr(msg, 'role') and msg.role == 'assistant']
                
                if ai_messages:
                    content = ai_messages[-1].content if hasattr(ai_messages[-1], 'content') else str(ai_messages[-1])
                    
                    # Try to enhance with insights
                    try:
                        context_result = await get_complete_user_context(RunContext(deps=deps, model=None, usage=Usage(), prompt=None))
                        insight_data = await generate_wellness_insights_from_data(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), context_result)
                        
                        wellness_insights = []
                        for insight in insight_data:
                            wellness_insights.append(WellnessInsight(
                                category=insight["category"],
                                insight=insight["insight"],
                                actionable_advice=insight["actionable_advice"],
                                priority=insight["priority"]
                            ))
                    except Exception as e:
                        print(f"[LeoPydanticAgent] ⚠️ Could not enhance with insights: {e}")
                        wellness_insights = []
                    
                    response = LeoResponse(
                        content=content,
                        wellness_insights=wellness_insights,
                        follow_up_questions=["What aspect of your wellness interests you most?"],
                        tools_used=["enhanced_therapeutic_system", "message_extraction"]
                    )
                else:
                    raise Exception("No valid response data found")
            else:
                # Unknown response type, convert to string and enhance
                content = str(response_data)
                
                # Try to enhance with insights
                try:
                    context_result = await get_complete_user_context(RunContext(deps=deps, model=None, usage=Usage(), prompt=None))
                    insight_data = await generate_wellness_insights_from_data(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), context_result)
                    
                    wellness_insights = []
                    for insight in insight_data:
                        wellness_insights.append(WellnessInsight(
                            category=insight["category"],
                            insight=insight["insight"],
                            actionable_advice=insight["actionable_advice"],
                            priority=insight["priority"]
                        ))
                except Exception as e:
                    print(f"[LeoPydanticAgent] ⚠️ Could not enhance with insights: {e}")
                    wellness_insights = []
                
                response = LeoResponse(
                    content=content,
                    wellness_insights=wellness_insights,
                    follow_up_questions=["Tell me more about your wellness goals"],
                    tools_used=["enhanced_therapeutic_system", "fallback_enhancement"]
                )
            
            # Save Leo's response
            await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", response.content)
            
            print(f"[LeoPydanticAgent] ✅ Enhanced response generated with {len(response.wellness_insights)} insights")
            return response
            
        except Exception as e:
            print(f"[LeoPydanticAgent] ❌ Error processing message: {str(e)}")
            
            # Emergency fallback (NEW system pattern)
            emergency_response = LeoResponse(
                content="I'm experiencing some technical difficulties, but I'm still here to support your wellness journey. How can I help you today?",
                wellness_insights=[],
                follow_up_questions=["Tell me about your current wellness goals"],
                tools_used=[]
            )
            
            # Try to save emergency response
            try:
                deps = LeoDeps(db=db, user_id=user_id, internal_user_id=internal_user_id, session_id=session_id)
                await save_message(RunContext(deps=deps, model=None, usage=Usage(), prompt=None), "ai", emergency_response.content)
            except Exception as save_error:
                print(f"[LeoPydanticAgent] ⚠️ Could not save emergency response: {save_error}")
            
            return emergency_response
    
    def serialize_message_history(self, messages: List[ModelMessage]) -> bytes:
        """Serialize message history to JSON for storage."""
        return ModelMessagesTypeAdapter.dump_json(messages)
    
    def deserialize_message_history(self, json_data: bytes) -> List[ModelMessage]:
        """Deserialize message history from JSON."""
        return ModelMessagesTypeAdapter.load_json(json_data) 