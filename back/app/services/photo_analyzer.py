import openai
import base64
import requests
import mimetypes
import os
import json
import aiohttp
import asyncio
from typing import Optional, Dict, Any
# Assuming app.config.settings exists and is correctly configured
# from app.config.settings import settings

# Placeholder for settings for standalone testing
class MockSettings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY_HERE")

settings = MockSettings()


class PhotoAnalyzerGPT4o:
    """Agent for analyzing photos using OpenAI GPT-4o Vision API."""

    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o"
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_photo_async(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        OPTIMIZED: Async photo analysis with faster, more concise prompts.
        Expected 30-50% faster than sync version.
        """
        try:
            # Handle data URLs and remote URLs
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
            else:
                # Use async HTTP client for better performance
                async with aiohttp.ClientSession() as session:
                    async with session.get(photo_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        response.raise_for_status()
                        img_bytes = await response.read()
                        mime_type = response.headers.get("Content-Type") or "image/jpeg"
                        encoded = base64.b64encode(img_bytes).decode()

            # OPTIMIZED: Much shorter, focused prompt for faster processing
            optimized_prompt = """Analyze this face photo. Return ONLY JSON:
{
  "estimatedAgeRange": {"lower": <int>, "upper": <int>, "justification": "<brief>"},
  "skinAnalysis": {
    "overallComplexion": "<fair/medium/dark>",
    "rednessOrErythema": "<none discernible OR brief description>",
    "shineOrOiliness": "<none discernible OR brief description>",
    "texture": "<smooth/rough/mixed with pore visibility>",
    "blemishesOrIrregularities": "<none discernible OR brief list>",
    "visibleCapillariesOrVascularity": "<none discernible OR brief description>"
  },
  "stressAndTirednessIndicators": {
    "eyes": "<none discernible OR brief observation>",
    "skinToneAndLuster": "<none discernible OR brief observation>",
    "facialExpressionCues": "<none discernible OR brief observation>"
  },
  "overallVisualSummary": "<2 sentences max describing key visual observations>"
}

Be objective, concise, and accurate. Output only JSON."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a visual analysis expert. Return only valid JSON with exact schema."},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": optimized_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
                            },
                        ],
                    },
                ],
                max_tokens=600,  # Reduced from 1024 for faster response
                temperature=0.2,  # Lower temperature for faster, more consistent results
                response_format={"type": "json_object"},
            )
            
            # FIXED: Proper response validation before parsing
            if not response or not response.choices or len(response.choices) == 0:
                print("PhotoAnalyzer ASYNC: Empty response from OpenAI API")
                return None
                
            content = response.choices[0].message.content
            if content is None:
                print("PhotoAnalyzer ASYNC: Response content is None")
                return None
                
            print(f"Raw PhotoAnalyzer ASYNC LLM response: {content}")
            return self._parse_response(response)

        except openai.APIConnectionError as e:
            print(f"PhotoAnalyzer ASYNC: API connection error - {e}")
            return None
        except openai.RateLimitError as e:
            print(f"PhotoAnalyzer ASYNC: Rate limit exceeded - {e}")
            return None
        except openai.APIStatusError as e:
            print(f"PhotoAnalyzer ASYNC: API status error - {e.status_code}: {e.response}")
            return None
        except Exception as e:
            print(f"PhotoAnalyzerGPT4o ASYNC error: {e}")
            return None

    def analyze_photo(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        Analyzes a base64-encoded photo and returns structured JSON insights.
        """
        try:
            # Accept both data URLs ("data:image/...;base64,<data>") and regular http(s) URLs.
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
            else:
                # Download remote image and convert to Base-64 so that the Vision model can consume it.
                response = requests.get(photo_url, timeout=10)
                response.raise_for_status()
                img_bytes = response.content
                mime_type = response.headers.get("Content-Type") or mimetypes.guess_type(photo_url)[0] or "image/jpeg"
                encoded = base64.b64encode(img_bytes).decode()

            prompt = self._get_analysis_prompt()

            response = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a highly precise visual analysis expert. Your sole purpose is to observe and describe visual attributes objectively and return structured JSON. Adhere strictly to the provided schema and instructions."},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
                            },
                        ],
                    },
                ],
                max_tokens=1024,
                temperature=0.4,
                response_format={"type": "json_object"},
            )
            print(f"Raw PhotoAnalyzer LLM response: {response.choices[0].message.content}")
            return self._parse_response(response)

        except Exception as e:
            print(f"PhotoAnalyzerGPT4o error: {e}")
            return None

    def _get_analysis_prompt(self) -> str:
        return """
        Critically analyze the provided photo of a person's face. Your output MUST be a JSON object, strictly adhering to the specified schema. Focus exclusively on directly observable visual characteristics. If a specific characteristic is not clearly visible or discernible, state "not discernible" or "no clear indicators" for that field, rather than omitting the field or speculating.

        Schema and Desired Output Details:
        {
            "estimatedAgeRange": {
                "lower": <integer, estimated minimum age, e.g., 20>,
                "upper": <integer, estimated maximum age, e.g., 30>,
                "justification": "<string, concise visual cues supporting the age estimate, e.g., 'Absence of deep wrinkles, youthful skin texture, clear jawline.'>"
            },
            "skinAnalysis": {
                "overallComplexion": "<string, e.g., 'fair', 'medium', 'dark', 'pale', 'flushed'>",
                "rednessOrErythema": "<string, precise description of any redness, including distribution (e.g., 'diffuse across cheeks', 'localized around nose'), intensity (e.g., 'mild', 'moderate', 'pronounced'), and nature (e.g., 'blotchy', 'uniform blush'). If none, state 'none discernible'.>",
                "shineOrOiliness": "<string, detailed description of any shine or oiliness, including location (e.g., 'T-zone', 'forehead'), and degree (e.g., 'slight sheen', 'moderate oiliness', 'greasy appearance'). If none, state 'none discernible'.>",
                "texture": "<string, describe the predominant skin texture (e.g., 'smooth', 'fine lines present', 'some roughness', 'uneven'). Comment on pore visibility (e.g., 'pores appear small', 'pores visibly enlarged'). Note any flaking or dryness (e.g., 'slight flaking on chin', 'dry patches').>",
                "blemishesOrIrregularities": "<string, itemize specific blemishes or irregularities such as 'small pimple on chin', 'freckles', 'hyperpigmentation spots on forehead', 'uneven skin tone'. If none, state 'none discernible'.>",
                "visibleCapillariesOrVascularity": "<string, describe any visible broken capillaries or prominent blood vessels, including location and extent. If none, state 'none discernible'.>"
            },
            "stressAndTirednessIndicators": {
                "eyes": "<string, specific observations regarding the eyes: 'slight puffiness under eyes', 'pronounced dark circles', 'redness in sclera', 'visible fine lines around eyes'. If none, state 'none discernible'.>",
                "skinToneAndLuster": "<string, describe any sallow appearance, dullness, or lack of luminosity. Be specific (e.g., 'skin appears slightly sallow', 'dullness primarily on cheeks', 'lack of natural glow'). If none, state 'none discernible'.>",
                "facialExpressionCues": "<string, note any lines or muscle tension indicative of fatigue or stress (e.g., 'furrowed brow', 'tension around mouth', 'subtle lines between eyebrows'). If none, state 'none discernible'.>"
            },
            "overallVisualSummary": "<string, a highly concise, objective summary of the most striking and prominent visual observations related to the person's facial appearance, synthesizing key points from the above sections. Max 2-3 sentences.>"
        }

        Strict Rules:
        1. Respond ONLY with the JSON object. No preambles, explanations, or conversational text.
        2. Ensure all keys in the schema are present in the output JSON.
        3. For fields where nothing is observed, use specific phrases like "none discernible", "no clear indicators", or "not applicable" as appropriate for the context, but do NOT omit the key.
        4. Do NOT interpret or make subjective judgments (e.g., "looks healthy", "appears sad"). Stick to objective visual descriptions.
        5. Do NOT make medical diagnoses or speculate on health conditions.
        6. Provide specific, detailed visual observations for each field, avoiding vague terms. Quantify or qualify where possible (e.g., "slight", "moderate", "pronounced", "diffuse", "localized").
        7. Ensure age range justification is based purely on visible features, not assumptions.
        8. The 'overallVisualSummary' should be a true summary, not a re-listing of details.
        """

    def _parse_response(self, response) -> Optional[Dict[str, Any]]:
        """Parses the JSON response from the OpenAI API."""
        try:
            content = response.choices[0].message.content
            # It's good practice to add a validation step here
            parsed_json = json.loads(content)
            # You might want to add schema validation using a library like Pydantic or jsonschema
            # For now, a basic check:
            expected_top_keys = ["estimatedAgeRange", "skinAnalysis", "stressAndTirednessIndicators", "overallVisualSummary"]
            if not all(key in parsed_json for key in expected_top_keys):
                print(f"Parsed JSON missing expected top-level keys: {parsed_json.keys()}")
                return None
            return parsed_json
        except (json.JSONDecodeError, IndexError, KeyError) as e:
            print(f"Error parsing photo analysis response: {e}")
            print(f"Problematic content: {response.choices[0].message.content if response.choices else 'No content'}")
            return None
