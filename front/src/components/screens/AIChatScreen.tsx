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
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

// Character personalization
const AI_CHARACTER_NAME = "Leo";
// Remove WELCOME_MESSAGE constant, use t('aiChat.header', { name: AI_CHARACTER_NAME }) directly in render and state initialization
// Insert a shared welcome message constant
const WELCOME_MESSAGE = "I'm Leo. Your future self asked me to help you get there.";

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface WellnessInsights {
  key_insight?: string;
  actionable_advice?: string;
  priority?: string;
  category?: string;
  [key: string]: any;
}

interface FollowUpQuestions {
  type: 'follow_up';
  questions: string[];
}

interface AgentInsights {
  insights: WellnessInsights;
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

// Utility to filter out (Refusal: true) or similar patterns from AI message content
function filterRefusalText(content: string): string {
  // Remove (Refusal: true)
  let cleaned = content.replace(/\(Refusal: ?true\)/gi, '');
  // Remove trailing asterisks, underscores, and empty lines
  cleaned = cleaned.replace(/([\n\r]+[ \t]*([*]{2,}|_{2,})[ \t]*)+$/g, '');
  // Remove any trailing whitespace or empty lines
  cleaned = cleaned.replace(/[\n\r]+$/g, '').trim();
  return cleaned;
}

export const AIChatScreen: React.FC<AIChatScreenProps> = ({ onBack }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { t } = useTranslation();
  
  // 🎯 SESSION PERSISTENCE - Store session ID in localStorage to maintain chat history
  const [sessionId, setSessionId] = useState<string>(() => {
    // Try to get existing session ID from localStorage
    const existingSessionId = localStorage.getItem(`chat_session_${user?.id}`);
    if (existingSessionId) {
      console.log('🔄 Restoring existing chat session:', existingSessionId);
      return existingSessionId;
    }
    // Generate new session ID if none exists
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆕 Creating new chat session:', newSessionId);
    localStorage.setItem(`chat_session_${user?.id}`, newSessionId);
    return newSessionId;
  });

  // Debug: Log session ID changes
  useEffect(() => {
    console.log('🎯 Current session ID:', sessionId);
    console.log('🎯 User ID:', user?.id);
  }, [sessionId, user?.id]);
  
  // Consolidated state management
  const [chatState, setChatState] = useState<ChatState>({
    messages: [{
      id: 0,
      user_id: 'ai',
      session_id: 'welcome',
      role: 'ai',
      content: t('aiChat.welcomeMessage'),
      timestamp: new Date().toISOString()
    }],
    input: '',
    loading: false,
    error: null
  });
  
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [wellnessInsights, setWellnessInsights] = useState<WellnessInsights | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  
  // 🎯 Personalized problem-focused prompts state
  const [personalizedPrompts, setPersonalizedPrompts] = useState<string[]>([]);
  const [userProblems, setUserProblems] = useState<any[]>([]);
  const [hiddenPatterns, setHiddenPatterns] = useState<any[]>([]);
  const [hasPersonalizedData, setHasPersonalizedData] = useState(false);
  
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

  // 🎯 Fetch personalized AI mentor prompts based on problems analysis
  useEffect(() => {
    const fetchPersonalizedPrompts = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 Fetching personalized AI mentor prompts...');
        const response = await makeRequest('ai-mentor-prompts', { method: 'GET' });
        
        if (response) {
          setPersonalizedPrompts(response.personalized_prompts || []);
          setUserProblems(response.user_problems || []);
          setHiddenPatterns(response.hidden_patterns || []);
          setHasPersonalizedData(response.has_assessment || false);
          
          console.log('🎯 Personalized prompts loaded:', {
            prompts: response.personalized_prompts?.length || 0,
            problems: response.user_problems?.length || 0,
            patterns: response.hidden_patterns?.length || 0
          });
        }
      } catch (error) {
        console.log('Could not fetch personalized prompts:', error);
        // Set fallback problem-focused prompts
        setPersonalizedPrompts([
          "Leo, what problems do I have that I'm not even aware of?",
          "What's the biggest thing holding me back that I can't see?",
          "Tell me the hard truth about what needs to change in my life",
          "What should I focus on first to improve my wellness?"
        ]);
      }
    };

    fetchPersonalizedPrompts();
  }, [user?.id, makeRequest]);

  // 🧠 INTELLIGENT PROMPT SYSTEM - Context-aware prompts based on user's wellness state
  const fixedPrompts = [
    t('aiChat.intelligentPrompt1', { name: AI_CHARACTER_NAME }),
    t('aiChat.intelligentPrompt2'),
    t('aiChat.intelligentPrompt3'),
    t('aiChat.intelligentPrompt4', { name: AI_CHARACTER_NAME })
  ];

  // Memoized user display name
  const userDisplayName = useMemo(() => {
    return userData?.first_name || user?.firstName || 'there';
  }, [userData?.first_name, user?.firstName]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didUnmount = useRef(false);

  // 🎯 Dynamic WebSocket URL with authentication token AND session ID
  const getSocketUrl = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      // Include session_id in WebSocket URL for chat history persistence
      const wsUrl = `${WS_BASE_URL}?token=${token}&session_id=${sessionId}`;
      console.log('🔗 WebSocket URL with session ID:', wsUrl.replace(token, '[TOKEN_HIDDEN]'));
      return wsUrl;
    } catch (error) {
      console.error('Error getting authentication token:', error);
      throw new Error('Authentication failed');
    }
  }, [getToken, sessionId]);

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
    console.log('Received WebSocket message:', data);
    
    if (data.type === "history") {
      console.log('Loading chat history:', data.messages?.length || 0, 'messages');
      // Preserve Leo's welcome message and add server messages after it
      const welcomeMessage = {
        id: 0,
        user_id: 'ai',
        session_id: 'welcome',
        role: 'ai' as const,
        content: t('aiChat.welcomeMessage'),
        timestamp: new Date().toISOString()
      };
      
      setChatState(prev => ({ 
        ...prev, 
        messages: [welcomeMessage, ...(data.messages || [])]
      }));
    } else if (data.type === "user") {
      console.log('Received user message from server:', data.message);
      // Handle user message from server (usually confirmation)
      if (data.message) {
        // Check if we already have this message to avoid duplicates
        setChatState(prev => {
          const messageExists = prev.messages.some(msg => 
            msg.content === data.message.content && 
            msg.role === 'user' &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 5000
          );
          
          if (!messageExists) {
            console.log('Adding user message from server to chat');
            return {
              ...prev,
              messages: [...prev.messages, data.message]
            };
          }
          console.log('User message already exists, skipping');
          return prev;
        });
      }
    } else if (data.type === "ai") {
      console.log('Received AI response:', data.message);
      // Handle AI response
      if (data.message) {
        setChatState(prev => ({ 
          ...prev, 
          messages: [...prev.messages, data.message],
          loading: false 
        }));
      }
    } else if (data.type === "processing") {
      console.log('Received processing message:', data.message);
      // Keep loading state true while processing
    } else if (data.type === "insights") {
      console.log('Received insights:', data.insights);
      const insightsData = data as AgentInsights;
      setWellnessInsights(insightsData.insights);
    } else if (data.type === "follow_up") {
      console.log('Received follow-up questions:', data.questions);
      const followUpData = data as FollowUpQuestions;
      setFollowUpQuestions(followUpData.questions);
    } else if (data.type === "error") {
      console.log('Received error:', data.message);
      setChatState(prev => ({ 
        ...prev, 
        error: data.message || 'Server error occurred',
        loading: false 
      }));
    } else {
      console.log('Unknown message type:', data.type);
    }
  }, [t, AI_CHARACTER_NAME]);

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
      console.log('Sending message:', content.trim());
      
      // Create user message object
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        user_id: user?.id || 'user',
        session_id: sessionId, // Use persistent session ID
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('Created user message:', userMessage);

      // Add user message to chat immediately
      setChatState(prev => {
        const newState = { 
          ...prev, 
          messages: [...prev.messages, userMessage],
          loading: true,
          input: '' 
        };
        console.log('Updated chat state with user message:', newState.messages.length, 'messages');
        return newState;
      });

      // Send message to WebSocket
      sendJsonMessage({ content: content.trim() });
    } else if (readyState !== ReadyState.OPEN) {
      setChatState(prev => ({ 
        ...prev, 
        error: 'Connection not available. Please wait for reconnection.' 
      }));
    }
  }, [readyState, chatState.loading, sendJsonMessage, user?.id, sessionId]);

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
    setChatState(prev => ({ ...prev, input: prompt }));
    inputRef.current?.focus();
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatState(prev => ({ ...prev, input: e.target.value }));
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    switch (readyState) {
      case ReadyState.CONNECTING:
        return t('aiChat.connectingStatus');
      case ReadyState.OPEN:
        return t('aiChat.connected');
      case ReadyState.CLOSING:
        return t('aiChat.disconnected');
      case ReadyState.CLOSED:
        return t('aiChat.disconnected');
      default:
        return t('aiChat.disconnected');
    }
  }, [readyState, t]);

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

  // 🎯 Start new conversation (clears session and chat history)
  const startNewConversation = useCallback(() => {
    if (user?.id) {
      // Clear the session ID from localStorage
      localStorage.removeItem(`chat_session_${user.id}`);
      
      // Generate a new session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 Starting new conversation with session:', newSessionId);
      localStorage.setItem(`chat_session_${user.id}`, newSessionId);
      
      // Update session ID state
      setSessionId(newSessionId);
      
      // Reset chat state to initial welcome message
      setChatState({
        messages: [{
          id: 0,
          user_id: 'ai',
          session_id: 'welcome',
          role: 'ai',
          content: t('aiChat.welcomeMessage'),
          timestamp: new Date().toISOString()
        }],
        input: '',
        loading: false,
        error: null
      });
      
      // Clear insights and follow-up questions
      setWellnessInsights(null);
      setFollowUpQuestions([]);
    }
  }, [user?.id]);

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
        title={t('aiChat.retry')}
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

  // Wellness insights display
  const WellnessInsightsDisplay = () => {
    if (!wellnessInsights) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-blue-800">{t('aiChat.insightsHeader')}</h3>
        </div>
        {wellnessInsights.key_insight && (
          <p className="text-sm text-blue-700 mb-2">{wellnessInsights.key_insight}</p>
        )}
        {wellnessInsights.actionable_advice && (
          <div className="bg-white rounded p-2 border-l-4 border-blue-400">
            <p className="text-xs text-blue-600 font-medium">{t('aiChat.actionableAdvice')}</p>
            <p className="text-sm text-blue-800">{wellnessInsights.actionable_advice}</p>
          </div>
        )}
        {wellnessInsights.priority && (
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              wellnessInsights.priority === 'high' ? 'bg-red-100 text-red-800' :
              wellnessInsights.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {wellnessInsights.priority === 'high' ? t('aiChat.priorityHigh') :
               wellnessInsights.priority === 'medium' ? t('aiChat.priorityMedium') :
               t('aiChat.priorityLow')}
            </span>
          </div>
        )}
      </div>
    );
  };

  const FollowUpQuestionsDisplay = () => {
    if (!followUpQuestions.length) return null;

    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-green-800">{t('aiChat.suggestedQuestions')}</h3>
        </div>
        <div className="space-y-2">
          {followUpQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => {
                setChatState(prev => ({ ...prev, input: question }));
                inputRef.current?.focus();
              }}
              className="w-full text-left p-2 bg-white rounded border border-green-200 hover:bg-green-50 transition-colors text-sm text-green-800"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const bodyTextClass = "text-base leading-relaxed";

  return (
    <div className={`relative sm:ml-[var(--sidebar-width)] min-h-screen aurora-bg flex flex-col lg:flex-row transition-all duration-300 overflow-hidden${isMobile ? ' fixed inset-0 h-screen w-screen overflow-hidden' : ''}`}>
      {/* Header - Mobile Only */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 flex items-center justify-center p-3 bg-white/90 backdrop-blur-md border-b border-gray-200 z-30 h-16 shadow-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors absolute left-3 top-1/2 -translate-y-1/2"
            aria-label={t('aiChat.yourChat')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold text-gray-900">{t('aiChat.header', { name: AI_CHARACTER_NAME })}</h1>
            <p className="text-xs text-gray-600">{t('aiChat.subheader')}</p>
          </div>
          <button
            onClick={startNewConversation}
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl absolute right-3 top-1/2 -translate-y-1/2"
            title={t('aiChat.newChat')}
          >
            {t('aiChat.newChat')}
          </button>
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
                  {readyState === ReadyState.OPEN ? t('aiChat.online') : t('aiChat.offline')}
                </span>
              </div>
            </div>
            <p className="text-base text-gray-600">{t('aiChat.subheader')}</p>
            {chatState.messages.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">📝 {t('aiChat.continuingConversation')}</div>
            )}
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
          

        </div>

        {/* Minimal Background Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-100/10 to-pink-100/10 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-xl" />
        </div>
      </section>

      {/* Mobile Avatar - Compact and elegant for mobile */}
      {isMobile && (
        <section className="w-full flex flex-col items-center pt-14 pb-3 relative bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-sm z-10" aria-label={`${AI_CHARACTER_NAME} avatar section`}>
          <div className="w-[160px] h-[160px] relative mb-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-sm" />
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/Oylan.png"
                className="w-full h-full object-cover object-top rounded-full border-2 border-white shadow-lg"
                alt={`${AI_CHARACTER_NAME} avatar`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center text-white font-semibold text-sm rounded-full ' + getAvatarBackground();
                  fallback.textContent = AI_CHARACTER_NAME;
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          </div>
          {/* Online/Offline Indicator for Mobile */}
          <div className="flex items-center gap-1 mb-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                readyState === ReadyState.OPEN ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500 font-medium">
              {readyState === ReadyState.OPEN ? t('aiChat.online') : t('aiChat.offline')}
            </span>
          </div>
          {/* Removed AI_CHARACTER_NAME below online indicator */}
        </section>
      )}

      {/* Chat Section - Right Panel (65% on desktop, full width on mobile) */}
      <main className={`flex-1 ${isMobile ? 'w-full pt-1 pb-20' : 'lg:ml-[35%] lg:w-[65%]'} flex flex-col relative${isMobile ? ' overflow-hidden' : ''}`} role="main" aria-label="Chat conversation" style={
        isMobile
          ? {
              height: 'calc(100vh - 8rem)', // 4rem header + 4rem input (adjust if needed)
              marginTop: 0,
              marginBottom: 0,
            }
          : {}
      }>
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-40 left-10 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-xl" />
        </div>

        {/* Connection Status Bar */}
        <div className="px-4 lg:px-6 pt-4 relative z-10">
          {/* Connection status removed */}
        </div>

        {/* Messages Container - Positioned between fixed header and input */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-2' : 'p-4 lg:p-6'} space-y-3 relative z-10`} role="log" aria-live="polite" style={{
          marginTop: isMobile ? '4rem' : '120px',
          marginBottom: isMobile ? '5rem' : '120px',
          maxHeight: isMobile ? 'calc(100vh - 16rem)' : undefined
        }}>
          {/* Wellness Insights Display */}
          
          {/* Messages - Transparent style */}
          {chatState.messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              role="article"
              aria-label={`${msg.role === "user" ? "Your message" : `${AI_CHARACTER_NAME}'s response`}`}
            >
              <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${msg.role === "user" ? "" : ""}`}>
                <div className={`${isMobile ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3'} backdrop-blur-md shadow-lg border 
                  ${msg.role === "user"
                    ? "bg-white/90 border-white/50 text-gray-900 font-semibold shadow-purple-400/30 shadow-lg"
                    : "bg-white/90 border-gray-200 text-gray-800 font-normal"}
                `}>
                  {/* Render AI messages as Markdown, user messages as plain text */}
                  {msg.role === 'ai' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkBreaks]}
                      components={{
                        h1: (props) => <h1 className="text-lg sm:text-xl font-bold mt-3 sm:mt-4 mb-2" {...props} />, // Main title
                        h2: (props) => <h2 className="text-base sm:text-lg font-semibold mt-2 sm:mt-3 mb-2" {...props} />, // Section header
                        h3: (props) => <h3 className="text-sm sm:text-base font-semibold mt-2 mb-1" {...props} />, // Subsection header
                        ul: (props) => <ul className={"list-disc pl-4 sm:pl-6 my-2 " + bodyTextClass} {...props} />, // Consistent body text
                        ol: (props) => <ol className={"list-decimal pl-4 sm:pl-6 my-2 " + bodyTextClass} {...props} />, // Consistent body text
                        li: (props) => <li className={"mb-1 " + bodyTextClass} {...props} />, // Consistent body text
                        code: (props) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />, // Minimal code
                        pre: (props) => <pre className="bg-gray-100 rounded p-2 my-2 overflow-x-auto text-xs" {...props} />, // Minimal code block
                        p: (props) => <p className={bodyTextClass + " whitespace-pre-wrap"} {...props} /> // Consistent body text
                      }}
                    >
                      {filterRefusalText(msg.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>
                  )}
                </div>
                {/* Message time */}
                <div className={`mt-1 ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 ${isMobile ? 'px-1' : 'pl-2'} ${msg.role === 'user' ? 'text-right pr-2' : 'text-left'}`}>
                  {(() => {
                    const date = new Date(msg.timestamp);
                    return isNaN(date.getTime())
                      ? '' // Hide or use a placeholder if invalid
                      : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  })()}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator - Transparent style */}
          {chatState.loading && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'}`}>
                <div className={`bg-white/90 backdrop-blur-md border border-gray-200 ${isMobile ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3'} shadow-lg`}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" aria-hidden="true" />
                    <span className="text-sm text-gray-600">{t('aiChat.leoThinking', { name: AI_CHARACTER_NAME })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 🧠 Intelligent Prompt Buttons - Context-aware suggestions */}
        {chatState.messages.length === 1 && !chatState.loading && readyState === ReadyState.OPEN && (
          <div className={`relative z-10 ${isMobile ? 'px-3 pb-3' : 'px-4 lg:px-6 pb-4'}`} style={{ marginBottom: isMobile ? '5rem' : '120px' }}>
            <div className="mb-2">
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 font-medium`}>
                {t('aiChat.quickStarters')}
              </p>
            </div>
            {/* Horizontal scrollable row for mobile, grid for desktop */}
            <div
              className={isMobile ? "flex gap-2 overflow-x-auto scrollbar-hide pb-1" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}
              role="group"
              aria-label="Intelligent conversation starters"
            >
              {fixedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className={`${isMobile ? 'px-3 py-2 text-xs min-w-[160px]' : 'px-4 py-2 text-sm w-full'} rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-300 active:scale-95 whitespace-pre-line shadow-none flex-shrink-0`}
                  disabled={chatState.loading || readyState !== ReadyState.OPEN}
                  style={{
                    fontWeight: 500,
                    letterSpacing: 0.01,
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Remove 'Your Chat' header on mobile */}
      {!isMobile && (
        <div className="fixed top-[5%] left-0 right-0 lg:left-[calc(var(--sidebar-width)+35%)] lg:right-0 px-4 lg:px-6 pt-2 pb-4 z-20">
          <div className="flex items-center justify-between">
            <div></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('aiChat.yourChat')}</h2>
            <button
              onClick={startNewConversation}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
              title={t('aiChat.newChat')}
            >
              {t('aiChat.newChat')}
            </button>
          </div>
        </div>
      )}

      {/* Error Display - Fixed position */}
      {chatState.error && (
        <div className={`fixed top-16 left-0 right-0 ${isMobile ? 'z-40' : 'lg:left-[calc(var(--sidebar-width)+35%)] lg:right-0 px-4 lg:px-6 z-20'}`}>
          <ErrorDisplay />
        </div>
      )}

      {/* Fixed Input Area - Outside the main container */}
      <div className={`fixed bottom-0 left-0 right-0 ${isMobile ? 'p-2' : 'lg:left-[calc(var(--sidebar-width)+35%)] lg:right-0 p-4 lg:p-6'} z-30`}>
        <div className={`relative bg-white/95 backdrop-blur-xl border border-white/50 ${isMobile ? 'rounded-2xl' : 'rounded-3xl'} shadow-xl shadow-purple-500/20`}>
          <div className={`flex items-center ${isMobile ? 'gap-2 p-2' : 'gap-3 p-3'}`}>
            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={chatState.input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={readyState === ReadyState.OPEN ? t('aiChat.sendPlaceholder', { name: AI_CHARACTER_NAME }) : t('aiChat.connecting')}
                className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-sm'} bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium resize-none`}
                disabled={chatState.loading || readyState !== ReadyState.OPEN}
                aria-label={t('aiChat.sendPlaceholder', { name: AI_CHARACTER_NAME })}
                aria-describedby={chatState.loading ? "loading-status" : undefined}
              />
            </div>
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={chatState.loading || !chatState.input.trim() || readyState !== ReadyState.OPEN}
              className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400/50 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed backdrop-blur-md`}
              aria-label="Send message"
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
        {chatState.loading && (
          <div id="loading-status" className="sr-only">{t('aiChat.leoThinking', { name: AI_CHARACTER_NAME })}</div>
        )}
      </div>
    </div>
  );
};