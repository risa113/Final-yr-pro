"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Square,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  Radio,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  VoiceLanguageId,
  SUPPORTED_VOICE_LANGUAGES,
  isSpeechRecognitionSupported,
} from "@/lib/voice/speech-service";

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
  selectedLanguage?: VoiceLanguageId;
  onLanguageChange?: (lang: VoiceLanguageId) => void;
  onOpenVoiceMode?: () => void;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  disabled,
  selectedLanguage = "auto",
  onLanguageChange,
  onOpenVoiceMode,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentLangConfig =
    SUPPORTED_VOICE_LANGUAGES.find((l) => l.id === selectedLanguage) ||
    SUPPORTED_VOICE_LANGUAGES[0];

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLangConfig.sttLang;

    let baseText = input ? input.trim() + " " : "";

    recognition.onresult = (event: any) => {
      let currentSessionText = "";
      for (let i = 0; i < event.results.length; ++i) {
        currentSessionText += event.results[i][0].transcript;
      }
      setInput(baseText + currentSessionText);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech Recognition Error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      console.warn("Could not start recognition:", e);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isRecording) {
      stopVoiceInput();
    }
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

        {/* Language Bar & Live Voice Launcher */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Change spoken and reply language"
            >
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>
                {currentLangConfig.flag} {currentLangConfig.nativeLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute left-0 bottom-full mb-1 w-60 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-30 text-left">
                <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Select Language / Dialect
                </p>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
                    const isSelected = lang.id === selectedLanguage;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          if (onLanguageChange) onLanguageChange(lang.id);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">
                          {lang.flag} {lang.label}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Voice Mode Trigger */}
          {onOpenVoiceMode && (
            <button
              type="button"
              onClick={onOpenVoiceMode}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[11px] font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Voice Mode</span>
            </button>
          )}
        </div>

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

          {/* Voice Speech-to-Text Button */}
          <button
            type="button"
            onClick={startVoiceInput}
            className={`p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/30"
                : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
            title={isRecording ? "Stop voice recording" : `Speak in ${currentLangConfig.nativeLabel}`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? `Listening in ${currentLangConfig.nativeLabel}... speak now`
                : selectedLanguage === "tanglish"
                ? "Tanglish-la pesunga: e.g. '100g idli la evlo calories irukku?'"
                : "Ask Tarik AI anything..."
            }
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
          <span>
            {isRecording ? (
              <span className="text-red-600 font-medium animate-pulse flex items-center gap-1">
                ● Listening now ({currentLangConfig.label})...
              </span>
            ) : (
              "Shift + Enter for new line • Mic button for voice input"
            )}
          </span>
          <span>Tarik AI Nutrition Assistant</span>
        </div>
      </div>
    </div>
  );
}
