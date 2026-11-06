"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  FileText,
  Edit2,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { ToolExecutionBadge } from "./ToolExecutionBadge";
import { ToolExecutionRecord } from "@/lib/tools";
import { speechSynthesizer, VoiceLanguageId } from "@/lib/voice/speech-service";

export interface ChatMessageItem {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  isVoice?: boolean;
  domain?: string;
  mode?: "fast" | "deep";
  assistantName?: string;
  isStreaming?: boolean;
  toolExecutions?: ToolExecutionRecord[];
  languagePreference?: VoiceLanguageId;
  attachment?: {
    type: "image" | "file";
    name?: string;
    url?: string;
  };
}

interface ChatMessageProps {
  message: ChatMessageItem;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
  selectedLanguage?: VoiceLanguageId;
}

export function ChatMessage({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
  selectedLanguage = "auto",
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.sender === "user";

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechSynthesizer.stop();
      setIsSpeaking(false);
    } else {
      const langToUse = message.languagePreference || selectedLanguage || "auto";
      const success = speechSynthesizer.speak(message.text, langToUse, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      if (success) setIsSpeaking(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = async (rating: "up" | "down") => {
    if (feedback === rating) return;
    setFeedback(rating);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          rating,
          category: message.domain || "general",
        }),
      });
    } catch (err) {
      console.warn("Feedback recording failed:", err);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editText.trim() && editText !== message.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group flex items-start gap-3.5 py-3.5 px-2 sm:px-4 rounded-2xl transition-colors ${
        isUser ? "bg-slate-50/70" : "bg-transparent"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
          isUser
            ? "bg-slate-900 text-white"
            : "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-800">
              {isUser ? "You" : "Tarik AI"}
            </span>
            <span className="text-[11px]">&bull; {message.timestamp}</span>

            {/* Voice Input Badge */}
            {message.isVoice && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                🎙️ Voice
              </span>
            )}

            {/* Mode Pill (Fast vs Deep) */}
            {!isUser && message.mode && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                  message.mode === "fast"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                }`}
              >
                <Zap className="w-2.5 h-2.5" />
                {message.mode === "fast" ? "Fast" : "Deep"}
              </span>
            )}

            {/* Domain Pill */}
            {message.domain && message.domain !== "GENERAL_KNOWLEDGE" && (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium hidden xs:inline-block">
                {message.domain.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Quick Actions (Copy / Edit) - Always accessible on mobile */}
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
            {isUser && onEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Attachment Thumbnail if present */}
        {message.attachment && (
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
            {message.attachment.type === "image" && message.attachment.url ? (
              <img
                src={message.attachment.url}
                alt={message.attachment.name || "Attachment"}
                className="w-16 h-16 object-cover rounded-lg border border-slate-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 pr-2">
              <p className="font-medium truncate max-w-xs">{message.attachment.name || "Attachment"}</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">{message.attachment.type}</p>
            </div>
          </div>
        )}

        {/* Tool Executions Badge */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {message.toolExecutions.map((tool, idx) => (
              <ToolExecutionBadge key={idx} tool={tool} />
            ))}
          </div>
        )}

        {/* User In-line Editing */}
        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Save & Resend
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Render Markdown Body with Live Typing Cursor */
          <div className="prose prose-slate max-w-none text-sm leading-relaxed break-words text-slate-800">
            {message.text ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, "")}
                        />
                      ) : (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[13px] border border-slate-200/60"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="my-3 overflow-x-auto rounded-xl border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200 text-xs">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3 py-2 bg-slate-50 text-left font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3 py-2 text-slate-600 border-t border-slate-100 whitespace-nowrap">
                          {children}
                        </td>
                      );
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 italic text-slate-600 bg-emerald-50/30 rounded-r-lg my-2">
                          {children}
                        </blockquote>
                      );
                    },
                  }}
                >
                  {message.text}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-emerald-600 animate-pulse align-middle" />
                )}
              </>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <span className="inline-block w-2 h-4 bg-emerald-600 animate-pulse align-middle" />
                <span>Tarik AI is thinking...</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Assistant Bottom Actions (Speak, Thumbs, Copy, Regenerate) */}
        {!isUser && !isEditing && message.text && !isStreaming && (
          <div className="flex items-center gap-3 pt-1 text-slate-400 text-xs">
            {/* Read Aloud / Text-to-Speech Button */}
            <button
              onClick={handleToggleSpeak}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                isSpeaking ? "text-emerald-600 font-semibold animate-pulse" : "hover:text-slate-700"
              }`}
              title={isSpeaking ? "Stop listening" : "Read aloud (Voice synthesis)"}
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">{isSpeaking ? "Speaking..." : "Listen"}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={() => handleFeedback("up")}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                feedback === "up" ? "text-emerald-600 font-bold" : "hover:text-slate-700"
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleFeedback("down")}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                feedback === "down" ? "text-red-500 font-bold" : "hover:text-slate-700"
              }`}
              title="Needs improvement"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer ml-auto"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
