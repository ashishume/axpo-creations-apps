/**
 * Parse "add student(s)" natural language using Google Gemini API.
 * Returns the same ParseResult shape as studentChatParser for drop-in use.
 */

import type { StudentPersonalDetails } from "../types";
import type { ParseResult, ParsedStudent } from "./studentChatParser";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Free-tier models; try in order (names vary by region / API version). Override with VITE_GEMINI_MODEL if needed.
const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

function getModelsToTry(): string[] {
  const envModel =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL
      ? String(import.meta.env.VITE_GEMINI_MODEL).trim()
      : "";
  if (envModel) return [envModel, ...DEFAULT_MODELS.filter((m) => m !== envModel)];
  return DEFAULT_MODELS;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function getApiKey(): string | undefined {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY
    ? String(import.meta.env.VITE_GEMINI_API_KEY).trim()
    : undefined;
}

export function isGeminiAvailable(): boolean {
  return !!getApiKey();
}

const SYSTEM_PROMPT = `You are a strict JSON extractor for a school app. The user will type a natural language request to ADD one or more students. Your job is to extract structured data and return ONLY valid JSON, no markdown or explanation.

Output JSON must match this exact structure (use null for missing optional fields):
{
  "students": [
    {
      "name": "string (required, full name of student)",
      "classLabel": "string or null (e.g. \\"1\\", \\"2\\", \\"4\\", \\"nursery\\" - the class/grade/standard number or name only)",
      "sessionYear": "string or null (e.g. \\"2024-2025\\")",
      "personalDetails": {
        "fatherName": "string or null",
        "motherName": "string or null",
        "guardianPhone": "string or null (digits only or with +)",
        "currentAddress": "string or null",
        "permanentAddress": "string or null",
        "bloodGroup": "A+ | A- | B+ | B- | AB+ | AB- | O+ | O- or null",
        "healthIssues": "string or null"
      } or null
    }
  ]
}

Rules:
- If the message is NOT about adding student(s), return: { "students": [], "error": "Could not detect add student intent." }
- Extract every student name mentioned (e.g. "diya and rahul" -> two students; "Rahul, Priya and Suresh" -> three).
- classLabel: only the number or name (1, 2, 4, nursery), not "class 1" - just "1".
- sessionYear: only if explicitly mentioned (e.g. 2024-2025).
- personalDetails: only include fields that are explicitly mentioned; omit the whole object if nothing is mentioned.
- bloodGroup must be one of the allowed values or null.
- Return only the JSON object, no other text.`;

function buildUserPrompt(userInput: string): string {
  return `Extract student(s) to add from this message. Return JSON only.\n\n"${userInput}"`;
}

function parseGeminiJson(text: string): { students: ParsedStudent[]; error?: string } {
  const trimmed = text.trim();
  // Strip markdown code block if present
  const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(jsonStr) as {
    students?: Array<{
      name?: string;
      classLabel?: string | null;
      sessionYear?: string | null;
      personalDetails?: {
        fatherName?: string | null;
        motherName?: string | null;
        guardianPhone?: string | null;
        currentAddress?: string | null;
        permanentAddress?: string | null;
        bloodGroup?: string | null;
        healthIssues?: string | null;
      } | null;
    }>;
    error?: string;
  };

  if (parsed.error) {
    return { students: [], error: parsed.error };
  }

  const students: ParsedStudent[] = (parsed.students ?? []).map((s) => {
    const pd = s.personalDetails;
    let personalDetails: StudentPersonalDetails | undefined;
    if (pd && (pd.fatherName || pd.motherName || pd.guardianPhone || pd.currentAddress || pd.permanentAddress || pd.bloodGroup || pd.healthIssues)) {
      const bg = pd.bloodGroup && BLOOD_GROUPS.includes(pd.bloodGroup as (typeof BLOOD_GROUPS)[number]) ? pd.bloodGroup : undefined;
      personalDetails = {
        fatherName: pd.fatherName ?? undefined,
        motherName: pd.motherName ?? undefined,
        guardianPhone: pd.guardianPhone ?? undefined,
        currentAddress: pd.currentAddress ?? undefined,
        permanentAddress: pd.permanentAddress ?? undefined,
        bloodGroup: (bg as StudentPersonalDetails["bloodGroup"]) ?? undefined,
        healthIssues: pd.healthIssues ?? undefined,
      };
    }
    return {
      name: (s.name ?? "").trim() || "Unknown",
      classLabel: s.classLabel ?? undefined,
      sessionYear: s.sessionYear ?? undefined,
      personalDetails,
    };
  }).filter((s) => s.name && s.name !== "Unknown");

  return { students, error: students.length === 0 ? "No student names found." : undefined };
}

export async function parseAddStudentsWithGemini(userInput: string): Promise<ParseResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, students: [], error: "Gemini API key not configured." };
  }

  const trimmed = userInput.trim();
  if (!trimmed) {
    return { success: false, students: [], error: "Enter a message to add student(s)." };
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + buildUserPrompt(trimmed) },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  interface GeminiPart {
    text?: string;
  }
  interface GeminiContent {
    parts?: GeminiPart[];
  }
  interface GeminiCandidate {
    content?: GeminiContent;
  }

  let lastError = "";
  for (const model of getModelsToTry()) {
    try {
      const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      if (!res.ok) {
        const isModelNotFound =
          res.status === 404 ||
          /not found|not supported for generateContent/i.test(responseText);
        lastError = (() => {
          try {
            const errJson = JSON.parse(responseText);
            return errJson?.error?.message ?? responseText?.slice(0, 200) ?? `API error (${res.status})`;
          } catch {
            return responseText?.slice(0, 200) || `API error (${res.status})`;
          }
        })();
        if (isModelNotFound) continue;
        if (res.status === 429) return { success: false, students: [], error: "Rate limit exceeded. Please try again in a moment." };
        return { success: false, students: [], error: lastError };
      }

      const data = JSON.parse(responseText) as { candidates?: GeminiCandidate[] };
      const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textPart) {
        return { success: false, students: [], error: "No response from Gemini." };
      }

      const { students, error } = parseGeminiJson(textPart);
      if (error && students.length === 0) {
        return { success: false, students: [], error };
      }
      return { success: true, students };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    success: false,
    students: [],
    error: lastError || "No Gemini model available. Check VITE_GEMINI_API_KEY and try again.",
  };
}
