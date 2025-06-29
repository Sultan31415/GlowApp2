import google.generativeai as genai
import openai
import json
import traceback
import re
from typing import Dict, List, Any, Optional, TypedDict
from fastapi import HTTPException
from langgraph.graph import StateGraph, END

from app.models.schemas import QuizAnswer
from app.config.settings import settings
from app.data.quiz_data import quiz_data
from app.services.photo_analyzer import PhotoAnalyzerGPT4o
from app.services.quiz_analyzer import QuizAnalyzerGemini
from app.services.langgraph_pipeline import build_analysis_graph


class AnalysisState(TypedDict, total=False):
    """Shared state passed between LangGraph nodes for AI analysis."""
    answers: List[QuizAnswer]
    base_scores: Dict[str, float]
    additional_data: Dict[str, Any]
    photo_url: Optional[str]
    photo_insights: Optional[Dict[str, Any]]
    quiz_insights: Optional[Dict[str, Any]]
    ai_analysis: Optional[Dict[str, Any]]

class AIService:
    """Service for orchestrating multi-agent AI analysis using multiple LLMs optimized for different tasks."""

    def __init__(self):
        """Initialize AI services with optimized model selection for each task."""
        # Quiz Analysis: Gemini (optimized for cultural context)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Orchestrator: GPT-4o Mini (optimized for synthesis and JSON reliability)
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.orchestrator_client = openai.AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.orchestrator_model = settings.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME
            self.use_azure_orchestrator = True
            print(f"[AIService] Using Azure OpenAI GPT-4o Mini for orchestration: {self.orchestrator_model}")
        else:
            self.orchestrator_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            self.orchestrator_model = "gpt-4o-mini"
            self.use_azure_orchestrator = False
            print(f"[AIService] Using OpenAI GPT-4o Mini for orchestration")
        
        # Fallback: Keep Gemini for backup orchestration
        self.gemini_orchestrator = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config=genai.types.GenerationConfig()
        )
        
        # Initialize other services
        self.photo_analyzer = PhotoAnalyzerGPT4o()
        self.quiz_analyzer = QuizAnalyzerGemini()
        self.question_map = self._build_question_map(quiz_data)
        self._graph = build_analysis_graph(self, self.question_map)

    def _build_question_map(self, q_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Builds a map from question ID to its full question details for quick lookup."""
        q_map = {}
        for section in q_data:
            for question in section['questions']:
                q_map[question['id']] = question
        return q_map

    async def orchestrate_analysis_gpt4o_mini(self, quiz_insights: Optional[Dict[str, Any]], photo_insights: Optional[Dict[str, Any]], state: Dict[str, Any]) -> Dict[str, Any]:
        """
        ULTRA-FAST: GPT-4o Mini orchestration with speed optimizations.
        Expected 70% faster than previous version.
        """
        try:
            from app.services.prompt_optimizer import PromptOptimizer
            
            # Extract key data for optimized prompt
            age = state.get('additional_data', {}).get('chronologicalAge', 30)
            country = state.get('additional_data', {}).get('countryOfResidence', 'Global')
            base_scores = state.get('base_scores', {})
            
            # Use optimized prompt
            prompt = PromptOptimizer.build_fast_orchestrator_prompt(
                quiz_insights, photo_insights, age, country, base_scores
            )
            
            response = await self.orchestrator_client.chat.completions.create(
                model=self.orchestrator_model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a wellness synthesizer. Combine insights quickly. Return JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.05,  # Maximum speed
                max_tokens=400,    # Maximum speed
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from GPT-4o Mini orchestrator")
            
            print(f"Raw GPT-4o Mini orchestrator response: {content}")
            return json.loads(content)
            
        except Exception as e:
            print(f"GPT-4o Mini orchestrator error: {e}")
            # Fallback to Gemini orchestrator
            print("Falling back to Gemini orchestrator...")
            return await self._fallback_gemini_orchestration(quiz_insights, photo_insights, state)

    async def _fallback_gemini_orchestration(self, quiz_insights: Optional[Dict[str, Any]], photo_insights: Optional[Dict[str, Any]], state: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback orchestration using Gemini if GPT-4o Mini fails."""
        try:
            prompt = self._build_orchestrator_prompt(quiz_insights, photo_insights)
            generation_config = genai.types.GenerationConfig(temperature=0.3, max_output_tokens=2000)
            response = self.gemini_orchestrator.generate_content([prompt], generation_config=generation_config)
            return self._parse_ai_response(response.text)
        except Exception as e:
            print(f"Fallback Gemini orchestrator also failed: {e}")
            raise HTTPException(status_code=500, detail="All orchestrator models failed")

    def get_ai_analysis(
        self, 
        answers: List[QuizAnswer], 
        base_scores: Dict[str, float], 
        additional_data: Dict[str, Any],
        photo_url: Optional[str]
    ) -> Dict[str, Any]:
        """Orchestrate multi-agent analysis: quiz, photo, and holistic synthesis using PARALLEL LangGraph processing."""
        import time
        start_time = time.time()
        
        try:
            print(f"[AI Service] 🚀 Starting PARALLEL LangGraph analysis pipeline...")
            initial_state: AnalysisState = {
                "answers": answers,
                "base_scores": base_scores,
                "additional_data": additional_data,
                "photo_url": photo_url,
            }
            final_state = self._graph.invoke(initial_state)
            
            total_time = time.time() - start_time
            print(f"[AI Service] ✅ PARALLEL LangGraph pipeline completed in {total_time:.2f}s")
            
            # FIXED: Handle both sync (ai_analysis) and async (final_analysis) pipeline results
            ai_analysis = final_state.get("ai_analysis") or final_state.get("final_analysis")
            
            if final_state and ai_analysis is not None:
                # Use the latest state for all required fields
                return self._format_response(
                    ai_analysis,
                    final_state.get("base_scores", base_scores),
                    final_state.get("additional_data", {}).get("chronologicalAge"),
                    final_state.get("photo_url", photo_url),
                    final_state.get("photo_insights"),
                    final_state.get("quiz_insights")
                )
            else:
                print(f"[AI Service] ❌ LangGraph final state keys: {list(final_state.keys()) if final_state else 'None'}")
                raise HTTPException(status_code=500, detail="AI analysis failed: No final response from LangGraph.")
        except Exception as e:
            print(f"Error in get_ai_analysis (LangGraph): {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    def _build_orchestrator_prompt(self, quiz_insights: Optional[Dict[str, Any]], photo_insights: Optional[Dict[str, Any]]) -> str:
        quiz_str = json.dumps(quiz_insights, indent=2) if quiz_insights else "No quiz insights available."
        photo_str = json.dumps(photo_insights, indent=2) if photo_insights else "No photo insights available."
        
        chronological_age = "null"
        if quiz_insights and 'chronologicalAge' in quiz_insights:
            chronological_age = quiz_insights['chronologicalAge']

        # Extract country-adjusted scores from the quiz analysis to use as a baseline for the final synthesis
        adjusted_scores_str = "No adjusted scores available from quiz."
        if quiz_insights and 'adjustedScores' in quiz_insights:
            adjusted_scores_str = json.dumps(quiz_insights['adjustedScores'], indent=2)

        return f"""
        You are the final expert wellness synthesizer. Your task is to create a holistic, final analysis by integrating three sources of information:
        1. A detailed analysis of a user's photo.
        2. A comprehensive analysis of their quiz answers, which has already been adjusted for their country of residence.
        3. The country-adjusted wellness scores derived from the quiz.

        --- Photo Analysis (JSON) ---
        {photo_str}

        --- Quiz & Health Data Analysis (JSON, already country-adjusted) ---
        {quiz_str}

        --- Country-Adjusted Wellness Scores (from Quiz Analysis) ---
        {adjusted_scores_str}

        Your output MUST be a single, complete JSON object. Do not include any text before or after the JSON.

        --- Final Synthesis Instructions ---
        Based on all the provided data, generate a final JSON object with the following schema. You must now perform the final score adjustment.

        1.  **Start with the `Country-Adjusted Wellness Scores`**. These are your new baseline.
        2.  **Critically evaluate the `visualAppearance` score.** The photo analysis is the most important factor for this score. You MUST adjust the `visualAppearance` score from the quiz analysis based on the detailed findings in the `photo_insights`. For example, if the photo shows clear, healthy skin, the score should increase. If it shows signs of stress or poor health, it should decrease significantly.
        3.  The `physicalVitality` and `emotionalHealth` scores should be taken directly from the `Country-Adjusted Wellness Scores` unless the photo provides an exceptionally strong and direct contradiction.

        Generate a JSON object with the following schema:
        {{
          "overallGlowScore": <number, 0-100. Holistically assess and combine all insights. This should be a weighted average of the final adjustedCategoryScores. Justify in the analysisSummary.>,
          "adjustedCategoryScores": {{
              "physicalVitality": <number, from country-adjusted scores, with minimal changes unless photo strongly contradicts>,
              "emotionalHealth": <number, from country-adjusted scores, with minimal changes unless photo strongly contradicts>,
              "visualAppearance": <number, **This is the critical adjustment**. Start with the country-adjusted score and significantly modify it based on the photo analysis.>
          }},
          "biologicalAge": <number, estimate based on all available data. Use photo 'estimatedAgeRange' as a primary visual cue and quiz 'keyRisks' (e.g., smoking, diet) to adjust. Justify in the analysisSummary.>,
          "emotionalAge": <number, estimate primarily based on quiz 'keyStrengths' and 'keyRisks' related to emotional health. Justify in the analysisSummary.>,
          "chronologicalAge": {chronological_age},
          "glowUpArchetype": {{
            "name": "<string, create an inspiring archetype name that reflects the user's integrated profile (e.g., 'The Resilient Artist', 'The Mindful Innovator')>",
            "description": "<string, 150-250 words. A detailed, empathetic description synthesizing insights from both the photo (e.g., 'a thoughtful expression') and the quiz (e.g., 'a strong sense of community').>"
          }},
          "microHabits": [
            "<1. Specific, Actionable Habit: Connect this directly to a specific finding, e.g., 'To address the observed skin dullness (from photo) and reported low energy (from quiz), try...'>",
            "<2. Specific, Actionable Habit: (as above)>",
            "<3. Specific, Actionable Habit: (as above)>",
            "<4. Specific, Actionable Habit: (as above)>",
            "<5. Specific, Actionable Habit: (as above)>"
          ],
          "analysisSummary": "<string, 200-400 words. A comprehensive narrative. Start by explaining the overallGlowScore and age estimates, explicitly referencing both photo and quiz insights (e.g., 'Your score reflects your strong emotional resilience noted in the quiz, balanced with visual signs of stress around the eyes from the photo.'). Explain the final score adjustments. End with an empowering message.>",
          "detailedInsightsPerCategory": {{
            "physicalVitalityInsights": [
                "<string, Synthesize findings. Example: 'The quiz indicated a risk related to cardiovascular health, which is not visually apparent in the photo, suggesting a hidden risk to address.'>"
            ],
            "emotionalHealthInsights": [
                "<string, Synthesize findings. Example: 'Your quiz answers show high emotional awareness, and your facial expression in the photo appears calm and composed, suggesting a strong alignment.'>"
            ],
            "visualAppearanceInsights": [
                "<string, Synthesize findings. Example: 'The photo analysis noted some skin redness, and your quiz answers about diet might suggest a link to inflammatory foods. This informed the final adjustment to your visual appearance score.'>"
            ]
          }}
        }}
        """

    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response, expecting a clean JSON string.
        """
        try:
            print(f"Raw AIService LLM response: {response_text}")
            # Gemini with response_mime_type="application/json" should return clean JSON
            return json.loads(response_text)
        except json.JSONDecodeError:
            print(f"Warning: Failed to parse clean JSON, attempting to extract from markdown. Raw text: {response_text}")
            # Fallback for cases where JSON is still wrapped in markdown
            match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if match:
                json_str = match.group(1)
                return json.loads(json_str)
            raise ValueError("AI response was not valid JSON.")

    def _format_response(
        self, 
        ai_analysis: Dict[str, Any], 
        base_scores: Dict[str, float], 
        chronological_age: Optional[int],
        photo_url: Optional[str],
        photo_insights: Optional[Dict[str, Any]] = None,
        quiz_insights: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Format the final response, including all new AI analysis fields."""
        final_chronological_age = chronological_age if chronological_age is not None else ai_analysis.get("chronologicalAge")

        # Ensure archetype is a dictionary
        archetype = ai_analysis.get("glowUpArchetype", {})
        if not isinstance(archetype, dict):
            archetype = {"name": "Unknown", "description": "No archetype provided."}

        return {
            "overallGlowScore": ai_analysis.get("overallGlowScore", 0),
            "categoryScores": ai_analysis.get("adjustedCategoryScores", ai_analysis.get("categoryScores", base_scores)),
            "biologicalAge": ai_analysis.get("biologicalAge", final_chronological_age),
            "emotionalAge": ai_analysis.get("emotionalAge", final_chronological_age),
            "chronologicalAge": final_chronological_age,
            "glowUpArchetype": archetype,
            "microHabits": ai_analysis.get("microHabits", []),
            "analysisSummary": ai_analysis.get("analysisSummary", "A comprehensive summary will be provided after AI analysis."),
            "detailedInsightsPerCategory": ai_analysis.get("detailedInsightsPerCategory", {}),
            "avatarUrls": {
                "before": photo_url if photo_url else settings.DEFAULT_AVATAR_BEFORE,
                "after": settings.DEFAULT_AVATAR_AFTER
            },
            "photoInsights": photo_insights,
            "quizInsights": quiz_insights
        }

    # ------------------------- LangGraph integration -------------------------
    def _setup_graph(self):
        """Compile the LangGraph workflow for the AI analysis pipeline."""
        def photo_node(state: "AnalysisState") -> Dict[str, Any]:
            photo_url = state.get("photo_url")
            insights = self.photo_analyzer.analyze_photo(photo_url) if photo_url else None
            return {"photo_insights": insights}

        def quiz_node(state: "AnalysisState") -> Dict[str, Any]:
            insights = self.quiz_analyzer.analyze_quiz(
                state["answers"],
                state["base_scores"],
                state["additional_data"],
                self.question_map,
            )
            return {"quiz_insights": insights}

        def orchestrator_node(state: "AnalysisState") -> Dict[str, Any]:
            prompt = self._build_orchestrator_prompt(state.get("quiz_insights"), state.get("photo_insights"))
            generation_config = genai.types.GenerationConfig()
            response = self.orchestrator.generate_content([prompt], generation_config=generation_config)
            print(f"Raw Orchestrator LLM response: {response.text}")
            ai_analysis = self._parse_ai_response(response.text)

            final_json = self._format_response(
                ai_analysis,
                state["base_scores"],
                state["additional_data"].get("chronologicalAge"),
                state.get("photo_url"),
                state.get("photo_insights"),
                state.get("quiz_insights"),
            )
            return {"ai_analysis": final_json}

        builder = StateGraph(AnalysisState)
        builder.add_node("photo", photo_node)
        builder.add_node("quiz", quiz_node)
        builder.add_node("orchestrator", orchestrator_node)
        builder.add_edge("photo", "quiz")
        builder.add_edge("quiz", "orchestrator")
        builder.set_entry_point("photo")
        self._graph = builder.compile()
    # ---------------------------------------------------------------------------

    async def generate_async(self, prompt: str) -> str:
        """
        OPTIMIZED: Async method for orchestrator generation.
        Used by optimized async nodes for faster processing.
        """
        try:
            # Optimized generation config for faster processing
            generation_config = genai.types.GenerationConfig(
                temperature=0.3,  # Lower for faster, more consistent results
                top_p=0.8,
                candidate_count=1,
                max_output_tokens=800  # Reduced for faster response
            )
            
            # Use asyncio to run the sync method in a thread pool since Gemini doesn't have native async
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.orchestrator.generate_content([prompt], generation_config=generation_config)
            )
            return response.text
            
        except Exception as e:
            print(f"Orchestrator async generation error: {e}")
            raise e