from typing import Dict, Any, List, Optional
import openai
from app.config.settings import settings
import json
import logging

logger = logging.getLogger(__name__)

class GoalSettingService:
    """Service for creating personalized goals and custom habits based on user data."""
    
    def __init__(self):
        # Use Azure OpenAI if configured, otherwise fallback to OpenAI
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.model = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
        else:
            self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o"

    async def create_personalized_goals(self, user_context: Dict[str, Any], user_name: str = None) -> Dict[str, Any]:
        """Create personalized goals based on user's current lifestyle and challenges."""
        prompt = self._build_goal_setting_prompt(user_context, user_name)
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert wellness coach specializing in personalized goal setting. Create realistic, meaningful goals that build on the user's strengths and address their specific challenges."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        try:
            goals = response.choices[0].message.content
            return goals
        except Exception as e:
            print(f"GoalSettingService error: {e}")
            return self._get_fallback_goals(user_context)

    async def create_custom_habits(self, user_context: Dict[str, Any], goals: Dict[str, Any], user_name: str = None) -> Dict[str, Any]:
        """Create custom habits that align with the user's goals and current lifestyle."""
        prompt = self._build_habit_creation_prompt(user_context, goals, user_name)
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert habit formation specialist. Create specific, actionable habits that fit the user's current lifestyle and help them achieve their goals."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        try:
            habits = response.choices[0].message.content
            return habits
        except Exception as e:
            print(f"HabitCreationService error: {e}")
            return self._get_fallback_habits(user_context)

    async def create_wellness_profile(self, user_context: Dict[str, Any], user_name: str) -> Dict[str, Any]:
        """Create a comprehensive wellness profile based on user data."""
        
        prompt = f"""
        Create a comprehensive wellness profile for {user_name} based on their assessment data.
        
        USER CONTEXT:
        {json.dumps(user_context, indent=2)}
        
        Create a detailed wellness profile that includes:
        1. User Information (name, age estimates, etc.)
        2. Current Lifestyle Analysis (detailed breakdown of their current habits and patterns)
        3. Wellness Scores (physical, emotional, visual, overall)
        4. Strengths (what they're doing well)
        5. Challenges (areas for improvement)
        6. Personalized Insights (specific observations about their lifestyle)
        
        Return the profile as a JSON object with the following structure:
        {{
            "user_info": {{
                "name": "string",
                "age": "string (estimated)",
                "biological_age": "string (if available)",
                "emotional_age": "string (if available)"
            }},
            "wellness_scores": {{
                "overall_glow_score": "number",
                "physical_vitality": "number",
                "emotional_health": "number", 
                "visual_appearance": "number"
            }},
            "current_lifestyle": {{
                "sleep_patterns": "detailed analysis",
                "exercise_habits": "detailed analysis",
                "nutrition_patterns": "detailed analysis",
                "stress_management": "detailed analysis",
                "social_connections": "detailed analysis",
                "work_life_balance": "detailed analysis"
            }},
            "strengths": ["list of specific strengths"],
            "challenges": ["list of specific challenges"],
            "personalized_insights": "comprehensive analysis of their unique situation"
        }}
        
        Make sure the profile is highly personalized based on their actual data, not generic advice.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            profile = json.loads(content)
            
            return profile
            
        except Exception as e:
            logger.error(f"Error creating wellness profile: {e}")
            # Return a basic profile structure if AI generation fails
            return {
                "user_info": {
                    "name": user_name,
                    "age": "Not specified",
                    "biological_age": "Not available",
                    "emotional_age": "Not available"
                },
                "wellness_scores": {
                    "overall_glow_score": 0,
                    "physical_vitality": 0,
                    "emotional_health": 0,
                    "visual_appearance": 0
                },
                "current_lifestyle": user_context.get("currentLifestyle", {}),
                "strengths": user_context.get("strengths", []),
                "challenges": user_context.get("challenges", []),
                "personalized_insights": "Profile generation failed. Please complete your assessment again."
            }

    def _build_goal_setting_prompt(self, user_context: Dict[str, Any], user_name: str = None) -> str:
        """Build a prompt for personalized goal setting."""
        current_lifestyle = user_context.get("currentLifestyle", {})
        strengths = user_context.get("strengths", [])
        challenges = user_context.get("challenges", [])
        
        name_str = f" for {user_name}" if user_name else ""
        
        lifestyle_summary = self._build_lifestyle_summary(current_lifestyle)
        
        return f"""
        Create personalized wellness goals{name_str} based on their current lifestyle and needs.

        **CURRENT LIFESTYLE:**
        {lifestyle_summary}

        **STRENGTHS TO BUILD UPON:**
        {', '.join(strengths) if strengths else 'No specific strengths identified yet'}

        **CHALLENGES TO ADDRESS:**
        {', '.join(challenges) if challenges else 'General wellness improvement needed'}

        **GOAL SETTING PRINCIPLES:**
        1. **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
        2. **Build on Strengths**: Leverage what they're already doing well
        3. **Address Specific Challenges**: Target their actual pain points
        4. **Progressive Difficulty**: Start where they are and progress gradually
        5. **Realistic Integration**: Consider their current schedule and constraints

        **CREATE GOALS IN THIS FORMAT:**
        {{
          "primaryGoals": [
            {{
              "category": "physical|emotional|social|lifestyle",
              "title": "Specific goal title",
              "description": "Detailed description of what they want to achieve",
              "currentLevel": "Where they are now",
              "targetLevel": "Where they want to be",
              "timeframe": "1-3 months",
              "motivation": "Why this matters to them specifically",
              "difficulty": "beginner|intermediate|advanced",
              "priority": "high|medium|low"
            }}
          ],
          "supportingGoals": [
            {{
              "category": "physical|emotional|social|lifestyle",
              "title": "Supporting goal title",
              "description": "How this supports the primary goals",
              "timeframe": "1-3 months",
              "difficulty": "beginner|intermediate|advanced"
            }}
          ],
          "goalRationale": "Explanation of why these specific goals were chosen for this user"
        }}

        **EXAMPLES OF PERSONALIZATION:**
        - If user already exercises 5+ times/week: Goal might be "Optimize workout recovery" or "Try new fitness modalities"
        - If user has poor sleep: Goal might be "Establish consistent sleep schedule" or "Improve sleep environment"
        - If user has high stress: Goal might be "Develop stress management toolkit" or "Create daily relaxation routine"
        - If user has good nutrition: Goal might be "Optimize meal timing" or "Add specific supplements"

        **REMEMBER**: These goals should feel like they were made specifically for this person, not generic wellness goals.

        Respond ONLY with a single valid JSON object.
        """

    def _build_habit_creation_prompt(self, user_context: Dict[str, Any], goals: Dict[str, Any], user_name: str = None) -> str:
        """Build a prompt for creating custom habits that align with goals."""
        current_lifestyle = user_context.get("currentLifestyle", {})
        name_str = f" for {user_name}" if user_name else ""
        
        lifestyle_summary = self._build_lifestyle_summary(current_lifestyle)
        
        return f"""
        Create custom habits{name_str} that will help them achieve their goals while fitting their current lifestyle.

        **CURRENT LIFESTYLE:**
        {lifestyle_summary}

        **USER'S GOALS:**
        {goals}

        **HABIT CREATION PRINCIPLES:**
        1. **Atomic Habits Method**: Make it obvious, attractive, easy, and satisfying
        2. **Stack on Existing Habits**: Connect new habits to current routines
        3. **Start Small**: Begin with 2-minute versions of habits
        4. **Personal Triggers**: Use their specific daily patterns as triggers
        5. **Meaningful Rewards**: Connect to their specific motivations

        **CREATE HABITS IN THIS FORMAT:**
        {{
          "coreHabits": [
            {{
              "title": "Specific habit name",
              "description": "Detailed description of the habit",
              "trigger": "When/where this habit will happen (based on their current routine)",
              "action": "Exactly what they will do (specific and actionable)",
              "reward": "What they'll get from this habit (meaningful to them)",
              "difficulty": "beginner|intermediate|advanced",
              "frequency": "daily|weekly|as-needed",
              "estimatedTime": "How long it takes",
              "goalConnection": "Which goal this habit supports",
              "progression": "How to make it harder over time"
            }}
          ],
          "supportingHabits": [
            {{
              "title": "Supporting habit name",
              "description": "How this supports the core habits",
              "trigger": "When this happens",
              "action": "What they do",
              "frequency": "daily|weekly|as-needed"
            }}
          ],
          "habitEnvironment": {{
            "obstacles": ["What might prevent these habits"],
            "enablers": ["What will help these habits succeed"],
            "integration": "How to fit these habits into their current schedule"
          }}
        }}

        **EXAMPLES OF PERSONALIZATION:**
        - If user wakes up at 5:30: Habit might be "5-minute morning stretch routine"
        - If user has lunch at work: Habit might be "10-minute post-lunch walk"
        - If user struggles with stress: Habit might be "3-minute breathing exercise before meetings"
        - If user has good nutrition: Habit might be "Meal prep on Sunday evenings"

        **REMEMBER**: These habits should feel natural and achievable for their specific lifestyle and current capabilities.

        Respond ONLY with a single valid JSON object.
        """

    def _build_lifestyle_summary(self, current_lifestyle: Dict[str, Any]) -> str:
        """Build a comprehensive summary of the user's current lifestyle."""
        summary_parts = []
        
        # Energy and sleep
        if "energyLevel" in current_lifestyle:
            energy = current_lifestyle["energyLevel"]
            summary_parts.append(f"Energy: {energy['description']} (score: {energy['score']}/5)")
        
        if "sleep" in current_lifestyle:
            sleep = current_lifestyle["sleep"]
            summary_parts.append(f"Sleep: {sleep['hours']} - {sleep['quality']} quality")
        
        # Exercise and nutrition
        if "exercise" in current_lifestyle:
            exercise = current_lifestyle["exercise"]
            summary_parts.append(f"Exercise: {exercise['frequency']} ({exercise['intensity']} intensity)")
        
        if "nutrition" in current_lifestyle:
            nutrition = current_lifestyle["nutrition"]
            summary_parts.append(f"Nutrition: {nutrition['quality']} (score: {nutrition['score']}/5)")
        
        # Stress and social
        if "stressManagement" in current_lifestyle:
            stress = current_lifestyle["stressManagement"]
            summary_parts.append(f"Stress Management: {stress['effectiveness']} (score: {stress['score']}/5)")
        
        if "socialConnections" in current_lifestyle:
            social = current_lifestyle["socialConnections"]
            summary_parts.append(f"Social Connections: {social['satisfaction']} (score: {social['score']}/5)")
        
        return "\n".join(summary_parts) if summary_parts else "Limited lifestyle data available"

    def _get_fallback_goals(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback goals when AI generation fails."""
        return {
            "primaryGoals": [
                {
                    "category": "lifestyle",
                    "title": "Establish Consistent Wellness Routine",
                    "description": "Create a sustainable daily routine that fits your current lifestyle",
                    "currentLevel": "Variable routine",
                    "targetLevel": "Consistent daily habits",
                    "timeframe": "2-3 months",
                    "motivation": "Build a foundation for long-term wellness",
                    "difficulty": "beginner",
                    "priority": "high"
                }
            ],
            "supportingGoals": [],
            "goalRationale": "General wellness improvement based on available data"
        }

    def _get_fallback_habits(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback habits when AI generation fails."""
        return {
            "coreHabits": [
                {
                    "title": "Morning Wellness Check",
                    "description": "Start each day with a brief wellness assessment",
                    "trigger": "After waking up",
                    "action": "Take 2 minutes to assess energy, mood, and hydration",
                    "reward": "Better awareness of daily needs",
                    "difficulty": "beginner",
                    "frequency": "daily",
                    "estimatedTime": "2 minutes",
                    "goalConnection": "Establish Consistent Wellness Routine",
                    "progression": "Add specific wellness actions based on assessment"
                }
            ],
            "supportingHabits": [],
            "habitEnvironment": {
                "obstacles": ["Time constraints", "Inconsistent schedule"],
                "enablers": ["Simple actions", "Flexible timing"],
                "integration": "Start with 2-minute habits that can be done anywhere"
            }
        } 