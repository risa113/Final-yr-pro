/**
 * Advanced Conversation Memory & Context Window Manager
 * Manages conversation persistence, sliding context windows, and privacy isolation.
 */

import { LLMMessage } from "./llm-client";

export interface StoredMessage {
  id: string;
  conversationId: string;
  senderRole: "user" | "assistant" | "system";
  content: string;
  contextSnapshot?: any;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export const MAX_CONTEXT_MESSAGES = 12;

/**
 * Prunes and prepares conversation history into LLMMessage objects,
 * maintaining context-window limits while preserving the initial user intent.
 */
export function buildBoundedContext(
  history: { role: "user" | "assistant" | "model" | "system"; content: string }[],
  summarySnippet?: string,
  maxMessages: number = MAX_CONTEXT_MESSAGES
): LLMMessage[] {
  const messages: LLMMessage[] = [];

  if (summarySnippet) {
    messages.push({
      role: "model",
      parts: [`[Conversation Summary of earlier turns: ${summarySnippet}]`],
    });
  }

  // Take the most recent messages up to maxMessages
  const boundedHistory = history.slice(-maxMessages);

  for (const item of boundedHistory) {
    const role = item.role === "assistant" ? "model" : (item.role as any);
    messages.push({
      role,
      parts: [item.content],
    });
  }

  return messages;
}

/**
 * In-memory conversation store for guest/demo sessions
 * ensuring zero leakage across distinct conversation IDs.
 */
class InMemoryConversationStore {
  private conversations: Map<string, { id: string; title: string; updatedAt: string }> = new Map();
  private messages: Map<string, StoredMessage[]> = new Map();

  constructor() {
    // Seed a default conversation with Tarik AI branding
    const defaultId = "conv_default_general";
    this.conversations.set(defaultId, {
      id: defaultId,
      title: "Tarik AI Nutrition Chatbot",
      updatedAt: "2026-11-02T12:00:00.000Z",
    });
    this.messages.set(defaultId, [
      {
        id: "msg_welcome",
        conversationId: defaultId,
        senderRole: "assistant",
        content: `Hi! I'm Tarik AI. How can I help you today?`,
        createdAt: "2026-11-02T12:00:00.000Z",
      },
    ]);
  }

  listConversations(limit: number = 30): { id: string; title: string; updatedAt: string; messageCount: number }[] {
    return Array.from(this.conversations.values())
      .map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: (this.messages.get(c.id) || []).length,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  createConversation(title?: string): { id: string; title: string } {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTitle = title || "New Conversation";
    this.conversations.set(id, {
      id,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
    this.messages.set(id, []);
    return { id, title: newTitle };
  }

  getMessages(conversationId: string): StoredMessage[] {
    return this.messages.get(conversationId) || [];
  }

  addMessage(
    conversationId: string,
    senderRole: "user" | "assistant" | "system",
    content: string,
    contextSnapshot?: any
  ): StoredMessage {
    if (!this.conversations.has(conversationId)) {
      this.createConversation("Conversation");
    }

    const msg: StoredMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderRole,
      content,
      contextSnapshot,
      createdAt: new Date().toISOString(),
    };

    const list = this.messages.get(conversationId) || [];
    list.push(msg);
    this.messages.set(conversationId, list);

    // Auto-update conversation title if it's the first user message
    const conv = this.conversations.get(conversationId);
    if (conv && senderRole === "user" && (conv.title === "New Conversation" || conv.title === "Conversation")) {
      const derivedTitle = content.slice(0, 36) + (content.length > 36 ? "..." : "");
      conv.title = derivedTitle;
      conv.updatedAt = new Date().toISOString();
    } else if (conv) {
      conv.updatedAt = new Date().toISOString();
    }

    return msg;
  }

  renameConversation(conversationId: string, newTitle: string): boolean {
    const conv = this.conversations.get(conversationId);
    if (!conv) return false;
    conv.title = newTitle;
    conv.updatedAt = new Date().toISOString();
    return true;
  }

  deleteConversation(conversationId: string): boolean {
    this.messages.delete(conversationId);
    return this.conversations.delete(conversationId);
  }
}

// Global singleton instance for memory persistence across API invocations in current runtime
export const memoryStore = new InMemoryConversationStore();
