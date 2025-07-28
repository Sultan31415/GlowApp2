from typing import Dict, Any, Optional, List
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
        
        # Extract rich user context for personalization
        user_context = quiz_insights.get("userContext", {}) if quiz_insights else {}
        current_lifestyle = user_context.get("currentLifestyle", {})
        strengths = user_context.get("strengths", [])
        challenges = user_context.get("challenges", [])
        
        # Build personalized context summary
        lifestyle_summary = self._build_lifestyle_summary(current_lifestyle)
        personalization_guidance = self._build_personalization_guidance(current_lifestyle, strengths, challenges)
        
        # CRITICAL: Extract specific user data for personalization
        user_specific_data = self._extract_user_specific_requirements(current_lifestyle)
        
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
        CRITICAL: You are creating a HIGHLY PERSONALIZED plan based on REAL user data. This is NOT generic advice.

        **USER'S CURRENT LIFESTYLE ANALYSIS:**
        {lifestyle_summary}

        **USER-SPECIFIC REQUIREMENTS (MANDATORY):**
        {user_specific_data}

        **PERSONALIZATION REQUIREMENTS:**
        {personalization_guidance}

        **USER'S STRENGTHS TO BUILD UPON:**
        {', '.join(strengths) if strengths else 'No specific strengths identified yet'}

        **USER'S CHALLENGES TO ADDRESS:**
        {', '.join(challenges) if challenges else 'General wellness improvement needed'}

        **ASSESSMENT DATA:**
        - Overall Glow Score: {orchestrator_output.get('overallGlowScore', 0)}
        - Physical Vitality: {orchestrator_output.get('adjustedCategoryScores', {}).get('physicalVitality', 0)}
        - Emotional Health: {orchestrator_output.get('adjustedCategoryScores', {}).get('emotionalHealth', 0)}
        - Visual Appearance: {orchestrator_output.get('adjustedCategoryScores', {}).get('visualAppearance', 0)}
        - Age: {orchestrator_output.get('chronologicalAge', 'Unknown')}
        - Archetype: {orchestrator_output.get('glowUpArchetype', {}).get('name', 'Unknown')}

        **PHOTO INSIGHTS (if available):**
        {json.dumps(photo_insights, indent=2) if photo_insights else 'No photo analysis available'}

        {name_str}

        {knowledge_summary}
        {backbone_str}
        {projected_scores_str}

        **CRITICAL PERSONALIZATION RULES (MANDATORY):**

        1. **RESPECT CURRENT CAPABILITIES**: 
           - If user already exercises 5+ times/week, don't suggest "start exercising" - suggest progression, variety, or skill development
           - If they sleep 7-9 hours, don't suggest "go to bed earlier" - suggest sleep quality optimization
           - If they have good nutrition, build on that with meal timing or supplementation
           - If they already walk 9 hours on weekends, don't suggest "take a 45-minute walk"

        2. **BUILD ON STRENGTHS**: 
           - If user has good nutrition, build on that
           - If they have good social connections, leverage that for motivation
           - If they have good energy, focus on optimization rather than basic improvements

        3. **ADDRESS SPECIFIC CHALLENGES**: 
           - If user struggles with stress management, focus on that
           - If they have poor sleep, prioritize sleep hygiene
           - If they have low energy, focus on energy optimization

        4. **PROGRESSIVE DIFFICULTY**: 
           - Start where they are and progress gradually
           - Don't suggest drastic changes
           - Consider their current schedule, energy levels, and lifestyle constraints

        5. **REALISTIC INTEGRATION**: 
           - Consider their current schedule, energy levels, and lifestyle constraints
           - Don't suggest activities that conflict with their existing routines
           - Respect their current commitments and time constraints

        **OUTPUT STRUCTURE:**
        {{
          'morningLaunchpad': [
            // 5-7 personalized morning actions based on their current sleep/wake patterns and energy levels
          ],
          'days': [
            {{
              'day': 1,
              'mainFocus': <personalized focus based on their specific challenges and strengths>,
              'systemBuilding': [
                {{
                  "trigger": <specific trigger based on their current routine>,
                  "action": <personalized action that builds on their current level>,
                  "reward": <meaningful reward for their specific situation>
                }}
              ],
              'deepFocus': <personalized focus session based on their energy patterns and current work/life situation>,
              'eveningReflection': <personalized reflection based on their emotional health needs>,
              'motivationalTip': <personalized motivation based on their specific challenges and archetype>
            }}
          ],
          'challenges': [
            {{
              'category': <chosen based on their specific needs>,
              'title': <personalized challenge title>,
              'description': <specific, actionable task tailored to their current level>,
              'estimatedTime': <realistic time based on their current lifestyle>,
              'rationale': <explanation of why this specific challenge benefits their unique situation>
            }}
          ]
        }}

        **EXAMPLES OF PERSONALIZATION:**
        - If user already exercises 5+ times/week: Suggest "Try a new workout style" or "Increase intensity" instead of "Start exercising"
        - If user sleeps 7-9 hours: Suggest "Optimize sleep quality" instead of "Get more sleep"
        - If user has poor stress management: Focus on stress-reduction techniques throughout the week
        - If user has good nutrition: Build on that with meal timing or supplementation
        - If user has low energy: Focus on energy optimization and gradual activity increases

        **REMEMBER**: This user has provided detailed information about their current lifestyle. Use that information to create a plan that feels like it was made specifically for them, not a generic template.

        Respond ONLY with a single valid JSON object. Do NOT include any explanation or text outside the JSON.
        """

    def _build_lifestyle_summary(self, current_lifestyle: Dict[str, Any]) -> str:
        """Build a comprehensive summary of the user's current lifestyle for personalization."""
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
        
        # Health indicators
        if "hydration" in current_lifestyle:
            hydration = current_lifestyle["hydration"]
            summary_parts.append(f"Hydration: {hydration['intake']} ({hydration['adequacy']})")
        
        if "bmi" in current_lifestyle:
            bmi = current_lifestyle["bmi"]
            summary_parts.append(f"BMI: {bmi['category']}")
        
        return "\n".join(summary_parts) if summary_parts else "Limited lifestyle data available"

    def _build_personalization_guidance(self, current_lifestyle: Dict[str, Any], strengths: List[str], challenges: List[str]) -> str:
        """Build specific guidance for personalizing the plan based on user data."""
        guidance_parts = []
        
        # Exercise guidance
        if "exercise" in current_lifestyle:
            exercise = current_lifestyle["exercise"]
            if exercise["intensity"] == "high":
                guidance_parts.append("User is already highly active - focus on variety, recovery, or skill development")
            elif exercise["intensity"] == "moderate":
                guidance_parts.append("User has moderate activity - suggest gradual progression and consistency")
            else:
                guidance_parts.append("User has low activity - start with gentle, accessible movements")
        
        # Sleep guidance
        if "sleep" in current_lifestyle:
            sleep = current_lifestyle["sleep"]
            if sleep["quality"] == "good":
                guidance_parts.append("User has good sleep habits - focus on optimization and consistency")
            else:
                guidance_parts.append("User needs sleep improvement - prioritize sleep hygiene and routine")
        
        # Stress guidance
        if "stressManagement" in current_lifestyle:
            stress = current_lifestyle["stressManagement"]
            if stress["score"] <= 3:
                guidance_parts.append("User struggles with stress - integrate stress management throughout the week")
            else:
                guidance_parts.append("User has good stress management - build on existing resilience")
        
        # Nutrition guidance
        if "nutrition" in current_lifestyle:
            nutrition = current_lifestyle["nutrition"]
            if nutrition["score"] >= 4:
                guidance_parts.append("User has good nutrition - focus on meal timing, supplementation, or variety")
            else:
                guidance_parts.append("User needs nutrition improvement - start with simple, sustainable changes")
        
        # Energy guidance
        if "energyLevel" in current_lifestyle:
            energy = current_lifestyle["energyLevel"]
            if energy["score"] <= 3:
                guidance_parts.append("User has low energy - prioritize energy optimization and gradual activity increases")
            else:
                guidance_parts.append("User has good energy - focus on maintaining and optimizing energy levels")
        
        return "\n".join(guidance_parts) if guidance_parts else "Focus on general wellness improvement" 

    def _extract_user_specific_requirements(self, current_lifestyle: Dict[str, Any]) -> str:
        """Extract specific user requirements based on their current lifestyle data."""
        requirements = []
        
        # Sleep patterns
        if "sleep" in current_lifestyle:
            sleep = current_lifestyle["sleep"]
            if sleep.get("hours") == "7-9 hours":
                requirements.append("User already gets adequate sleep - focus on sleep quality optimization, not duration")
            elif sleep.get("hours") == "5-6 hours":
                requirements.append("User gets limited sleep - prioritize sleep hygiene and gradual bedtime adjustment")
            elif sleep.get("hours") == "9+ hours":
                requirements.append("User gets plenty of sleep - focus on sleep quality and morning routine optimization")
        
        # Exercise patterns
        if "exercise" in current_lifestyle:
            exercise = current_lifestyle["exercise"]
            if exercise.get("frequency") == "5+ times per week":
                requirements.append("User is highly active - suggest variety, skill development, or recovery optimization")
            elif exercise.get("frequency") == "3-4 times per week":
                requirements.append("User has good exercise routine - suggest progression or new challenges")
            elif exercise.get("frequency") == "1-2 times per week":
                requirements.append("User has moderate activity - suggest gradual progression and consistency")
            elif exercise.get("frequency") == "Rarely or never":
                requirements.append("User has low activity - start with gentle, accessible movements")
        
        # Energy levels
        if "energyLevel" in current_lifestyle:
            energy = current_lifestyle["energyLevel"]
            if energy.get("score", 0) >= 4:
                requirements.append("User has good energy - focus on optimization and maintaining high performance")
            elif energy.get("score", 0) <= 2:
                requirements.append("User has low energy - prioritize energy optimization and gradual activity increases")
        
        # Stress management
        if "stressManagement" in current_lifestyle:
            stress = current_lifestyle["stressManagement"]
            if stress.get("score", 0) <= 3:
                requirements.append("User struggles with stress - integrate stress management throughout the week")
            else:
                requirements.append("User has good stress management - build on existing resilience")
        
        # Nutrition
        if "nutrition" in current_lifestyle:
            nutrition = current_lifestyle["nutrition"]
            if nutrition.get("score", 0) >= 4:
                requirements.append("User has good nutrition - focus on meal timing, supplementation, or variety")
            else:
                requirements.append("User needs nutrition improvement - start with simple, sustainable changes")
        
        # Social connections
        if "socialConnections" in current_lifestyle:
            social = current_lifestyle["socialConnections"]
            if social.get("score", 0) >= 4:
                requirements.append("User has strong social connections - leverage for motivation and accountability")
            else:
                requirements.append("User needs social connection improvement - focus on building relationships")
        
        # Physical symptoms
        if "physicalSymptoms" in current_lifestyle:
            symptoms = current_lifestyle["physicalSymptoms"]
            if symptoms.get("score", 0) <= 3:
                requirements.append("User experiences physical symptoms - prioritize recovery and gentle movement")
        
        # BMI considerations
        if "bmi" in current_lifestyle:
            bmi = current_lifestyle["bmi"]
            if bmi.get("category") in ["overweight", "obese"]:
                requirements.append("User has weight concerns - focus on sustainable lifestyle changes, not crash diets")
            elif bmi.get("category") == "underweight":
                requirements.append("User is underweight - focus on healthy weight gain and nutrition")
        
        # Alcohol consumption
        if "alcoholConsumption" in current_lifestyle:
            alcohol = current_lifestyle["alcoholConsumption"]
            if alcohol.get("risk") == "high":
                requirements.append("User has high alcohol consumption - focus on harm reduction and healthy alternatives")
        
        return "\n".join(requirements) if requirements else "Focus on general wellness improvement based on assessment scores" 