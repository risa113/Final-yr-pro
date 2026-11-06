"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatSidebar, ConversationItem } from "./ChatSidebar";
import { ChatMessage, ChatMessageItem } from "./ChatMessage";
import { ChatInput, AttachedFile } from "./ChatInput";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import {
  speechSynthesizer,
  VoiceLanguageId,
  SUPPORTED_VOICE_LANGUAGES,
} from "@/lib/voice/speech-service";
import {
  Bot,
  Flame,
  Scale,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Zap,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Globe,
} from "lucide-react";

export function ChatContainer() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationItem[]>([
    {
      id: "conv_default_general",
      title: "Tarik AI Nutrition Chatbot",
      updatedAt: "2026-11-02T12:00:00.000Z",
      messageCount: 1,
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>("conv_default_general");
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "intro",
      sender: "assistant",
      text: "Hi! I'm Tarik AI. How can I help you today?",
      timestamp: "Just now",
      domain: "GENERAL_KNOWLEDGE",
      mode: "fast",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [errorNotice, setErrorNotice] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguageId>("auto");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Load language and voice preferences from localStorage & URL
  useEffect(() => {
    if (searchParams && searchParams.get("mode") === "voice") {
      setIsVoiceModalOpen(true);
    }

    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("nutri_voice_lang") as VoiceLanguageId;
      if (savedLang) setSelectedLanguage(savedLang);
      const savedAutoVoice = localStorage.getItem("nutri_auto_voice") === "true";
      setAutoSpeakReplies(savedAutoVoice);
    }
  }, [searchParams]);

  const handleLanguageChange = (lang: VoiceLanguageId) => {
    setSelectedLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("nutri_voice_lang", lang);
    }
  };

  const handleToggleAutoVoice = () => {
    const nextVal = !autoSpeakReplies;
    setAutoSpeakReplies(nextVal);
    if (!nextVal) speechSynthesizer.stop();
    if (typeof window !== "undefined") {
      localStorage.setItem("nutri_auto_voice", String(nextVal));
    }
  };

  // Suggested Prompts
  const quickPrompts = [
    { label: "🥗 Nutrition", text: "How many calories and protein are in 100g of cooked dal tadka?" },
    { label: "📐 Math Calculation", text: "What is 250 multiplied by 48?" },
    { label: "💻 Code Example", text: "Write a clean TypeScript debounce function with type safety." },
    { label: "🌐 Tanglish Nutrition", text: "Enakku high protein vegetarian diet plan konjam explain pannunga." },
    { label: "🔬 Physics Law", text: "Explain Newton's third law of motion with everyday real-world examples." },
    { label: "💼 Business Strategy", text: "How to draft an effective go-to-market strategy for an AI startup?" },
  ];

  // User Nutrition Profile snapshot for contextual queries
  const userNutritionContext = {
    userName: "Arun Kumar",
    age: 22,
    gender: "male",
    weightKg: 70,
    heightCm: 175,
    goalType: "maintenance",
    dietaryType: "vegetarian",
    allergies: ["peanuts"],
    intolerances: ["lactose"],
    dailyTargets: { calories: 2450, proteinG: 135, carbsG: 290, fatG: 75 },
    todayConsumed: { calories: 860, proteinG: 34, carbsG: 120, fatG: 26 },
    recentMeals: [
      { mealType: "breakfast", foodName: "Idli with Sambar & Coconut Chutney", calories: 340, proteinG: 9.8 },
      { mealType: "lunch", foodName: "Steamed Rice with Dal Tadka & Chapati", calories: 520, proteinG: 18.5 },
    ],
  };

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();

    // Check if user came from Food Scanner with a scanned meal
    if (typeof window !== "undefined") {
      const rawMeal = sessionStorage.getItem("thariq_scanned_meal");
      if (rawMeal) {
        try {
          const meal = JSON.parse(rawMeal);
          sessionStorage.removeItem("thariq_scanned_meal");

          const mealMsgId = `scanned_meal_${Date.now()}`;
          const itemsText = meal.detectedItems && meal.detectedItems.length > 1
            ? `\n\n**Detected Items Breakdown:**\n` +
              meal.detectedItems
                .map(
                  (it: any) =>
                    `- **${it.name}** (~${it.portionG}g): ${it.calories} kcal, ${it.proteinG}g protein, ${it.carbsG}g carbs (${it.cookingMethod || "Standard"})`
                )
                .join("\n")
            : "";

          setMessages((prev) => [
            ...prev,
            {
              id: mealMsgId,
              sender: "assistant",
              text: `🍽️ **Scanned Meal Loaded into Context**: **${meal.detectedFoodName}** (${meal.estimatedServingG}g)

- **Total Calories**: ${meal.totalNutrition?.calories || meal.calories} kcal
- **Macronutrients**: ${meal.totalNutrition?.proteinG || meal.proteinG}g Protein | ${meal.totalNutrition?.carbsG || meal.carbsG}g Carbs | ${meal.totalNutrition?.fatG || meal.fatG}g Fat | ${meal.totalNutrition?.fiberG || meal.fiberG || 0}g Fiber
- **Key Micros**: ${meal.totalNutrition?.sodiumMg || 0}mg Sodium | ${meal.totalNutrition?.potassiumMg || 0}mg Potassium | ${meal.totalNutrition?.ironMg || 0}mg Iron
- **Preparation**: ${meal.preparationMethod || "Standard"}
- **Laboratory Source**: ${meal.totalNutrition?.source || "ICMR-NIN IFCT 2017 & USDA"}${itemsText}

I have loaded this meal into your active nutritional budget. How can I help you? You can ask:
1. *"How does this meal impact my daily calorie and protein targets?"*
2. *"Is the sodium or saturated fat in this dish suitable for my health profile?"*
3. *"What should I eat for my next meal to balance out these macros?"*`,
              timestamp: "Just now",
              domain: "FOOD_NUTRITION",
              mode: "fast",
            },
          ]);
        } catch (e) {
          console.warn("Failed to parse scanned meal from sessionStorage:", e);
        }
      }
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
        }
      }
    } catch (err) {
      console.warn("Failed to load conversation history:", err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    setIsLoading(false);
    setCurrentStreamingId(null);
    setErrorNotice("");

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              sender: m.senderRole,
              text: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              domain: m.contextSnapshot?.domain,
              mode: m.contextSnapshot?.mode,
              toolExecutions: m.contextSnapshot?.toolExecutions,
            }))
          );
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch messages for conversation:", err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [
          { id: newConv.id, title: newConv.title, updatedAt: "2026-11-02T12:00:00.000Z", messageCount: 0 },
          ...prev,
        ]);
        setActiveConversationId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      const localId = `conv_${Date.now()}`;
      setConversations((prev) => [
        { id: localId, title: "New Conversation", updatedAt: "2026-11-02T12:00:00.000Z", messageCount: 0 },
        ...prev,
      ]);
      setActiveConversationId(localId);
      setMessages([]);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.warn("Rename API sync failed:", err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete API sync failed:", err);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setCurrentStreamingId(null);
  };

  // Send Message with High-Speed Progressive SSE Streaming
  const handleSendMessage = async (text: string, attachment?: AttachedFile) => {
    if ((!text.trim() && !attachment) || isLoading) return;

    setErrorNotice("");
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment: attachment
        ? {
            type: attachment.type,
            name: attachment.name,
            url: attachment.base64,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const botMsgId = `bot_${Date.now()}`;
    setCurrentStreamingId(botMsgId);

    const placeholderBotMsg: ChatMessageItem = {
      id: botMsgId,
      sender: "assistant",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, placeholderBotMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          conversationId: activeConversationId,
          stream: true,
          attachment: attachment
            ? {
                type: attachment.type,
                name: attachment.name,
                mimeType: attachment.mimeType,
                base64: attachment.base64,
                text: attachment.text,
              }
            : undefined,
          nutritionContext: userNutritionContext,
          languagePreference: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to receive response from Tarik AI.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Response body is not readable.");

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let detectedDomain = "";
      let detectedMode: "fast" | "deep" = "fast";
      let toolExecutions: any[] = [];
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        // Keep trailing incomplete fragment in buffer
        buffer = events.pop() || "";

        for (const evt of events) {
          const trimmed = evt.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(trimmed.replace("data: ", "").trim());

              if (eventData.type === "meta") {
                detectedDomain = eventData.domain;
                detectedMode = eventData.mode || "fast";
                toolExecutions = eventData.tools || [];
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          domain: detectedDomain,
                          mode: detectedMode,
                          toolExecutions,
                        }
                      : m
                  )
                );
              } else if (eventData.type === "chunk") {
                accumulatedText += eventData.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          text: accumulatedText,
                        }
                      : m
                  )
                );
              } else if (eventData.type === "done") {
                accumulatedText = eventData.fullReply || accumulatedText;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          text: accumulatedText,
                          isStreaming: false,
                          languagePreference: selectedLanguage,
                        }
                      : m
                  )
                );

                if (autoSpeakReplies && accumulatedText) {
                  speechSynthesizer.speak(accumulatedText, selectedLanguage);
                }
              } else if (eventData.type === "error") {
                setErrorNotice(eventData.error);
              }
            } catch (pErr) {
              // Ignore partial JSON parsing during rapid stream
            }
          }
        }
      }

      // Update conversation title if this is the first turn
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId && (c.title === "New Conversation" || c.title === "Conversation" || c.title === "Tarik AI Nutrition Chatbot")
            ? { ...c, title: text.slice(0, 32) + (text.length > 32 ? "..." : "") }
            : c
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by user.");
      } else {
        setErrorNotice(err.message || "Failed to communicate with Tarik AI.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId && !m.text
              ? {
                  ...m,
                  text: `⚠️ **Notice**: ${
                    err.message || "Could not complete response."
                  }\n\nPlease verify your connection and try again.`,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      setCurrentStreamingId(null);
      abortControllerRef.current = null;
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (isLoading || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  // Edit User Message
  const handleEditUserMessage = (editedText: string) => {
    handleSendMessage(editedText);
  };

  // Direct Voice Assistant Send Turn
  const handleVoiceAssistantSend = async (spokenText: string, lang: VoiceLanguageId): Promise<string> => {
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      sender: "user",
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: spokenText,
        conversationId: activeConversationId,
        stream: false,
        nutritionContext: userNutritionContext,
        languagePreference: lang,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to receive Tarik AI voice reply.");
    }

    const data = await res.json();
    const replyText = data.reply || "";

    const botMsgId = `bot_${Date.now()}`;
    const botMsg: ChatMessageItem = {
      id: botMsgId,
      sender: "assistant",
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      domain: data.domain,
      mode: data.mode,
      toolExecutions: data.toolExecutions,
      languagePreference: lang,
    };

    setMessages((prev) => [...prev, botMsg]);
    return replyText;
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] max-w-7xl mx-auto rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* Top Header Bar */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Open Conversation History"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Tarik AI Nutrition Chatbot</h1>
              <p className="text-[10px] text-slate-500">Context-Aware AI Assistant & Nutrition Intelligence</p>
            </div>
          </div>

          {/* Header Controls: Live Voice Mode & Auto-Speak */}
          <div className="flex items-center gap-2 text-[11px] font-medium overflow-x-auto no-scrollbar">
            {/* Live Voice Assistant Modal Trigger */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold shadow-xs transition-all cursor-pointer flex-shrink-0"
              title="Launch hands-free real-time Voice Assistant (like ChatGPT Voice Mode)"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
              <span>🎙️ Live Voice Assistant</span>
            </button>

            {/* Auto Read-Aloud Toggle */}
            <button
              onClick={handleToggleAutoVoice}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0 ${
                autoSpeakReplies
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Toggle automatic speech synthesis for assistant replies"
            >
              {autoSpeakReplies ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Voice Out: {autoSpeakReplies ? "ON" : "OFF"}</span>
            </button>

            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold flex-shrink-0">
              <Flame className="w-3 h-3 text-emerald-600" />
              <span>1,590 kcal left</span>
            </span>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold flex-shrink-0">
              <Scale className="w-3 h-3 text-indigo-600" />
              <span>101g protein</span>
            </span>
          </div>
        </div>

        {/* Error Alert Notice if any */}
        {errorNotice && (
          <div className="m-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{errorNotice}</div>
            <button
              onClick={handleRegenerate}
              className="text-amber-800 font-semibold underline hover:text-amber-950 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Bot className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">Start a conversation with Tarik AI.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Ask about food, meal planning, programming, science, mathematics, or everyday general knowledge.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                isStreaming={isLoading && m.id === currentStreamingId}
                onRegenerate={m.sender === "assistant" && !isLoading ? handleRegenerate : undefined}
                onEdit={m.sender === "user" ? handleEditUserMessage : undefined}
                selectedLanguage={selectedLanguage}
              />
            ))
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Suggested Question Heading & Chips */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Ask Tarik AI
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form with Voice Support */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isLoading={isLoading}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onOpenVoiceMode={() => setIsVoiceModalOpen(true)}
        />

        {/* Real-time Multilingual Voice Assistant Modal */}
        <VoiceAssistantModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onSendVoiceMessage={handleVoiceAssistantSend}
          userName={userNutritionContext.userName}
        />
      </div>
    </div>
  );
}
