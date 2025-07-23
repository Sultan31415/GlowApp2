# 🔍 Problem Analysis & Personalized AI Mentor System

## Overview

We've implemented a comprehensive system that analyzes users' quiz data to identify specific problems, hidden patterns, and disconnects, then provides personalized AI mentor prompts to help users discover issues they might not be aware of.

## 🎯 User Journey Flow

### 1. User sees Dashboard with their scores
- Physical Vitality: 45/100 (low energy, poor nutrition)
- Emotional Health: 35/100 (high stress, social isolation) 
- Visual Appearance: 50/100 (poor self-image)

### 2. Enhanced AI Mentor Section appears with:
- **Problem indicators**: "Energy Issues Detected", "Stress Patterns Found", "Self-Image Concerns"
- **Compelling messaging**: "Leo has analyzed your complete wellness profile and identified patterns you might not see"
- **Suggested questions preview**: "What problems am I not seeing?", "Why am I always tired?", "What's holding me back?"

### 3. User clicks "Talk to Leo" → Goes to AI Chat

### 4. AI Chat shows personalized problem-focused prompts:
- "Leo, what problems do I have that I'm not even aware of?"
- "Why am I always so tired even when I sleep?"
- "What's really causing my energy crashes?"
- "Leo, what stress patterns am I blind to?"
- "Why don't I like what I see in the mirror?"
- "What's the connection between my diet, activity, and energy levels?"

### 5. User clicks a prompt → Leo analyzes their data and reveals specific insights

## 🧠 Technical Implementation

### Backend Components

#### 1. New Leo Tool: `analyze_quiz_problems_and_patterns`
**Location**: `back/app/services/leo_pydantic_agent.py`

**What it does**:
- Analyzes quiz answers to identify specific problems (chronic fatigue, poor sleep, stress issues, etc.)
- Detects hidden patterns (stress-sleep-energy cycles, appearance-social withdrawal, etc.)  
- Generates personalized problem-focused prompts
- Identifies biological concerns (accelerated aging)

**Example analysis for user with low scores**:
```python
{
  "identified_problems": [
    {
      "category": "chronic_fatigue", 
      "problem": "Chronic low energy and fatigue",
      "description": "You're experiencing persistent fatigue affecting daily life",
      "quiz_evidence": "Energy level rated 2/5",
      "suggested_prompts": [
        "Why am I always so tired even when I sleep?",
        "What's really causing my energy crashes?"
      ]
    },
    {
      "category": "chronic_stress",
      "problem": "Poor stress management affecting multiple life areas", 
      "description": "Unmanaged stress is cascading into other health problems",
      "quiz_evidence": "Stress management rated 2/5"
    }
  ],
  "hidden_patterns": [
    {
      "pattern_name": "stress_exhaustion_cycle",
      "description": "You're caught in a cycle where stress disrupts sleep, poor sleep reduces energy, and low energy increases stress vulnerability"
    }
  ],
  "personalized_prompts": [
    "Why am I always so tired even when I sleep?",
    "Leo, what stress patterns am I blind to?", 
    "Leo, I'm stuck in a cycle of stress, poor sleep, and exhaustion. What's the way out?"
  ]
}
```

#### 2. New API Endpoint: `/ai-mentor-prompts`
**Location**: `back/app/api/endpoints.py`

**What it does**:
- Calls Leo's problem analysis tool
- Returns personalized prompts, identified problems, and hidden patterns
- Provides fallback prompts if analysis fails

**Response format**:
```json
{
  "personalized_prompts": [
    "Leo, what problems do I have that I'm not even aware of?",
    "Why am I always so tired even when I sleep?",
    "What's really causing my energy crashes?"
  ],
  "user_problems": [
    {
      "category": "chronic_fatigue",
      "problem": "Chronic low energy and fatigue",
      "description": "You're experiencing persistent fatigue affecting daily life"
    }
  ],
  "hidden_patterns": [
    {
      "name": "stress_exhaustion_cycle", 
      "description": "Stress → Poor sleep → Low energy → More stress vulnerability"
    }
  ],
  "has_assessment": true,
  "assessment_scores": {
    "physicalVitality": 45,
    "emotionalHealth": 35,
    "visualAppearance": 50
  }
}
```

#### 3. Enhanced Leo System Prompt
**Location**: `back/app/services/leo_pydantic_agent.py`

**Key additions**:
- Emphasis on proactive problem identification
- Specific guidance on when to use the new analysis tool
- Examples of how to connect quiz data to user insights

### Frontend Components

#### 1. Enhanced Dashboard AI Mentor Section
**Location**: `front/src/components/screens/DashboardScreen.tsx`

**New features**:
- Dynamic problem indicators based on user scores
- Compelling messaging about pattern identification
- Preview of suggested questions
- More prominent call-to-action

#### 2. Enhanced AI Chat Interface  
**Location**: `front/src/components/screens/AIChatScreen.tsx`

**New features**:
- Fetches personalized prompts from API on load
- Displays identified problems in special orange section
- Prioritizes problem-focused prompts over generic ones
- Shows hidden patterns discovered in user data

## 🎭 Example User Scenarios

### Scenario 1: Chronically Tired User
**Quiz Data**: Energy=2/5, Sleep=2/5, Water=2/5, Activity=1/5

**Problems Identified**:
- Chronic fatigue from poor lifestyle choices
- Dehydration affecting energy levels  
- Sedentary lifestyle creating energy drain

**Personalized Prompts**:
- "Why am I always so tired even when I sleep?"
- "Leo, how is dehydration affecting me that I don't realize?"
- "What's the connection between my diet, activity, and energy levels?"

**Leo's Response**: "I analyzed your wellness data and found a clear pattern. You're drinking only 2 glasses of water daily and rated your activity level as 1/5. This combination creates a perfect storm for chronic fatigue - dehydration reduces cognitive function and energy, while lack of movement decreases circulation and endorphins. Your body is essentially running on empty fuel..."

### Scenario 2: Stressed Perfectionist  
**Quiz Data**: Stress=1/5, EmotionalHealth=2/5, SocialConnections=2/5, SelfImage=3/5

**Problems Identified**:
- Chronic stress affecting multiple life areas
- Social isolation despite perfectionist tendencies
- Emotional instability from unmanaged stress

**Hidden Patterns**:
- Perfectionism creating social withdrawal
- Stress manifesting as control issues

**Personalized Prompts**:
- "Leo, what stress patterns am I blind to?"
- "Why does stress control my life instead of me controlling stress?"
- "Is my perfectionism making me avoid social situations?"

**Leo's Response**: "Looking at your data, I see a fascinating pattern. You rated stress management at 1/5 and social connections at 2/5. Often, perfectionism becomes a coping mechanism for stress, but it backfires by making us avoid social situations where we might not be 'perfect.' This isolation then increases stress. You're caught in a cycle where your coping strategy is actually feeding the problem..."

### Scenario 3: Low Self-Image User
**Quiz Data**: Appearance=2/5, SocialConnections=2/5, EmotionalHealth=3/5

**Problems Identified**:
- Poor self-image affecting confidence
- Social withdrawal due to appearance concerns

**Hidden Patterns**:
- Appearance anxiety reinforcing social isolation

**Personalized Prompts**:
- "Why don't I like what I see in the mirror?"
- "Leo, is my poor self-image making me avoid social situations?"
- "What's behind my negative self-image?"

## 🚀 Benefits of This System

### For Users:
1. **Self-Discovery**: Users discover problems they didn't know they had
2. **Data-Driven Insights**: Concrete evidence from their own responses
3. **Personalized Support**: AI mentor knows their specific challenges
4. **Pattern Recognition**: See hidden connections between different life areas
5. **Actionable Guidance**: Specific problems lead to specific solutions

### For the App:
1. **Increased Engagement**: Users want to understand their problems
2. **Stickiness**: Data-driven insights are compelling and unique
3. **Value Differentiation**: No other app provides this level of personal analysis
4. **User Retention**: People return to explore more insights
5. **Social Sharing**: Users share interesting discoveries about themselves

## 🎯 Key Features

### 1. **Problem-Focused Prompts**
Instead of generic "How are you feeling?", users get:
- "Why am I always so tired even when I sleep?"
- "What's really causing my energy crashes?"
- "Leo, what stress patterns am I blind to?"

### 2. **Visual Problem Indicators**  
Dashboard shows specific badges:
- "Energy Issues Detected" (if Physical Vitality < 70)
- "Stress Patterns Found" (if Emotional Health < 70) 
- "Self-Image Concerns" (if Visual Appearance < 70)
- "Accelerated Aging" (if Biological Age > Chronological + 2)

### 3. **Hidden Pattern Recognition**
System identifies patterns like:
- Stress → Poor Sleep → Low Energy → More Stress
- Poor Self-Image → Social Withdrawal → Worse Self-Image
- Sedentary Lifestyle → Poor Nutrition → Energy Drain

### 4. **Data-Driven Therapeutic Responses**
Leo provides insights like:
- "Your quiz shows you rated water intake as 2/5 and energy as 2/5 - this 80% correlation suggests dehydration is a major factor in your fatigue"
- "You scored stress as 1/5 but sleep as 4/5 - this disconnect reveals how stress is hiding in your life"

## 🔧 Technical Flow

1. User completes assessment → Quiz answers stored in database
2. User views dashboard → Sees their scores + AI mentor section with problem indicators  
3. User clicks "Talk to Leo" → Frontend fetches personalized prompts from `/ai-mentor-prompts`
4. API calls Leo's `analyze_quiz_problems_and_patterns` tool → Analyzes quiz data
5. Frontend displays personalized problem-focused prompts + identified issues
6. User clicks prompt → Leo uses data to provide specific insights about their problems
7. Leo continues conversation using therapeutic techniques informed by their specific data

## 🎯 Success Metrics

### Engagement Metrics:
- Increased click-through rate from Dashboard → AI Chat
- Longer conversation sessions in AI Chat
- Higher prompt click rates (problem-focused vs generic)
- More return visits to AI Chat feature

### User Satisfaction Metrics:
- User feedback on insights quality
- Self-reported "aha moments" from problem discovery
- User sharing of insights on social media
- NPS scores for AI mentor feature

### Business Metrics:
- Increased daily/weekly active users
- Improved user retention rates
- Higher feature adoption rates
- Increased time spent in app

This implementation transforms the AI mentor from a generic chatbot into a personalized problem-solving partner that knows the user's specific challenges and can guide them toward solutions with unprecedented precision. 