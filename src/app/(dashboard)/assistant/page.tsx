"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ShieldAlert,
  Flame,
  AlertCircle,
  RefreshCw,
  Scale,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      sender: "assistant",
      text: `Hello Arun! I am your **Context-Aware AI Nutritionist**.

I have reviewed your active profile:
- **Biometrics**: 22 yrs, Male, 70kg (BMR: 1,668 kcal | TDEE: 2,586 kcal).
- **Dietary Pattern**: Vegetarian.
- **Critical Exclusions**: Peanuts, Lactose.
- **Today's Status**: You have logged **860 kcal** so far (Breakfast & Lunch). You have **1,590 kcal** and **101g protein** remaining in today's budget.

How can I assist your nutrition planning today?`,
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Suggest a high-protein vegetarian dinner for my remaining calories.",
    "How many calories have I consumed today?",
    "Can you suggest a healthy 200 kcal snack without peanuts or dairy?",
    "What is the difference between my BMR and TDEE?",
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setErrorNotice("");

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response from AI Assistant.");
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to communicate with the assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto space-y-4">
      {/* CONTEXT HEADER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">Context-Aware AI Assistant</h1>
            <p className="text-[11px] text-slate-500">Retrieval-Augmented Nutrition Guidance (Gemini)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
            <Flame className="w-3 h-3 text-emerald-600" />
            <span>1,590 kcal left</span>
          </span>
          <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
            <Scale className="w-3 h-3 text-indigo-600" />
            <span>101g protein left</span>
          </span>
          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
            <ShieldAlert className="w-3 h-3 text-red-500" />
            <span>Allergy: Peanuts</span>
          </span>
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorNotice}</div>
        </div>
      )}

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-xs ${
                  isUser
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-slate-900 text-white rounded-tr-xs"
                    : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs whitespace-pre-line"
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {isUser ? "You" : "NutriContext AI"} &bull; {m.timestamp}
                </div>
                {m.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Formulating contextual response with live intake snapshot...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your calories, meal ideas, or nutritional context..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
