import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useApi } from '../../utils/useApi';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  Smile, 
  Camera, 
  Sparkles,
  User,
  Bot,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { AssessmentResults } from '../../types';

// Character personalization
const AI_CHARACTER_NAME = "Leo";

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat";

interface AIChatScreenProps {
  onBack?: () => void;
}

export const AIChatScreen: React.FC<AIChatScreenProps> = ({ onBack }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { t } = useTranslation();
  
  // Consolidated state management
  const [chatState, setChatState] = useState<ChatState>({
    messages: [{
      id: 0,
      user_id: 'ai',
      session_id: 'welcome',
      role: 'ai',
      content: "I'm Leo. Your future self asked me to help you get there.",
      timestamp: new Date().toISOString()
    }],
    input: '',
    loading: false,
    error: null
  });
  
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // 🧠 Fetch user's assessment data for intelligent prompts
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await makeRequest('assessment', { method: 'GET' });
        if (response) {
          setResults(response);
          console.log('🧠 Assessment data loaded for intelligent prompts:', response);
        }
      } catch (error) {
        console.log('No assessment data available for intelligent prompts');
      }
    };

    fetchAssessmentData();
  }, [user?.id, makeRequest]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didUnmount = useRef(false);

  // 🧠 INTELLIGENT PROMPT SYSTEM - Context-aware prompts based on user's wellness state
  const suggestedPrompts = useMemo(() => {
    if (!results) {
      // Fallback prompts when no assessment data is available
      return [
        `Ask ${AI_CHARACTER_NAME} about my energy today`,
        `What does ${AI_CHARACTER_NAME} think I should focus on?`,
        `Tell ${AI_CHARACTER_NAME} about my biggest challenge`,
        `Ask ${AI_CHARACTER_NAME} for a quick pep talk`
      ];
    }

    // Extract wellness data for intelligent prompt generation
    const categoryScores = results.categoryScores || {};
    const physicalVitality = categoryScores.physicalVitality || 0;
    const emotionalHealth = categoryScores.emotionalHealth || 0;
    const visualAppearance = categoryScores.visualAppearance || 0;
    const overallScore = results.overallGlowScore || 0;
    const archetype = results.glowUpArchetype?.name || '';
    const microHabits = results.microHabits || [];

    // Determine user's primary wellness focus areas
    const lowestScore = Math.min(physicalVitality, emotionalHealth, visualAppearance);
    const highestScore = Math.max(physicalVitality, emotionalHealth, visualAppearance);
    
    // Create intelligent prompts based on wellness state
    const intelligentPrompts = [];

    // Energy & Vitality Focus (if physical vitality is low)
    if (physicalVitality < 70) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} how to boost my energy (currently ${physicalVitality}/100)`,
        `What does ${AI_CHARACTER_NAME} suggest for my physical vitality?`
      );
    } else {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} how to maintain my great energy levels`,
        `What does ${AI_CHARACTER_NAME} think about my physical wellness progress?`
      );
    }

    // Emotional Wellness Focus (if emotional health is low)
    if (emotionalHealth < 70) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} for help with my emotional balance (${emotionalHealth}/100)`,
        `What does ${AI_CHARACTER_NAME} suggest for stress management?`
      );
    } else {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} how to maintain my emotional well-being`,
        `What does ${AI_CHARACTER_NAME} think about my mental health journey?`
      );
    }

    // Visual & Confidence Focus (if visual appearance is low)
    if (visualAppearance < 70) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} about my appearance confidence (${visualAppearance}/100)`,
        `What does ${AI_CHARACTER_NAME} suggest for my visual wellness?`
      );
    } else {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} how to enhance my natural radiance`,
        `What does ${AI_CHARACTER_NAME} think about my appearance journey?`
      );
    }

    // Overall Progress & Motivation
    if (overallScore < 70) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} for a personalized pep talk (${overallScore}/100)`,
        `What does ${AI_CHARACTER_NAME} think I should prioritize right now?`
      );
    } else {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} how to maintain my wellness momentum`,
        `What does ${AI_CHARACTER_NAME} think about my transformation progress?`
      );
    }

    // Archetype-specific prompts
    if (archetype) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} about my ${archetype} archetype journey`,
        `What does ${AI_CHARACTER_NAME} think about my ${archetype} potential?`
      );
    }

    // Habit-focused prompts
    if (microHabits.length > 0) {
      intelligentPrompts.push(
        `Ask ${AI_CHARACTER_NAME} about my current habits: ${microHabits.slice(0, 2).join(', ')}`,
        `What does ${AI_CHARACTER_NAME} suggest for my habit development?`
      );
    }

    // Return the most relevant prompts (prioritize areas that need attention)
    const priorityPrompts = [];
    
    // Add lowest score area first
    if (physicalVitality === lowestScore && physicalVitality < 70) {
      priorityPrompts.push(intelligentPrompts.find(p => p.includes('energy') || p.includes('physical')));
    } else if (emotionalHealth === lowestScore && emotionalHealth < 70) {
      priorityPrompts.push(intelligentPrompts.find(p => p.includes('emotional') || p.includes('stress')));
    } else if (visualAppearance === lowestScore && visualAppearance < 70) {
      priorityPrompts.push(intelligentPrompts.find(p => p.includes('appearance') || p.includes('visual')));
    }
    
    // Add overall motivation prompt
    priorityPrompts.push(intelligentPrompts.find(p => p.includes('pep talk') || p.includes('prioritize')));
    
    // Add archetype-specific prompt
    if (archetype) {
      priorityPrompts.push(intelligentPrompts.find(p => p.includes(archetype)));
    }
    
    // Add habit-focused prompt
    if (microHabits.length > 0) {
      priorityPrompts.push(intelligentPrompts.find(p => p.includes('habits')));
    }

    // Filter out undefined and return unique prompts
    return priorityPrompts.filter((prompt): prompt is string => 
      prompt !== undefined && prompt !== null
    ).filter((prompt, index, arr) => 
      arr.indexOf(prompt) === index
    ).slice(0, 4);
  }, [results, AI_CHARACTER_NAME]);

  // Memoized user display name
  const userDisplayName = useMemo(() => {
    return userData?.first_name || user?.firstName || 'there';
  }, [userData?.first_name, user?.firstName]);

  // Dynamic WebSocket URL with authentication token
  const getSocketUrl = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return `${WS_BASE_URL}?token=${token}`;
    } catch (error) {
      console.error('Error getting authentication token:', error);
      throw new Error('Authentication failed');
    }
  }, [getToken]);

  // WebSocket connection with react-use-websocket
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(getSocketUrl, {
    shouldReconnect: (closeEvent) => {
      // Don't reconnect if component is unmounting
      if (didUnmount.current) return false;
      
      // Don't reconnect on normal closure
      if (closeEvent.code === 1000) return false;
      
      // Reconnect on other closure codes
      return true;
    },
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 10s, 10s...
      return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
    },
    onOpen: () => {
      console.log('WebSocket connected successfully');
      setChatState(prev => ({ ...prev, error: null }));
    },
    onClose: (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setChatState(prev => ({ ...prev, loading: false }));
      
      if (event.code !== 1000) {
        setChatState(prev => ({ 
          ...prev, 
          error: `Connection lost (${event.code}). Reconnecting...` 
        }));
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setChatState(prev => ({ 
        ...prev, 
        error: 'Connection error. Please check your internet connection.',
        loading: false 
      }));
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setChatState(prev => ({ 
          ...prev, 
          error: 'Received invalid message format',
          loading: false 
        }));
      }
    },
    retryOnError: true,
    heartbeat: {
      message: 'ping',
      returnMessage: 'pong',
      timeout: 30000, // 30 seconds
      interval: 25000, // 25 seconds
    },
  });

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "history") {
      // Preserve Leo's welcome message and add server messages after it
      const welcomeMessage = {
        id: 0,
        user_id: 'ai',
        session_id: 'welcome',
        role: 'ai' as const,
        content: "I'm Leo. Your future self asked me to help you get there.",
        timestamp: new Date().toISOString()
      };
      
      setChatState(prev => ({ 
        ...prev, 
        messages: [welcomeMessage, ...(data.messages || [])]
      }));
    } else if (data.type === "user" || data.type === "ai") {
      if (data.message) {
        setChatState(prev => ({ 
          ...prev, 
          messages: [...prev.messages, data.message],
          loading: false 
        }));
      }
    } else if (data.type === "error") {
      setChatState(prev => ({ 
        ...prev, 
        error: data.message || 'Server error occurred',
        loading: false 
      }));
    }
  }, []);

  // Fetch user data and results
  const fetchUserData = useCallback(async () => {
    try {
      const userInfo = await makeRequest('me');
      setUserData(userInfo);
      
      try {
        const resultsData = await makeRequest('results');
        setResults(resultsData);
      } catch (resultsErr: any) {
        if (resultsErr?.response?.status !== 404) {
          console.error('Error fetching results:', resultsErr);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [makeRequest]);

  // Send message function
  const sendChatMessage = useCallback((content: string) => {
    if (readyState === ReadyState.OPEN && content.trim() && !chatState.loading) {
      setChatState(prev => ({ ...prev, loading: true }));
      sendJsonMessage({ content: content.trim() });
      setChatState(prev => ({ ...prev, input: '' }));
    } else if (readyState !== ReadyState.OPEN) {
      setChatState(prev => ({ 
        ...prev, 
        error: 'Connection not available. Please wait for reconnection.' 
      }));
    }
  }, [readyState, chatState.loading, sendJsonMessage]);

  // Handle send button click
  const handleSend = useCallback(() => {
    if (chatState.input.trim()) {
      sendChatMessage(chatState.input);
    }
  }, [chatState.input, sendChatMessage]);

  // Handle keyboard events
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle suggested prompt clicks
  const handleSuggestedPrompt = useCallback((prompt: string) => {
    sendChatMessage(prompt);
  }, [sendChatMessage]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatState(prev => ({ ...prev, input: e.target.value }));
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        return 'Connecting...';
      case ReadyState.OPEN:
        return 'Connected';
      case ReadyState.CLOSING:
        return 'Disconnecting...';
      case ReadyState.CLOSED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }, [readyState]);

  // Avatar state calculation
  const getAvatarState = useCallback(() => {
    if (!results) return 'default';
    
    const emotionalHealth = results.categoryScores.emotionalHealth;
    const glowScore = results.overallGlowScore;
    
    if (emotionalHealth < 50) return 'tired';
    if (glowScore > 80) return 'glowing';
    return 'normal';
  }, [results]);

  // Avatar background calculation
  const getAvatarBackground = useCallback(() => {
    const state = getAvatarState();
    switch (state) {
      case 'tired':
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
      case 'glowing':
        return 'bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-400 animate-pulse';
      default:
        return 'bg-gradient-to-br from-blue-400 to-purple-600';
    }
  }, [getAvatarState]);

  // Navigation handler
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  }, [onBack, navigate]);

  // Retry connection
  const handleRetry = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
    // The library will automatically attempt to reconnect
    const ws = getWebSocket();
    if (ws && ws.readyState === WebSocket.CLOSED) {
      // Force a new connection attempt
      window.location.reload();
    }
  }, [getWebSocket]);

  // Effects
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messages]);

  // Focus input when connected
  useEffect(() => {
    if (inputRef.current && readyState === ReadyState.OPEN) {
      inputRef.current.focus();
    }
  }, [readyState]);

  // Error display component
  const ErrorDisplay = () => (
    <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
      <span className="text-red-700 text-sm">{chatState.error}</span>
      <button
        onClick={handleRetry}
        className="ml-2 p-1 text-red-600 hover:text-red-800 transition-colors"
        title="Retry connection"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <div 
        className={`w-2 h-2 rounded-full ${
          readyState === ReadyState.OPEN ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span>{getConnectionStatus()}</span>
    </div>
  );

  return (
    <div className="relative sm:ml-[var(--sidebar-width)] min-h-screen aurora-bg flex flex-col lg:flex-row transition-all duration-300 overflow-hidden">
      {/* Header - Mobile Only */}
      {isMobile && (
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Chat with {AI_CHARACTER_NAME}</h1>
            <p className="text-xs text-gray-600">Your personal wellness companion</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Avatar Section - Fixed Left Panel (35%) */}
      <section className="hidden lg:block lg:w-[35%] lg:fixed lg:left-[var(--sidebar-width)] lg:top-0 lg:h-screen lg:flex lg:items-start lg:justify-center lg:pt-[5%] lg:p-8 lg:z-20" aria-label={`${AI_CHARACTER_NAME} avatar section`}> 
        {/* Main Avatar Container */}
        <div className="relative w-full max-w-[500px] h-[600px] flex flex-col items-center">
          {/* Simple Character Header */}
          <div className="w-full text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{AI_CHARACTER_NAME}</h2>
              <div className="flex items-center gap-1">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    readyState === ReadyState.OPEN ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-500 font-medium">
                  {readyState === ReadyState.OPEN ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-base text-gray-600">Your Personal AI Mentor</p>
          </div>

          {/* Avatar Display - Natural Shape */}
          <div className="relative w-[400px] h-[500px] xl:w-[450px] xl:h-[550px]">
            {/* Subtle Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-3xl blur-xl" />
            
            {/* Main Avatar Container - Natural Shape */}
            <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/Oylan.png"
                className="max-w-full max-h-full object-contain rounded-3xl"
                alt={`${AI_CHARACTER_NAME} avatar`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center text-white font-semibold text-2xl rounded-3xl ' + getAvatarBackground();
                  fallback.textContent = AI_CHARACTER_NAME;
              target.parentNode?.appendChild(fallback);
            }}
          />
            </div>
          </div>
          
          {/* Simple Character Info */}
          <div className="w-full mt-6 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Always Here for You</h3>
            </div>
          </div>
        </div>

        {/* Minimal Background Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-100/10 to-pink-100/10 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-xl" />
        </div>
      </section>

      {/* Mobile Avatar - Only visible on mobile */}
      <section className="lg:hidden w-full flex flex-col items-center p-4 relative" aria-label={`${AI_CHARACTER_NAME} avatar section`}>
        {/* Simple Character Header - Mobile */}
        <div className="w-full text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{AI_CHARACTER_NAME}</h2>
            <div className="flex items-center gap-1">
              <div 
                className={`w-1.5 h-1.5 rounded-full ${
                  readyState === ReadyState.OPEN ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-500 font-medium">
                {readyState === ReadyState.OPEN ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Your Personal AI Mentor</p>
        </div>

        {/* Avatar Display - Mobile Natural Shape */}
        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-2xl blur-lg" />
          
          {/* Main Avatar Container - Natural Shape */}
          <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/Oylan.png"
              className="max-w-full max-h-full object-contain rounded-2xl"
              alt={`${AI_CHARACTER_NAME} avatar`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center text-white font-semibold text-lg rounded-2xl ' + getAvatarBackground();
                fallback.textContent = AI_CHARACTER_NAME;
              target.parentNode?.appendChild(fallback);
            }}
          />
          </div>
        </div>
          
        {/* Simple Character Info - Mobile */}
        <div className="w-full max-w-sm mt-4 bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/50">
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900">Always Here for You</h3>
          </div>
        </div>
      </section>

      {/* Chat Section - Right Panel (65% on desktop, full width on mobile) */}
      <main className="flex-1 lg:ml-[35%] lg:w-[65%] flex flex-col relative" role="main" aria-label="Chat conversation">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-40 left-10 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-xl" />
        </div>

        {/* Connection Status Bar */}
        <div className="px-4 lg:px-6 pt-4 relative z-10">
          {/* Connection status removed */}
        </div>

        {/* Error Display */}
        {chatState.error && <ErrorDisplay />}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 relative z-10" role="log" aria-live="polite">
          {/* Messages - Transparent style */}
          {chatState.messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              role="article"
              aria-label={`${msg.role === "user" ? "Your message" : `${AI_CHARACTER_NAME}'s response`}`}
            >
              <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg border ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-white/90 border-gray-200 text-gray-800"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator - Transparent style */}
          {chatState.loading && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="max-w-[80%]">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" aria-hidden="true" />
                    <span className="text-sm text-gray-600">{AI_CHARACTER_NAME} is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 🧠 Intelligent Prompt Buttons - Context-aware suggestions */}
        {chatState.messages.length > 0 && !chatState.loading && readyState === ReadyState.OPEN && (
          <div className="px-4 lg:px-6 pb-4 relative z-10">
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium">
                {results ? '🧠 Personalized suggestions based on your wellness profile' : '💡 Quick conversation starters'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Intelligent conversation starters">
              {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className={`backdrop-blur-md border rounded-full px-4 py-2 text-sm transition-all duration-200 shadow-lg ${
                    results 
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300' 
                      : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white hover:border-purple-300'
                  }`}
                  disabled={chatState.loading || readyState !== ReadyState.OPEN}
                >
                  {prompt}
                </button>
              ))}
            </div>
            {results && (
              <div className="mt-2">
                <p className="text-xs text-gray-400">
                  Based on your scores: Physical {results.categoryScores?.physicalVitality || 0}/100, 
                  Emotional {results.categoryScores?.emotionalHealth || 0}/100, 
                  Visual {results.categoryScores?.visualAppearance || 0}/100
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input Area - Transparent style */}
        <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-md p-4 lg:p-6 relative z-10">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={chatState.input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={readyState === ReadyState.OPEN ? `Message ${AI_CHARACTER_NAME}...` : "Connecting..."}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500 resize-none"
                disabled={chatState.loading || readyState !== ReadyState.OPEN}
                aria-label="Type your message"
                aria-describedby={chatState.loading ? "loading-status" : undefined}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Mood picker"
                  aria-label="Open mood picker"
                  disabled={chatState.loading || readyState !== ReadyState.OPEN}
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Voice input"
                  aria-label="Voice input"
                  disabled={chatState.loading || readyState !== ReadyState.OPEN}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Take photo"
                  aria-label="Take photo"
                  disabled={chatState.loading || readyState !== ReadyState.OPEN}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={chatState.loading || !chatState.input.trim() || readyState !== ReadyState.OPEN}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400/50 disabled:to-gray-500/50 text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed backdrop-blur-md"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {chatState.loading && (
            <div id="loading-status" className="sr-only">{AI_CHARACTER_NAME} is processing your message</div>
          )}
        </footer>
      </main>
    </div>
  );
};