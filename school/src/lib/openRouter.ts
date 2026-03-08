/**
 * OpenRouter API client – single LLM integration for school app.
 * Uses OpenAI-compatible chat completions: https://openrouter.ai/docs/api-reference/chat-completion
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-2.0-flash";

function getApiKey(): string | undefined {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_API_KEY
    ? String(import.meta.env.VITE_OPENROUTER_API_KEY).trim()
    : undefined;
}

export function getOpenRouterModel(): string {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_MODEL
    ? String(import.meta.env.VITE_OPENROUTER_MODEL).trim()
    : DEFAULT_MODEL;
}

export function isOpenRouterAvailable(): boolean {
  return !!getApiKey();
}

export interface OpenRouterChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChatOptions {
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

/**
 * Send a chat completion request to OpenRouter. Returns the assistant message content or throws.
 */
export async function openRouterChat(
  messages: OpenRouterChatMessage[],
  options: OpenRouterChatOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env.local.");
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.1,
      max_tokens: options.max_tokens ?? 2048,
      ...(options.response_format && { response_format: options.response_format }),
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    let errMsg = text?.slice(0, 300) || `API error (${res.status})`;
    try {
      const errJson = JSON.parse(text);
      errMsg = errJson?.error?.message ?? errJson?.error ?? errMsg;
    } catch {
      // use errMsg as is
    }
    if (res.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    throw new Error(errMsg);
  }

  const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content;
  if (content == null || content === "") {
    throw new Error("No response from model.");
  }
  return content;
}
