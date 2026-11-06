/**
 * Tarik AI Multilingual Voice Assistant Service
 * Provides Speech-to-Text (STT) and Text-to-Speech (TTS)
 * across 7+ regional & global languages (Tanglish, English, Tamil, Hinglish, Hindi, Malayalam, Telugu).
 */

export type VoiceLanguageId =
  | "auto"
  | "tanglish"
  | "english"
  | "tamil"
  | "hinglish"
  | "hindi"
  | "malayalam"
  | "telugu";

export interface VoiceLanguageConfig {
  id: VoiceLanguageId;
  label: string;
  nativeLabel: string;
  sttLang: string;
  ttsLang: string;
  flag: string;
  accentNote: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageConfig[] = [
  {
    id: "tanglish",
    label: "Tanglish (Tamil in English)",
    nativeLabel: "தமிழ் Romanized",
    sttLang: "ta-IN", // Listens with native Tamil acoustic engine to prevent garbled English words
    ttsLang: "en-IN", // Indian English voice pronounces Tanglish with natural Indian cadence
    flag: "🇮🇳",
    accentNote: "Speak in Tamil/Tanglish, replies in Romanized Tamil",
  },
  {
    id: "tamil",
    label: "Tamil (தமிழ் எழுத்துகள்)",
    nativeLabel: "தமிழ்",
    sttLang: "ta-IN",
    ttsLang: "ta-IN",
    flag: "🇮🇳",
    accentNote: "Pure Tamil script & classical cadence",
  },
  {
    id: "english",
    label: "English (Global / Indian)",
    nativeLabel: "English",
    sttLang: "en-IN",
    ttsLang: "en-IN",
    flag: "🌐",
    accentNote: "Standard global & Indian English conversation",
  },
  {
    id: "auto",
    label: "Auto-Detect Language",
    nativeLabel: "Auto-Predict (ChatGPT Style)",
    sttLang: "ta-IN",
    ttsLang: "en-IN",
    flag: "✨",
    accentNote: "Auto predicts Tamil, Tanglish & English",
  },
  {
    id: "hinglish",
    label: "Hinglish (Hindi in English)",
    nativeLabel: "Hinglish",
    sttLang: "hi-IN",
    ttsLang: "en-IN",
    flag: "🇮🇳",
    accentNote: "Colloquial Hindi written in English letters",
  },
  {
    id: "hindi",
    label: "Hindi (हिंदी भाषा)",
    nativeLabel: "हिन्दी",
    sttLang: "hi-IN",
    ttsLang: "hi-IN",
    flag: "🇮🇳",
    accentNote: "Standard Hindi speech",
  },
  {
    id: "malayalam",
    label: "Malayalam (മലയാളം)",
    nativeLabel: "മലയാളം",
    sttLang: "ml-IN",
    ttsLang: "ml-IN",
    flag: "🇮🇳",
    accentNote: "Kerala regional Malayalam / Manglish",
  },
  {
    id: "telugu",
    label: "Telugu (తెలుగు)",
    nativeLabel: "తెలుగు",
    sttLang: "te-IN",
    ttsLang: "te-IN",
    flag: "🇮🇳",
    accentNote: "Andhra / Telangana Telugu speech",
  },
];

/**
 * Strips markdown code blocks, bold markers, headers, and symbols
 * so the synthetic voice sounds completely fluid, conversational, and natural.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, " [Code block skipped] ")
    .replace(/`([^`]+)`/g, "$1")
    // Remove Markdown headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold and italics
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove markdown links but keep anchor text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove tables
    .replace(/\|[^\n]+\|/g, "")
    // Remove bullet points and numbered list markers
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, "")
    // Remove emojis so synthetic voice does not stutter
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Replace multiple newlines or spaces
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether Web Speech Recognition is supported in the current browser.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Checks whether Speech Synthesis is supported in the current browser.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Voice Speech Synthesizer Controller
 */
class SpeechSynthesizer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onEndCallbacks: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Pre-warm browser voice list
      };
    }
  }

  public speak(
    text: string,
    lang: VoiceLanguageId = "auto",
    options: {
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): boolean {
    if (!isSpeechSynthesisSupported()) return false;

    this.stop();

    const clean = cleanTextForSpeech(text);
    if (!clean) return false;

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance;

    const config =
      SUPPORTED_VOICE_LANGUAGES.find((l) => l.id === lang) ||
      SUPPORTED_VOICE_LANGUAGES[0];

    const hasTamilUnicode = /[\u0B80-\u0BFF]/.test(clean);
    const hasHindiUnicode = /[\u0900-\u097F]/.test(clean);
    const hasMalayalamUnicode = /[\u0D00-\u0D7F]/.test(clean);
    const hasTeluguUnicode = /[\u0C00-\u0C7F]/.test(clean);

    // Pick best matching system voice
    const voices = window.speechSynthesis.getVoices();
    let chosenVoice: SpeechSynthesisVoice | undefined;

    if (hasTamilUnicode || lang === "tamil") {
      utterance.lang = "ta-IN";
      chosenVoice =
        voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ta")) ||
        voices.find((v) => v.name.toLowerCase().includes("tamil")) ||
        voices.find((v) => v.lang.includes("en-IN"));
    } else if (hasHindiUnicode || lang === "hindi") {
      utterance.lang = "hi-IN";
      chosenVoice =
        voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("hi")) ||
        voices.find((v) => v.name.toLowerCase().includes("hindi")) ||
        voices.find((v) => v.lang.includes("en-IN"));
    } else if (hasMalayalamUnicode || lang === "malayalam") {
      utterance.lang = "ml-IN";
      chosenVoice =
        voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ml")) ||
        voices.find((v) => v.lang.includes("en-IN"));
    } else if (hasTeluguUnicode || lang === "telugu") {
      utterance.lang = "te-IN";
      chosenVoice =
        voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("te")) ||
        voices.find((v) => v.lang.includes("en-IN"));
    } else if (lang === "tanglish" || lang === "auto" || lang === "hinglish") {
      // Indian English voice sounds ideal for Tanglish / Romanized Tamil
      utterance.lang = "en-IN";
      chosenVoice =
        voices.find(
          (v) =>
            (v.lang.replace("_", "-").toLowerCase().includes("en-in") ||
              v.name.toLowerCase().includes("india") ||
              v.name.toLowerCase().includes("heera") ||
              v.name.toLowerCase().includes("ravi") ||
              v.name.toLowerCase().includes("neerja")) &&
            !v.name.toLowerCase().includes("offline")
        ) ||
        voices.find((v) => v.lang.replace("_", "-").toLowerCase().includes("en-in")) ||
        voices.find((v) => v.lang.startsWith("en"));
    } else {
      utterance.lang = config.ttsLang;
      chosenVoice = voices.find((v) => v.lang.startsWith(config.ttsLang.slice(0, 2)));
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.rate = options.rate ?? (lang === "tanglish" ? 1.05 : 1.0);
    utterance.pitch = options.pitch ?? 1.0;

    utterance.onend = () => {
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
      this.onEndCallbacks.forEach((cb) => cb());
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (options.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stop() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    if (!isSpeechSynthesisSupported()) return false;
    return window.speechSynthesis.speaking;
  }

  public subscribeEnd(cb: () => void) {
    this.onEndCallbacks.add(cb);
    return () => this.onEndCallbacks.delete(cb);
  }
}

export const speechSynthesizer = new SpeechSynthesizer();
