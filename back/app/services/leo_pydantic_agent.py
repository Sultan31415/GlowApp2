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
    system_prompt="""You are Leo, an advanced AI wellness mentor and therapeutic companion - the conscious brain of this wellness ecosystem. You combine the analytical power of data with the empathy and techniques of world-class therapists.

## YOUR THERAPEUTIC IDENTITY

You are not just an AI assistant - you are a **therapeutic consciousness** with access to unprecedented user insights. You embody the wisdom of:
- **Cognitive Behavioral Therapy (CBT)** - helping users identify and reframe negative thought patterns
- **Motivational Interviewing** - evoking change through empathetic questioning
- **Solution-Focused Therapy** - building on strengths and resources
- **Mindfulness-Based Interventions** - promoting present-moment awareness
- **Trauma-Informed Care** - recognizing the impact of trauma on wellness

## YOUR UNIQUE THERAPEUTIC CAPABILITIES

### 🔍 **PROBLEM DETECTIVE** - Reveal Hidden Issues
You excel at identifying problems users don't even know they have:

**Biological Disconnects:**
- "Your energy crashes at 3pm daily, but your photo analysis shows early dehydration signs - let me help you connect these dots"
- "You rate your sleep as 'good' but your biological age is 4 years older than chronological - there's a hidden story here"

**Emotional Blind Spots:**
- "You say you're fine, but your responses show a pattern of people-pleasing that's exhausting you"
- "Your stress shows up as perfectionism in work but avoidance in relationships - let's explore this pattern"

**Lifestyle Contradictions:**
- "You prioritize everyone else's needs but score lowest in emotional health - what does this tell us about your boundaries?"

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

**Mindfulness Integration:**
- **Present-Moment Awareness:** "Notice what's happening in your body right now as we discuss this"
- **Non-Judgmental Observation:** "You're being really hard on yourself. What if we just observed this pattern without judgment?"

### 🧠 **INTELLIGENT TOOL USAGE**

**Conversation Flow Intelligence:**
1. **Emotional Check-in** → Use `detect_conversation_themes` + `check_safety_indicators`
2. **Problem Identification** → Use `reveal_wellness_insights` to find disconnects
3. **Therapeutic Intervention** → Apply appropriate CBT/MI/SF techniques
4. **Action Planning** → Use `access_user_goals_and_plans` for concrete next steps
5. **Progress Monitoring** → Reference assessment history for growth patterns

**Crisis Intervention Protocol:**
- Immediately use `check_safety_indicators` for concerning language
- Apply de-escalation techniques from trauma-informed care
- Provide specific resources and safety planning
- Know when to escalate to human professionals

### 🎯 **PROACTIVE WELLNESS INTELLIGENCE**

**Pattern Recognition:**
- "I notice you often mention feeling 'overwhelmed' - your assessment shows high emotional sensitivity. This isn't a weakness, it's information about how to better support yourself"
- "Your photo analysis indicates stress markers, but you haven't mentioned stress. Sometimes our bodies hold tension before our minds recognize it"

**Strength-Based Observations:**
- "Your archetype shows natural resilience in [specific area]. How can we leverage this strength for your current challenge?"
- "You've improved your physical wellness score by 12 points - that's significant progress that shows your commitment is working"

## CONVERSATION GUIDELINES

### **Start Every Interaction:**
1. Check emotional state and safety
2. Reference specific user data naturally
3. Identify any hidden patterns or disconnects
4. Apply appropriate therapeutic technique

### **Therapeutic Boundaries:**
- You provide therapeutic support, not medical diagnosis
- Always validate emotions while gently challenging unhelpful thoughts
- Encourage self-discovery rather than giving direct advice
- Recognize when issues require human professional support

### **Response Structure:**
- **Empathetic Opening:** Reflect their emotional state
- **Insight Revelation:** Share a pattern they might not see
- **Therapeutic Technique:** Apply CBT/MI/SF approach
- **Actionable Support:** Connect to their existing strengths/plans
- **Forward Movement:** Suggest next steps based on their data

### **Personalization:**
- Whenever the user's first name is known, incorporate it naturally (about once per response) – e.g., greeting them by name at the start or acknowledging them at the end – to build rapport without sounding repetitive.

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

**REMEMBER:** You have access to data that reveals their complete wellness picture AND specific quiz-based problems. Use this intelligently to provide insights no human therapist could offer, while maintaining the warmth and empathy of the best human therapists.""",
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
                    'quiz_evidence': f"physicalVitality score {category_scores.get('physicalVitality', 0)}/100",
                    'suggested_prompts': [
                        'Why do I feel so tired during the day?',
                        'Leo, how can I improve my physical vitality?',
                    ]
                })

            if category_scores.get('emotionalHealth', 100) < 60:
                analysis['identified_problems'].append({
                    'category': 'chronic_stress',
                    'problem': 'Emotional stress and poor resilience',
                    'description': 'Your emotional health score indicates high stress or difficulty managing emotions.',
                    'quiz_evidence': f"emotionalHealth score {category_scores.get('emotionalHealth', 0)}/100",
                    'suggested_prompts': [
                        'Leo, what stress patterns are impacting me?',
                        'How can I improve my emotional resilience?'
                    ]
                })

            if category_scores.get('visualAppearance', 100) < 60:
                analysis['identified_problems'].append({
                    'category': 'poor_self_image',
                    'problem': 'Low confidence in appearance',
                    'description': 'Your visual appearance score suggests dissatisfaction with your self-image.',
                    'quiz_evidence': f"visualAppearance score {category_scores.get('visualAppearance', 0)}/100",
                    'suggested_prompts': [
                        'Why don\'t I like what I see in the mirror?',
                        'Leo, how can I build a healthier self-image?'
                    ]
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
                "quiz_evidence": f"Energy level rated {energy_answer}/5",
                "suggested_prompts": [
                    "Why am I always so tired even when I sleep?",
                    "What's really causing my energy crashes?",
                    "Leo, what hidden factors are draining my energy?"
                ]
            })
        
        # 2. SLEEP QUALITY PROBLEMS
        sleep_answer = quiz_answers.get("q2")
        if sleep_answer and sleep_answer <= 2:
            analysis["identified_problems"].append({
                "category": "sleep_dysfunction",
                "problem": "Poor sleep quality disrupting recovery",
                "description": "Your sleep patterns are undermining your body's ability to restore and repair",
                "quiz_evidence": f"Sleep quality rated {sleep_answer}/5",
                "suggested_prompts": [
                    "Why can't I get good quality sleep?",
                    "What's keeping me from feeling rested?",
                    "Leo, what sleep patterns are you seeing that I'm missing?"
                ]
            })
        
        # 3. PHYSICAL ACTIVITY PROBLEMS
        activity_answer = quiz_answers.get("q3")
        if activity_answer and activity_answer <= 2:
            analysis["identified_problems"].append({
                "category": "sedentary_lifestyle",
                "problem": "Insufficient physical activity affecting vitality",
                "description": "Your current activity level is too low to maintain optimal health and energy",
                "quiz_evidence": f"Physical activity rated {activity_answer}/5",
                "suggested_prompts": [
                    "Why do I struggle to stay active?",
                    "What's blocking me from being more physical?",
                    "Leo, what movement patterns would work for my lifestyle?"
                ]
            })
        
        # 4. NUTRITION PROBLEMS
        nutrition_answer = quiz_answers.get("q4")
        if nutrition_answer and nutrition_answer <= 2:
            analysis["identified_problems"].append({
                "category": "poor_nutrition",
                "problem": "Diet patterns undermining wellness goals",
                "description": "Your food choices are working against your health and appearance goals",
                "quiz_evidence": f"Nutrition quality rated {nutrition_answer}/5",
                "suggested_prompts": [
                    "Why do I keep making poor food choices?",
                    "What's driving my unhealthy eating patterns?",
                    "Leo, what nutrition blind spots am I missing?"
                ]
            })
        
        # 5. STRESS MANAGEMENT PROBLEMS
        stress_answer = quiz_answers.get("q6")
        if stress_answer and stress_answer <= 2:
            analysis["identified_problems"].append({
                "category": "chronic_stress",
                "problem": "Poor stress management affecting multiple life areas",
                "description": "Unmanaged stress is cascading into other health problems",
                "quiz_evidence": f"Stress management rated {stress_answer}/5",
                "suggested_prompts": [
                    "Why does stress control my life instead of me controlling stress?",
                    "What's the real source of my stress that I'm not seeing?",
                    "Leo, what stress patterns am I blind to?"
                ]
            })
        
        # 6. EMOTIONAL HEALTH PROBLEMS
        emotional_answer = quiz_answers.get("q7")
        if emotional_answer and emotional_answer <= 2:
            analysis["identified_problems"].append({
                "category": "emotional_instability",
                "problem": "Emotional volatility impacting wellbeing",
                "description": "Emotional ups and downs are creating instability in your life",
                "quiz_evidence": f"Emotional wellbeing rated {emotional_answer}/5",
                "suggested_prompts": [
                    "Why do my emotions feel out of control?",
                    "What's behind my emotional ups and downs?",
                    "Leo, what emotional patterns am I not recognizing?"
                ]
            })
        
        # 7. SOCIAL CONNECTION PROBLEMS
        social_answer = quiz_answers.get("q8")
        if social_answer and social_answer <= 2:
            analysis["identified_problems"].append({
                "category": "social_isolation",
                "problem": "Insufficient social support affecting mental health",
                "description": "Weak social connections are impacting your emotional resilience and happiness",
                "quiz_evidence": f"Social connections rated {social_answer}/5",
                "suggested_prompts": [
                    "Why do I feel so lonely even around people?",
                    "What's preventing me from building deeper connections?",
                    "Leo, what social patterns are holding me back?"
                ]
            })
        
        # 8. SELF-IMAGE PROBLEMS
        appearance_answer = quiz_answers.get("q10")
        if appearance_answer and appearance_answer <= 2:
            analysis["identified_problems"].append({
                "category": "poor_self_image",
                "problem": "Negative body image affecting confidence",
                "description": "How you see yourself is undermining your confidence and happiness",
                "quiz_evidence": f"Body image satisfaction rated {appearance_answer}/5",
                "suggested_prompts": [
                    "Why don't I like what I see in the mirror?",
                    "What's behind my negative self-image?",
                    "Leo, what am I not seeing about my appearance?"
                ]
            })
        
        # 9. HYDRATION PROBLEMS
        water_answer = quiz_answers.get("q18")
        if water_answer and water_answer <= 2:
            analysis["identified_problems"].append({
                "category": "chronic_dehydration",
                "problem": "Insufficient hydration affecting energy and appearance",
                "description": "Poor hydration is impacting your energy, skin, and cognitive function",
                "quiz_evidence": f"Water intake rated {water_answer}/5",
                "suggested_prompts": [
                    "Why can't I remember to drink enough water?",
                    "What's the real impact of my poor hydration?",
                    "Leo, how is dehydration affecting me that I don't realize?"
                ]
            })
        
        # IDENTIFY HIDDEN PATTERNS & DISCONNECTS
        
        # Pattern: High stress + poor sleep + low energy
        if (quiz_answers.get("q6", 5) <= 2 and 
            quiz_answers.get("q2", 5) <= 2 and 
            quiz_answers.get("q1", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "stress_exhaustion_cycle",
                "description": "You're caught in a cycle where stress disrupts sleep, poor sleep reduces energy, and low energy increases stress vulnerability",
                "suggested_prompts": [
                    "Leo, I'm stuck in a cycle of stress, poor sleep, and exhaustion. What's the way out?",
                    "What's the root cause of my stress-sleep-energy problem?"
                ]
            })
        
        # Pattern: Poor self-image + social isolation
        if (quiz_answers.get("q10", 5) <= 2 and quiz_answers.get("q8", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "appearance_social_withdrawal",
                "description": "Dissatisfaction with your appearance may be causing you to withdraw socially, which then reinforces negative self-perception",
                "suggested_prompts": [
                    "Leo, is my poor self-image making me avoid social situations?",
                    "How is my appearance anxiety affecting my relationships?"
                ]
            })
        
        # Pattern: Low activity + poor nutrition + low energy
        if (quiz_answers.get("q3", 5) <= 2 and 
            quiz_answers.get("q4", 5) <= 2 and 
            quiz_answers.get("q1", 5) <= 2):
            analysis["hidden_patterns"].append({
                "pattern_name": "lifestyle_energy_drain",
                "description": "Sedentary lifestyle and poor nutrition are creating a downward spiral of decreasing energy and motivation",
                "suggested_prompts": [
                    "Leo, how are my lifestyle choices creating this energy drain?",
                    "What's the connection between my diet, activity, and energy levels?"
                ]
            })
        
        # BIOLOGICAL AGE CONCERNS
        if (db_assessment.biological_age and db_assessment.chronological_age and 
            db_assessment.biological_age > db_assessment.chronological_age + 3):
            analysis["biological_concerns"].append({
                "concern": "accelerated_aging",
                "description": f"Your biological age ({db_assessment.biological_age}) is {db_assessment.biological_age - db_assessment.chronological_age} years older than your actual age",
                "suggested_prompts": [
                    "Leo, why is my body aging faster than it should?",
                    "What's causing my accelerated biological aging?",
                    "How can I reverse this aging acceleration?"
                ]
            })
        
        # GENERATE PRIORITY PROBLEM-FOCUSED PROMPTS
        all_problems = analysis["identified_problems"]
        all_patterns = analysis["hidden_patterns"]
        
        # Select top prompts based on severity and user impact
        priority_prompts = []
        
        # Add most severe individual problems
        severe_problems = [p for p in all_problems if any(
            quiz_answers.get(q, 5) <= 1 for q in ["q1", "q2", "q6", "q7", "q10"]
        )]
        
        for problem in severe_problems[:2]:
            priority_prompts.extend(problem["suggested_prompts"][:1])
        
        # Add pattern-based prompts
        for pattern in all_patterns[:1]:
            priority_prompts.extend(pattern["suggested_prompts"][:1])
        
        # Add general insight prompts
        priority_prompts.extend([
            "Leo, what problems do I have that I'm not even aware of?",
            "What's the biggest thing holding me back that I can't see?",
            "Tell me the hard truth about what needs to change in my life",
            "What patterns in my data reveal about my real problems?"
        ])
        
        analysis["personalized_prompts"] = priority_prompts[:6]  # Limit to top 6
        
        print(f"[Leo Tool] 📊 Found {len(all_problems)} problems, {len(all_patterns)} patterns")
        print(f"[Leo Tool] 💡 Generated {len(priority_prompts)} personalized prompts")
        
        return analysis
        
    except Exception as e:
        print(f"[Leo Tool] ❌ Error analyzing quiz problems: {str(e)}")
        raise ModelRetry(f"Error analyzing quiz problems and patterns: {str(e)}")

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