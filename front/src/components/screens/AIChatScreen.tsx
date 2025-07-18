import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useApi } from '../../utils/useApi';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  Smile, 
  Camera, 
  Sparkles,
  User,
  Bot,
  Loader2
} from 'lucide-react';
import { AssessmentResults } from '../../types';

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat";

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
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested prompts based on user's data
  const suggestedPrompts = [
    "What can I improve today?",
    "Why is my Glow Score low?",
    "What's draining my energy?",
    "Give me a 2-min motivation boost"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
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
    };
    
    fetchUserData();
  }, [makeRequest]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        
        socket = new WebSocket(`${WS_URL}?token=${token}`);
        setWs(socket);
        
        socket.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };
        
        socket.onmessage = (event) => {
          if (!isMounted) return;
          
          const data = JSON.parse(event.data);
          if (data.type === "history") {
            setMessages(data.messages);
          } else if (data.type === "user" || data.type === "ai") {
            setMessages((prev) => [...prev, data.message]);
            setLoading(false);
          }
        };
        
        socket.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            setWs(null);
          }
        };
        
        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
    };
  }, [user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (content: string) => {
    if (ws && content.trim() && !loading) {
      setLoading(true);
      ws.send(JSON.stringify({ content: content.trim() }));
      setInput("");
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const getAvatarState = () => {
    if (!results) return 'default';
    
    const emotionalHealth = results.categoryScores.emotionalHealth;
    const glowScore = results.overallGlowScore;
    
    if (emotionalHealth < 50) return 'tired';
    if (glowScore > 80) return 'glowing';
    return 'normal';
  };

  const getAvatarBackground = () => {
    const state = getAvatarState();
    switch (state) {
      case 'tired':
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
      case 'glowing':
        return 'bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-400 animate-pulse';
      default:
        return 'bg-gradient-to-br from-blue-400 to-purple-600';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative sm:ml-[var(--sidebar-width)] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col lg:flex-row transition-all duration-300 overflow-hidden">
      {/* Header - Mobile Only */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Talk to Your Future Self</h1>
            <p className="text-xs text-gray-600">AI-powered reflection & growth</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      )}

      {/* Avatar Section - Left Panel (35%) */}
      <div className="w-full lg:w-[35%] flex flex-col items-center justify-center p-6 lg:p-8 bg-white/60 backdrop-blur-sm border-r border-gray-200">
        {/* Avatar Container */}
        <div className="relative mb-6">
          <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full ${getAvatarBackground()} flex items-center justify-center shadow-2xl`}>
            <div className="text-white text-4xl lg:text-6xl font-bold">
              {userData?.first_name?.[0] || user?.firstName?.[0] || 'U'}
            </div>
          </div>
          
          {/* Connection Status */}
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            {userData?.first_name || user?.firstName || 'User'}
          </h2>
          <p className="text-gray-600 text-sm lg:text-base">
            Your Future Self
          </p>
        </div>

        {/* Glow Score Display */}
        {results && (
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 w-full max-w-xs">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Current Glow Score
              </p>
              <div className="text-3xl font-black text-gray-900 mb-2">
                {results.overallGlowScore}
              </div>
              <div className="flex justify-center items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="text-center mt-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Talk to Your Future Self</h1>
            <p className="text-gray-600">AI-powered reflection & growth</p>
          </div>
        )}
      </div>

      {/* Chat Section - Right Panel (65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col bg-white/40 backdrop-blur-sm">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Your Future Self Chat
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                I'm here to help you reflect on your wellness journey and provide personalized guidance based on your assessment.
              </p>
              
              {/* AI Greeting */}
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm leading-relaxed">
                        Hey {userData?.first_name || user?.firstName || 'there'}. I noticed some shifts in your emotional energy this week. Want to reflect together?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id + msg.timestamp}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-blue-500 to-purple-500" 
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}>
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length > 0 && !loading && (
          <div className="px-4 lg:px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4 lg:p-6">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={loading || !isConnected}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Mood picker"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Take photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !isConnected}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 