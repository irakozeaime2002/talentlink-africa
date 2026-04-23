"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { sendChatMessage } from "../../lib/api";

interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "How do I create a job?",
  "How does AI screening work?",
  "How do I complete my profile?",
  "How to upload resumes for a job?",
];

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  const parseInline = (line: string, key: number): React.ReactNode => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={i}>{part.slice(1, -1)}</em>;
          return part;
        })}
      </span>
    );
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const bulletMatch = line.match(/^[*-]\s+(.*)/);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[*-]\s+/)) {
        items.push(lines[i].replace(/^[*-]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc pl-4 space-y-0.5 my-1">
          {items.map((item, j) => <li key={j}>{parseInline(item, j)}</li>)}
        </ul>
      );
      continue;
    }
    if (line.trim()) elements.push(<p key={i} className="mb-1">{parseInline(line, i)}</p>);
    else if (elements.length > 0) elements.push(<br key={i} />);
    i++;
  }
  return elements;
};

export default function AIChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      const { reply } = await sendChatMessage(text, history, pathname ?? undefined);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err: any) {
      console.error("[Chat Widget] Error:", err);
      const errorMsg = err.message || "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: "model", text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="glass-card w-80 sm:w-96 flex flex-col animate-slide-up overflow-hidden" style={{ height: "480px" }}>
          {/* Header */}
          <div className="btn-glow px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">🌍 TalentLink Africa</p>
                <p className="text-white/70 text-xs mt-0.5">Ask me anything</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full accent-icon-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="glass-card px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 max-w-[85%]">
                    Hi! I'm your TalentLink Africa assistant. I can help you with jobs, applications, screening, and more. What would you like to know?
                  </div>
                </div>
                <div className="pl-9 space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl border dark:border-white/10 hover:opacity-80 transition"
                      style={{ color: "var(--accent)", borderColor: "var(--accent-light)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-gray-200 dark:bg-white/10" : "accent-icon-bg"}`}>
                  {msg.role === "user"
                    ? <User size={13} className="text-gray-600 dark:text-gray-300" />
                    : <Bot size={13} className="text-white" />
                  }
                </div>
                <div className={`px-3 py-2.5 rounded-2xl text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "glass-card text-gray-700 dark:text-gray-300 rounded-tl-sm"
                }`}
                  style={msg.role === "user" ? { background: "var(--accent)" } : {}}
                >
                  {msg.role === "model" ? renderMarkdown(msg.text) : msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full accent-icon-bg flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="glass-card px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 glass-card px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a question..."
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition btn-glow shrink-0"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="btn-glow w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl relative"
        title="AI Assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}
