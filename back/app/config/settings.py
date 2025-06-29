import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # API Configuration
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "GlowApp API"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173","http://localhost:4173"]  # Frontend URL
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # OpenAI API Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME", "gpt-4o")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Default values
    DEFAULT_AGE: int = 30
    DEFAULT_AVATAR_BEFORE: str = "https://example.com/before.jpg"
    DEFAULT_AVATAR_AFTER: str = "https://example.com/after.jpg"

    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://glowuser:glowpassword@localhost:5433/glowdb")

# Create settings instance
settings = Settings() 