"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { AppFrame } from "@/components/aloe-guard";
import { api } from "@/lib/api";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
};

const SUGGESTIONS = [
  "How often should I water my Aloe Vera?",
  "What is the best soil mix for Aloe?",
  "How much sunlight does Aloe Vera need?",
  "How to identify and treat root rot?",
  "When is Aloe Vera ready for harvesting?",
  "How do I propagate Aloe Vera pups?",
  "What NPK fertilizer ratio is ideal?",
  "How to get rid of mealybugs on leaves?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Mabuhay! I am your Aloe Vera Botanical Assistant. Ask me anything about watering, soil, sunlight, pests, diseases, maturity, harvesting, or plant care.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.chat.send(text);
      const botMessage: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: res.reply || "No response received.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to botanical assistant.";
      setError(errorMsg);
      const botErrMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "I am having trouble connecting to the offline chatbot service. Please ensure the backend is running.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botErrMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <AppFrame active="AI Chatbot">
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>💬</span>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--color-primary-dark, #1b4d3e)" }}>
                Aloe Vera Botanical Assistant
              </h1>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
                Offline field advisor specialized strictly in Aloe barbadensis Miller care & agronomy
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: 16, fontSize: "0.75rem", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", display: "inline-block" }} />
              Active (Offline)
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div style={{ marginBottom: 12, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
          <div style={{ display: "inline-flex", gap: 8 }}>
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "6px 12px",
                  borderRadius: 16,
                  fontSize: "0.8rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Panel */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#888",
                  marginBottom: 4,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span>{m.sender === "user" ? "You" : "🌿 Aloe Advisor"}</span>
                <span>•</span>
                <span>{m.time}</span>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  borderTopLeftRadius: m.sender === "bot" ? 2 : 14,
                  borderTopRightRadius: m.sender === "user" ? 2 : 14,
                  background: m.sender === "user" ? "var(--color-primary-dark, #1b4d3e)" : "#f8f9fa",
                  color: m.sender === "user" ? "#ffffff" : "#212529",
                  border: m.sender === "bot" ? "1px solid #e9ecef" : "none",
                  fontSize: "0.925rem",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  boxShadow: m.sender === "user" ? "0 2px 6px rgba(27,77,62,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: "0.85rem", fontStyle: "italic" }}>
              <span style={{ fontSize: "1rem" }}>🌿</span> Aloe Advisor is typing...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {error && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, fontSize: "0.8rem" }}>
            {error}
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Ask about watering, soil, pests, harvesting, leaf rot..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 24px",
              background: loading || !input.trim() ? "#ccc" : "var(--color-primary-dark, #1b4d3e)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </form>
      </div>
    </AppFrame>
  );
}
