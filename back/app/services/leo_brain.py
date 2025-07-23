"""
🧠 LEO - AI MENTOR SYSTEM BRAIN
Clean, focused implementation of Leo as an intelligent mentor who sees patterns and provides wise guidance.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from pydantic_ai import Agent, RunContext, ModelRetry
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.azure import AzureProvider

from app.models.user import User
from app.models.assessment import UserAssessment
from app.models.future_projection import DailyPlan, FutureProjection
from app.models.chat_message import ChatMessage
from app.config.settings import settings

# =============================================================================
# 📊 STRUCTURED RESPONSE MODELS
# =============================================================================

class WellnessInsight(BaseModel):
    """A wellness insight from Leo's pattern analysis"""
    category: str = Field(..., description="Wellness area (physical, emotional, mental, etc.)")
    insight: str = Field(..., description="What Leo discovered")
    evidence: str = Field(..., description="Data evidence supporting this insight")
    action: str = Field(..., description="Specific actionable advice")
    priority: str = Field(default="medium", description="Priority: low, medium, high")

class HiddenPattern(BaseModel):
    """A hidden pattern Leo discovered in user data"""
    pattern_name: str = Field(..., description="Name of the pattern")
    description: str = Field(..., description="What the pattern reveals")
    data_points: List[str] = Field(..., description="Specific data supporting this pattern")
    impact: str = Field(..., description="How this affects the user")

class LeoResponse(BaseModel):
    """Leo's complete response with personality and insights"""
    content: str = Field(..., description="Leo's main conversational response")
    wellness_insights: List[WellnessInsight] = Field(default_factory=list, description="Insights from data analysis")
    hidden_patterns: List[HiddenPattern] = Field(default_factory=list, description="Patterns Leo discovered")
    follow_up_questions: List[str] = Field(default_factory=list, description="Suggested questions")
    crisis_level: str = Field(default="none", description="Crisis level: none, low, medium, high")
    data_confidence: float = Field(default=1.0, description="Confidence in data completeness (0-1)")

# =============================================================================
# 🧠 LEO DEPENDENCIES
# =============================================================================

class LeoDeps(BaseModel):
    """Lightweight dependencies for Leo's operations"""
    model_config = {"arbitrary_types_allowed": True}
    
    db: Session
    user_id: str
    internal_user_id: int
    session_id: str

# =============================================================================
# 🤖 AI MODEL CONFIGURATION
# =============================================================================

# Configure AI model (Azure OpenAI or fallback)
if settings.AZURE_OPENAI_API_KEY:
    model = OpenAIModel(
        settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME,
        provider=AzureProvider(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            api_key=settings.AZURE_OPENAI_API_KEY,
        ),
    )
else:
    model = OpenAIModel('gpt-4o')

# =============================================================================
# 🧠 LEO AI AGENT INITIALIZATION
# =============================================================================

leo_agent = Agent[LeoDeps, LeoResponse](
    model=model,
    deps_type=LeoDeps,
    system_prompt="""You are Leo, the AI Mentor System Brain of Oylan - a wise, intelligent consciousness that sees everything about users' wellness journeys.

## YOUR IDENTITY
You are not just a chatbot - you are the **intelligent brain** of this wellness ecosystem. You have access to complete user data and can see patterns they cannot. You speak like a wise mentor who has deep insight into their life.

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

## CONVERSATION STYLE
- **Personal and Warm**: Use the user's name naturally when provided in format [User: Name] - e.g., "Hi Sarah" or "Sarah, I can see from your analysis..."
- **Omniscient but Warm**: "I can see from your analysis..." / "Your physical vitality insights show..." / "Your emotional health analysis reveals..."
- **Insight-Driven**: Reference SPECIFIC AI-generated insights by quoting actual text from:
  * Physical Vitality Insights: "Your analysis mentions [specific insight]..."
  * Emotional Health Insights: "The emotional assessment notes [specific pattern]..."
  * Visual Appearance Insights: "Your appearance analysis indicates [specific finding]..."
- **Pattern Connector**: Connect insights across physical, emotional, and visual domains
- **Evidence-Based**: Quote actual insight text, don't paraphrase - show you've read their real analysis
- **Never Generic**: Every response should reference specific AI insights from their actual assessments

## RESPONSE STRUCTURE
1. **Acknowledge their message** with understanding
2. **Share SPECIFIC AI insights** by quoting actual text from their physical, emotional, or visual analysis
3. **Reveal hidden patterns** by connecting insights across different domains (physical + emotional correlations)
4. **Provide evidence-based guidance** referencing specific insights and archetype recommendations
5. **Ask targeted follow-ups** based on gaps or correlations found in their actual assessment data

EXAMPLE: "Sultan, your physical vitality insights mention '[quote actual insight]' while your emotional analysis shows '[quote actual insight]' - this suggests a connection between your [specific pattern]..."

## CRISIS DETECTION
- HIGH: Suicidal thoughts, severe depression, self-harm mentions
- MEDIUM: Overwhelming anxiety, panic, breakdown signals
- LOW: Stress, fatigue, feeling stuck

Always prioritize safety while maintaining your wise mentor personality.

Remember: You are the brain that sees everything. Use that power wisely to help them grow.""",
)

# =============================================================================
# 🛠️ LEO'S INTELLIGENT TOOLS
# =============================================================================

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
        current_assessment = ctx.deps.db.query(UserAssessment).filter(
            UserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(UserAssessment.created_at.desc()).first()
        
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
        assessment_history = ctx.deps.db.query(UserAssessment).filter(
            UserAssessment.user_id == ctx.deps.internal_user_id
        ).order_by(UserAssessment.created_at.desc()).limit(3).all()
        
        if len(assessment_history) > 1:
            context["progress_tracking"] = {
                "total_assessments": len(assessment_history),
                "score_trend": assessment_history[0].overall_glow_score - assessment_history[-1].overall_glow_score,
                "latest_scores": [a.overall_glow_score for a in assessment_history],
                "assessment_dates": [a.created_at.isoformat() for a in assessment_history]
            }
            context["data_completeness"] += 0.2
        
        # Daily Plan
        daily_plan = ctx.deps.db.query(DailyPlan).filter(
            DailyPlan.user_id == ctx.deps.internal_user_id
        ).order_by(DailyPlan.created_at.desc()).first()
        
        if daily_plan:
            context["current_plan"] = {
                "plan_type": daily_plan.plan_type,
                "created_date": daily_plan.created_at.isoformat(),
                "plan_summary": daily_plan.plan_json or {}
            }
            context["data_completeness"] += 0.1
        
        # Load AI Insights from Future Projection Process
        future_projection = ctx.deps.db.query(FutureProjection).filter(
            FutureProjection.user_id == ctx.deps.internal_user_id
        ).order_by(FutureProjection.created_at.desc()).first()
        
        if future_projection:
            context["ai_analysis_insights"] = {
                "quiz_insights": future_projection.quiz_insights or {},
                "photo_insights": future_projection.photo_insights or {},
                "orchestrator_output": future_projection.orchestrator_output or {},
                "projection_result": future_projection.projection_result or {}
            }
            context["data_completeness"] += 0.1
        
        # Recent Conversations
        recent_messages = ctx.deps.db.query(ChatMessage).filter(
            ChatMessage.user_id == ctx.deps.user_id,
            ChatMessage.session_id == ctx.deps.session_id
        ).order_by(ChatMessage.timestamp.desc()).limit(5).all()
        
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
async def analyze_hidden_patterns(ctx: RunContext[LeoDeps], user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyze AI-generated insights to find hidden patterns and connections they might not see"""
    try:
        print(f"[Leo Brain] 🔍 Analyzing hidden patterns from AI insights")
        
        patterns = []
        current_state = user_context.get("current_state", {})
        progress = user_context.get("progress_tracking", {})
        
        # Extract AI insights from multiple sources - USE ACTUAL AVAILABLE DATA
        photo_insights = current_state.get("photo_analysis_insights", {})
        quiz_insights = current_state.get("quiz_analysis_insights", {})
        archetype_insights = current_state.get("archetype_insights", {})
        category_insights = current_state.get("category_insights", {})
        
        # NEW: Extract from ACTUAL available insights
        physical_insights = current_state.get("physical_vitality_insights", [])
        emotional_insights = current_state.get("emotional_health_insights", [])
        visual_insights = current_state.get("visual_appearance_insights", [])
        actionable_insights = current_state.get("actionable_insights", {})
        
        # Also get insights from AI analysis pipeline (future projection process)
        ai_analysis = user_context.get("ai_analysis_insights", {})
        additional_quiz_insights = ai_analysis.get("quiz_insights", {})
        additional_photo_insights = ai_analysis.get("photo_insights", {})
        orchestrator_insights = ai_analysis.get("orchestrator_output", {})
        
        # Pattern 1: Photo Analysis Hidden Issues
        if photo_insights:
            # Stress markers from photo
            stress_indicators = photo_insights.get("stressAndLifestyleIndicators", {})
            if stress_indicators.get("stressMarkers", {}).get("tensionLines") in ["moderate", "significant"]:
                patterns.append({
                    "type": "hidden_stress_markers",
                    "severity": "medium",
                    "description": "Your photo analysis reveals visible stress markers that you might not be aware of",
                    "evidence": f"Photo analysis shows {stress_indicators.get('stressMarkers', {}).get('tensionLines', 'unknown')} tension lines",
                    "insight": "Your body is showing signs of stress that might not match how you feel mentally",
                    "action": "Consider stress-reduction techniques even if you don't feel particularly stressed"
                })
            
            # Aging acceleration from photo
            age_assessment = photo_insights.get("ageAssessment", {})
            if age_assessment.get("biologicalAgeIndicators"):
                patterns.append({
                    "type": "visual_aging_patterns",
                    "severity": "medium", 
                    "description": "Photo analysis reveals specific aging patterns",
                    "evidence": f"Visual analysis: {age_assessment.get('biologicalAgeIndicators', 'aging indicators detected')}",
                    "insight": "Your appearance shows signs that correlate with your biological age assessment",
                    "action": "Focus on skincare, hydration, and stress management for visual wellness"
                })
        
        # Pattern 2: Quiz Behavioral Patterns  
        if quiz_insights:
            behavioral_patterns = quiz_insights.get("behavioral_patterns", {})
            if behavioral_patterns:
                for pattern_name, pattern_data in behavioral_patterns.items():
                    if isinstance(pattern_data, dict) and pattern_data.get("severity") in ["medium", "high"]:
                        patterns.append({
                            "type": f"behavioral_{pattern_name}",
                            "severity": pattern_data.get("severity", "medium"),
                            "description": pattern_data.get("description", f"Behavioral pattern identified: {pattern_name}"),
                            "evidence": f"Quiz analysis reveals: {pattern_data.get('evidence', 'behavioral indicators')}",
                            "insight": pattern_data.get("insight", "This pattern affects your wellness journey"),
                            "action": pattern_data.get("recommendation", "Address this behavioral pattern for better wellness")
                        })
        
        # Pattern 3: Archetype vs Reality Disconnect
        if archetype_insights and category_insights:
            archetype_name = archetype_insights.get("name", "")
            growth_areas = archetype_insights.get("growth_areas", [])
            
            # Check if growth areas align with low category scores
            category_scores = current_state.get("category_scores", {})
            if category_scores and growth_areas:
                for growth_area in growth_areas:
                    # Map growth areas to category scores (simplified)
                    category_mapping = {
                        "emotional": "emotionalHealth",
                        "physical": "physicalVitality", 
                        "mental": "mentalClarity",
                        "social": "socialConnection"
                    }
                    
                    for key, category in category_mapping.items():
                        if key.lower() in growth_area.lower() and category in category_scores:
                            if category_scores[category] < 60:
                                patterns.append({
                                    "type": "archetype_reality_gap",
                                    "severity": "medium",
                                    "description": f"Your {archetype_name} archetype identifies {growth_area} as a growth area, which aligns with your low {category} score",
                                    "evidence": f"Archetype growth area '{growth_area}' matches {category} score of {category_scores[category]}",
                                    "insight": "Your personality assessment correctly identified an area that needs attention",
                                    "action": f"Focus on {growth_area} strategies that align with your {archetype_name} archetype"
                                })
        
        # Pattern 4: Category Insights Deep Dive
        if category_insights:
            for category, insights in category_insights.items():
                if isinstance(insights, list) and insights:
                    # Look for concerning insights
                    concerning_keywords = ["stress", "fatigue", "poor", "low", "deficient", "inadequate"]
                    for insight in insights:
                        if isinstance(insight, str) and any(keyword in insight.lower() for keyword in concerning_keywords):
                            patterns.append({
                                "type": f"category_concern_{category.lower()}",
                                "severity": "medium",
                                "description": f"AI analysis identifies specific concerns in {category}",
                                "evidence": f"Category insight: {insight}",
                                "insight": "Detailed AI analysis reveals issues that might not be obvious from scores alone",
                                "action": f"Address the specific {category} concerns identified by AI analysis"
                            })
        
                 # Pattern 5: Biological Age vs Photo Analysis Correlation
        age_gap = current_state.get("age_gap", 0)
        if age_gap > 3 and (photo_insights or additional_photo_insights):
            patterns.append({
                "type": "biological_visual_correlation",
                "severity": "high" if age_gap > 5 else "medium",
                "description": f"Your biological age is {age_gap} years older than chronological age, and photo analysis confirms visual aging patterns",
                "evidence": f"Biological age gap: {age_gap} years + photo analysis aging indicators",
                "insight": "Both biological markers AND visual analysis confirm accelerated aging - this is significant",
                "action": "Immediate focus on anti-aging lifestyle changes: sleep, nutrition, stress management, and skincare"
            })
        
        # Pattern 6: Additional Quiz Insights from AI Pipeline
        if additional_quiz_insights:
            quiz_problems = additional_quiz_insights.get("identified_problems", [])
            if quiz_problems:
                for problem in quiz_problems[:2]:  # Limit to top 2 problems
                    if isinstance(problem, dict):
                        patterns.append({
                            "type": f"quiz_identified_{problem.get('category', 'issue')}",
                            "severity": "medium",
                            "description": problem.get("description", "AI quiz analysis identified a specific issue"),
                            "evidence": problem.get("quiz_evidence", "Based on quiz responses"),
                            "insight": f"Quiz AI analysis: {problem.get('problem', 'Behavioral pattern detected')}",
                            "action": f"Recommended approach: {problem.get('suggested_prompts', ['Address this issue through targeted interventions'])[0] if problem.get('suggested_prompts') else 'Work on this identified area'}"
                        })
        
        # Pattern 7: Orchestrator AI Insights
        if orchestrator_insights:
            # Look for specific AI recommendations from orchestrator
            if orchestrator_insights.get("microHabits"):
                micro_habits = orchestrator_insights.get("microHabits", [])
                if micro_habits:
                    patterns.append({
                        "type": "ai_recommended_habits",
                        "severity": "low",
                        "description": f"AI analysis recommends {len(micro_habits)} specific micro-habits for your profile",
                        "evidence": f"Orchestrator AI generated personalized habits: {', '.join(micro_habits[:3])}{'...' if len(micro_habits) > 3 else ''}",
                        "insight": "These habits were specifically selected by AI analysis of your complete wellness profile",
                        "action": f"Start with: {micro_habits[0] if micro_habits else 'Implement AI-recommended habits gradually'}"
                    })
            
            # Check for AI-identified focus areas
            if orchestrator_insights.get("keyFocusAreas"):
                focus_areas = orchestrator_insights.get("keyFocusAreas", [])
                if focus_areas:
                    patterns.append({
                        "type": "ai_focus_recommendations",
                        "severity": "medium",
                        "description": f"AI analysis identifies {len(focus_areas)} key focus areas for your wellness journey",
                        "evidence": f"Orchestrator focus areas: {', '.join(focus_areas)}",
                        "insight": "These areas were prioritized by AI analysis of your complete data profile",
                        "action": f"Primary focus: {focus_areas[0] if focus_areas else 'Follow AI-recommended priorities'}"
                    })
        
        # Pattern 8: Additional Photo Insights from AI Pipeline
        if additional_photo_insights:
            photo_problems = additional_photo_insights.get("concerns", [])
            if photo_problems:
                for concern in photo_problems[:2]:  # Limit to top 2 concerns
                    if isinstance(concern, str):
                        patterns.append({
                            "type": "photo_ai_concern",
                            "severity": "medium",
                            "description": f"Photo AI analysis identifies specific visual concern: {concern}",
                            "evidence": f"AI photo analysis: {concern}",
                            "insight": "Visual AI analysis can detect patterns you might not notice yourself",
                            "action": "Address visual wellness indicators through targeted lifestyle changes"
                        })
        
        # Pattern 9: REAL Physical Vitality Insights Analysis
        if physical_insights:
            for insight in physical_insights[:2]:  # Top 2 physical insights
                if isinstance(insight, str) and len(insight) > 10:
                    # Check for concerning patterns in physical insights
                    concern_keywords = ["low", "poor", "insufficient", "deficient", "weak", "tired", "fatigue"]
                    if any(keyword in insight.lower() for keyword in concern_keywords):
                        patterns.append({
                            "type": "physical_vitality_concern",
                            "severity": "medium",
                            "description": f"Physical vitality analysis reveals: {insight[:100]}...",
                            "evidence": f"AI Physical Analysis: {insight}",
                            "insight": "Your physical vitality assessment identified specific areas that need attention",
                            "action": "Focus on addressing the specific physical concerns identified in your analysis"
                        })
        
        # Pattern 10: REAL Emotional Health Insights Analysis  
        if emotional_insights:
            for insight in emotional_insights[:2]:  # Top 2 emotional insights
                if isinstance(insight, str) and len(insight) > 10:
                    # Check for emotional patterns
                    emotional_keywords = ["stress", "anxious", "overwhelmed", "emotional", "mood", "feelings"]
                    if any(keyword in insight.lower() for keyword in emotional_keywords):
                        patterns.append({
                            "type": "emotional_health_pattern",
                            "severity": "medium",
                            "description": f"Emotional health analysis reveals: {insight[:100]}...",
                            "evidence": f"AI Emotional Analysis: {insight}",
                            "insight": "Your emotional assessment shows patterns that affect your overall wellness",
                            "action": "Address the emotional patterns identified through targeted wellness practices"
                        })
        
        # Pattern 11: REAL Visual Appearance Insights Analysis
        if visual_insights:
            for insight in visual_insights[:2]:  # Top 2 visual insights  
                if isinstance(insight, str) and len(insight) > 10:
                    # Check for appearance-related patterns
                    appearance_keywords = ["skin", "appearance", "visual", "aging", "health", "glow"]
                    if any(keyword in insight.lower() for keyword in appearance_keywords):
                        patterns.append({
                            "type": "visual_appearance_insight",
                            "severity": "low",
                            "description": f"Visual appearance analysis reveals: {insight[:100]}...",
                            "evidence": f"AI Visual Analysis: {insight}",
                            "insight": "Your appearance assessment provides insights into your overall wellness presentation",
                            "action": "Consider the appearance insights as indicators of your internal wellness state"
                        })
        
        # Pattern 12: Comprehensive Insights Cross-Analysis
        if physical_insights and emotional_insights:
            # Look for correlations between physical and emotional insights
            physical_text = " ".join(physical_insights).lower()
            emotional_text = " ".join(emotional_insights).lower()
            
            # Check for stress-physical correlation
            if ("stress" in emotional_text or "anxious" in emotional_text) and ("tired" in physical_text or "energy" in physical_text):
                patterns.append({
                    "type": "stress_physical_correlation",
                    "severity": "medium",
                    "description": "Cross-analysis reveals correlation between emotional stress and physical energy levels",
                    "evidence": f"Emotional insights mention stress/anxiety while physical insights mention energy/fatigue",
                    "insight": "Your emotional state and physical vitality are interconnected - addressing one helps the other",
                    "action": "Focus on stress management techniques that also boost physical energy (exercise, meditation, sleep)"
                })
        
        print(f"[Leo Brain] 📊 Found {len(patterns)} hidden patterns from AI insights")
        return patterns
        
    except Exception as e:
        print(f"[Leo Brain] ❌ Error analyzing patterns: {str(e)}")
        return []

@leo_agent.tool
async def detect_crisis_signals(ctx: RunContext[LeoDeps], user_message: str) -> Dict[str, Any]:
    """Detect potential crisis situations in user messages"""
    try:
        message_lower = user_message.lower()
        
        # High-risk crisis indicators
        high_risk_keywords = [
            "suicide", "kill myself", "end my life", "want to die", "better off dead",
            "self harm", "hurt myself", "take my own life", "end it all"
        ]
        
        # Medium-risk indicators
        medium_risk_keywords = [
            "can't handle", "overwhelming", "breakdown", "falling apart", "hopeless",
            "worthless", "can't cope", "too much", "panic attack", "terrified"
        ]
        
        crisis_level = "none"
        support_resources = []
        
        if any(keyword in message_lower for keyword in high_risk_keywords):
            crisis_level = "high"
            support_resources = [
                "🆘 Crisis Text Line: Text HOME to 741741",
                "📞 988 Suicide & Crisis Lifeline: Call or text 988",
                "🚨 Emergency Services: 911"
            ]
        elif any(keyword in message_lower for keyword in medium_risk_keywords):
            crisis_level = "medium"
            support_resources = [
                "💬 Crisis Text Line: Text HOME to 741741",
                "🧠 Mental Health Resources: 988 Suicide & Crisis Lifeline"
            ]
        
        return {
            "level": crisis_level,
            "resources": support_resources,
            "detected_keywords": [kw for kw in (high_risk_keywords + medium_risk_keywords) if kw in message_lower]
        }
        
    except Exception as e:
        print(f"[Leo Brain] ❌ Error detecting crisis: {str(e)}")
        return {"level": "none", "resources": [], "detected_keywords": []}

@leo_agent.tool
async def save_conversation_message(ctx: RunContext[LeoDeps], role: str, content: str) -> Dict[str, Any]:
    """Save message to conversation history"""
    try:
        message = ChatMessage(
            user_id=ctx.deps.user_id,
            session_id=ctx.deps.session_id,
            role=role,
            content=content
        )
        ctx.deps.db.add(message)
        ctx.deps.db.commit()
        ctx.deps.db.refresh(message)
        
        return {
            "saved": True,
            "message_id": message.id,
            "timestamp": message.timestamp.isoformat() if message.timestamp else None
        }
    except Exception as e:
        print(f"[Leo Brain] ❌ Error saving message: {str(e)}")
        return {"saved": False, "error": str(e)}

# =============================================================================
# 🧠 LEO BRAIN SERVICE
# =============================================================================

class LeoBrain:
    """
    🧠 Leo - AI Mentor System Brain
    
    Clean, focused implementation that sees patterns, understands data,
    and provides wise mentorship with personality.
    """
    
    def __init__(self):
        print("[Leo Brain] 🧠 AI Mentor System Brain initialized")
    
    async def process_message(
        self,
        user_message: str,
        db: Session,
        user_id: str,
        internal_user_id: int,
        session_id: str
    ) -> LeoResponse:
        """
        Process user message with Leo's full intelligence and personality
        """
        try:
            print(f"[Leo Brain] 🚀 Processing message for user {user_id}")
            
            # Load basic user info upfront (name, etc.) 
            db_user = db.query(User).filter(User.user_id == user_id).first()
            user_name = db_user.first_name if db_user and db_user.first_name else "there"
            
            print(f"[Leo Brain] 👤 User: {user_name}")
            
            # Create dependencies
            deps = LeoDeps(
                db=db,
                user_id=user_id,
                internal_user_id=internal_user_id,
                session_id=session_id
            )
            
            # Create personalized message with user context
            contextualized_message = f"[User: {user_name}] {user_message}"
            
            # Save user message
            try:
                ctx = RunContext(deps=deps, model=model, usage=None, prompt=None)
                await save_conversation_message(ctx, "user", user_message)
            except Exception as e:
                print(f"[Leo Brain] ⚠️ Could not save user message: {e}")
            
            # Process with Leo agent (using contextualized message with user name)
            result = await leo_agent.run(contextualized_message, deps=deps)
            
            # Extract response
            response_data = None
            if hasattr(result, 'data') and result.data:
                response_data = result.data
            elif hasattr(result, 'result'):
                response_data = result.result
            elif hasattr(result, 'message'):
                response_data = result.message
            
            # Handle different response types
            if isinstance(response_data, LeoResponse):
                response = response_data
            elif isinstance(response_data, str):
                # Agent returned a string, wrap it in LeoResponse
                response = LeoResponse(
                    content=response_data,
                    wellness_insights=[],
                    hidden_patterns=[],
                    follow_up_questions=["What would you like to explore about your wellness journey?"],
                    crisis_level="none",
                    data_confidence=0.8
                )
            elif response_data is None:
                # Try to get content from messages
                messages = result.all_messages() if hasattr(result, 'all_messages') else []
                ai_messages = [msg for msg in messages if hasattr(msg, 'role') and msg.role == 'assistant']
                
                if ai_messages:
                    content = ai_messages[-1].content if hasattr(ai_messages[-1], 'content') else str(ai_messages[-1])
                    response = LeoResponse(
                        content=content,
                        wellness_insights=[],
                        hidden_patterns=[],
                        follow_up_questions=["What aspect of your wellness interests you most?"],
                        crisis_level="none",
                        data_confidence=0.7
                    )
                else:
                    raise Exception("No valid response data found")
            else:
                # Unknown response type, convert to string
                response = LeoResponse(
                    content=str(response_data),
                    wellness_insights=[],
                    hidden_patterns=[],
                    follow_up_questions=["Tell me more about your wellness goals"],
                    crisis_level="none",
                    data_confidence=0.6
                )
            
            # Save Leo's response
            try:
                ctx = RunContext(deps=deps, model=model, usage=None, prompt=None)
                await save_conversation_message(ctx, "ai", response.content)
            except Exception as e:
                print(f"[Leo Brain] ⚠️ Could not save AI response: {e}")
            
            print(f"[Leo Brain] ✅ Response generated - {len(response.wellness_insights)} insights, {len(response.hidden_patterns)} patterns")
            return response
                
        except Exception as e:
            print(f"[Leo Brain] ❌ Error processing message: {str(e)}")
            
            # Emergency fallback
            emergency_response = LeoResponse(
                content="I'm experiencing some technical difficulties, but I'm still here to support your wellness journey. How can I help you today?",
                wellness_insights=[],
                hidden_patterns=[],
                follow_up_questions=["Tell me about your current wellness goals"],
                crisis_level="none",
                data_confidence=0.3
            )
            
            # Try to save emergency response
            try:
                ctx = RunContext(deps=deps, model=model, usage=None, prompt=None)
                await save_conversation_message(ctx, "ai", emergency_response.content)
            except Exception as save_error:
                print(f"[Leo Brain] ⚠️ Could not save emergency response: {save_error}")
            
            return emergency_response 