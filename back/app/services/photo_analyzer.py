import openai
import base64
import requests
import mimetypes
import os
import json
import aiohttp
import asyncio
from typing import Optional, Dict, Any
from app.config.settings import settings
from app.services.prompt_optimizer import PromptOptimizer

# Note: Using Azure OpenAI instead of standard OpenAI
# Make sure to configure these in your .env file:
# AZURE_OPENAI_API_KEY=your_azure_openai_key
# AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
# AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o  # Your deployment name


class PhotoAnalyzerGPT4o:
    """Agent for analyzing photos using Azure OpenAI GPT-4o Vision API."""

    def __init__(self):
        # Check if Azure OpenAI is configured, otherwise fall back to OpenAI
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            # Initialize Azure OpenAI client
            self.deployment_name = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
            self.client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            # For sync client (used in analyze_photo method)
            self.sync_client = openai.AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.use_azure = True
            print(f"[PhotoAnalyzer] Using Azure OpenAI with deployment: {self.deployment_name}")
        else:
            # Fallback to regular OpenAI
            self.deployment_name = "gpt-4o"
            self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.sync_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            self.use_azure = False
            print(f"[PhotoAnalyzer] Using OpenAI with model: {self.deployment_name}")

    async def analyze_photo_async(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        OPTIMIZED: Async photo analysis with comprehensive health indicators.
        Enhanced prompt while maintaining speed optimization.
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

            # ENHANCED: Using Context7 best practices optimized prompt
            from app.services.prompt_optimizer import PromptOptimizer
            optimized_prompt = PromptOptimizer.build_fast_photo_prompt()

            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert computer vision health analyst specializing in facial wellness assessment. Focus on objective, observable features that correlate with wellness. Provide specific, evidence-based assessments. Always return valid JSON only."
                    },
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
                max_tokens=1000,  # Increased for Context7 enhanced prompts
                temperature=0.1,   # Lower temperature for maximum consistency
                response_format={"type": "json_object"},
            )
            
            # FIXED: Proper response validation before parsing
            if not response or not response.choices or len(response.choices) == 0:
                print("PhotoAnalyzer ASYNC (Azure): Empty response from Azure OpenAI API")
                return None
                
            content = response.choices[0].message.content
            if content is None:
                print("PhotoAnalyzer ASYNC (Azure): Response content is None")
                return None
                
            print(f"Raw PhotoAnalyzer ASYNC (Azure) LLM response: {content}")
            return self._parse_response(response)

        except openai.APIConnectionError as e:
            print(f"PhotoAnalyzer ASYNC (Azure): API connection error - {e}")
            return None
        except openai.RateLimitError as e:
            print(f"PhotoAnalyzer ASYNC (Azure): Rate limit exceeded - {e}")
            return None
        except openai.APIStatusError as e:
            print(f"PhotoAnalyzer ASYNC (Azure): API status error - {e.status_code}: {e.response}")
            return None
        except Exception as e:
            print(f"PhotoAnalyzerGPT4o ASYNC (Azure) error: {e}")
            return None

    def analyze_photo(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        Analyzes a photo and returns comprehensive wellness insights.
        Enhanced with medical and dermatological expertise.
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

            response = self.sync_client.chat.completions.create(
                model=self.deployment_name,  # Use deployment name for Azure OpenAI
                messages=[
                    {"role": "system", "content": "You are a highly specialized wellness assessment expert with deep knowledge in dermatology, facial analysis, and health indicator recognition. Your analysis will inform personalized wellness recommendations. Provide objective, detailed observations based on established medical and wellness science."},
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
                max_tokens=1500,  # Increased for comprehensive analysis
                temperature=0.3,  # Slightly higher for nuanced health insights
                response_format={"type": "json_object"},
            )
            print(f"Raw PhotoAnalyzer (Azure) LLM response: {response.choices[0].message.content}")
            return self._parse_response(response)

        except Exception as e:
            print(f"PhotoAnalyzerGPT4o (Azure) error: {e}")
            return None

    async def analyze_photo_fast(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        ULTRA-FAST photo analysis with optimized prompt and reduced complexity.
        Uses compressed prompts and minimal required fields.
        """
        try:
            print("[LangGraph] 📸⚡ Processing photo (speed mode)")

            # Handle data URLs and remote URLs properly
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
            else:
                # For remote URLs, use basic encoding
                encoded = self._encode_image(photo_url)
                if not encoded:
                    print("PhotoAnalyzer FAST: Could not encode image")
                    return self._get_fallback_photo_response()
                mime_type = "image/jpeg"  # Default mime type for remote URLs
                
            # Use the ultra-compressed fast prompt
            prompt = PromptOptimizer.build_fast_photo_prompt()

            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are a wellness assessment specialist. Analyze facial photos quickly for health indicators. Return structured JSON only."},
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
                max_tokens=800,  # Increased from 300 to handle JSON properly
                temperature=0.05, # Even lower for maximum speed
                response_format={"type": "json_object"},
            )
            
            if not response or not response.choices or len(response.choices) == 0:
                print("PhotoAnalyzer FAST: Empty response from API")
                return self._get_fallback_photo_response()
                
            content = response.choices[0].message.content
            if content is None:
                print("PhotoAnalyzer FAST: Response content is None")
                return self._get_fallback_photo_response()
                
            print(f"PhotoAnalyzer FAST response: {content}")
            
            # Try to parse the response
            parsed_result = self._parse_response(response)
            if parsed_result is None:
                print("PhotoAnalyzer FAST: Failed to parse response, using fallback")
                return self._get_fallback_photo_response()
                
            return parsed_result

        except Exception as e:
            print(f"PhotoAnalyzer FAST error: {e}")
            return self._get_fallback_photo_response()

    def _get_analysis_prompt(self) -> str:
        return """
        You are conducting a comprehensive wellness assessment of a facial photograph. Your analysis will inform personalized health and beauty recommendations. Focus on objective, observable characteristics that correlate with health, wellness, and biological age.

        **CRITICAL INSTRUCTIONS:**
        - Analyze ONLY visible, objective features
        - Avoid medical diagnoses or definitive health claims
        - Focus on wellness indicators, not medical conditions
        - Use established dermatological and health assessment principles
        - If something is not clearly visible, state "not clearly discernible"
        - Provide specific, actionable observations

        **OUTPUT SCHEMA - Return ONLY this JSON structure:**

        {
            "ageAssessment": {
            "estimatedAgeRange": {
                    "lower": <integer, minimum estimated age>,
                    "upper": <integer, maximum estimated age>,
                    "primaryIndicators": "<key facial features used for age estimation>"
                },
                "biologicalVsChronological": "<assessment of whether person appears younger, older, or age-appropriate>",
                "youthfulnessMarkers": [
                    "<specific features suggesting biological youth, e.g., 'firm skin elasticity', 'minimal periorbital wrinkles'>"
                ],
                "maturityIndicators": [
                    "<specific features suggesting biological maturity/aging, e.g., 'slight nasolabial lines', 'skin texture changes'>"
                ]
            },
            
            "comprehensiveSkinAnalysis": {
                "overallSkinHealth": "<excellent/very-good/good/fair/poor - overall impression>",
                "skinType": {
                    "complexion": "<very-fair/fair/light-medium/medium/olive/dark/very-dark>",
                    "undertone": "<cool/warm/neutral/mixed - if discernible>",
                    "skinThickness": "<thin/normal/thick - based on visible characteristics>"
                },
                "skinQualityMetrics": {
                    "texture": "<smooth/fine-textured/slightly-rough/rough/very-rough>",
                    "poreVisibility": "<minimal/small/moderate/enlarged/very-enlarged>",
                    "skinToneEvenness": "<very-even/mostly-even/somewhat-uneven/patchy/very-uneven>",
                    "elasticity": "<excellent/good/moderate/poor - based on visible firmness>",
                    "hydrationLevel": "<well-hydrated/adequately-hydrated/slightly-dry/dry/very-dry>"
                },
                "skinConcerns": {
                    "acneAndBlemishes": "<clear/occasional-blemishes/active-breakouts/severe-acne/post-acne-scarring>",
                    "hyperpigmentation": "<none/mild-spots/moderate-discoloration/significant-pigmentation>",
                    "redness": "<none/slight-flush/moderate-redness/significant-erythema/rosacea-like>",
                    "visibleDamage": "<none/early-photodamage/moderate-sun-damage/significant-damage>",
                    "skinBarrierHealth": "<intact/slightly-compromised/compromised - based on visible irritation>"
                },
                "skinLuminosity": {
                    "radiance": "<luminous/healthy-glow/normal/dull/very-dull>",
                    "skinClarity": "<very-clear/clear/slightly-cloudy/dull/muddy>",
                    "healthyGlow": "<present/moderate/minimal/absent>"
                }
            },

            "vitalityAndHealthIndicators": {
                "eyeAreaAssessment": {
                    "eyeBrightness": "<very-bright/bright/normal/dull/very-dull>",
                    "scleraHealth": "<clear-white/slightly-yellow/red-veined/bloodshot>",
                    "underEyeCondition": "<clear/slight-darkness/dark-circles/severe-circles>",
                    "eyePuffiness": "<none/minimal/moderate/significant>",
                    "eyeAreaSkin": "<firm/normal/slightly-loose/crepey>",
                    "expressionLines": "<none/minimal/moderate/pronounced>"
                },
                "facialVitality": {
                    "facialFullness": "<youthful-fullness/healthy-fullness/normal/slightly-gaunt/gaunt>",
                    "muscleTone": "<excellent/good/moderate/poor - facial muscle firmness>",
                    "facialSymmetry": "<excellent/good/moderate/asymmetrical>",
                    "boneDensity": "<strong-structure/normal/delicate - based on visible bone prominence>"
                },
                "circulationAndOxygenation": {
                    "skinColor": "<healthy-pink/normal/pale/flushed/grayish/yellowish>",
                    "lipColor": "<healthy-pink/normal/pale/dark/bluish-tinge>",
                    "overallOxygenation": "<excellent/good/moderate/poor - based on color indicators>"
                }
            },

            "stressAndLifestyleIndicators": {
                "stressMarkers": {
                    "tensionLines": "<none/minimal/moderate/significant - forehead, between brows>",
                    "jawTension": "<relaxed/slight-tension/clenched/very-tense>",
                    "overallFacialTension": "<relaxed/normal/tense/very-tense>"
                },
                "sleepQualityIndicators": {
                    "eyeArea": "<well-rested/normal/slightly-tired/tired/exhausted>",
                    "skinRecovery": "<excellent/good/moderate/poor - overnight repair signs>",
                    "alertness": "<very-alert/alert/normal/drowsy/very-drowsy>"
                },
                "emotionalWellbeing": {
                    "facialExpression": "<content/peaceful/neutral/worried/stressed>",
                    "eyeExpression": "<bright-engaged/normal/distant/vacant>",
                    "mouthArea": "<relaxed/neutral/tense/downturned>"
                },
                "lifestyleClues": {
                    "hydrationStatus": "<well-hydrated/adequate/dehydrated - skin plumpness, lip condition>",
                    "nutritionalIndicators": "<excellent/good/adequate/poor - skin quality, hair visible at edges>",
                    "sunProtectionHabits": "<excellent/good/moderate/poor - based on damage patterns>",
                    "skinCareRoutine": "<excellent/good/basic/minimal - based on skin condition>"
                }
            },

            "environmentalAndLifestyleImpact": {
                "environmentalExposure": {
                    "sunDamage": "<none/minimal/moderate/significant>",
                    "pollutionEffects": "<none/minimal/moderate/significant - dullness, congestion>",
                    "weatherExposure": "<protected/normal/excessive - wind, cold damage>"
                },
                "lifestyleReflection": {
                    "exerciseIndicators": "<active/moderate/sedentary - circulation, muscle tone>",
                    "stressLevel": "<low/moderate/high - based on visible stress markers>",
                    "healthHabits": "<excellent/good/fair/poor - overall impression>"
                }
            },

            "overallWellnessAssessment": {
                "biologicalAge": "<younger-than-chronological/age-appropriate/older-than-chronological>",
                "vitalityLevel": "<very-high/high/moderate/low/very-low>",
                "skinAge": "<younger/appropriate/older - compared to estimated chronological age>",
                "healthImpression": "<vibrant/healthy/average/concerning>",
                "wellnessPriorities": [
                    "<top 2-3 areas that could benefit from attention based on visual assessment>"
                ]
            },

            "detailedObservations": {
                "positiveFindings": [
                    "<specific positive health/wellness indicators observed>"
                ],
                "areasForImprovement": [
                    "<specific areas where enhancement could benefit overall wellness>"
                ],
                "noteworthy": [
                    "<any particularly notable features, positive or concerning>"
                ]
            },

            "analysisMetadata": {
                "imageQuality": "<excellent/good/fair/poor>",
                "visibilityFactors": "<good-lighting/adequate/poor, clear-angle/angled, high-resolution/low-resolution>",
                "analysisConfidence": "<very-high/high/moderate/low>",
                "limitingFactors": "<any factors that limited the analysis accuracy>"
            }
        }

        **ANALYSIS GUIDELINES:**

        1. **Age Assessment:** Consider multiple factors: skin elasticity, fine lines, facial volume, bone prominence, hair (if visible at edges), overall facial structure maturity.

        2. **Skin Health:** Assess using dermatological principles - barrier function, hydration, inflammation, pigmentation, texture, and signs of aging or damage.

        3. **Vitality Indicators:** Focus on circulation, hydration, muscle tone, and signs of systemic health reflected in facial appearance.

        4. **Lifestyle Reflection:** Identify patterns that suggest exercise habits, sun protection, stress levels, sleep quality, and general self-care.

        5. **Wellness Priorities:** Based on observations, suggest the most impactful areas for improvement.

        **IMPORTANT CONSTRAINTS:**
        - NO medical diagnoses or disease identification
        - Focus on wellness optimization, not pathology
        - Acknowledge limitations of photo-based assessment
        - Provide actionable insights for wellness improvement
        - Use "not clearly discernible" for unclear features
        """

    def _parse_response(self, response) -> Optional[Dict[str, Any]]:
        """Parses the JSON response from the OpenAI API with enhanced validation and error recovery."""
        try:
            content = response.choices[0].message.content
            if not content:
                print("Photo analysis: Empty content received")
                return None
                
            # Handle potential JSON markdown blocks
            if "```json" in content:
                import re
                match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            # Check for truncated JSON and attempt basic repair
            if not content.strip().endswith('}'):
                print("Photo analysis: Detected truncated JSON, attempting repair...")
                # Find the last complete field and close the JSON
                content = content.rstrip()
                if content.endswith(','):
                    content = content[:-1]  # Remove trailing comma
                if not content.endswith('}'):
                    content += '}'
                print(f"Photo analysis: Attempted JSON repair")
            
            parsed_json = json.loads(content)
            
            # Basic validation for essential fields
            if not isinstance(parsed_json, dict):
                print("Photo analysis: Response is not a valid JSON object")
                return None
            
            # If we have some data, return it even if not complete
            if parsed_json:
                print("Photo analysis: Successfully parsed JSON response")
                return parsed_json
            else:
                print("Photo analysis: Empty JSON object received")
                return None
                
        except json.JSONDecodeError as e:
            print(f"Photo analysis JSON decode error: {e}")
            print(f"Problematic content (first 500 chars): {content[:500] if content else 'None'}")
            
            # Attempt aggressive JSON repair
            try:
                if content:
                    # Remove everything after the last complete quote-colon-value pattern
                    import re
                    # Find the last properly closed field
                    content_clean = re.sub(r',\s*[^"]*$', '', content)  # Remove incomplete trailing field
                    if not content_clean.strip().endswith('}'):
                        content_clean += '}'
                    
                    parsed_json = json.loads(content_clean)
                    print("Photo analysis: Successfully repaired and parsed JSON")
                    return parsed_json
            except:
                print("Photo analysis: JSON repair failed")
            
            return None
            
        except (IndexError, KeyError, AttributeError) as e:
            print(f"Photo analysis parsing error: {e}")
            return None

    def _get_fallback_photo_response(self) -> Dict[str, Any]:
        """Returns a basic fallback response when photo analysis fails."""
        return {
            "ageAssessment": {
                "estimatedRange": {
                    "lower": 20,
                    "upper": 35
                },
                "biologicalAgeIndicators": "Photo analysis unavailable"
            },
            "comprehensiveSkinAnalysis": {
                "overallSkinHealth": "Unable to assess from photo",
                "skinQualityMetrics": {
                    "texture": "Analysis unavailable",
                    "evenness": "Analysis unavailable",
                    "radiance": "Analysis unavailable"
                },
                "skinConcerns": {
                    "acne": "Unable to assess",
                    "redness": "Unable to assess",
                    "damage": "Unable to assess"
                }
            },
            "vitalityAndHealthIndicators": {
                "eyeAreaAssessment": {
                    "brightness": "Unable to assess",
                    "underEye": "Unable to assess",
                    "puffiness": "Unable to assess"
                },
                "facialVitality": {
                    "fullness": "Unable to assess",
                    "muscleTone": "Unable to assess"
                }
            },
            "stressAndLifestyleIndicators": {
                "stressMarkers": {
                    "tensionLines": "Unable to assess",
                    "facialTension": "Unable to assess"
                },
                "sleepQuality": {
                    "eyeArea": "Unable to assess",
                    "alertness": "Unable to assess"
                }
            },
            "overallWellnessAssessment": {
                "biologicalAge": "Analysis unavailable",
                "vitalityLevel": "Unable to determine",
                "healthImpression": "Photo analysis needed"
            },
            "analysisMetadata": {
                "imageQuality": "Unable to process",
                "analysisConfidence": "low",
                "limitingFactors": "Photo processing or analysis failure"
            }
        }

    def _encode_image(self, photo_url: str) -> Optional[str]:
        """Helper method to encode image from URL or data URI."""
        try:
            # Handle data URLs and remote URLs
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                return encoded
            else:
                # For remote URLs, we need to fetch them
                # This is a sync version for the sync methods
                import requests
                response = requests.get(photo_url, timeout=10)
                response.raise_for_status()
                img_bytes = response.content
                encoded = base64.b64encode(img_bytes).decode()
                return encoded
        except Exception as e:
            print(f"Photo encoding error: {e}")
            return None

    async def _encode_image_async(self, photo_url: str) -> Optional[tuple]:
        """Async helper method to encode image from URL or data URI."""
        try:
            # Handle data URLs and remote URLs
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
                return encoded, mime_type
            else:
                # Use async HTTP client for better performance
                async with aiohttp.ClientSession() as session:
                    async with session.get(photo_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        response.raise_for_status()
                        img_bytes = await response.read()
                        mime_type = response.headers.get("Content-Type") or "image/jpeg"
                        encoded = base64.b64encode(img_bytes).decode()
                        return encoded, mime_type
        except Exception as e:
            print(f"Async photo encoding error: {e}")
            return None, None

    async def analyze_photo_dermatological(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        DERMATOLOGICAL FOCUS: Specialized photo analysis with aggressive skin condition detection.
        Uses medical-grade prompts specifically designed for accurate skin assessment.
        This is an alternative approach if standard analysis misses obvious skin conditions.
        """
        try:
            print("[PhotoAnalyzer] 🔬 DERMATOLOGICAL analysis started - specialized skin assessment")

            # Handle data URLs and remote URLs
            if photo_url.startswith("data:"):
                header, encoded = photo_url.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
            else:
                async with aiohttp.ClientSession() as session:
                    async with session.get(photo_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        response.raise_for_status()
                        img_bytes = await response.read()
                        mime_type = response.headers.get("Content-Type") or "image/jpeg"
                        encoded = base64.b64encode(img_bytes).decode()

            # Aggressive dermatological assessment prompt
            dermatological_prompt = """You are a specialized dermatological assessment AI with expertise in skin condition recognition. Your primary task is to identify and accurately assess visible skin conditions with medical precision.

CRITICAL MISSION: Detect and accurately identify ANY visible skin conditions, redness, acne, or skin irregularities. Do NOT minimize or overlook obvious skin problems.

SKIN ASSESSMENT PROTOCOL:

1. REDNESS ANALYSIS (CRITICAL):
   - Scan the entire facial area for ANY pink, red, or inflamed coloration
   - Check cheeks, nose, chin, forehead, around mouth
   - Look for flushing, irritation, inflammatory patterns
   - Even subtle redness should be noted
   - Rate precisely: none/slight/moderate/significant/severe

2. ACNE AND BLEMISH DETECTION (CRITICAL):
   - Identify ALL visible acne lesions: comedones, papules, pustules
   - Look for active breakouts, whiteheads, blackheads
   - Check for post-acne marks, scarring, or discoloration
   - Assess severity and distribution accurately
   - Rate precisely: clear/few-blemishes/moderate-acne/severe-acne

3. SKIN TEXTURE ASSESSMENT:
   - Evaluate surface texture: smooth vs. rough
   - Identify enlarged pores, uneven texture
   - Look for skin irregularities or bumps
   - Rate: smooth/slightly-rough/rough/very-rough

4. OVERALL SKIN HEALTH:
   - Combine all findings for comprehensive assessment
   - Be objective and clinically accurate
   - Rate: excellent/good/fair/poor

CRITICAL INSTRUCTIONS:
- If you see redness, you MUST identify it as redness
- If you see acne or blemishes, you MUST identify them as such
- Do NOT be conservative or minimize obvious skin conditions
- Be clinically accurate and objective
- Focus on what is ACTUALLY VISIBLE

Return assessment in this format:

{{
  "dermatologicalAssessment": {{
    "skinConditions": {{
      "redness": {{
        "severity": "<none/slight/moderate/significant/severe>",
        "distribution": "<facial areas affected>",
        "characteristics": "<description of redness pattern>"
      }},
      "acne": {{
        "severity": "<clear/few-blemishes/moderate-acne/severe-acne>",
        "activeBreakouts": "<number/description of active lesions>",
        "distribution": "<facial areas affected>"
      }},
      "texture": {{
        "quality": "<smooth/slightly-rough/rough/very-rough>",
        "poreVisibility": "<minimal/moderate/enlarged>",
        "irregularities": "<description of texture issues>"
      }}
    }},
    "overallSkinHealth": "<excellent/good/fair/poor>",
    "clinicalObservations": [
      "<specific visible findings>",
      "<additional skin condition notes>"
    ],
    "recommendedFocus": [
      "<areas needing attention based on visible conditions>"
    ]
  }},
  "ageAssessment": {{
    "estimatedRange": {{"lower": <age>, "upper": <age>}},
    "skinAgeIndicators": "<visible aging signs>"
  }},
  "analysisConfidence": "<high/medium/low - based on image quality and visibility>"
}}"""

            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a specialized dermatological AI analyst. Your expertise is in accurate skin condition identification. Be precise, objective, and never minimize visible skin problems. Focus on clinical accuracy."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": dermatological_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
                            },
                        ],
                    },
                ],
                max_tokens=800,
                temperature=0.05,  # Very low for maximum consistency and accuracy
                response_format={"type": "json_object"},
            )
            
            if not response or not response.choices or len(response.choices) == 0:
                print("PhotoAnalyzer DERMATOLOGICAL: Empty response from API")
                return None
                
            content = response.choices[0].message.content
            if content is None:
                print("PhotoAnalyzer DERMATOLOGICAL: Response content is None")
                return None
                
            print(f"Raw PhotoAnalyzer DERMATOLOGICAL response: {content}")
            return self._parse_response(response)

        except Exception as e:
            print(f"PhotoAnalyzer DERMATOLOGICAL error: {e}")
            return None
