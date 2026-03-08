/**
 * Parse "add student(s)" natural language using OpenRouter API.
 * Returns the same ParseResult shape as studentChatParser for drop-in use.
 */

import type { StudentPersonalDetails } from "../types";
import type { ParseResult, ParsedStudent } from "./studentChatParser";
import { openRouterChat, isOpenRouterAvailable } from "./openRouter";

export function isLLMAvailableForAddStudents(): boolean {
  return isOpenRouterAvailable();
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

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

function parseJsonResponse(text: string): { students: ParsedStudent[]; error?: string } {
  const trimmed = text.trim();
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

export async function parseAddStudentsWithOpenRouter(userInput: string): Promise<ParseResult> {
  if (!isOpenRouterAvailable()) {
    return { success: false, students: [], error: "OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in .env.local." };
  }

  const trimmed = userInput.trim();
  if (!trimmed) {
    return { success: false, students: [], error: "Enter a message to add student(s)." };
  }

  try {
    const content = await openRouterChat(
      [
        { role: "user", content: SYSTEM_PROMPT + "\n\n" + buildUserPrompt(trimmed) },
      ],
      { temperature: 0.1, max_tokens: 1024, response_format: { type: "json_object" } }
    );
    const { students, error } = parseJsonResponse(content);
    if (error && students.length === 0) {
      return { success: false, students: [], error };
    }
    return { success: true, students };
  } catch (e) {
    return {
      success: false,
      students: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
