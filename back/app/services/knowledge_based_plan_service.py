from typing import Dict, Any, Optional
import openai
from app.config.settings import settings
from app.services.ai_knowledge_base import ATOMIC_HABITS_PRINCIPLES, MIRACLE_MORNING_PRINCIPLES, DEEP_WORK_PRINCIPLES
import json
import logging
import re

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
            # self.model = settings.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME
            self.model = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
            print(f"[KnowledgeBasedPlanService] Using Azure OpenAI with deployment: {self.model}")
        else:
            self.llm_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o"
            print(f"[KnowledgeBasedPlanService] Using OpenAI with model: {self.model}")

    async def generate_7_day_plan(self, orchestrator_output: Dict[str, Any], quiz_insights: Dict[str, Any], photo_insights: Dict[str, Any], user_name: str = None, backbone: Optional[Any] = None, projected_scores: Optional[Any] = None) -> Dict[str, Any]:
        """Generate a highly personal, systemic 7-day plan grounded in the knowledge base principles, using the backbone and projected scores as targets."""
        prompt = self._build_7_day_plan_prompt(orchestrator_output, quiz_insights, photo_insights, user_name, backbone, projected_scores)
        response = await self.llm_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert transformation coach specializing in highly personalized, actionable daily wellness plans. For each week, create a plan that is realistic, motivating, and tailored to the user's unique needs, struggles, and goals. Ground your plan in the principles from Atomic Habits, Miracle Morning, and Deep Work."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        try:
            plan_json = response.choices[0].message.content.strip()
            print("\n" + "="*80)
            print("📅 RAW 7-DAY PLAN LLM OUTPUT:")
            print(plan_json)
            print("="*80 + "\n")
            try:
                plan = json.loads(plan_json)
                # Validate new structure: must have morningLaunchpad, deepFocus, days (list of 7)
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

    def _build_7_day_plan_prompt(self, orchestrator_output, quiz_insights, photo_insights, user_name=None, backbone=None, projected_scores=None):
        name_str = f" The user's name is {user_name}. Use it at least once during the week." if user_name else ""
        # Summarize key principles from the knowledge base
        knowledge_summary = f"""
        Here are key principles from top self-improvement books to guide your plan:
        - Atomic Habits: {ATOMIC_HABITS_PRINCIPLES['core_concept']} Key ideas: {', '.join(ATOMIC_HABITS_PRINCIPLES['key_ideas'])}
        - Miracle Morning: {MIRACLE_MORNING_PRINCIPLES['core_concept']} Key ideas: {', '.join(MIRACLE_MORNING_PRINCIPLES['key_ideas'])}
        - Deep Work: {DEEP_WORK_PRINCIPLES['core_concept']} Key ideas: {', '.join(DEEP_WORK_PRINCIPLES['key_ideas'])}
        """
        backbone_str = f"\nHere is the weekly backbone (themes, focus areas, rationale) for each week: {json.dumps(backbone, ensure_ascii=False, indent=2)}" if backbone else ""
        projected_scores_str = f"\nHere are the user's projected scores for 7 and 30 days: {json.dumps(projected_scores, ensure_ascii=False, indent=2)}" if projected_scores else ""
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

        Given the following user data:
        - Orchestrator output: {orchestrator_output}
        - Quiz insights: {quiz_insights}
        - Photo insights: {photo_insights}
        {name_str}

        {knowledge_summary}
        {backbone_str}
        {projected_scores_str}

        Your task:

        1. Create ONE morning routine (Miracle Morning) for the entire week — a list of 5-7 short, trackable actions like ["Wake up", "Drink water", "Stretch", ...], personalized to the user's context.

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

        3. Create exactly 2 or 3 weekly challenges under the "challenges" section. Prioritize the most relevant categories based on the user’s needs, quiz insights, and photo insights. Choose the types of challenges that would most benefit the user's emotional, physical, or mental state this week.
            - Each challenge should fall into one of these categories: Learning, Leisure, Physical, Social, Mindfulness, Creative
            - Each challenge must be:
                - actionable (e.g. “Visit a new place and take 3 photos”)
                - clearly described
                - doable within the week
                - engaging and slightly outside of user's current routine
            - Include a brief rationale for each challenge

        Do NOT include all categories (Learning, Leisure, Social, etc.). Pick only a few that feel the most important for this user's current situation. This makes the plan more focused and less overwhelming.

        AGAIN: Respond ONLY with a single valid JSON object. Do NOT include any explanation or text outside the JSON.
        """ 