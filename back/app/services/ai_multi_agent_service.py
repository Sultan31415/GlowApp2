import base64
import json
import re
import os
import tempfile
import traceback
from typing import TypedDict, List, Any, Dict, Optional, Annotated

import google.generativeai as genai
from fastapi import HTTPException
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
# Import for structured output
from langchain_core.output_parsers import JsonOutputParser

from app.config.settings import settings
from app.data.quiz_data import quiz_data
from app.models.schemas import QuizAnswer
from app.services.scoring_service import ScoringService
from langgraph.graph import StateGraph, END

# --- 1. State Definition ---
# Use more specific types for parsed JSON outputs
class AgentState(TypedDict):
    """Represents the state of our multi-agent graph."""
    answers: List[QuizAnswer]
    base_scores: Dict[str, float]
    additional_data: Dict[str, Any]
    photo_url: Optional[str]
    
    # Agent outputs - now as parsed dictionaries
    quiz_analysis: Optional[Dict[str, Any]] # Parsed dict from Quiz Analyzer
    photo_analysis: Optional[Dict[str, Any]] # Parsed dict from Photo Analyzer
    
    # Final output
    final_report: Dict[str, Any]

# --- Helper for Photo Processing (Utility function) ---
def _process_photo_for_langchain(photo_url: str) -> Dict[str, Any]:
    # Ensure photo_url is base64 encoded
    if photo_url.startswith("data:"):
        header, encoded = photo_url.split(',', 1)
        mime_type = header.split(':')[1].split(';')[0]
        return {"type": "image_url", "image_url": {"url": photo_url, "mime_type": mime_type}}
    else:
        # Assuming it's a direct URL if not data URI
        return {"type": "image_url", "image_url": {"url": photo_url}}

# --- 2. Service and Agent Definitions ---

class AIMultiAgentService:
    """Orchestrates AI analysis using a LangGraph multi-agent system."""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Using JsonOutputParser can simplify output formatting for the LLM
        self.model = ChatGoogleGenerativeAI(model=settings.GEMINI_MODEL, temperature=0.7, google_api_key=settings.GEMINI_API_KEY)
        # Use the same Gemini Flash model for both text and vision; assumes the model supports image input
        self.vision_model = ChatGoogleGenerativeAI(model=settings.GEMINI_MODEL, temperature=0.4, google_api_key=settings.GEMINI_API_KEY)
        self.question_map = self._build_question_map(quiz_data)
        self.graph = self._build_agent_graph()

    def _build_question_map(self, q_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        q_map = {}
        for section in q_data:
            for question in section['questions']:
                q_map[question['id']] = question
        return q_map

    # --- Helper Builders (ported from legacy AIService) ---
    # These are general utility methods, not agent nodes
    def _compose_user_profile(self, additional_data: Dict[str, Any]) -> str:
        lines = [
            f"Chronological Age: {additional_data.get('chronologicalAge', 'Not provided')} years",
            f"Biological Sex: {additional_data.get('biologicalSex', 'Not provided').replace('-', ' ').title()}",
            f"Country of Primary Residence (past 10 years): {additional_data.get('countryOfResidence', 'Not provided')}"
        ]
        return "\n".join(lines)

    def _compose_health_metrics(self, additional_data: Dict[str, Any]) -> str:
        h_lines = []
        if additional_data.get('bmi'): h_lines.append(f"- BMI Status: {additional_data['bmi'].replace('-', ' ').title()}")
        if additional_data.get('bloodPressure'): h_lines.append(f"- Blood Pressure: {additional_data['bloodPressure'].replace('-', ' ').title()}")
        if additional_data.get('restingHeartRate'): h_lines.append(f"- Resting Heart Rate: {additional_data['restingHeartRate'].replace('-', ' ').title()}")
        if additional_data.get('cvdHistory'): h_lines.append(f"- Cardiovascular Disease History: {additional_data['cvdHistory'].replace('-', ' ').title()}")
        return "\nAdditional Health Metrics:\n" + "\n".join(h_lines) if h_lines else ""

    # --- Agent Nodes ---

    def run_quiz_analyzer(self, state: AgentState) -> Dict[str, Any]:
        """Analyzes quiz answers to generate detailed category-specific insights."""
        print("--- Running Quiz Analyzer Agent ---")
        answers = state['answers']
        base_scores = state['base_scores']
        additional_data = state['additional_data']
        
        prompt = self._build_quiz_analyzer_prompt(answers, base_scores, additional_data)
        
        # NOTE: Previously attempted to instantiate JsonOutputParser with a typing.Dict, which
        # is invalid because it expects a Pydantic BaseModel class. For now, rely on
        # strict prompt design and manual JSON parsing; remove the unused parser.
        
        try:
            # Use .with_structured_output if you have a Pydantic model for output
            # For simpler dict output, rely on strict prompting and JsonOutputParser
            response = self.model.with_config({"run_name": "Quiz Analyzer"}).invoke(prompt)
            
            # Manually parse the JSON content here before storing in state
            parsed_content = self._parse_json_content(response.content, "Quiz Analyzer")
            
            # Ensure the structure matches what fusion expects, or default
            if "physicalVitalityInsights" not in parsed_content:
                parsed_content = {
                    "physicalVitalityInsights": parsed_content.get("physicalVitalityInsights", []),
                    "emotionalHealthInsights": parsed_content.get("emotionalHealthInsights", []),
                    "visualAppearanceInsights": parsed_content.get("visualAppearanceInsights", [])
                }

            print(f"Quiz Analyzer Parsed Response: {json.dumps(parsed_content, indent=2)}")
            return {"quiz_analysis": parsed_content}
        except Exception as e:
            print(f"Error in Quiz Analyzer: {traceback.format_exc()}")
            # Return a default error structure that downstream agents can handle
            return {"quiz_analysis": {
                "error": "Failed to analyze quiz data.",
                "physicalVitalityInsights": [],
                "emotionalHealthInsights": [],
                "visualAppearanceInsights": []
            }}

    def run_photo_analyzer(self, state: AgentState) -> Dict[str, Any]:
        """Analyzes the user's photo for visual age and wellness indicators."""
        print("--- Running Photo Analyzer Agent ---")
        photo_url = state['photo_url']
        if not photo_url:
            return {"photo_analysis": {"age_estimation": None, "observations": "No photo provided."}}

        prompt = self._build_photo_analyzer_prompt()
        
        try:
            image_message_content = _process_photo_for_langchain(photo_url)
            message = HumanMessage(content=[{"type": "text", "text": prompt}, image_message_content])
            
            response = self.vision_model.with_config({"run_name": "Photo Analyzer"}).invoke([message])
            
            # Manually parse the JSON content here
            parsed_content = self._parse_json_content(response.content, "Photo Analyzer")
            print(f"Photo Analyzer Parsed Response: {json.dumps(parsed_content, indent=2)}")
            return {"photo_analysis": parsed_content}
        except Exception as e:
            print(f"Error in Photo Analyzer: {traceback.format_exc()}")
            return {"photo_analysis": {"error": "Failed to process photo.", "age_estimation": None, "observations": ""}}

    def run_fusion_agent(self, state: AgentState) -> Dict[str, Any]:
        """Synthesizes all analyses into a final, comprehensive report."""
        print("--- Running Fusion Agent ---")
        # Ensure that quiz_analysis and photo_analysis are parsed dicts
        quiz_analysis = state.get('quiz_analysis', {})
        photo_analysis = state.get('photo_analysis', {})
        base_scores = state['base_scores']
        additional_data = state['additional_data']
        
        prompt = self._build_fusion_prompt(base_scores, quiz_analysis, photo_analysis, additional_data)
        
        try:
            response = self.model.with_config({"run_name": "Fusion Agent"}).invoke(prompt)
            print(f"Fusion Agent Raw Response: {response.content[:500]}...")
            
            final_report_raw = self._parse_json_content(response.content, "Fusion Agent")
            
            # Format the final response, which includes merging the detailed insights
            formatted_report = self._format_final_response(final_report_raw, base_scores, additional_data, state['photo_url'], quiz_analysis)
            return {"final_report": formatted_report}
        except Exception as e:
            print(f"Error in Fusion Agent: {traceback.format_exc()}")
            return {"final_report": {"error": "Failed to generate final report."}}

    # --- Graph Definition ---

    def _decide_to_run_photo_agent(self, state: AgentState) -> str:
        """Determines the next step based on whether a photo was provided."""
        print("--- Decision: Analyze Photo? ---")
        if state.get('photo_url'):
            print("Outcome: Yes, photo provided. -> photo_analyzer")
            return "photo_analyzer"
        else:
            print("Outcome: No, skipping photo analysis. -> fusion_agent")
            # If no photo, provide a default structure for photo_analysis in the state
            # This ensures fusion_agent always has a photo_analysis dict to work with
            state['photo_analysis'] = {"age_estimation": None, "observations": "No photo provided."}
            return "fusion_agent"

    def _build_agent_graph(self) -> StateGraph:
        """Builds the LangGraph agent graph."""
        graph = StateGraph(AgentState)

        graph.add_node("quiz_analyzer", self.run_quiz_analyzer)
        graph.add_node("photo_analyzer", self.run_photo_analyzer)
        graph.add_node("fusion_agent", self.run_fusion_agent)

        graph.set_entry_point("quiz_analyzer")

        graph.add_conditional_edges(
            "quiz_analyzer",
            self._decide_to_run_photo_agent,
            {
                "photo_analyzer": "photo_analyzer",
                "fusion_agent": "fusion_agent"
            }
        )

        graph.add_edge("photo_analyzer", "fusion_agent")
        graph.add_edge("fusion_agent", END)

        return graph.compile()

    # --- Main Service Method ---

    def get_ai_analysis(
            self,
            answers: List[QuizAnswer],
            photo_url: Optional[str],
            *,
            base_scores: Optional[Dict[str, float]] = None,
            additional_data: Optional[Dict[str, Any]] = None,
        ) -> Dict[str, Any]:
        """Main entry point to run the multi-agent analysis."""
        print("--- Starting Multi-Agent AI Analysis ---")
        try:
            # 1. Prepare base scores and additional data. Allow callers (e.g., REST endpoint)
            #    to pre-compute these values for efficiency or custom logic. If they are
            #    not supplied, fall back to ScoringService to calculate them here.
            if base_scores is None:
                base_scores = ScoringService.calculate_base_scores(answers)
            if additional_data is None:
                additional_data = ScoringService.extract_additional_data(answers)
            
            # 2. Prepare initial state
            initial_state = AgentState(
                answers=answers,
                base_scores=base_scores,
                additional_data=additional_data,
                photo_url=photo_url,
                quiz_analysis=None, # Will be filled by quiz_analyzer
                photo_analysis=None, # Will be filled by photo_analyzer or conditional edge
                final_report={} # Will be filled by fusion_agent
            )
            
            # 3. Run the graph
            # You might want to use .stream() for longer-running graphs if you want intermediate results
            # For simplicity, .invoke() is fine here.
            final_state = self.graph.invoke(initial_state)
            
            print("--- Multi-Agent AI Analysis Complete ---")
            if final_state.get('final_report') and 'error' not in final_state['final_report']:
                return final_state['final_report']
            else:
                # Log the full final_state for better debugging
                print(f"Final state after graph execution (with error): {json.dumps(final_state, indent=2)}")
                raise HTTPException(status_code=500, detail=f"AI analysis failed. Check logs for details.")

        except Exception as e:
            print(f"Error in get_ai_analysis (multi-agent): {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # --- Prompt Builders and Helpers ---
    # These are internal methods for prompt construction and JSON parsing within the class

    def _build_quiz_analyzer_prompt(self, answers: List[QuizAnswer], base_scores: Dict[str, float], additional_data: Dict[str, Any]) -> str:
        detailed_answers_context = []
        for ans in answers:
            q_detail = self.question_map.get(ans.questionId)
            selected_option_label = ans.label # Use provided label if available
            if q_detail:
                if not selected_option_label and q_detail.get('type') == 'single-choice' and 'options' in q_detail:
                    selected_option_label = next((opt['label'] for opt in q_detail['options'] if opt['value'] == ans.value), str(ans.value))
                
                detailed_answers_context.append({
                    "questionId": ans.questionId, # Include ID for specific reference
                    "questionText": q_detail['text'],
                    "selectedValue": ans.value, 
                    "selectedLabel": selected_option_label
                })
            else:
                detailed_answers_context.append({
                    "questionId": ans.questionId,
                    "questionText": f"Unknown Question: {ans.questionId}",
                    "selectedValue": ans.value, "selectedLabel": ans.label
                })

        detailed_answers_json = json.dumps(detailed_answers_context, indent=2)
        country = additional_data.get('countryOfResidence', 'general')
        user_profile = self._compose_user_profile(additional_data)
        health_metrics = self._compose_health_metrics(additional_data)

        # Refined prompt for Quiz Analyzer
        return f"""
        You are an expert wellness analyst whose sole task is to extract detailed insights from a user's quiz answers.
        Your output MUST be valid JSON with the specific schema below. Do NOT include any other text or formatting.

        --- User Profile ---
        {user_profile}
        {health_metrics}

        --- Base Category Scores (0-100) ---
        {json.dumps(base_scores)}

        --- Detailed Answers ---
        {detailed_answers_json}

        --- Instructions ---
        Based on the provided data, identify key strengths and areas for improvement related to the user's wellness.
        For each category, provide 2-3 concise, specific bullet point insights. Each insight should be grounded in the quiz answers.
        If applicable, briefly mention the question ID (e.g., "Daily smoking (q6)...").
        Consider the user's country ({country}) for context if relevant to general lifestyle or health norms.

        **JSON Output Schema:**
        {{
            "physicalVitalityInsights": [
                "<Insight 1: e.g., 'Consistent sleep (q2) is a strength.' or 'Occasional smoking (q6) is an area for improvement.'>",
                "<Insight 2>",
                "<Insight 3>"
            ],
            "emotionalHealthInsights": [
                "<Insight 1: e.g., 'High stress levels (q8) indicate a need for coping strategies.'>",
                "<Insight 2>",
                "<Insight 3>"
            ],
            "visualAppearanceInsights": [
                "<Insight 1: e.g., 'Positive self-perception (q13) is a strong foundation.'>",
                "<Insight 2>"
            ]
        }}
        """

    def _build_photo_analyzer_prompt(self) -> str:
        # Refined prompt for Photo Analyzer
        return f"""
        You are a neutral visual assessment expert. Analyze the provided image of a person to estimate their apparent biological age and list key general visual observations related to their overall vitality and well-being.
        Your output MUST be valid JSON with the specific schema below. Do NOT include any other text or formatting.

        **JSON Output Structure:**
        {{
            "age_estimation": <number, your best objective guess for the person's apparent age in years, or null if uncertain>,
            "observations": "<A brief, neutral, comma-separated list or short sentence of visual indicators of wellness, like skin condition, apparent energy levels, signs of fatigue, general vitality. Avoid subjective judgments or overly positive/negative language. Example: 'Clear skin, alert eyes, no visible signs of fatigue.'>"
        }}
        """

    def _build_fusion_prompt(self, base_scores: Dict[str, float], quiz_analysis: Dict[str, Any], photo_analysis: Dict[str, Any], additional_data: Dict[str, Any]) -> str:
        user_profile = self._compose_user_profile(additional_data)
        health_metrics = self._compose_health_metrics(additional_data)
        country = additional_data.get('countryOfResidence', 'Not provided')
        if country and country.lower() != 'not provided':
            country_guidance = f"**Crucial Context: The user is from {country}.** When providing recommendations, reflect cultural, lifestyle, and healthcare norms in {country}. Micro-habits should be feasible and culturally appropriate."
        else:
            country_guidance = "No specific country provided; use general global wellness trends and universally applicable advice."

        # Pass parsed JSON objects directly for integration
        quiz_insights_json_str = json.dumps(quiz_analysis, indent=2)
        photo_insights_json_str = json.dumps(photo_analysis, indent=2)

        # Refined prompt for Fusion Agent
        # The Fusion Agent does NOT re-generate detailedInsightsPerCategory; it includes the one from Quiz Analyzer
        prompt_template = """You are an extremely knowledgeable and empathetic expert wellness and personal development coach. Your primary goal is to provide a comprehensive, highly personalized, and actionable analysis of the user's wellness assessment results. Synthesize *all* provided data points for a nuanced understanding.

--- User's General Profile ---
{user_profile}
{health_metrics}
Chronological Age: {chronological_age} years

--- Overall Wellness Scores ---
- Physical Vitality: {physical_vitality_score}%
- Emotional Health: {emotional_health_score}%
- Visual Appearance: {visual_appearance_score}%

--- Quiz Analysis Insights (from Quiz Analyzer) ---
{quiz_insights_json_str}

--- Photo Analysis Insights (from Photo Analyzer) ---
{photo_insights_json_str}

--- Specific Contextual Guidance ---
{country_guidance}

--- Detailed Instructions for Your Analysis ---
Your response MUST be valid JSON with the following structure. Each section should be richly detailed, empathetic, and directly reflective of ALL provided data.
Do NOT include any other text, conversational elements, or formatting outside the JSON.

**JSON Output Schema:**
{{
    "overallGlowScore": <number between 0-100, calculated holistically by combining quiz scores, health metrics, and insights from both quiz and photo analysis. Provide a brief explanation in the analysisSummary.>,
    "biologicalAge": <estimated biological age. This should be a number. PRIORITIZE the 'age_estimation' from Photo Analysis if available and reasonable. If not, infer robustly from 'physicalVitality' score, health metrics, and relevant quiz insights. JUSTIFY your estimation in analysisSummary.>,
    "emotionalAge": <estimated emotional age. This should be a number. Infer robustly from 'emotionalHealth' score and relevant quiz insights (e.g., stress levels, relationships). JUSTIFY your estimation in analysisSummary.>,
    "chronologicalAge": {chronological_age},
    "glowUpArchetype": {{
        "name": "<Creative, inspiring archetype name capturing user's current state and potential.>",
        "description": "<Detailed, empathetic description (150-250 words) synthesizing ALL data (scores, quiz insights, photo observations, health metrics, country context). How do these elements contribute to the archetype? It should resonate with the user and their specific profile.>"
    }},
    "microHabits": [
        "<**1. Specific, Actionable Micro-Habit:** Connect directly to a specific quiz insight or an area identified for improvement (e.g., from 'physicalVitalityInsights' or 'observations' from photo). Make it quantifiable (e.g., 'Drink 8 glasses of water daily', 'Meditate for 10 minutes before bed'). Ensure it is feasible and culturally appropriate for {country}. Focus on small, incremental changes for maximum impact.>",
        "<**2. Specific, Actionable Micro-Habit:** (as above)>",
        "<**3. Specific, Actionable Micro-Habit:** (as above)>",
        "<**4. Specific, Actionable Micro-Habit:** (as above, consider if photo insights suggest an area, e.g., 'Incorporate 15 minutes of outdoor light exposure daily for energy' if low vitality shown)>",
        "<**5. Specific, Actionable Micro-Habit:** (as above)>"
    ],
    "analysisSummary": "<Comprehensive narrative (200-400 words). Start by explaining the 'overallGlowScore' and justification for 'biologicalAge' and 'emotionalAge'. Integrate findings from quiz analysis, health metrics, and photo analysis (if available). Discuss key strengths and areas for growth. Conclude with an empowering and encouraging message that motivates positive change. Incorporate the country context subtly within the narrative where relevant.>",
    "detailedInsightsPerCategory": {quiz_insights_json_str}
}}

Ensure all estimations are precise and justified within the 'analysisSummary'. Micro-habits must be hyper-specific and actionable. The entire analysis must be a personalized, empathetic narrative using all context.
"""
        return prompt_template.format(
            user_profile=user_profile,
            health_metrics=health_metrics,
            physical_vitality_score=base_scores['physicalVitality'],
            emotional_health_score=base_scores['emotionalHealth'],
            visual_appearance_score=base_scores['visualAppearance'],
            quiz_insights_json_str=quiz_insights_json_str,
            photo_insights_json_str=photo_insights_json_str,
            country_guidance=country_guidance,
            chronological_age=additional_data.get('chronologicalAge', 'null'), # Use 'null' for JSON
            country=country
        )

    def _parse_json_content(self, response_text: str, agent_name: str) -> Dict[str, Any]:
        """Utility to parse JSON content and handle common LLM errors."""
        try:
            # Attempt to find JSON block first
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Fallback: try to parse the whole string if no ```json``` block
                json_str = response_text.strip()
            
            parsed_data = json.loads(json_str)
            return parsed_data
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from {agent_name} response: {e}")
            print(f"Malformed response text: {response_text[:500]}...")
            # Return a default/empty dict or raise a specific error depending on desired behavior
            return {} 
        except Exception as e:
            print(f"An unexpected error occurred during JSON parsing for {agent_name}: {e}")
            print(f"Response text: {response_text[:500]}...")
            return {}

    def _format_final_response(self, ai_analysis: Dict[str, Any], base_scores: Dict[str, float], additional_data: Dict[str, Any], photo_url: Optional[str], quiz_analysis: Dict[str, Any]) -> Dict[str, Any]:
        chronological_age = additional_data.get('chronologicalAge', settings.DEFAULT_AGE)
        
        # Merge the detailed insights from the quiz_analysis, ensuring it's always there
        final_detailed_insights = quiz_analysis if quiz_analysis is not None else {
            "physicalVitalityInsights": [],
            "emotionalHealthInsights": [],
            "visualAppearanceInsights": []
        }

        # Handle potential missing keys from LLM output for robustness
        return {
            "overallGlowScore": ai_analysis.get("overallGlowScore", 0),
            "categoryScores": base_scores,
            "biologicalAge": ai_analysis.get("biologicalAge", chronological_age),
            "emotionalAge": ai_analysis.get("emotionalAge", chronological_age),
            "chronologicalAge": chronological_age,
            "glowUpArchetype": ai_analysis.get("glowUpArchetype", {"name": "Unknown", "description": "N/A"}),
            "microHabits": ai_analysis.get("microHabits", []),
            "analysisSummary": ai_analysis.get("analysisSummary", "No summary available."),
            "detailedInsightsPerCategory": final_detailed_insights, # This is crucial: use the output from quiz_analyzer
            "avatarUrls": {
                "before": photo_url if photo_url else settings.DEFAULT_AVATAR_BEFORE,
                "after": settings.DEFAULT_AVATAR_AFTER
            }
        }