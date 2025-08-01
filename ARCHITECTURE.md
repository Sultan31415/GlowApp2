# 🏗️ GlowApp Technical Architecture

## System Overview

GlowApp is built on a modern, scalable architecture that combines cutting-edge AI technologies with robust backend services and an intuitive frontend experience.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   React 18.3.1  │  │  TypeScript 5.5 │  │  Tailwind CSS   │  │   Vite 5.4  │ │
│  │   (Concurrent)  │  │   (Strict Mode) │  │   (Utility)     │  │  (Build)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Framer Motion  │  │  React Router   │  │   Three.js      │  │   i18next   │ │
│  │   (Animations)  │  │   (Navigation)  │  │   (3D Viz)      │  │   (i18n)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS/WebSocket
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND API                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   FastAPI 0.104 │  │  SQLAlchemy 2.0 │  │   Alembic       │  │  Pydantic   │ │
│  │   (Async API)   │  │   (ORM)         │  │   (Migrations)  │  │   (Validation)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   WebSocket     │  │   Clerk Auth    │  │   CORS          │  │  Rate Limit │ │
│  │   (Real-time)   │  │   (JWT)         │  │   (Security)    │  │   (Protection)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Database Connection
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 DATABASE LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           PostgreSQL 15+                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │    Users    │  │ Assessments │  │ Daily Plans │  │  Progress Tracking  │ │ │
│  │  │             │  │             │  │             │  │                     │ │ │
│  │  │ - user_id   │  │ - scores    │  │ - plans     │  │ - habit_completions │ │ │
│  │  │ - email     │  │ - insights  │  │ - versions  │  │ - progress_snapshots│ │ │
│  │  │ - profile   │  │ - archetype │  │ - history   │  │ - streaks           │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ AI Service Calls
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                AI ORCHESTRATION                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           LangGraph Pipeline                                │ │
│  │                                                                             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │ │
│  │  │   Photo     │    │    Quiz     │    │ Orchestrator│    │ Future Self │   │ │
│  │  │  Analysis   │───▶│  Analysis   │───▶│   (GPT-4o   │───▶│  Projection │   │ │
│  │  │ (GPT-4o)    │    │ (Gemini)    │    │   Mini)     │    │             │   │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ AI Model APIs
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 AI SERVICES                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │ │
│  │  │ Azure OpenAI    │  │  Google Gemini  │  │  Pydantic AI    │            │ │
│  │  │                 │  │                 │  │                 │            │ │
│  │  │ • GPT-4o        │  │ • Gemini 2.0    │  │ • Leo Agent     │            │ │
│  │  │ • GPT-4o Mini   │  │   Flash         │  │ • 12 Tools      │            │ │
│  │  │ • Vision API    │  │ • Quiz Analysis │  │ • Therapeutic   │            │ │
│  │  │ • Embeddings    │  │ • Cultural      │  │   Support       │            │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Architecture

#### **React 18 with Modern Patterns**
```typescript
// Concurrent Features
const DashboardScreen = lazy(() => 
  import('./components/screens/DashboardScreen')
    .then(m => ({ default: m.DashboardScreen }))
);

// Suspense for loading states
<Suspense fallback={<LoadingScreen />}>
  <DashboardScreen />
</Suspense>
```

#### **State Management**
```typescript
// Custom hooks for feature-specific state
const { quizData, loading, error } = useQuiz();
const { assessment, submitAssessment } = useAssessment();
const { user, isAuthenticated } = useAuthEffects();
```

#### **Real-time Communication**
```typescript
// WebSocket for Leo AI chat
const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
  onOpen: () => console.log('Connected to Leo'),
  onMessage: (event) => handleLeoResponse(event.data),
  shouldReconnect: (closeEvent) => true,
});
```

### 2. Backend Architecture

#### **FastAPI with Async Support**
```python
# High-performance async endpoints
@router.post("/assess")
async def assess_results(
    request: AssessmentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
) -> AssessmentResponse:
    # Async processing with multiple AI models
    pass
```

#### **Database Schema Design**
```sql
-- User management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR UNIQUE NOT NULL,  -- Clerk user ID
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comprehensive assessments
CREATE TABLE user_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    overall_glow_score INTEGER NOT NULL,
    biological_age INTEGER NOT NULL,
    emotional_age INTEGER NOT NULL,
    chronological_age INTEGER NOT NULL,
    category_scores JSONB NOT NULL,
    glowup_archetype JSONB NOT NULL,
    micro_habits JSONB NOT NULL,
    analysis_summary TEXT,
    detailed_insights JSONB,
    quiz_answers JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE habit_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    habit_type VARCHAR(50) NOT NULL,
    habit_content TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    day_date DATE NOT NULL,
    notes TEXT
);
```

### 3. AI Orchestration

#### **LangGraph Pipeline**
```python
# Optimized async parallel processing
async def optimized_parallel_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # Execute photo and quiz analysis concurrently
    photo_task = photo_node_async(photo_state)
    quiz_task = quiz_node_async(quiz_state)
    
    photo_result, quiz_result = await asyncio.gather(photo_task, quiz_task)
    
    return {
        **state,
        "photo_insights": photo_result.get("photo_insights"),
        "quiz_insights": quiz_result.get("quiz_insights")
    }
```

#### **Multi-Model AI Integration**
```python
class AIService:
    def __init__(self):
        # Quiz Analysis: Gemini (cultural context)
        self.quiz_analyzer = QuizAnalyzerGemini()
        
        # Photo Analysis: Azure OpenAI GPT-4o
        self.photo_analyzer = PhotoAnalyzerGPT4o()
        
        # Orchestration: GPT-4o Mini (synthesis)
        self.orchestrator = AzureOpenAI()
        
        # Fallback: Gemini for backup
        self.gemini_fallback = GenerativeModel()
```

### 4. Leo AI Agent

#### **Pydantic AI Framework**
```python
# Structured AI agent with 12 specialized tools
@leo_agent.tool
async def get_complete_user_context(ctx: RunContext[LeoDeps]) -> Dict[str, Any]:
    """Load comprehensive user data for AI analysis"""
    pass

@leo_agent.tool
async def update_morning_routine(ctx: RunContext[LeoDeps], new_routine: List[str]) -> Dict[str, Any]:
    """Update user's morning routine across all days"""
    pass

@leo_agent.tool
async def apply_cbt_technique(ctx: RunContext[LeoDeps], thought_pattern: str, technique_type: str) -> Dict[str, Any]:
    """Apply Cognitive Behavioral Therapy techniques"""
    pass
```

## Performance Optimizations

### 1. Frontend Performance
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Vite with rollup visualizer
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Service worker for offline support

### 2. Backend Performance
- **Async Processing**: Non-blocking I/O operations
- **Response Caching**: 5-minute TTL for AI responses
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections

### 3. AI Performance
- **Parallel Processing**: Concurrent photo and quiz analysis
- **Model Optimization**: Context7 best practices for prompts
- **Fallback Systems**: Multiple AI providers for reliability
- **Response Validation**: Structured output validation

## Security Architecture

### 1. Authentication & Authorization
```python
# Clerk integration with JWT validation
def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    # Validate with Clerk
    user_data = verify_clerk_token(token)
    return user_data
```

### 2. Data Protection
- **Input Validation**: Pydantic models for all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM
- **XSS Protection**: Content Security Policy
- **CORS Configuration**: Restricted origins

### 3. API Security
- **Rate Limiting**: Request throttling
- **Request Validation**: Schema-based validation
- **Error Handling**: Secure error responses
- **Logging**: Audit trail for security events

## Scalability Considerations

### 1. Horizontal Scaling
- **Stateless Design**: No server-side session storage
- **Load Balancing**: Multiple API instances
- **Database Sharding**: User-based partitioning
- **CDN Integration**: Static asset distribution

### 2. Vertical Scaling
- **Resource Optimization**: Efficient memory usage
- **Connection Pooling**: Database connection management
- **Caching Layers**: Redis for session data
- **Background Jobs**: Celery for heavy processing

### 3. Monitoring & Observability
- **Health Checks**: API endpoint monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Sentry integration
- **Logging**: Structured logging with correlation IDs

## Deployment Architecture

### 1. Development Environment
```bash
# Backend
cd back
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd front
npm install
npm run dev
```

### 2. Production Environment
```yaml
# Docker Compose
version: '3.8'
services:
  backend:
    build: ./back
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/glowdb
    depends_on:
      - db
  
  frontend:
    build: ./front
    ports:
      - "80:80"
    depends_on:
      - backend
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=glowdb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
```

### 3. CI/CD Pipeline
```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd back && pytest
          cd front && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deployment steps
```

## Data Flow

### 1. Assessment Flow
```
User Input → Frontend Validation → API Request → 
AI Orchestration → Multi-Model Analysis → 
Response Synthesis → Database Storage → 
Frontend Display
```

### 2. Chat Flow
```
User Message → WebSocket → Leo Agent → 
Tool Selection → Database Query → 
AI Processing → Response Generation → 
WebSocket → Frontend Display
```

### 3. Progress Tracking Flow
```
Habit Completion → API Request → 
Database Update → Streak Calculation → 
Analytics Processing → Frontend Update
```

This architecture ensures high performance, scalability, and maintainability while providing a robust foundation for the AI-powered wellness platform. 