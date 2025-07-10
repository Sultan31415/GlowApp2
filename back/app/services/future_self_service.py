from typing import Dict, Any
import openai
from app.config.settings import settings
from app.models.future_projection import FutureProjection, DailyPlan
from app.db.session import SessionLocal
import json
import logging

class FutureSelfService:
    def __init__(self):
        # Use Azure OpenAI if configured, otherwise fallback to OpenAI
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.llm_client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.model = settings.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME
            print(f"[FutureSelfService] Using Azure OpenAI with deployment: {self.model}")
        else:
            self.llm_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o"
            print(f"[FutureSelfService] Using OpenAI with model: {self.model}")

    def clamp_score(self, value):
        try:
            val = float(value)
            if val < 0 or val > 100:
                logging.warning(f"[FutureSelfService] Score out of bounds: {val}, clamped to [0, 100]")
            return max(0, min(100, round(val)))
        except Exception as e:
            logging.error(f"[FutureSelfService] Error converting score '{value}' to float: {e}")
            return 0

    async def get_dual_timeframe_projection(self, orchestrator_output: Dict[str, Any], quiz_insights: Dict[str, Any], photo_insights: Dict[str, Any], user_name: str = None) -> Dict[str, Any]:
        """Generate both 7-day and 30-day projections in a single call for efficiency and consistency."""
        prompt = self._build_dual_projection_prompt(orchestrator_output, quiz_insights, photo_insights, user_name)
        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert transformation coach specializing in realistic yet motivational wellness projections. Create inspiring but evidence-based projections for both short-term wins and longer-term transformation. Focus on achievable improvements that users will actually feel and see."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1800,
            response_format={"type": "json_object"}
        )
        projection_output = response.choices[0].message.content
        print("\n" + "="*80)
        print("🔮 RAW DUAL TIMEFRAME PROJECTION OUTPUT:")
        print(f"{projection_output}")
        print("="*80 + "\n")
        # Clamp all scores to [0, 100]
        try:
            parsed = json.loads(projection_output) if isinstance(projection_output, str) else projection_output
            for timeframe in ["sevenDay", "thirtyDay"]:
                if timeframe in parsed and "projectedScores" in parsed[timeframe]:
                    for key in ["overallGlowScore", "physicalVitality", "emotionalHealth", "visualAppearance"]:
                        if key in parsed[timeframe]["projectedScores"]:
                            val = parsed[timeframe]["projectedScores"][key]
                            parsed[timeframe]["projectedScores"][key] = self.clamp_score(val)
            return parsed
        except Exception as e:
            logging.error(f"[FutureSelfService] Error clamping scores: {e}")
            return projection_output

    # Keep legacy method for backward compatibility
    async def get_7_day_projection(self, orchestrator_output: Dict[str, Any], quiz_insights: Dict[str, Any], photo_insights: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method - now calls dual timeframe and extracts 7-day data."""
        dual_projection = await self.get_dual_timeframe_projection(orchestrator_output, quiz_insights, photo_insights)
        
        # Parse and extract 7-day data for backward compatibility
        try:
            import json
            parsed = json.loads(dual_projection) if isinstance(dual_projection, str) else dual_projection
            seven_day = parsed.get("sevenDay", {})
            
            # Convert to legacy format
            return json.dumps({
                "projectedScores": seven_day.get("projectedScores", {}),
                "rationalePerMetric": seven_day.get("rationalePerMetric", {}),
                "narrativeSummary": seven_day.get("narrativeSummary", "")
            })
        except Exception as e:
            print(f"Error parsing dual projection for legacy format: {e}")
            return dual_projection

    async def get_7_day_personalized_plan(self, orchestrator_output, quiz_insights, photo_insights, user_name=None):
        """Generate a personalized daily plan for each day of the first week using the LLM."""
        prompt = self._build_7_day_plan_prompt(orchestrator_output, quiz_insights, photo_insights, user_name)
        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert transformation coach specializing in highly personalized, actionable daily wellness plans. For each day, create a plan that is realistic, motivating, and tailored to the user's unique needs, struggles, and goals."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        plan_output = response.choices[0].message.content
        try:
            return json.loads(plan_output) if isinstance(plan_output, str) else plan_output
        except Exception as e:
            logging.error(f"[FutureSelfService] Error parsing 7-day plan output: {e}")
            return plan_output

    def _build_7_day_plan_prompt(self, orchestrator_output, quiz_insights, photo_insights, user_name=None):
        name_str = f" The user's name is {user_name}. Use it at least once during the week." if user_name else ""
        return f"""
        Given the following user data:
        - Orchestrator output: {orchestrator_output}
        - Quiz insights: {quiz_insights}
        - Photo insights: {photo_insights}
        {name_str}

        Generate a JSON array called 'dailyPlan' with 7 objects, each representing a personalized plan for one day of the first week. For each day, include:
        - 'day': The day number (1-7)
        - 'mainFocus': The main focus or theme for the day
        - 'actionableTasks': 2-4 specific, actionable tasks tailored to the user's needs and preferences
        - 'motivationalTip': A motivational tip or message
        - 'rationale': A brief rationale for why these actions are chosen for this user

        Make the plan feel like it was written just for this user, referencing their quiz and photo insights. Use vivid, personal language. The plan should be realistic, achievable, and inspiring. Output only the JSON object with the key 'dailyPlan'.
        """

    def _build_dual_projection_prompt(self, orchestrator_output, quiz_insights, photo_insights, user_name=None):
        name_str = f" Their name is {user_name}. Use it at least once in the letter." if user_name else ""
        return f"""
        You are an elite transformation architect. Your mission is to craft an inspiring, actionable, and scientifically-grounded roadmap for a user's transformation, focusing on generating profound and noticeable differences, especially within the first week. Leverage principles from top-tier wellness programs, bestselling self-help, and high-performance coaching to ensure every projection feels not just possible, but inevitable and deeply rewarding. Your output will guide another specialized LLM in creating daily and weekly plans.

        Here is a user's current wellness analysis based on comprehensive data:
        <orchestrator_output_start>
        {orchestrator_output}
        <orchestrator_output_end>

        Key quiz insights revealing their personal struggles, motivations, and preferences:
        <quiz_insights_start>
        {quiz_insights}
        <quiz_insights_end>

        Key photo insights providing visual cues and perceived areas for improvement:
        <photo_insights_start>
        {photo_insights}
        <photo_insights_end>

        ---

        **PROJECTION FRAMEWORKS:**

        **1. 7-DAY "IGNITION WEEK" (Rapid Momentum & Felt Difference)**
        This phase is about immediate, high-impact interventions that create a palpable shift in the user's well-being. The goal is for the user to *feel* the difference—more energetic, less bloated, clearer-headed, or visibly more vibrant—within days. This builds crucial early momentum and trust.

        * **Focus Areas:**
            * **Fundamental Biological Optimization:** Targeted hydration, light exposure, basic movement resets (e.g., posture breaks, short walks).
            * **Instant Calm & Focus:** Simple breathwork, short mindfulness anchors.
            * **Digestive Harmony:** Gentle dietary adjustments (e.g., increased fiber, mindful eating).
            * **Rejuvenating Sleep Rituals:** Establishing a consistent pre-sleep routine.
            * **Immediate Visual Brightening:** Basic skin hydration, posture awareness.
        * **Scoring Guidelines (7-day improvements):** 3-8 points per category. These are felt, not necessarily dramatic, but significant enough to be noticed.
            * Overall Glow Score: +4-12 points.

        **2. 30-DAY "DEEP DIVE TRANSFORMATION" (Sustainable Change & Visible Progress)**
        Building on the Ignition Week, this phase integrates deeper, more sustainable lifestyle shifts. The focus is on compounding habits, establishing routines, and creating visible, measurable changes across all dimensions of well-being.

        * **Focus Areas:**
            * **Metabolic & Nutritional Refinement:** Deeper dietary strategy, consistent meal timing.
            * **Progressive Physical Conditioning:** Structured exercise, improved strength/endurance.
            * **Advanced Stress Resilience:** Deeper mindfulness practices, emotional regulation techniques.
            * **Restorative Sleep Architecture:** Optimizing sleep environment, addressing sleep disruptions.
            * **Enhanced Radiance & Presence:** Advanced skin care integration, self-care rituals, confidence building.
        * **Scoring Guidelines (30-day improvements):** 8-20 points per category. These are substantial, visible, and enduring.
            * Overall Glow Score: +10-25 points.

        **ALL PROJECTED SCORES MUST BE BETWEEN 0 AND 100. NEVER EXCEED 100.**
        **IMPORTANT RULE:** For each projected score, add the specified increment to the current value, but if the result is greater than 100, set it to 100. For example, if the current score is 95 and the increment is +12, the projected score must be 100 (not 107). Never allow any projected score to be above 100, no matter what. Your projections should be highly motivational, but always grounded in realistic, achievable progress.

        ---

        **OUTPUT STRUCTURE:**

        Generate a JSON object with this exact schema:

        {{
          "sevenDay": {{
            "projectedScores": {{
              "overallGlowScore": <current + 4-12, max 100>,
              "physicalVitality": <current + 3-8, max 100>,
              "emotionalHealth": <current + 3-8, max 100>,
              "visualAppearance": <current + 3-8, max 100>
            }},
            "rationaleSummary": "A concise, compelling summary explaining *why* these initial gains are projected and how the user will feel them."
          }},
          "thirtyDay": {{
            "projectedScores": {{
              "overallGlowScore": <current + 10-25, max 100>,
              "physicalVitality": <current + 8-20, max 100>,
              "emotionalHealth": <current + 8-20, max 100>,
              "visualAppearance": <current + 8-20, max 100>
            }},
            "rationaleSummary": "A concise, inspiring summary explaining the deeper, compounding changes projected over 30 days and their visible impact."
          }},
          "weeklyBackbone": [
            {{
              "week": 1,
              "theme": "Ignition & Reset",
              "coreHabitFocus": ["Hydration Mastery", "Morning Light Exposure", "2-Minute Breathing Anchors"],
              "mindset": "Cultivating awareness of immediate sensations and celebrating small wins.",
              "progressiveElement": "Laying the physiological foundation and building instant momentum."
            }},
            {{
              "week": 2,
              "theme": "Energy & Flow Optimization",
              "coreHabitFocus": ["Consistent Sleep Schedule", "Mindful Movement Integration (e.g., 10-min walks)", "Nutrient-Dense Breakfast"],
              "mindset": "Understanding energy rhythms and building consistent, supportive routines.",
              "progressiveElement": "Translating initial momentum into sustainable daily energy."
            }},
            {{
              "week": 3,
              "theme": "Strength & Resilience Building",
              "coreHabitFocus": ["Structured Bodyweight Routine (3x/week)", "Emotional Regulation Practice (e.g., journaling)", "Strategic Protein Intake"],
              "mindset": "Embracing challenges as opportunities for growth; building inner and outer strength.",
              "progressiveElement": "Introducing more structured physical and mental challenges for adaptation."
            }},
            {{
              "week": 4,
              "theme": "Integration & Radiance",
              "coreHabitFocus": ["Advanced Hydration (e.g., electrolyte balance)", "Mind-Body Connection (e.g., stretching/yoga)", "Personalized Self-Care Ritual"],
              "mindset": "Consolidating new habits into a holistic lifestyle; celebrating visible and felt transformation.",
              "progressiveElement": "Solidifying habits, refining self-awareness, and maximizing overall glow."
            }}
          ],
          "messageFromFutureSelf": "Write a deeply personal message from the user's future self, 30 days ahead, directly to their present-day self who is just about to begin this journey. This is not a formal letter—it's a raw, honest, and intimate note from 'me' to 'me.'
            - Begin as if you are the same person, 30 days apart. Do NOT use formal greetings like 'Dear [Name]'. Instead, start with a direct, familiar line (e.g., 'Hey, it's me. 30 days from now.').
            - Briefly acknowledge the user's current state, feelings, or what led them to start, based on quiz_insights, photo_insights, and orchestrator_output.
            - Anticipate the emotional struggles, physical/visual insecurities, and transformation progress the user is likely to experience.
            - Reference 1-2 *very specific* moments, habits, or feelings the user will recognize or soon encounter. These should be different for each user, and should be drawn from their unique quiz_insights, photo_insights, and orchestrator_output. Do not always use the same example (such as "on Day 3 when you think about skipping that walk"); instead, vary the moments and habits based on the user's data, and randomize the day, activity, or challenge referenced.
            - Ensure that the specific moments, days, and habits referenced are not repeated across users, and are personalized and varied each time.
            - Use vivid, sensory, and personal language. Be warm, real, and a bit raw—like a private journal entry sent back in time, not generic motivation or over-coaching.
            - Emphasize the continuity of self: remind the user that 'I am you, just 30 days ahead', and that this transformation is already within them.
            - Use the user's name at least once.{name_str}
            - Be between 120 and 140 words.
            - End with a line that feels like a whisper through time, e.g., 'See you in 30 days', 'I'll be waiting for you', or 'We’re closer than you think.'"

        Ensure the 'rationaleSummary' for both 7-day and 30-day projections clearly articulates *how* the projected improvements will be felt or seen by the user, connecting them back to the initial insights. The 'messageFromFutureSelf' is critical – make it deeply resonant and personal based on *all* available data.
        """

    def save_future_projection(self, user_id, assessment_id, orchestrator_output, quiz_insights, photo_insights, projection_result):
        db = SessionLocal()
        projection = FutureProjection(
            user_id=user_id,
            assessment_id=assessment_id,
            orchestrator_output=orchestrator_output,
            quiz_insights=quiz_insights,
            photo_insights=photo_insights,
            projection_result=projection_result
        )
        db.add(projection)
        db.commit()
        db.refresh(projection)
        db.close()
        return projection 

    def save_daily_plan(self, user_id, assessment_id, plan_json, plan_type="7-day"):
        db = SessionLocal()
        daily_plan = DailyPlan(
            user_id=user_id,
            assessment_id=assessment_id,
            plan_type=plan_type,
            plan_json=plan_json
        )
        db.add(daily_plan)
        db.commit()
        db.refresh(daily_plan)
        db.close()
        return daily_plan 