import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat"; // Adjust for prod

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!open) return;
    let socket: WebSocket | null = null;
    let isMounted = true;
    (async () => {
      // Use default Clerk session token for backend compatibility
      const token = await getToken();
      if (!token) return;
      socket = new WebSocket(`${WS_URL}?token=${token}`);
      setWs(socket);
      socket.onopen = () => {
        // Optionally send session info here
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "history") {
          setMessages(data.messages);
        } else if (data.type === "user" || data.type === "ai") {
          setMessages((prev) => [...prev, data.message]);
          setLoading(false);
        }
      };
      socket.onclose = () => {
        setWs(null);
      };
    })();
    return () => {
      isMounted = false;
      if (socket) socket.close();
    };
  }, [open, getToken]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = () => {
    if (ws && input.trim()) {
      setLoading(true);
      ws.send(JSON.stringify({ content: input }));
      setInput("");
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
        AI Wellness Coach
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
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 15,
            padding: "8px 0 8px 8px",
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            marginLeft: 8,
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.7 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget; 