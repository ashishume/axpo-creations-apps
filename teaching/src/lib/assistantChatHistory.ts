/**
 * Persist Axpo Assistant chat history by session.
 * When backend API is configured, uses localStorage only (no Supabase).
 * When only Supabase is configured, uses DB; otherwise localStorage.
 */

import { isTeachingApiConfigured } from "./api/client";
import { isSupabaseConfigured } from "./db/supabase";
import { assistantChatMessagesRepository } from "./db/repositories/assistantChatMessages";

const PREFIX = "axpo_assistant_chat_";

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO
  isError?: boolean;
  analytics?: unknown;
}

export function getChatHistoryKey(sessionId: string): string {
  return PREFIX + sessionId;
}

/** Load chat history for a session. When API configured uses localStorage; when Supabase only uses DB; else localStorage. */
export async function loadChatHistory(sessionId: string): Promise<StoredChatMessage[]> {
  if (!isTeachingApiConfigured() && isSupabaseConfigured()) {
    try {
      const rows = await assistantChatMessagesRepository.getBySession(sessionId);
      return rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        timestamp: r.timestamp,
        isError: r.isError,
        analytics: r.analytics,
      }));
    } catch {
      return [];
    }
  }

  try {
    const raw = localStorage.getItem(getChatHistoryKey(sessionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is StoredChatMessage =>
        m &&
        typeof m === "object" &&
        typeof m.id === "string" &&
        typeof m.role === "string" &&
        typeof m.content === "string" &&
        typeof m.timestamp === "string"
    );
  } catch {
    return [];
  }
}

/** Save chat history for a session. When API configured uses localStorage; when Supabase only uses DB; else localStorage. */
export async function saveChatHistory(
  sessionId: string,
  messages: StoredChatMessage[]
): Promise<void> {
  if (!isTeachingApiConfigured() && isSupabaseConfigured()) {
    try {
      await assistantChatMessagesRepository.saveMessages(sessionId, messages);
    } catch {
      // ignore
    }
    return;
  }

  try {
    const key = getChatHistoryKey(sessionId);
    if (messages.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore quota or parse errors
  }
}
