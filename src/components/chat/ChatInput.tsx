"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

export interface AttachedFile {
  type: "image" | "file";
  name: string;
  mimeType: string;
  base64?: string;
  text?: string;
  sizeBytes: number;
}

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: AttachedFile) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && !attachment) || isLoading || disabled) return;
    onSendMessage(input.trim(), attachment || undefined);
    setInput("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    const reader = new FileReader();

    if (isImage || isPDF) {
      reader.onload = () => {
        setAttachment({
          type: isImage ? "image" : "file",
          name: file.name,
          mimeType: file.type || (isPDF ? "application/pdf" : "image/jpeg"),
          base64: reader.result as string,
          sizeBytes: file.size,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Read as text
      reader.onload = () => {
        setAttachment({
          type: "file",
          name: file.name,
          mimeType: file.type || "text/plain",
          text: reader.result as string,
          sizeBytes: file.size,
        });
      };
      reader.readAsText(file);
    }

    // Reset file input so user can pick same file again if removed
    e.target.value = "";
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Attachment Preview Chip */}
        {attachment && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 shadow-xs">
            {attachment.type === "image" ? (
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            ) : (
              <FileText className="w-4 h-4 text-indigo-600" />
            )}
            <span className="font-medium max-w-xs truncate">{attachment.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({(attachment.sizeBytes / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Box */}
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-xs">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            title="Attach image, document, or code file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,text/*,.csv,.json,.py,.js,.ts,.tsx,.cpp,.java,.html"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Tarik AI anything..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent border-0 resize-none py-2 px-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-44 leading-relaxed"
          />

          {/* Action Button: Stop or Send */}
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex-shrink-0 transition-all cursor-pointer shadow-sm"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-current text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!input.trim() && !attachment) || disabled}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex-shrink-0 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Shift + Enter for new line</span>
          <span>Tarik AI Nutrition Chatbot</span>
        </div>
      </div>
    </div>
  );
}
