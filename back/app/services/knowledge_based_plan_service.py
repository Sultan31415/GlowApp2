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
            self.model = settings.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME
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
                {"role": "system", "content": "You are an expert transformation coach specializing in highly personalized, actionable daily wellness plans. For each day, create a plan that is realistic, motivating, and tailored to the user's unique needs, struggles, and goals. Ground your plan in the principles from Atomic Habits, Miracle Morning, and Deep Work."},
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
                return json.loads(plan_json)
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
        IMPORTANT: Respond ONLY with a valid JSON array of 7 objects (one for each day, in order from Day 1 to Day 7). Do NOT include any explanations, comments, or text outside the JSON. The response must be a single valid JSON array that can be parsed directly.

        Given the following user data:
        - Orchestrator output: {orchestrator_output}
        - Quiz insights: {quiz_insights}
        - Photo insights: {photo_insights}
        {name_str}

        {knowledge_summary}
        {backbone_str}
        {projected_scores_str}

        Your task: Create a 7-day plan that will help this user build truly life-changing habits and routines, not just generic tasks.
        - Each day should use the following four-layer structure:
          1. Morning Launchpad (Miracle Morning): A short, intentional routine to start the day with clarity and energy. Use S.A.V.E.R.S. practices and personalize to the user's needs.
          2. System Building (Atomic Habits): 1-2 small, specific habits to build or replace, using habit stacking, the 2-minute rule, and identity-based habits. Specify trigger/cue, action, and reward for each.
          3. Deep Focus (Deep Work): A block of time for focused, meaningful work or self-improvement, free from distractions. Personalize the focus area to the user's goals or struggles.
          4. Evening Reflection: A short review or journaling task to reinforce progress and identity, celebrate wins, and plan for tomorrow.
        - Each day's plan should be unique, progressive, and build toward a real routine by week's end.
        - Use the user's quiz and photo insights, the weekly backbone, and the knowledge base to personalize every section.
        - Avoid generic or repetitive tasks. Make the plan feel like it was written by a world-class coach for this user.
        - Each day's plan should take 30-90 minutes total, with at least one habit that, if continued, will change the user's life.

        For each day, output an object with:
        - 'day': The day number (1-7)
        - 'mainFocus': The main focus or theme for the day (should align with the backbone)
        - 'morningLaunchpad': A personalized morning routine (Miracle Morning)
        - 'systemBuilding': 1-2 specific, actionable, and progressive habits (Atomic Habits, with trigger, action, reward)
        - 'deepFocus': A focused work/self-improvement block (Deep Work)
        - 'eveningReflection': A review or journaling/reflection task
        - 'motivationalTip': A motivational tip or message
        - 'rationale': A brief rationale for why these habits/routines are chosen for this user, referencing the knowledge base, the backbone, and the user's unique data

        Make the plan feel like it was written just for this user, referencing their quiz and photo insights, the backbone, and the projected scores. Use vivid, personal language. The plan should be realistic, achievable, and inspiring, but also substantial and meaningful.

        AGAIN: Respond ONLY with a single valid JSON array of 7 objects (one for each day, in order from Day 1 to Day 7). Do NOT include any explanations, comments, or text outside the JSON.
        """ 