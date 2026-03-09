/**
 * AI Assistant API client (Teaching backend).
 * When Teaching API is configured, use these to parse intents via backend instead of client-side OpenRouter.
 */
import { teachingFetch, teachingFetchJson } from "../../api/client";
import type { IntentResult, EntityFilters } from "../../axpoAssistantParser";

interface ParseResponseDto {
  success: boolean;
  intent: string;
  entity?: string | null;
  operation?: string | null;
  data?: unknown;
  filters?: { id?: string; name?: string; studentId?: string; employeeId?: string } | null;
  message?: string | null;
  error?: string | null;
}

function mapFilters(dto: ParseResponseDto["filters"]): EntityFilters | undefined {
  if (!dto) return undefined;
  return {
    id: dto.id ?? undefined,
    name: dto.name ?? undefined,
    studentId: dto.studentId ?? undefined,
    employeeId: dto.employeeId ?? undefined,
  };
}

export const aiAssistantApi = {
  /**
   * Check if the AI Assistant is available (backend has OpenRouter configured).
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await teachingFetch("/ai-assistant/status");
      if (!res.ok) return false;
      const body = await res.json();
      return Boolean(body?.available);
    } catch {
      return false;
    }
  },

  /**
   * Parse user natural language input via backend. Returns IntentResult compatible with axpoAssistantParser.
   */
  async parseIntent(input: string): Promise<IntentResult> {
    const dto = await teachingFetchJson<ParseResponseDto>("/ai-assistant/parse", {
      method: "POST",
      body: JSON.stringify({ input: input.trim() }),
    });
    return {
      success: dto.success,
      intent: dto.intent as IntentResult["intent"],
      entity: (dto.entity as IntentResult["entity"]) ?? undefined,
      operation: (dto.operation as IntentResult["operation"]) ?? undefined,
      data: dto.data as IntentResult["data"],
      filters: mapFilters(dto.filters),
      message: dto.message ?? undefined,
      error: dto.error ?? undefined,
    };
  },
};
