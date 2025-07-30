import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useTranslation } from 'react-i18next';
import { Send, X, Loader2, MessageCircle, GripVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat";
const AI_CHARACTER_NAME = "Leo";

interface LeoChatWidgetProps {
  className?: string;
  onPlanUpdated?: () => void;  // Callback when Leo updates the plan
  onProgressUpdated?: () => void;  // Callback when Leo updates progress tracking
}

// Utility to filter out (Refusal: true) or similar patterns from AI message content
function filterRefusalText(content: string): string {
  let cleaned = content.replace(/\(Refusal: ?true\)/gi, '');
  cleaned = cleaned.replace(/([\n\r]+[ \t]*([*]{2,}|_{2,})[ \t]*)+$/g, '');
  cleaned = cleaned.replace(/[\n\r]+$/g, '').trim();
  return cleaned;
}

const LeoChatWidget: React.FC<LeoChatWidgetProps> = ({ className = "", onPlanUpdated, onProgressUpdated }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 0,
    user_id: 'ai',
    session_id: 'welcome',
    role: 'ai',
    content: t('aiChat.welcomeMessage'),
    timestamp: new Date().toISOString()
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didUnmount = useRef(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // Default bottom-right position
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Session persistence for Leo
  const [sessionId, setSessionId] = useState<string>(() => {
    const existingSessionId = localStorage.getItem(`leo_widget_session_${user?.id}`);
    if (existingSessionId) {
      return existingSessionId;
    }
    const newSessionId = `leo_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(`leo_widget_session_${user?.id}`, newSessionId);
    return newSessionId;
  });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(`leo_widget_position_${user?.id}`);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.log('Could not parse saved position, using default');
        // Set default position if parsing fails
        setPosition({ x: 24, y: 24 });
      }
    } else {
      // Set default position if no saved position exists
      setPosition({ x: 24, y: 24 });
    }
  }, [user?.id]);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (user?.id && open) {
      localStorage.setItem(`leo_widget_position_${user.id}`, JSON.stringify(position));
    }
  }, [position, user?.id, open]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setHasDragged(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    // Set hasDragged to true if mouse moves more than a few pixels
    if (!hasDragged) {
      const moveDistance = Math.sqrt(
        Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2)
      );
      if (moveDistance > 3) {
        setHasDragged(true);
      }
    }

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    if (open) {
      // Widget is open - constrain to viewport bounds for widget
      const maxX = window.innerWidth - 320; // widget width
      const maxY = window.innerHeight - 384; // widget height
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else {
      // Button is closed - constrain to viewport bounds for button
      const maxX = window.innerWidth - 56; // button width (14 * 4 = 56px)
      const maxY = window.innerHeight - 56; // button height
      
      // Convert button position back to widget position
      const widgetX = Math.max(0, Math.min(newX - 153, maxX - 320));
      const widgetY = Math.max(0, Math.min(newY - 191, maxY - 384));
      
      setPosition({
        x: widgetX,
        y: widgetY
      });
    }
  }, [isDragging, dragOffset, open, hasDragged]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Dynamic WebSocket URL with authentication token and session ID
  const getSocketUrl = useCallback(async () => {
    if (!open) {
      throw new Error('Widget is closed');
    }
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const wsUrl = `${WS_BASE_URL}?token=${token}&session_id=${sessionId}`;
      return wsUrl;
    } catch (error) {
      console.error('Error getting authentication token:', error);
      throw new Error('Authentication failed');
    }
  }, [open, getToken, sessionId]);

  // WebSocket connection
  const {
    sendJsonMessage,
    readyState,
  } = useWebSocket(open ? getSocketUrl : null, {
    shouldReconnect: (closeEvent) => {
      if (didUnmount.current || !open) return false;
      if (closeEvent.code === 1000) return false;
      return true;
    },
    reconnectAttempts: 5,
    reconnectInterval: (attemptNumber) => {
      return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
    },
    onOpen: () => {
      console.log('Leo Widget WebSocket connected');
      setLoading(false);
      setError(null);
    },
    onClose: (event) => {
      console.log('Leo Widget WebSocket closed:', event.code, event.reason);
      setLoading(false);
      if (event.code !== 1000) {
        setError('Connection lost. Reconnecting...');
      }
    },
    onError: (error) => {
      console.error('Leo Widget WebSocket error:', error);
      setLoading(false);
      setError('Connection error. Please try again.');
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing Leo Widget WebSocket message:', error);
      }
    },
    retryOnError: true,
    heartbeat: {
      message: 'ping',
      returnMessage: 'pong',
      timeout: 30000,
      interval: 25000,
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
      
      setMessages([welcomeMessage, ...(data.messages || [])]);
    } else if (data.type === "user") {
      console.log('Received user message from server:', data.message);
      // Handle user message from server (usually confirmation)
      if (data.message) {
        // Check if we already have this message to avoid duplicates
        setMessages(prev => {
          const messageExists = prev.some(msg => 
            msg.content === data.message.content && 
            msg.role === 'user' &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 5000
          );
          
          if (!messageExists) {
            console.log('Adding user message from server to chat');
            return [...prev, data.message];
          }
          console.log('User message already exists, skipping');
          return prev;
        });
      }
    } else if (data.type === "ai") {
      console.log('Received AI response:', data.message);
      // Handle AI response
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setLoading(false);
      }
    } else if (data.type === "processing") {
      console.log('Received processing message:', data.message);
      // Keep loading state true while processing
      setLoading(true);
    } else if (data.type === "insights") {
      console.log('Received insights:', data.insights);
      // Note: Widget doesn't display insights, but we handle the message
    } else if (data.type === "follow_up") {
      console.log('Received follow-up questions:', data.questions);
      // Note: Widget doesn't display follow-up questions, but we handle the message
    } else if (data.type === "error") {
      console.log('Received error:', data.message);
      setError(data.message || 'Server error occurred');
      setLoading(false);
    } else if (data.type === "plan_updated") {
      console.log('Received plan_updated message');
      // Call the onPlanUpdated callback if provided
      if (typeof onPlanUpdated === 'function') {
        onPlanUpdated();
      }
    } else if (data.type === "progress_updated") {
      console.log('Received progress_updated message');
      // Call the onProgressUpdated callback if provided
      if (typeof onProgressUpdated === 'function') {
        console.log('Calling onProgressUpdated callback...');
        try {
          onProgressUpdated();
          console.log('onProgressUpdated callback executed successfully');
        } catch (error) {
          console.error('Error in onProgressUpdated callback:', error);
        }
      } else {
        console.log('No onProgressUpdated callback provided');
      }
    } else {
      console.log('Unknown message type:', data.type);
    }
  }, [t, onPlanUpdated, onProgressUpdated]);

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = () => {
    if (readyState === ReadyState.OPEN && input.trim() && !loading) {
      console.log('Sending message:', input.trim());
      
      // Create user message object
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        user_id: user?.id || 'user',
        session_id: sessionId, // Use persistent session ID
        role: 'user',
        content: input.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('Created user message:', userMessage);

      // Add user message to chat immediately
      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        console.log('Updated messages with user message:', newMessages.length, 'messages');
        return newMessages;
      });

      // Send message to WebSocket
      sendJsonMessage({ content: input.trim() });
      setInput("");
      setLoading(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    if (user?.id) {
      localStorage.removeItem(`leo_widget_session_${user.id}`);
      const newSessionId = `leo_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`leo_widget_session_${user.id}`, newSessionId);
      setSessionId(newSessionId);
      setMessages([{
        id: 0,
        user_id: 'ai',
        session_id: 'welcome',
        role: 'ai',
        content: t('aiChat.welcomeMessage'),
        timestamp: new Date().toISOString()
      }]);
      setError(null);
    }
  };

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={(e) => {
          if (!hasDragged) {
            setOpen(true);
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
          setIsDragging(true);
          setHasDragged(false);
        }}
        style={{
          position: 'fixed',
          left: position.x + 153, // Center the button relative to widget (320/2 - 14/2 = 153)
          top: position.y + 191, // Center the button relative to widget (384/2 - 14/2 = 191)
          zIndex: 50,
        }}
        className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
        aria-label="Chat with Leo"
        title="Chat with Leo (Click to open, drag to move)"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div 
      ref={widgetRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
      }}
      className={`w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${className} ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Header - Draggable */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src="/Oylan.png" 
              alt="Leo" 
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{AI_CHARACTER_NAME}</h3>
            <div className="flex items-center gap-1">
              <div 
                className={`w-2 h-2 rounded-full ${
                  readyState === ReadyState.OPEN ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-xs opacity-90">
                {readyState === ReadyState.OPEN ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 opacity-60">
            <GripVertical className="w-3 h-3" />
            <span className="text-xs">Drag</span>
          </div>
          <button
            onClick={startNewConversation}
            className="text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors"
            title="New conversation"
          >
            New
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">

        
        {messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
            <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
              <div className={`rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks]}
                    components={{
                      p: (props) => <p className="text-sm leading-relaxed" {...props} />,
                      ul: (props) => <ul className="list-disc pl-4 my-1 text-sm" {...props} />,
                      ol: (props) => <ol className="list-decimal pl-4 my-1 text-sm" {...props} />,
                      li: (props) => <li className="mb-1" {...props} />,
                      code: (props) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />,
                    }}
                  >
                    {filterRefusalText(msg.content)}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
              <div className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-600">Leo is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2">
                <span className="text-sm text-red-600">{error}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={readyState === ReadyState.OPEN ? "Ask Leo anything..." : "Connecting..."}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading || readyState !== ReadyState.OPEN}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || readyState !== ReadyState.OPEN}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-full p-2 transition-colors disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeoChatWidget; 