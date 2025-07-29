from typing import Dict, Any, Optional, List
import openai
from app.config.settings import settings
from app.services.ai_knowledge_base import ATOMIC_HABITS_PRINCIPLES, MIRACLE_MORNING_PRINCIPLES, DEEP_WORK_PRINCIPLES
import json
import logging
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.progress_tracking import HabitCompletion
from app.models.chat_message import ChatMessage
from app.models.assessment import UserAssessment
from app.models.user import User
from app.services.user_preferences_service import UserPreferencesService

def extract_first_json(text: str):
    json_candidates = re.findall(r'\{.*?\}', text, re.DOTALL)
    for candidate in json_candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None

class KnowledgeBasedPlanService:
    def __init__(self):
        # Use Azure OpenAI if configured, otherwise fallback to OpenAI
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.llm_client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.model = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
            print(f"[KnowledgeBasedPlanService] Using Azure OpenAI with deployment: {self.model}")
        else:
            self.llm_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o"
            print(f"[KnowledgeBasedPlanService] Using OpenAI with model: {self.model}")

    def _extract_user_patterns(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Extract comprehensive user patterns from all available data"""
        patterns = {
            "habit_completion_history": {},
            "chat_preferences": {},
            "assessment_progression": {},
            "user_context": {},
            "custom_habits": [],
            "struggles": [],
            "successes": [],
            "user_preferences": {},
            "custom_routines": {}
        }
        
        try:
            # 1. Analyze habit completion patterns
            habit_completions = db.query(HabitCompletion).filter(
                HabitCompletion.user_id == user_id
            ).order_by(HabitCompletion.day_date.desc()).limit(100).all()
            
            if habit_completions:
                patterns["habit_completion_history"] = {
                    "total_completions": len(habit_completions),
                    "completion_rate": self._calculate_completion_rate(habit_completions),
                    "most_successful_habits": self._find_most_successful_habits(habit_completions),
                    "struggling_habits": self._find_struggling_habits(habit_completions),
                    "completion_trends": self._analyze_completion_trends(habit_completions),
                    "recent_activity": [{
                        "habit_type": hc.habit_type,
                        "content": hc.habit_content,
                        "date": hc.day_date.isoformat(),
                        "notes": hc.notes
                    } for hc in habit_completions[:10]]
                }
            
            # 2. Extract user preferences from chat messages
            chat_messages = db.query(ChatMessage).filter(
                ChatMessage.user_id == str(user_id)
            ).order_by(ChatMessage.timestamp.desc()).limit(50).all()
            
            if chat_messages:
                patterns["chat_preferences"] = {
                    "frequent_topics": self._extract_frequent_topics(chat_messages),
                    "expressed_struggles": self._extract_struggles(chat_messages),
                    "mentioned_preferences": self._extract_preferences(chat_messages),
                    "goals_mentioned": self._extract_goals(chat_messages)
                }
            
            # 3. Analyze assessment progression
            assessments = db.query(UserAssessment).filter(
                UserAssessment.user_id == user_id
            ).order_by(UserAssessment.created_at.desc()).limit(5).all()
            
            if len(assessments) > 1:
                patterns["assessment_progression"] = {
                    "score_trends": self._analyze_score_trends(assessments),
                    "archetype_evolution": self._analyze_archetype_evolution(assessments),
                    "biological_age_progression": self._analyze_age_progression(assessments),
                    "latest_insights": assessments[0].detailed_insights if assessments[0].detailed_insights else {}
                }
            
            # 4. Get user context
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                patterns["user_context"] = {
                    "name": user.first_name,
                    "member_since": (datetime.utcnow() - user.created_at).days if user.created_at else 0,
                    "engagement_level": self._calculate_engagement_level(habit_completions, chat_messages)
                }
            
            # 5. Extract custom habits and preferences
            patterns["custom_habits"] = self._extract_custom_habits(habit_completions, chat_messages)
            patterns["struggles"] = self._extract_struggles_from_data(habit_completions, chat_messages, assessments)
            patterns["successes"] = self._extract_successes_from_data(habit_completions, chat_messages, assessments)
            
            # 6. Get user preferences and custom routines
            preferences_service = UserPreferencesService()
            user_context = preferences_service.get_user_context_for_planning(db, user_id)
            patterns["user_preferences"] = user_context.get("preferences", {})
            patterns["custom_routines"] = user_context.get("custom_routines", {})
            patterns["custom_habits"].extend(user_context.get("custom_habits", []))
            
        except Exception as e:
            logging.error(f"Error extracting user patterns: {e}")
        
        return patterns

    def _calculate_completion_rate(self, completions: List[HabitCompletion]) -> Dict[str, float]:
        """Calculate completion rate by habit type"""
        rates = {}
        total_by_type = {}
        completed_by_type = {}
        
        for completion in completions:
            habit_type = completion.habit_type
            if habit_type not in total_by_type:
                total_by_type[habit_type] = 0
                completed_by_type[habit_type] = 0
            
            total_by_type[habit_type] += 1
            if completion.completed_at:
                completed_by_type[habit_type] += 1
        
        for habit_type in total_by_type:
            rates[habit_type] = (completed_by_type[habit_type] / total_by_type[habit_type]) * 100
        
        return rates

    def _find_most_successful_habits(self, completions: List[HabitCompletion]) -> List[str]:
        """Find habits the user consistently completes"""
        successful_habits = []
        habit_success_count = {}
        
        for completion in completions:
            if completion.completed_at:
                content = completion.habit_content.lower()
                if content not in habit_success_count:
                    habit_success_count[content] = 0
                habit_success_count[content] += 1
        
        # Find habits completed more than once
        for habit, count in habit_success_count.items():
            if count > 1:
                successful_habits.append(habit)
        
        return successful_habits[:5]  # Top 5

    def _find_struggling_habits(self, completions: List[HabitCompletion]) -> List[str]:
        """Find habits the user struggles with"""
        struggling_habits = []
        habit_failure_count = {}
        
        for completion in completions:
            if not completion.completed_at:
                content = completion.habit_content.lower()
                if content not in habit_failure_count:
                    habit_failure_count[content] = 0
                habit_failure_count[content] += 1
        
        # Find habits that were not completed
        for habit, count in habit_failure_count.items():
            if count > 0:
                struggling_habits.append(habit)
        
        return struggling_habits[:5]  # Top 5

    def _analyze_completion_trends(self, completions: List[HabitCompletion]) -> Dict[str, Any]:
        """Analyze completion trends over time"""
        if not completions:
            return {}
        
        # Group by week
        weekly_stats = {}
        for completion in completions:
            week_start = completion.day_date - timedelta(days=completion.day_date.weekday())
            week_key = week_start.isoformat()
            
            if week_key not in weekly_stats:
                weekly_stats[week_key] = {"total": 0, "completed": 0}
            
            weekly_stats[week_key]["total"] += 1
            if completion.completed_at:
                weekly_stats[week_key]["completed"] += 1
        
        # Calculate trend
        weeks = sorted(weekly_stats.keys())
        if len(weeks) >= 2:
            recent_rate = weekly_stats[weeks[-1]]["completed"] / weekly_stats[weeks[-1]]["total"]
            previous_rate = weekly_stats[weeks[-2]]["completed"] / weekly_stats[weeks[-2]]["total"]
            trend = "improving" if recent_rate > previous_rate else "declining" if recent_rate < previous_rate else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "trend": trend,
            "recent_completion_rate": weekly_stats[weeks[-1]]["completed"] / weekly_stats[weeks[-1]]["total"] if weeks else 0,
            "weekly_stats": weekly_stats
        }

    def _extract_frequent_topics(self, messages: List[ChatMessage]) -> List[str]:
        """Extract frequently discussed topics from chat"""
        topics = []
        for msg in messages:
            if msg.role == "user":
                content = msg.content.lower()
                # Simple topic extraction
                if "sleep" in content or "tired" in content:
                    topics.append("sleep_quality")
                if "stress" in content or "anxiety" in content:
                    topics.append("stress_management")
                if "exercise" in content or "workout" in content:
                    topics.append("physical_activity")
                if "diet" in content or "food" in content:
                    topics.append("nutrition")
                if "routine" in content or "habit" in content:
                    topics.append("habit_formation")
        
        return list(set(topics))

    def _extract_struggles(self, messages: List[ChatMessage]) -> List[str]:
        """Extract user struggles from chat messages"""
        struggles = []
        for msg in messages:
            if msg.role == "user":
                content = msg.content.lower()
                if any(word in content for word in ["struggle", "difficult", "hard", "can't", "unable", "fail"]):
                    struggles.append(content[:100])  # First 100 chars
        
        return struggles[:5]

    def _extract_preferences(self, messages: List[ChatMessage]) -> Dict[str, str]:
        """Extract user preferences from chat"""
        preferences = {}
        for msg in messages:
            if msg.role == "user":
                content = msg.content.lower()
                if "prefer" in content or "like" in content or "enjoy" in content:
                    preferences["expressed_likes"] = content[:200]
                if "don't like" in content or "hate" in content or "dislike" in content:
                    preferences["expressed_dislikes"] = content[:200]
        
        return preferences

    def _extract_goals(self, messages: List[ChatMessage]) -> List[str]:
        """Extract user goals from chat"""
        goals = []
        for msg in messages:
            if msg.role == "user":
                content = msg.content.lower()
                if any(word in content for word in ["goal", "want to", "aim to", "plan to", "target"]):
                    goals.append(content[:100])
        
        return goals[:3]

    def _analyze_score_trends(self, assessments: List[UserAssessment]) -> Dict[str, Any]:
        """Analyze how user scores have changed over time"""
        if len(assessments) < 2:
            return {}
        
        latest = assessments[0]
        previous = assessments[1]
        
        trends = {}
        for category in ["physicalVitality", "emotionalHealth", "visualAppearance"]:
            if category in latest.category_scores and category in previous.category_scores:
                change = latest.category_scores[category] - previous.category_scores[category]
                trends[category] = {
                    "current": latest.category_scores[category],
                    "previous": previous.category_scores[category],
                    "change": change,
                    "trend": "improving" if change > 0 else "declining" if change < 0 else "stable"
                }
        
        return trends

    def _analyze_archetype_evolution(self, assessments: List[UserAssessment]) -> Dict[str, Any]:
        """Analyze how user archetype has evolved"""
        if len(assessments) < 2:
            return {}
        
        latest_archetype = assessments[0].glowup_archetype
        previous_archetype = assessments[1].glowup_archetype
        
        return {
            "current_archetype": latest_archetype.get("name", "Unknown"),
            "previous_archetype": previous_archetype.get("name", "Unknown"),
            "archetype_changed": latest_archetype.get("name") != previous_archetype.get("name")
        }

    def _analyze_age_progression(self, assessments: List[UserAssessment]) -> Dict[str, Any]:
        """Analyze biological age progression"""
        if len(assessments) < 2:
            return {}
        
        latest = assessments[0]
        previous = assessments[1]
        
        biological_change = latest.biological_age - previous.biological_age
        emotional_change = latest.emotional_age - previous.emotional_age
        
        return {
            "biological_age_change": biological_change,
            "emotional_age_change": emotional_change,
            "biological_trend": "improving" if biological_change < 0 else "declining" if biological_change > 0 else "stable",
            "emotional_trend": "improving" if emotional_change < 0 else "declining" if emotional_change > 0 else "stable"
        }

    def _calculate_engagement_level(self, completions: List[HabitCompletion], messages: List[ChatMessage]) -> str:
        """Calculate user engagement level"""
        total_activities = len(completions) + len(messages)
        
        if total_activities > 50:
            return "high"
        elif total_activities > 20:
            return "medium"
        else:
            return "low"

    def _extract_custom_habits(self, completions: List[HabitCompletion], messages: List[ChatMessage]) -> List[str]:
        """Extract custom habits the user has mentioned or created"""
        custom_habits = []
        
        # From habit completions
        for completion in completions:
            if "custom" in completion.habit_content.lower() or "personal" in completion.habit_content.lower():
                custom_habits.append(completion.habit_content)
        
        # From chat messages
        for msg in messages:
            if msg.role == "user":
                content = msg.content.lower()
                if "my routine" in content or "my habit" in content or "i do" in content:
                    custom_habits.append(msg.content[:100])
        
        return list(set(custom_habits))[:5]

    def _extract_struggles_from_data(self, completions: List[HabitCompletion], messages: List[ChatMessage], assessments: List[UserAssessment]) -> List[str]:
        """Extract struggles from all data sources"""
        struggles = []
        
        # From failed habit completions
        failed_habits = [c.habit_content for c in completions if not c.completed_at]
        if failed_habits:
            struggles.append(f"Struggles with: {', '.join(failed_habits[:3])}")
        
        # From chat messages
        for msg in messages:
            if msg.role == "user" and any(word in msg.content.lower() for word in ["struggle", "difficult", "can't", "fail"]):
                struggles.append(msg.content[:100])
        
        # From assessment insights
        if assessments and assessments[0].detailed_insights:
            insights = assessments[0].detailed_insights
            for category in ["physicalVitalityInsights", "emotionalHealthInsights", "visualAppearanceInsights"]:
                if category in insights:
                    for insight in insights[category]:
                        if any(word in insight.lower() for word in ["struggle", "difficult", "challenge", "problem"]):
                            struggles.append(insight[:100])
        
        return struggles[:5]

    def _extract_successes_from_data(self, completions: List[HabitCompletion], messages: List[ChatMessage], assessments: List[UserAssessment]) -> List[str]:
        """Extract successes from all data sources"""
        successes = []
        
        # From successful habit completions
        successful_habits = [c.habit_content for c in completions if c.completed_at]
        if successful_habits:
            successes.append(f"Successfully completed: {', '.join(successful_habits[:3])}")
        
        # From chat messages
        for msg in messages:
            if msg.role == "user" and any(word in msg.content.lower() for word in ["success", "achieved", "completed", "feel better"]):
                successes.append(msg.content[:100])
        
        # From assessment improvements
        if len(assessments) > 1:
            latest = assessments[0]
            previous = assessments[1]
            if latest.overall_glow_score > previous.overall_glow_score:
                successes.append(f"Improved overall score from {previous.overall_glow_score} to {latest.overall_glow_score}")
        
        return successes[:5]

    async def generate_7_day_plan(self, orchestrator_output: Dict[str, Any], quiz_insights: Dict[str, Any], photo_insights: Dict[str, Any], user_name: str = None, backbone: Optional[Any] = None, projected_scores: Optional[Any] = None, db: Session = None, user_id: int = None) -> Dict[str, Any]:
        """Generate a highly personalized, data-driven 7-day plan based on user patterns and preferences."""
        
        # Extract comprehensive user patterns if database is available
        user_patterns = {}
        if db and user_id:
            user_patterns = self._extract_user_patterns(db, user_id)
            print(f"[KnowledgeBasedPlanService] Extracted user patterns: {json.dumps(user_patterns, indent=2)}")
        
        prompt = self._build_personalized_plan_prompt(
            orchestrator_output, 
            quiz_insights, 
            photo_insights, 
            user_name, 
            backbone, 
            projected_scores,
            user_patterns
        )
        
        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert transformation coach specializing in highly personalized, data-driven daily wellness plans. You have access to comprehensive user data including habit completion history, chat preferences, assessment progression, and personal struggles/successes. Use this data to create plans that are realistic, motivating, and tailored to the user's unique patterns, preferences, and current capabilities. Ground your plan in the principles from Atomic Habits, Miracle Morning, and Deep Work, but adapt them to the user's specific context."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        try:
            plan_json = response.choices[0].message.content.strip()
            print("\n" + "="*80)
            print("📅 RAW PERSONALIZED 7-DAY PLAN LLM OUTPUT:")
            print(plan_json)
            print("="*80 + "\n")
            
            try:
                plan = json.loads(plan_json)
                # Validate structure
                if (
                    isinstance(plan, dict)
                    and 'morningLaunchpad' in plan
                    and 'days' in plan
                    and isinstance(plan['days'], list)
                    and len(plan['days']) == 7
                ):
                    return plan
                else:
                    logging.error(f"[KnowledgeBasedPlanService] Output does not match expected structure. Returning raw parsed object.")
                    return plan
            except Exception as e:
                logging.error(f"[KnowledgeBasedPlanService] Error parsing 7-day plan output: {e}")
                extracted = extract_first_json(plan_json)
                if extracted:
                    return extracted
                logging.error(f"[KnowledgeBasedPlanService] Raw output: {plan_json}")
                return None
        except Exception as e:
            logging.error(f"[KnowledgeBasedPlanService] Error generating 7-day plan: {e}")
            return None

    def _build_personalized_plan_prompt(self, orchestrator_output, quiz_insights, photo_insights, user_name=None, backbone=None, projected_scores=None, user_patterns=None):
        """Build a highly personalized prompt using all available user data"""
        
        name_str = f" The user's name is {user_name}. Use it at least once during the week." if user_name else ""
        
        # Knowledge base principles
        knowledge_summary = f"""
        Here are key principles from top self-improvement books to guide your plan:
        - Atomic Habits: {ATOMIC_HABITS_PRINCIPLES['core_concept']} Key ideas: {', '.join(ATOMIC_HABITS_PRINCIPLES['key_ideas'])}
        - Miracle Morning: {MIRACLE_MORNING_PRINCIPLES['core_concept']} Key ideas: {', '.join(MIRACLE_MORNING_PRINCIPLES['key_ideas'])}
        - Deep Work: {DEEP_WORK_PRINCIPLES['core_concept']} Key ideas: {', '.join(DEEP_WORK_PRINCIPLES['key_ideas'])}
        """
        
        backbone_str = f"\nHere is the weekly backbone (themes, focus areas, rationale) for each week: {json.dumps(backbone, ensure_ascii=False, indent=2)}" if backbone else ""
        projected_scores_str = f"\nHere are the user's projected scores for 7 and 30 days: {json.dumps(projected_scores, ensure_ascii=False, indent=2)}" if projected_scores else ""
        
        # User patterns and preferences
        patterns_str = ""
        if user_patterns:
            patterns_str = f"""
        === USER PATTERNS & PREFERENCES (CRITICAL FOR PERSONALIZATION) ===
        
        HABIT COMPLETION HISTORY:
        - Completion rates by type: {json.dumps(user_patterns.get('habit_completion_history', {}).get('completion_rate', {}), indent=2)}
        - Most successful habits: {user_patterns.get('habit_completion_history', {}).get('most_successful_habits', [])}
        - Struggling habits: {user_patterns.get('habit_completion_history', {}).get('struggling_habits', [])}
        - Recent activity: {json.dumps(user_patterns.get('habit_completion_history', {}).get('recent_activity', [])[:3], indent=2)}
        
        CHAT PREFERENCES & STRUGGLES:
        - Frequent topics: {user_patterns.get('chat_preferences', {}).get('frequent_topics', [])}
        - Expressed struggles: {user_patterns.get('chat_preferences', {}).get('expressed_struggles', [])}
        - User preferences: {json.dumps(user_patterns.get('chat_preferences', {}).get('mentioned_preferences', {}), indent=2)}
        - Goals mentioned: {user_patterns.get('chat_preferences', {}).get('goals_mentioned', [])}
        
        ASSESSMENT PROGRESSION:
        - Score trends: {json.dumps(user_patterns.get('assessment_progression', {}).get('score_trends', {}), indent=2)}
        - Archetype evolution: {json.dumps(user_patterns.get('assessment_progression', {}).get('archetype_evolution', {}), indent=2)}
        - Age progression: {json.dumps(user_patterns.get('assessment_progression', {}).get('biological_age_progression', {}), indent=2)}
        
                 USER CONTEXT:
         - Name: {user_patterns.get('user_context', {}).get('name', 'User')}
         - Member since: {user_patterns.get('user_context', {}).get('member_since', 0)} days
         - Engagement level: {user_patterns.get('user_context', {}).get('engagement_level', 'unknown')}
         
         USER PREFERENCES & CUSTOM ROUTINES:
         - Preferred wake time: {user_patterns.get('user_preferences', {}).get('preferred_wake_time', 'Not set')}
         - Preferred sleep time: {user_patterns.get('user_preferences', {}).get('preferred_sleep_time', 'Not set')}
         - Exercise preferences: {user_patterns.get('user_preferences', {}).get('preferred_exercise_time', 'Not set')} at {user_patterns.get('user_preferences', {}).get('preferred_exercise_intensity', 'Not set')} level
         - Work schedule: {json.dumps(user_patterns.get('user_preferences', {}).get('work_schedule', {}), indent=2)}
         - Family obligations: {json.dumps(user_patterns.get('user_preferences', {}).get('family_obligations', {}), indent=2)}
         - Primary goals: {json.dumps(user_patterns.get('user_preferences', {}).get('primary_goals', []), indent=2)}
         - Focus areas: {json.dumps(user_patterns.get('user_preferences', {}).get('focus_areas', []), indent=2)}
         - Avoid areas: {json.dumps(user_patterns.get('user_preferences', {}).get('avoid_areas', []), indent=2)}
         - Custom morning routine: {json.dumps(user_patterns.get('custom_routines', {}).get('morning_routine', []), indent=2)}
         - Custom evening routine: {json.dumps(user_patterns.get('custom_routines', {}).get('evening_routine', []), indent=2)}
         
         CUSTOM HABITS & PREFERENCES:
         - Custom habits: {user_patterns.get('custom_habits', [])}
         - Current struggles: {user_patterns.get('struggles', [])}
         - Recent successes: {user_patterns.get('successes', [])}
        """
        
        return f"""
        IMPORTANT: Respond ONLY with a valid JSON object with the following structure (no explanations, comments, or text outside the JSON):
        {{
          'morningLaunchpad': [...],
          'days': [
            {{
              'day': 1,
              'mainFocus': <main focus or theme for the day (should align with the backbone)>,
              'systemBuilding': <1-2 specific, actionable, and progressive habits (Atomic Habits, with trigger, action, reward)>,
              'deepFocus': <a unique, highly personalized deep work block for this day (Deep Work)>,
              'eveningReflection': <a review or journaling/reflection task>,
              'motivationalTip': <a motivational tip or message>
            }},
            ...
          ],
          'challenges': [
            {{
              'category': "Learning | Leisure | Physical | Social | Mindfulness | Creative",
              'title': <Short title for the challenge>,
              'description': <Clear, trackable task to complete during the week>,
              'estimatedTime': <Approximate time to complete the challenge, e.g. "30 min">,
              'rationale': <Brief explanation why this challenge is useful based on user's profile>
            }},
            ...
          ]
        }}
        The response must be a single valid JSON object that can be parsed directly.

        === CRITICAL PERSONALIZATION REQUIREMENTS ===
        
        You have access to comprehensive user data. Use this data to create HIGHLY PERSONALIZED plans:
        
        1. **ADAPT TO USER'S CURRENT LEVEL**: 
           - If they already do 60-70 pushups, don't suggest 10 pushups
           - If they wake up at 5:30, don't suggest 6:30 wake-up
           - If they walk 9 hours on weekends, don't suggest 45-minute walks
           - Build on their existing strengths and current capabilities
        
        2. **LEVERAGE SUCCESS PATTERNS**:
           - Use their most successful habits as a foundation
           - Incorporate elements from habits they consistently complete
           - Build on what's already working for them
        
        3. **ADDRESS SPECIFIC STRUGGLES**:
           - Avoid suggesting habits they've struggled with
           - Provide alternatives to habits they find difficult
           - Address their specific challenges mentioned in chat
        
        4. **RESPECT PREFERENCES**:
           - Consider their expressed likes/dislikes from chat
           - Adapt to their cultural context and lifestyle
           - Use their preferred terminology and approach
        
        5. **PROGRESSIVE DIFFICULTY**:
           - Start with what they can easily achieve
           - Gradually increase challenge based on their progression
           - Consider their assessment trends and improvements

        Given the following user data:
        - Orchestrator output: {orchestrator_output}
        - Quiz insights: {quiz_insights}
        - Photo insights: {photo_insights}
        {name_str}
        {patterns_str}

        {knowledge_summary}
        {backbone_str}
        {projected_scores_str}

        Your task:

        1. Create ONE morning routine (Miracle Morning) for the entire week — a list of 5-7 short, trackable actions personalized to the user's context, current schedule, and preferences.

        2. Create a detailed 7-day plan ("days") where each day includes:
            - mainFocus: key theme of the day
            - systemBuilding: 1-2 concrete, physical habits (Atomic Habits structure). Example:
              {{
                "trigger": "After lunch",
                "action": "Take a 15-min walk",
                "reward": "Clear mind and refreshed energy"
              }}
            - deepFocus: personalized 30–60 min session of uninterrupted focus (Deep Work)
            - eveningReflection: simple journal or reflection action
            - motivationalTip: motivating sentence
            - Each habit must be unique, specific, and real-world — no vague or generic instructions.

        3. Create exactly 2 or 3 weekly challenges under the "challenges" section. Prioritize the most relevant categories based on the user's needs, quiz insights, and photo insights. Choose the types of challenges that would most benefit the user's emotional, physical, or mental state this week.
            - Each challenge should fall into one of these categories: Learning, Leisure, Physical, Social, Mindfulness, Creative
            - Each challenge must be:
                - actionable (e.g. "Visit a new place and take 3 photos")
                - clearly described
                - doable within the week
                - engaging and slightly outside of user's current routine
            - Include a brief rationale for each challenge

        Do NOT include all categories (Learning, Leisure, Social, etc.). Pick only a few that feel the most important for this user's current situation. This makes the plan more focused and less overwhelming.

        AGAIN: Respond ONLY with a single valid JSON object. Do NOT include any explanation or text outside the JSON.
        """ 