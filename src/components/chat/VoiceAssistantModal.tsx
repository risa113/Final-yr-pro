"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Globe,
  Radio,
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  VoiceLanguageId,
  SUPPORTED_VOICE_LANGUAGES,
  speechSynthesizer,
  isSpeechRecognitionSupported,
} from "@/lib/voice/speech-service";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: VoiceLanguageId;
  onLanguageChange: (lang: VoiceLanguageId) => void;
  onSendVoiceMessage: (text: string, lang: VoiceLanguageId) => Promise<string>;
  userName?: string;
}

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

export function VoiceAssistantModal({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
  onSendVoiceMessage,
  userName = "Friend",
}: VoiceAssistantModalProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [aiReply, setAiReply] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isHandsFree, setIsHandsFree] = useState<boolean>(true);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  const currentLangConfig =
    SUPPORTED_VOICE_LANGUAGES.find((l) => l.id === selectedLanguage) ||
    SUPPORTED_VOICE_LANGUAGES[0];

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopListening();
      speechSynthesizer.stop();
    };
  }, []);

  // Initialize SpeechRecognition on modal open
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      speechSynthesizer.stop();
      setStatus("idle");
      setTranscript("");
      setAiReply("");
      return;
    }

    // Auto-start listening on open
    startListening();
  }, [isOpen, selectedLanguage]);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        "Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari."
      );
      return;
    }

    speechSynthesizer.stop();
    stopListening();
    setErrorMessage("");
    setStatus("listening");
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLangConfig.sttLang;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = final || interim;
      setTranscript(text);

      if (final && final.trim()) {
        handleUserSpoke(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        // Keep in listening or idle
        setStatus("idle");
      } else if (event.error === "not-allowed") {
        setErrorMessage("Microphone access was denied. Please allow microphone permissions.");
        setStatus("idle");
      } else {
        console.warn("[Voice STT Error]:", event.error);
        setStatus("idle");
      }
    };

    recognition.onend = () => {
      if (status === "listening" && !transcript.trim()) {
        setStatus("idle");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Recognition already active", e);
    }
  };

  const handleUserSpoke = async (spokenText: string) => {
    stopListening();
    setStatus("thinking");

    try {
      const response = await onSendVoiceMessage(spokenText, selectedLanguage);
      if (!isComponentMounted.current) return;

      setAiReply(response);
      setStatus("speaking");

      speechSynthesizer.speak(response, selectedLanguage, {
        onEnd: () => {
          if (!isComponentMounted.current) return;
          setStatus("idle");
          if (isHandsFree) {
            // Hands-free conversational loop
            setTimeout(() => {
              if (isComponentMounted.current && isOpen) {
                startListening();
              }
            }, 600);
          }
        },
        onError: () => {
          if (isComponentMounted.current) setStatus("idle");
        },
      });
    } catch (err: any) {
      if (!isComponentMounted.current) return;
      setErrorMessage(err.message || "Failed to formulate voice response.");
      setStatus("idle");
    }
  };

  const toggleListening = () => {
    if (status === "listening") {
      stopListening();
      setStatus("idle");
    } else if (status === "speaking") {
      speechSynthesizer.stop();
      setStatus("idle");
    } else {
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center text-white overflow-hidden">
        {/* Background glow orb */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Language Switcher & Close */}
        <div className="w-full flex items-center justify-between z-10 mb-6">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentLangConfig.flag} {currentLangConfig.nativeLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl p-1.5 shadow-xl z-30 text-left">
                <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Select Spoken & Reply Dialect
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
                    const isSelected = lang.id === selectedLanguage;
                    return (
                      <button
                        key={lang.id}
                        onClick={() => {
                          onLanguageChange(lang.id);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600/20 text-emerald-300 font-semibold"
                            : "text-slate-300 hover:bg-slate-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{lang.flag}</span>
                          <span className="truncate">{lang.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Exit Voice Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branding & Status Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-[11px] font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Tarik AI Multilingual Voice Assistant</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            {status === "listening" && "Listening to you..."}
            {status === "thinking" && "Formulating response..."}
            {status === "speaking" && "Tarik AI is speaking..."}
            {status === "idle" && "Tap the microphone to speak"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Speaking in <strong className="text-emerald-400">{currentLangConfig.label}</strong>
          </p>
        </div>

        {/* Central Animated Pulsing Orb (ChatGPT/Gemini Live style) */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Ambient outer rings */}
          <div
            className={`absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full transition-all duration-700 ${
              status === "listening"
                ? "bg-emerald-500/20 scale-110 animate-ping"
                : status === "speaking"
                ? "bg-teal-500/25 scale-125 animate-pulse"
                : status === "thinking"
                ? "bg-indigo-500/20 scale-100 animate-spin"
                : "bg-slate-800/40 scale-95"
            }`}
          />

          <div
            className={`absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-all duration-500 ${
              status === "listening"
                ? "bg-emerald-500/30 blur-md scale-105"
                : status === "speaking"
                ? "bg-teal-400/35 blur-lg scale-110"
                : status === "thinking"
                ? "bg-indigo-500/30 blur-md"
                : "bg-slate-800/60"
            }`}
          />

          {/* Core Interactive Mic Orb */}
          <button
            onClick={toggleListening}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
              status === "listening"
                ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 scale-105 shadow-emerald-500/40"
                : status === "speaking"
                ? "bg-gradient-to-tr from-teal-400 to-cyan-500 text-slate-950 shadow-teal-500/40"
                : status === "thinking"
                ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-indigo-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
            title={
              status === "listening"
                ? "Tap to pause"
                : status === "speaking"
                ? "Tap to mute"
                : "Tap to talk"
            }
          >
            {status === "listening" ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : status === "speaking" ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : status === "thinking" ? (
              <Sparkles className="w-10 h-10 animate-spin" />
            ) : (
              <MicOff className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Live Subtitle Transcript Display */}
        <div className="w-full min-h-[90px] max-h-36 overflow-y-auto px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-left text-xs sm:text-sm space-y-2">
          {transcript && (
            <p className="text-slate-200">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                You:
              </span>
              {transcript}
            </p>
          )}

          {aiReply && status !== "listening" && (
            <p className="text-emerald-100">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                Tarik AI ({currentLangConfig.nativeLabel}):
              </span>
              {aiReply}
            </p>
          )}

          {!transcript && !aiReply && (
            <p className="text-slate-500 text-center py-4 italic">
              Try saying: &quot;100g idli la evlo calories irukku?&quot; or &quot;How much protein in dal?&quot;
            </p>
          )}
        </div>

        {/* Error Notification if any */}
        {errorMessage && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-left">
            {errorMessage}
          </div>
        )}

        {/* Bottom Feature Toggles */}
        <div className="w-full mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isHandsFree}
              onChange={(e) => setIsHandsFree(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-800 border-slate-700"
            />
            <span>Hands-Free Auto Turn</span>
          </label>

          <button
            onClick={() => {
              speechSynthesizer.stop();
              setAiReply("");
              startListening();
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Turn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
