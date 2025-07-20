import openai
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from app.config.settings import settings
import json
import asyncio
from datetime import datetime

class EmbeddingService:
    """
    🧠 CONTEXT7 OPTIMIZED: Advanced embedding service with Azure OpenAI integration.
    Provides semantic search, sentiment analysis, and topic extraction for Leo's memory system.
    """
    
    def __init__(self):
        # Initialize Azure OpenAI client for embeddings
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            # Use text-embedding-3-small for cost efficiency and good performance
            self.embedding_model = "text-embedding-3-small"
            self.use_azure = True
            print(f"[EmbeddingService] Using Azure OpenAI: {self.embedding_model}")
        else:
            # Fallback to regular OpenAI
            self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.embedding_model = "text-embedding-3-small"
            self.use_azure = False
            print(f"[EmbeddingService] Using OpenAI: {self.embedding_model}")
        
        # Initialize GPT-4o client for analysis
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.gpt_client = openai.AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.gpt_model = settings.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
        else:
            self.gpt_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.gpt_model = "gpt-4o"

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text using Azure OpenAI.
        Optimized for wellness and personal development content.
        """
        try:
            if not text or not text.strip():
                return None
                
            # Clean and prepare text for embedding
            cleaned_text = self._preprocess_text(text)
            
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=cleaned_text,
                encoding_format="float"
            )
            
            if response.data and len(response.data) > 0:
                embedding = response.data[0].embedding
                print(f"[EmbeddingService] Generated embedding for text: {len(text)} chars -> {len(embedding)} dimensions")
                return embedding
            else:
                print("[EmbeddingService] No embedding data received")
                return None
                
        except Exception as e:
            print(f"[EmbeddingService] Error generating embedding: {e}")
            return None

    async def generate_batch_embeddings(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts efficiently.
        Handles batching and error recovery.
        """
        try:
            if not texts:
                return []
            
            # Clean and filter texts
            cleaned_texts = [self._preprocess_text(text) for text in texts if text and text.strip()]
            
            if not cleaned_texts:
                return []
            
            # Process in batches of 100 (Azure OpenAI limit)
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(cleaned_texts), batch_size):
                batch = cleaned_texts[i:i + batch_size]
                
                response = await self.client.embeddings.create(
                    model=self.embedding_model,
                    input=batch,
                    encoding_format="float"
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Small delay between batches to respect rate limits
                if i + batch_size < len(cleaned_texts):
                    await asyncio.sleep(0.1)
            
            print(f"[EmbeddingService] Generated {len(all_embeddings)} embeddings from {len(texts)} texts")
            return all_embeddings
            
        except Exception as e:
            print(f"[EmbeddingService] Error in batch embedding generation: {e}")
            return [None] * len(texts)

    async def analyze_message_metadata(self, content: str) -> Dict[str, Any]:
        """
        CONTEXT7 ENHANCED: Analyze message for type, sentiment, and topics.
        Uses GPT-4o for intelligent analysis of wellness conversations.
        """
        try:
            analysis_prompt = """Analyze this wellness conversation message and extract key metadata.

MESSAGE: "{content}"

Provide analysis in this exact JSON format:

{{
  "message_type": "<greeting/question/answer/wellness_tip/concern/celebration/reflection>",
  "sentiment_score": <float between -1.0 and 1.0, where -1 is very negative, 0 is neutral, 1 is very positive>,
  "topic_tags": [
    "<primary wellness topic>",
    "<secondary topic if applicable>"
  ],
  "wellness_domain": "<physical/emotional/mental/social/spiritual>",
  "urgency_level": "<low/medium/high>",
  "requires_followup": <true/false>
}}

Focus on wellness and personal development context. Be accurate and objective."""

            response = await self.gpt_client.chat.completions.create(
                model=self.gpt_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert wellness conversation analyst. Extract precise metadata for personal development conversations."
                    },
                    {
                        "role": "user",
                        "content": analysis_prompt.format(content=content[:500])  # Limit content length
                    }
                ],
                max_tokens=300,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            if response.choices and response.choices[0].message.content:
                analysis = json.loads(response.choices[0].message.content)
                print(f"[EmbeddingService] Message analysis: {analysis['message_type']} | Sentiment: {analysis['sentiment_score']}")
                return analysis
            else:
                return self._get_default_metadata()
                
        except Exception as e:
            print(f"[EmbeddingService] Error analyzing message metadata: {e}")
            return self._get_default_metadata()

    async def find_similar_messages(
        self, 
        query_embedding: List[float], 
        user_id: str,
        limit: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Find semantically similar messages using vector similarity search.
        Returns messages with similarity scores above threshold.
        """
        try:
            # This will be implemented in the VectorSearchService
            # For now, return empty list as placeholder
            return []
            
        except Exception as e:
            print(f"[EmbeddingService] Error finding similar messages: {e}")
            return []

    async def create_conversation_summary(
        self, 
        messages: List[Dict[str, Any]], 
        user_context: Dict[str, Any]
    ) -> str:
        """
        CONTEXT7 OPTIMIZED: Create intelligent conversation summary for Leo's memory.
        Focuses on key insights and patterns for personal development.
        """
        try:
            if not messages:
                return "No conversation history available."
            
            # Prepare conversation context
            conversation_text = "\n".join([
                f"{msg.get('role', 'unknown')}: {msg.get('content', '')}"
                for msg in messages[-10:]  # Last 10 messages for context
            ])
            
            summary_prompt = f"""Create a concise, intelligent summary of this wellness conversation for Leo's memory system.

USER CONTEXT:
{json.dumps(user_context, indent=2)}

RECENT CONVERSATION:
{conversation_text}

Create a summary that captures:
1. Key topics discussed
2. User's current state and concerns
3. Progress or insights shared
4. Areas that may need follow-up

Keep it concise (2-3 sentences) and focused on actionable insights for Leo's future interactions."""

            response = await self.gpt_client.chat.completions.create(
                model=self.gpt_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are Leo's memory system. Create insightful, actionable summaries of wellness conversations."
                    },
                    {
                        "role": "user",
                        "content": summary_prompt
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            if response.choices and response.choices[0].message.content:
                summary = response.choices[0].message.content.strip()
                print(f"[EmbeddingService] Created conversation summary: {len(summary)} chars")
                return summary
            else:
                return "Conversation summary unavailable."
                
        except Exception as e:
            print(f"[EmbeddingService] Error creating conversation summary: {e}")
            return "Conversation summary unavailable."

    def _preprocess_text(self, text: str) -> str:
        """
        Clean and prepare text for optimal embedding generation.
        """
        if not text:
            return ""
        
        # Basic cleaning
        cleaned = text.strip()
        
        # Remove excessive whitespace
        cleaned = " ".join(cleaned.split())
        
        # Truncate if too long (Azure OpenAI limit is 8192 tokens)
        if len(cleaned) > 6000:
            cleaned = cleaned[:6000] + "..."
        
        return cleaned

    def _get_default_metadata(self) -> Dict[str, Any]:
        """
        Return default metadata when analysis fails.
        """
        return {
            "message_type": "general",
            "sentiment_score": 0.0,
            "topic_tags": ["wellness"],
            "wellness_domain": "general",
            "urgency_level": "low",
            "requires_followup": False
        }

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        """
        try:
            if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
                return 0.0
            
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            print(f"[EmbeddingService] Error calculating similarity: {e}")
            return 0.0 