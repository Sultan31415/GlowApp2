import openai
import base64
import os
from typing import Optional, Dict, Any
from app.config.settings import settings

class PhotoAnalyzerGPT4o:
    """Agent for analyzing photos using OpenAI GPT-4o Vision API."""

    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o"

    def analyze_photo(self, photo_url: str) -> Optional[Dict[str, Any]]:
        """
        Analyzes a base64-encoded photo and returns structured insights.
        photo_url: 'data:image/png;base64,...' or 'data:image/jpeg;base64,...'
        Returns: dict with keys like 'apparent_age', 'emotion', 'health_markers', etc.
        """
        try:
            header, encoded = photo_url.split(',', 1)
            image_data = base64.b64decode(encoded)
            mime_type = header.split(':')[1].split(';')[0]

            # Prepare the prompt for GPT-4o
            prompt = (
                "Your task is to analyze the skin condition based solely on visual cues from the photo. "
                "Please provide an objective, structured output covering the following aspects:\n\n"
                "I. Skin Condition (Objective Visual Assessment):\n"
                "- Redness/Erythema: Describe distribution, intensity, and nature.\n"
                "- Shine/Oiliness: Describe distribution and degree.\n"
                "- Texture: Describe overall texture, presence of flaking, scaling, or prominent pores.\n"
                "- Blemishes/Irregularities: Note any specific blemishes, uneven texture, or other irregularities.\n"
                "- Capillaries/Vascularity: Comment on any visible blood vessels or signs of increased vascularity.\n\n"
                "II. Indicators of Stress/Tiredness (Objective Visual Cues):\n"
                "- Eyes: Comment on puffiness, dark circles, redness/irritation of the eyes themselves.\n"
                "- Skin Tone/Luster: Describe overall skin tone, sallow appearance, or dullness.\n"
                "- Facial Expression: Note any tension, lines, or expressions indicative of stress/fatigue.\n"
                "- Other Potential Cues: (e.g., hair condition if relevant, but emphasize visual and objective connection to stress/tiredness).\n\n"
                "III. Summary of Objective Visual Feedback:\n"
                "- Provide a concise summary highlighting the most prominent visual observations.\n\n"
                "Important Instructions:\n"
                "- Focus ONLY on objective visual information from the photo.\n"
                "- Do not make medical diagnoses, speculate on causes, or infer subjective feelings (like \"stressed\" or \"tired\") unless there are clear and universally recognized visual cues for them.\n"
                "- Use neutral and descriptive language. Avoid judgmental terms.\n"
                "- Maintain the structured format (Roman numerals and bullet points) as outlined above.\n"
                "- Exclude any personal advice, treatment recommendations, or disclaimers about consulting doctors. Your output should be purely observational analysis."
            )


            # OpenAI API expects files, so save to temp file
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                tmp_file.write(image_data)
                tmp_file_path = tmp_file.name

            try:
                with open(tmp_file_path, "rb") as image_file:
                    response = openai.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": prompt},
                            {"role": "user", "content": [
                                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}"}}
                            ]}
                        ],
                        max_tokens=512,
                    )
                # Parse the response (expecting JSON in the reply)
                import json, re
                text = response.choices[0].message.content
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    return json.loads(match.group())
                else:
                    return {"raw_response": text}
            finally:
                try:
                    os.unlink(tmp_file_path)
                except Exception:
                    pass
        except Exception as e:
            print(f"PhotoAnalyzerGPT4o error: {e}")
            return None 