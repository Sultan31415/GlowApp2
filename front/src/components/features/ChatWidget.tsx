import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import useWebSocket, { ReadyState } from 'react-use-websocket';

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat";

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const didUnmount = useRef(false);

  // Dynamic WebSocket URL with authentication token
  const getSocketUrl = useCallback(async () => {
    if (!open) {
      throw new Error('Widget is closed'); // Throw error instead of returning null
    }
    
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
  }, [open, getToken]);

  // WebSocket connection with react-use-websocket
  const {
    sendJsonMessage,
    readyState,
  } = useWebSocket(open ? getSocketUrl : null, {
    shouldReconnect: (closeEvent) => {
      // Don't reconnect if component is unmounting or widget is closed
      if (didUnmount.current || !open) return false;
      
      // Don't reconnect on normal closure
      if (closeEvent.code === 1000) return false;
      
      // Reconnect on other closure codes
      return true;
    },
    reconnectAttempts: 10, // Increased attempts
    reconnectInterval: (attemptNumber) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s...
      return Math.min(Math.pow(2, attemptNumber) * 1000, 30000);
    },
    onOpen: () => {
      console.log('ChatWidget WebSocket connected');
      setLoading(false);
    },
    onClose: (event) => {
      console.log('ChatWidget WebSocket closed:', event.code, event.reason);
      setLoading(false);
    },
    onError: (error) => {
      console.error('ChatWidget WebSocket error:', error);
      setLoading(false);
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing ChatWidget WebSocket message:', error);
      }
    },
    retryOnError: true,
    heartbeat: {
      message: 'ping',
      returnMessage: 'pong',
      timeout: 60000, // Increased timeout
      interval: 30000, // Increased interval
    },
  });

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "history") {
      setMessages(data.messages || []);
    } else if (data.type === "user" || data.type === "ai") {
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setLoading(false);
      }
    } else if (data.type === "processing") {
      // Handle processing status
      setLoading(true);
      console.log('ChatWidget processing message:', data.message);
    } else if (data.type === "ping") {
      // Handle ping messages to keep connection alive
      console.log('ChatWidget received ping:', data.timestamp);
    }
  }, []);

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
      setLoading(true);
      sendJsonMessage({ content: input.trim() });
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 1000,
          background: "#6366f1",
          color: "white",
          borderRadius: "50%",
          width: 56,
          height: 56,
          fontSize: 28,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Open chat"
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: 340,
        maxHeight: 500,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#6366f1",
          color: "white",
          padding: "12px 16px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>AI Wellness Coach</span>
          <div 
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: readyState === ReadyState.OPEN ? "#10b981" : "#ef4444"
            }}
            title={readyState === ReadyState.OPEN ? "Connected" : "Disconnected"}
          />
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer" }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id + msg.timestamp}
            style={{
              marginBottom: 12,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: msg.role === "user" ? "#6366f1" : "#e0e7ff",
                color: msg.role === "user" ? "white" : "#3730a3",
                borderRadius: 12,
                padding: "8px 14px",
                maxWidth: 220,
                fontSize: 15,
                boxShadow: msg.role === "user" ? "0 1px 4px #6366f133" : "none",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#6366f1", fontStyle: "italic", marginBottom: 8 }}>AI is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex", borderTop: "1px solid #e5e7eb", padding: 8, background: "#f1f5f9" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={readyState === ReadyState.OPEN ? "Type your message..." : "Connecting..."}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 15,
            padding: "8px 0 8px 8px",
          }}
          disabled={loading || readyState !== ReadyState.OPEN}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim() || readyState !== ReadyState.OPEN}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            marginLeft: 8,
            fontWeight: 600,
            cursor: loading || !input.trim() || readyState !== ReadyState.OPEN ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() || readyState !== ReadyState.OPEN ? 0.7 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget; 