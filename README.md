# 🌟 GlowApp - Next-Generation AI-Powered Wellness Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4o-0078D4?style=for-the-badge&logo=microsoft)](https://azure.microsoft.com/en-us/services/openai/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

> **Revolutionary AI-powered wellness assessment platform combining clinical-grade therapeutic support with cutting-edge technology**

## 🚀 Overview

**GlowApp** (also known as "Oylan") represents the pinnacle of digital wellness technology - a sophisticated full-stack application that bridges the gap between traditional wellness apps and professional therapeutic support. Built with modern architecture and powered by multiple AI models, it provides personalized, evidence-based wellness guidance available 24/7.

### 🎯 Core Mission
Transform wellness assessment and support by combining:
- **Clinical-grade AI therapeutic interventions**
- **Advanced multi-modal health analysis**
- **Personalized action planning with dynamic updates**
- **Sophisticated progress tracking and gamification**
- **Accessible mental health support for global users**

---

## 🏗️ Architecture & Technology Stack

### **Frontend (React + TypeScript)**
```typescript
// Modern React 18 with advanced patterns
- React 18.3.1 (Concurrent Features, Suspense)
- TypeScript 5.5.4 (Strict type safety)
- Vite 5.4.2 (Ultra-fast build tool)
- Tailwind CSS 3.4.17 (Utility-first styling)
- Framer Motion 12.19.2 (Advanced animations)
- React Router 6.30.1 (Client-side routing)
- Clerk Authentication (Enterprise-grade auth)
- WebSocket (Real-time communication)
- Three.js (3D visualizations)
- i18next (Internationalization)
```

### **Backend (FastAPI + Python)**
```python
# High-performance async API
- FastAPI 0.104.1 (Modern async framework)
- SQLAlchemy 2.0.23 (Advanced ORM)
- PostgreSQL (Production database)
- Alembic (Database migrations)
- Pydantic AI 0.0.49 (Structured AI agents)
- Azure OpenAI (GPT-4o, GPT-4o Mini)
- Google Gemini AI (Additional processing)
- LangGraph (AI orchestration)
- WebSocket (Real-time features)
```

### **AI & Machine Learning**
```python
# Multi-model AI orchestration
- Azure OpenAI GPT-4o (Photo analysis)
- Azure OpenAI GPT-4o Mini (Efficient orchestration)
- Google Gemini 2.0 Flash (Quiz analysis)
- Pydantic AI Agent Framework (Structured AI)
- Advanced scoring algorithms
- Demographic normalization
- Pattern recognition across domains
```

---

## 🌟 Key Features & Capabilities

### **1. Advanced Assessment System**
- **17-question comprehensive wellness quiz** covering physical vitality, emotional health, and visual appearance
- **Multi-modal photo analysis** using Azure OpenAI GPT-4o Vision for facial wellness markers
- **Demographic normalization** with country-specific health baselines (US, UK, CA, AU, DE, FR, JP, KR, CN, IN, BR, MX)
- **Age-adjusted scoring** with exponential decay curves (5% physical, 2% emotional, 8% visual per decade)
- **Gender-specific adjustments** based on research-backed differences
- **Cultural context integration** for personalized insights

### **2. Leo - AI Wellness Mentor**
```python
# Therapeutic-grade AI agent with 12 specialized tools
- Cognitive Behavioral Therapy (CBT) techniques
- Motivational Interviewing for behavior change
- Solution-Focused Therapy approaches
- Crisis intervention with safety protocols
- Pattern recognition across wellness domains
- Dynamic plan management with version control
- Real-time therapeutic conversations
```

### **3. Sophisticated Progress Tracking**
- **GitHub-style contribution graphs** for habit visualization
- **Streak tracking** with motivational algorithms
- **Custom habit creation** with trigger-action-reward framework
- **Progress snapshots** for milestone celebration
- **Completion analytics** with pattern recognition
- **Real-time progress updates** via WebSocket

### **4. Advanced Plan Management**
- **7-day personalized plans** with morning routines and daily activities
- **Dynamic plan updates** through natural language conversation
- **Version history** with backup and restoration capabilities
- **Multi-day modifications** with intelligent field mapping
- **Real calendar integration** with actual dates
- **Atomic changes** with rollback capabilities

---

## 🔧 Technical Excellence

### **Performance Optimizations**
```python
# Async parallel processing with caching
- LangGraph pipeline with asyncio optimization
- Response caching with 5-minute TTL
- Parallel photo and quiz analysis
- Optimized prompts using Context7 best practices
- Background task processing for AI operations
- Code splitting with lazy loading
```

### **AI Orchestration Architecture**
```python
# Multi-model AI orchestration
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

### **Advanced Scoring System**
```python
# Evidence-based scoring with demographic normalization
class AdvancedScoringService:
    # Country-specific health modifiers
    COUNTRY_HEALTH_MODIFIERS = {
        "US": {"physical": 0.92, "mental": 0.88, "social": 0.85},
        "JP": {"physical": 1.02, "mental": 0.87, "social": 0.89},
        # ... 12 countries with research-backed adjustments
    }
    
    # Age-adjusted baselines with exponential decay
    AGE_DECLINE_RATES = {
        "physicalVitality": 0.05,    # 5% decline per decade
        "emotionalHealth": 0.02,     # 2% decline per decade
        "visualAppearance": 0.08,    # 8% decline per decade
    }
```

### **Real-time Communication**
```typescript
// WebSocket-based real-time chat with Leo
const LeoChatWidget: React.FC = () => {
  const { sendMessage, lastMessage } = useWebSocket(WS_URL);
  
  // Drag-and-drop positioning
  const [position, setPosition] = useState({ x: 24, y: 24 });
  
  // Session persistence
  const [sessionId] = useState(() => 
    localStorage.getItem(`leo_widget_session_${user?.id}`) || 
    `leo_widget_${Date.now()}_${Math.random().toString(36)}`
  );
};
```

---

## 🏥 Clinical & Therapeutic Features

### **AI Therapeutic Capabilities**
- **CBT Techniques**: Thought challenging, behavioral experiments, cognitive restructuring
- **Motivational Interviewing**: Open-ended questions, affirmations, reflective listening, change talk
- **Solution-Focused Approach**: Exception finding, scaling questions, future-focused interventions
- **Crisis Intervention**: Safety detection, de-escalation techniques, resource provision
- **Emotional State Detection**: Real-time emotional analysis and appropriate responses

### **Wellness Insights & Analysis**
- **Cross-domain pattern recognition** (sleep-stress-energy cycles)
- **Biological age vs chronological age** analysis
- **Emotional wellness assessment** with specific interventions
- **Visual appearance markers** for aging and health indicators
- **Personalized micro-habits** based on assessment data

---

## 📊 Data & Analytics

### **Assessment Data Structure**
```sql
-- Comprehensive wellness assessment
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
    quiz_answers JSONB
);
```

### **Progress Tracking Schema**
```sql
-- Sophisticated habit tracking
CREATE TABLE habit_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    habit_type VARCHAR(50) NOT NULL,
    habit_content TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    day_date DATE NOT NULL,
    notes TEXT
);

-- Plan version history for rollbacks
CREATE TABLE plan_version_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES daily_plans(id),
    version_number INTEGER NOT NULL,
    plan_json JSONB NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_description TEXT,
    changed_fields JSONB,
    previous_values JSONB,
    new_values JSONB
);
```

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.9+
- Node.js 18+
- PostgreSQL 15+
- Azure OpenAI account
- Google Gemini API key
- Clerk authentication account

### **Backend Setup**
```bash
# Clone repository
git clone https://github.com/your-org/glowapp.git
cd glowapp/back

# Install dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Configure your .env file with API keys

# Database setup
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**
```bash
cd ../front

# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Configure your .env file

# Run development server
npm run dev
```

### **Environment Variables**
```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/glowdb

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_KEY=your_jwt_key

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/chat
```

---

## 🔐 Security & Authentication

### **Authentication Flow**
- **Clerk Integration**: Enterprise-grade authentication
- **JWT Tokens**: Secure API access
- **WebSocket Authentication**: Real-time feature security
- **Database Security**: Proper user isolation
- **API Rate Limiting**: Request validation and throttling

### **Data Protection**
- **Environment-based Configuration**: Secure credential management
- **Input Validation**: Pydantic models for data validation
- **SQL Injection Prevention**: SQLAlchemy ORM protection
- **CORS Configuration**: Cross-origin request security

---

## 🌍 Internationalization

### **Multi-language Support**
- **English**: Primary language with full feature support
- **Russian**: Complete localization
- **Cultural Adaptations**: Country-specific health baselines
- **Localized Content**: User interfaces and wellness content

### **Cultural Wellness Integration**
```python
# Country-specific health baseline adjustments
COUNTRY_HEALTH_MODIFIERS = {
    "US": {"physical": 0.92, "mental": 0.88, "social": 0.85},  # Lifestyle diseases
    "JP": {"physical": 1.02, "mental": 0.87, "social": 0.89},  # High longevity, work stress
    "FR": {"physical": 0.98, "mental": 0.91, "social": 0.94},  # Mediterranean diet effect
    # ... 12 countries with research-backed adjustments
}
```

---

## 📱 User Experience

### **Progressive Web App Features**
- **Responsive Design**: Optimized for all device sizes
- **Drag-and-Drop Chat Widget**: Interactive Leo AI interface
- **Real-time Updates**: WebSocket-powered live features
- **Smooth Animations**: Framer Motion transitions
- **Offline Capabilities**: Progressive enhancement

### **Personalization Engine**
- **User-specific Insights**: Assessment data-driven recommendations
- **Adaptive Plans**: Evolution based on progress patterns
- **Custom Habit Creation**: Personal trigger-action-reward systems
- **Therapeutic Conversations**: Tailored to individual needs

---

## 🔧 Advanced Technical Features

### **Performance Optimizations**
```typescript
// Code splitting with lazy loading
const DashboardScreen = lazy(() => 
  import('./components/screens/DashboardScreen')
    .then(m => ({ default: m.DashboardScreen }))
);

// WebSocket connection management
const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
  onOpen: () => console.log('Connected to Leo'),
  onMessage: (event) => handleLeoResponse(event.data),
  onError: (error) => console.error('WebSocket error:', error),
  shouldReconnect: (closeEvent) => true,
});
```

### **Scalability Architecture**
- **Microservice-ready**: Modular service architecture
- **Database Migrations**: Alembic for schema evolution
- **Environment Configuration**: Multi-environment support
- **Docker Containerization**: Production deployment ready
- **Load Balancing**: Horizontal scaling considerations

---

## 📈 Business Value & Impact

### **Revolutionary Approach**
This platform represents a **paradigm shift in digital wellness** by combining:

1. **Clinical-grade therapeutic support** through AI
2. **Comprehensive wellness assessment** with scientific rigor
3. **Personalized action planning** with dynamic updates
4. **Progress tracking** with gamification elements
5. **Accessible mental health support** available 24/7

### **Target Impact**
- **Global Wellness Access**: Making professional-grade support available worldwide
- **Preventive Health**: Early intervention through pattern recognition
- **Personalized Care**: AI-driven customization for individual needs
- **Therapeutic Innovation**: Bridging traditional and digital therapeutic approaches

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Backend development
cd back
pip install -r requirements.txt
pre-commit install

# Frontend development
cd front
npm install
npm run lint
npm run type-check
```

### **Testing**
```bash
# Backend tests
cd back
pytest

# Frontend tests
cd front
npm test
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Azure OpenAI** for advanced AI capabilities
- **Google Gemini** for additional AI processing
- **Clerk** for enterprise authentication
- **FastAPI** for high-performance API development
- **React** for modern frontend development
- **Tailwind CSS** for utility-first styling

---

## 📞 Support

- **Documentation**: [docs.glowapp.com](https://docs.glowapp.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/glowapp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/glowapp/discussions)
- **Email**: support@glowapp.com

---

<div align="center">

**🌟 Built with ❤️ for global wellness transformation 🌟**

*Empowering individuals worldwide with AI-powered therapeutic support*

</div> 