/**
 * Parse natural-language "add student(s)" input into structured data.
 * No AI/LLM: pattern-based to handle many phrasings.
 */

import type { StudentPersonalDetails } from "../types";

export interface ParsedStudent {
  name: string;
  /** e.g. "1", "2", "class 4", "grade 5" - resolved to classId using session classes */
  classLabel?: string;
  /** e.g. "2024-2025" - optional; UI can use selected session if missing */
  sessionYear?: string;
  personalDetails?: StudentPersonalDetails;
}

export interface ParseResult {
  success: boolean;
  students: ParsedStudent[];
  error?: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function normalize(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*[.,;:]\s*/g, " ")
    .trim()
    .toLowerCase();
}

/** Match "add student(s)" intent - many phrasings */
function isAddStudentIntent(n: string): boolean {
  const patterns = [
    // Core patterns: add/create/register + student(s)
    /\b(?:please\s+)?(?:add|create|register|enroll|enrol|insert|new)\s+(?:a\s+)?(?:new\s+)?student(s)?\b/i,
    /\b(?:add|create|register|enroll|enrol)\s+(?:a\s+)?student(s)?\s+(?:named?|called|by\s+name|with\s+name)/i,
    
    // "add these/the/some/following students"
    /\b(?:add|create|register)\s+(?:these?|the|some|following|my|our)\s+student(s)?/i,
    /\b(?:add|create|register)\s+(?:these?\s+)?(?:student|students)\s*(?:named?|called)?/i,
    
    // Intent with "want to", "need to", "would like to"
    /\b(?:i\s+)?(?:want\s+to|would\s+like\s+to|need\s+to|going\s+to|have\s+to)\s+(?:add|create|register|enroll)\s+(?:a\s+)?(?:new\s+)?student(s)?/i,
    
    // "students:" or "student:" at start or after add
    /\b(?:add|create|register)?\s*(?:student|students)\s*[:\-]/i,
    /\bstudent\s+(?:addition|registration|enrollment)\s*[:\-]?/i,
    /\b(?:new|add)\s+student(s)?\s*[:\-]?/i,
    
    // "add him/her/them as student"
    /\b(?:add|create)\s+(?:him|her|them)\s+as\s+(?:a\s+)?student/i,
    
    // "add following/these students"
    /\b(?:add|register)\s+(?:the\s+)?(?:following|below|these)\s+student(s)?/i,
    
    // Polite forms
    /\b(?:can\s+you\s+)?(?:please\s+)?(?:kindly\s+)?(?:add|create|register)\s+(?:a\s+)?(?:new\s+)?student/i,
    /\b(?:let'?s|lets)\s+(?:add|create|register)\s+(?:a\s+)?(?:new\s+)?student(s)?/i,
    /\b(?:could\s+you|would\s+you)\s+(?:please\s+)?(?:add|create|register)\s+(?:a\s+)?student/i,
    
    // "here is/are students"
    /\b(?:here\s+(?:is|are)|here'?s)\s+(?:a\s+)?(?:new\s+)?(?:the\s+)?student(s)?/i,
    /\b(?:this\s+is|these\s+are)\s+(?:a\s+)?(?:new\s+)?student(s)?/i,
    
    // Entry/record
    /\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?(?:student\s+)?(?:entry|record)/i,
    /\b(?:add|create)\s+student\s+(?:with\s+)?(?:details?|info|information)/i,
    
    // Enroll/enrol variations
    /\b(?:enrol|enroll)\s+(?:a\s+)?(?:new\s+)?(?:the\s+)?student(s)?/i,
    /\b(?:enrollment|enrolment)\s+(?:for\s+)?(?:student|of)/i,
    
    // Put/enter/record/include/insert
    /\b(?:put\s+in|enter|record|log)\s+(?:a\s+)?(?:new\s+)?student/i,
    /\b(?:include|insert|input)\s+(?:a\s+)?(?:new\s+)?student/i,
    
    // More student(s)
    /\b(?:add|register|create)\s+(?:one|two|three|four|five|some|few|more|another)\s+(?:more\s+)?student(s)?/i,
    
    // Student to add/register
    /\b(?:new\s+)?(?:student|pupil|learner)\s+(?:to\s+)?(?:add|register|enroll|be\s+added)/i,
    
    // Admit/admission
    /\b(?:admit|admission)\s+(?:a\s+)?(?:new\s+)?student/i,
    /\b(?:take\s+in|accept|onboard)\s+(?:a\s+)?(?:new\s+)?student/i,
    
    // Names followed by "for/in/to class" (implicit add)
    /\b(?:named?|name)\s+[A-Za-z0-9\s,]+\s+(?:for|in|to)\s+class/i,
    
    // Simple "student(s) named X"
    /\bstudent(s)?\s+named?\s+[A-Za-z]/i,
    
    // "X for class Y" pattern (common shorthand)
    /\b[A-Za-z0-9\s,]+\s+for\s+class\s+\d/i,
  ];
  return patterns.some((p) => p.test(n));
}

/** Extract session year like 2024-2025, 2024-25, 2024 2025 */
function extractSessionYear(text: string): string | undefined {
  const m = text.match(/\b(20\d{2})\s*[-–—]\s*(20\d{2}|(?:\d{2}))\b/i);
  if (!m) return undefined;
  const end = m[2].length === 2 ? `20${m[2]}` : m[2];
  return `${m[1]}-${end}`;
}

/** Normalize class label to a number string for matching: "class 4" -> "4", "grade 5" -> "5", "nursery" -> "nursery" */
function normalizeClassLabel(raw: string): string {
  const s = raw.trim().toLowerCase();
  const ordinals: Record<string, string> = {
    first: "1", 1: "1", one: "1",
    second: "2", 2: "2", two: "2",
    third: "3", 3: "3", three: "3",
    fourth: "4", 4: "4", four: "4",
    fifth: "5", 5: "5", five: "5",
    sixth: "6", 6: "6", six: "6",
    seventh: "7", 7: "7", seven: "7",
    eighth: "8", 8: "8", eight: "8",
    ninth: "9", 9: "9", nine: "9",
    tenth: "10", 10: "10", ten: "10",
  };
  let m = s.match(/\b(?:class|grade|standard|std|form)\s*[:\-]?\s*(\w+)\b/);
  if (m) {
    const v = m[1];
    return ordinals[v] ?? v;
  }
  m = s.match(/\b(1st|2nd|3rd|\d+th)\s+(?:class|grade|standard)\b/);
  if (m) {
    const num = m[1].replace(/\D/g, "");
    return num || m[1];
  }
  if (/^\d+$/.test(s)) return s;
  if (/\b(nursery|kg|pre[- ]?primary|pp|ukg|lkg)\b/.test(s)) return s;
  return raw.trim();
}

/** Find class mention in a segment: "class 4", "grade 2", "in class 1", "for class 5" */
function extractClassLabel(segment: string): string | undefined {
  const patterns = [
    // "for class 1", "in class 2", "to class 3"
    /\b(?:for|in|to)\s+(?:class|grade|standard|std)\s*[:\-]?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i,
    // "class 4", "grade 5", "standard 3"
    /\b(?:class|grade|standard|std|form)\s*[:\-]?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i,
    // "1st class", "2nd grade"
    /\b(1st|2nd|3rd|\d+th)\s+(?:class|grade|standard)\b/i,
    // "class: X" or "grade: X"
    /\b(?:class|grade)\s*[:\-]\s*(\S+)/i,
    // Nursery, KG, etc.
    /\b(nursery|kg|pre[- ]?primary|pp|ukg|lkg)\b/i,
  ];
  for (const p of patterns) {
    const m = segment.match(p);
    if (m) return normalizeClassLabel(m[1] ?? m[0]);
  }
  return undefined;
}

/** Extract personal details from a segment (father, mother, guardian, phone, address, blood, health) */
function extractPersonalDetails(segment: string): Partial<StudentPersonalDetails> {
  const out: Partial<StudentPersonalDetails> = {};
  const s = segment;

  const fatherPatterns = [
    /\b(?:father'?s?\s+name|father\s*[:\-]|father'?s?\s+name\s+is\s*[:\-]?)\s*([^,.\n]+?)(?=\s+(?:mother|guardian|phone|address|blood|class|session|$)|[,.\n])/i,
    /\b(?:father|dad|papa)\s*[:\-]\s*([^,.\n]+?)(?=\s+(?:mother|guardian|phone|class|$)|[,.\n])/i,
    /\bfather\s+([A-Za-z][A-Za-z\s.]+?)(?=\s+mother|\s+guardian|\s+phone|,|\.|\n|$)/i,
  ];
  for (const p of fatherPatterns) {
    const m = s.match(p);
    if (m && m[1]) {
      out.fatherName = m[1].trim();
      break;
    }
  }

  const motherPatterns = [
    /\b(?:mother'?s?\s+name|mother\s*[:\-]|mother'?s?\s+name\s+is\s*[:\-]?)\s*([^,.\n]+?)(?=\s+(?:father|guardian|phone|address|blood|class|session|$)|[,.\n])/i,
    /\b(?:mother|mom|mum|mummy)\s*[:\-]\s*([^,.\n]+?)(?=\s+(?:father|guardian|phone|class|$)|[,.\n])/i,
    /\bmother\s+([A-Za-z][A-Za-z\s.]+?)(?=\s+father|\s+guardian|\s+phone|,|\.|\n|$)/i,
  ];
  for (const p of motherPatterns) {
    const m = s.match(p);
    if (m && m[1]) {
      out.motherName = m[1].trim();
      break;
    }
  }

  const phonePatterns = [
    /\b(?:guardian'?s?\s+phone|guardian\s+contact|contact\s+(?:no|number)|phone\s*[:\-]|mobile\s*[:\-]|mobile\s+no\.?)\s*[:\-]?\s*([0-9\s\-+]{10,15})\b/i,
    /\b(?:phone|mobile|contact)\s+(?:no\.?|number)?\s*[:\-]?\s*([0-9\s\-+]{10,15})\b/i,
    /\b([6-9]\d{9})\b/g,
    /\b(\+91[\s\-]?[6-9]\d{9})\b/,
    /\b(\d{5}[\s\-]?\d{5})\b/,
  ];
  for (const p of phonePatterns) {
    const m = s.match(p);
    if (m && m[1]) {
      out.guardianPhone = m[1].replace(/\s+/g, "").trim();
      break;
    }
  }
  if (!out.guardianPhone) {
    const tenDigit = s.match(/\b([6-9]\d{9})\b/);
    if (tenDigit) out.guardianPhone = tenDigit[1];
  }

  const addressPatterns = [
    /\b(?:current\s+address|address\s*[:\-]|address\s+is\s*[:\-]?)\s*([^,.\n]+?(?=\s+(?:permanent|blood|father|mother|class|$)|[,.\n]{2}))/i,
    /\b(?:permanent\s+address|permanent\s+addr)\s*[:\-]?\s*([^,.\n]+?)(?=\s+(?:current|blood|class|$)|[,.\n])/i,
    /\b(?:lives?\s+at|resident\s+of)\s+([^,.\n]+?)(?=\s+(?:phone|blood|class|$)|[,.\n])/i,
    /\b(?:address\s*[:\-])\s*([^,.\n]+)/i,
  ];
  for (const p of addressPatterns) {
    const m = s.match(p);
    if (m && m[1]) {
      const addr = m[1].trim();
      if (!out.currentAddress) out.currentAddress = addr;
      else if (/permanent/i.test(p.source)) out.permanentAddress = addr;
    }
  }
  if (out.currentAddress && !out.permanentAddress && /permanent/i.test(s)) {
    const pm = s.match(/permanent\s*[:\-]?\s*([^,.\n]+)/i);
    if (pm && pm[1]) out.permanentAddress = pm[1].trim();
  }

  for (const bg of BLOOD_GROUPS) {
    if (new RegExp(`\\b${bg.replace("+", "\\+").replace("-", "\\-")}\\b`, "i").test(s)) {
      out.bloodGroup = bg;
      break;
    }
  }
  if (!out.bloodGroup && /\bblood\s*group\s*[:\-]?\s*(A\+|A\-|B\+|B\-|AB\+|AB\-|O\+|O\-)/i.test(s)) {
    const bm = s.match(/blood\s*group\s*[:\-]?\s*(A\+|A\-|B\+|B\-|AB\+|AB\-|O\+|O\-)/i);
    if (bm) out.bloodGroup = bm[1] as StudentPersonalDetails["bloodGroup"];
  }

  const healthPatterns = [
    /\b(?:health\s+issues?|medical\s+notes?|allergies?|allergy)\s*[:\-]?\s*([^,.\n]+?)(?=\s+(?:class|session|$)|[,.\n])/i,
    /\b(?:suffers?\s+from|has\s+(?:a\s+)?(?:condition|allergy))\s+([^,.\n]+?)(?=\s+(?:class|session|$)|[,.\n])/i,
    /\b(?:asthma|diabetes|epilepsy|allergy\s+to\s+\w+)/i,
  ];
  for (const p of healthPatterns) {
    const m = s.match(p);
    if (m && m[1]) {
      out.healthIssues = m[1].trim();
      break;
    }
  }
  if (!out.healthIssues && /\b(asthma|diabetes|epilepsy|peanut\s+allergy)\b/i.test(s)) {
    const hm = s.match(/\b(asthma|diabetes|epilepsy|peanut\s+allergy)\b/i);
    if (hm) out.healthIssues = hm[1];
  }

  return out;
}

/** Capitalize first letter of each word for display */
function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Extract one or more names from segment; also split on "and" / "," for multiple students */
function extractNames(segment: string): string[] {
  const names: string[] = [];
  const rawSegment = segment.trim();

  const namedPatterns = [
    // "named X" or "name is X" or "name: X" - capture until class/age/father/etc.
    /(?:named?|called|by\s+name|name\s+is|name\s*[:\-])\s*([A-Za-z][A-Za-z0-9\s.]*?)(?=\s+(?:age|for\s+class|class|grade|father|mother|phone|session|$)|[,])/gi,
    // "student X age Y" or "student X, age Y"  
    /(?:student\s+)?([A-Za-z][A-Za-z0-9\s.]+?)(?=\s+(?:age|,\s*age|\d+\s*years?))/gi,
    // "add X" followed by class/age/and/comma
    /(?:add|register)\s+([A-Za-z][A-Za-z0-9\s.]+?)(?=\s+(?:age|for\s+class|class|and\s+|$)|,)/gi,
  ];
  const collected = new Set<string>();
  for (const p of namedPatterns) {
    let m: RegExpExecArray | null;
    const re = new RegExp(p.source, p.flags);
    while ((m = re.exec(rawSegment)) !== null) {
      const name = m[1].trim();
      if (name.length >= 2 && !/^(age|class|grade|session|father|mother|phone|and|the)$/i.test(name)) {
        collected.add(toTitleCase(name));
      }
    }
  }

  if (collected.size > 0) {
    return Array.from(collected);
  }

  const andSplit = rawSegment.split(/\s+and\s+/i);
  const hasMultiple = andSplit.length >= 2 || rawSegment.includes(",");
  const parts = hasMultiple
    ? rawSegment.split(/\s+and\s+|\s*,\s*/i).map((p) => p.trim())
    : [rawSegment];

  for (const part of parts) {
    const cleaned = part
      .replace(/\b(?:named?|called|name\s+is|name\s*[:\-])\s*/gi, "")
      .replace(/\s*(?:for\s+class|age|class|grade|session|father|mother|phone)\s*.*$/i, "")
      .trim();
    // Allow names with numbers like "Akash 1", "Student A", etc.
    if (cleaned.length >= 2 && /^[A-Za-z][A-Za-z0-9\s.]*$/.test(cleaned)) {
      const singleName = toTitleCase(cleaned.replace(/\s+/g, " ").trim());
      if (singleName && !/^(age|class|grade|session|father|mother|phone|and|the|for)$/i.test(singleName)) {
        names.push(singleName);
      }
    }
  }

  if (names.length > 0) return names;

  const singleNameMatch = rawSegment.match(
    /(?:^|\s)([A-Za-z][A-Za-z\s.]*?)\s+(?:age|class|grade|\d+\s*years?|father|mother|session)/i
  );
  if (singleNameMatch && singleNameMatch[1]) {
    return [toTitleCase(singleNameMatch[1].trim())];
  }

  const fallback = rawSegment.match(
    /(?:add|create|register|student\s+)([A-Za-z][A-Za-z\s.]{1,50}?)(?=\s+age|\s+class|\s+grade|\s+session|\s+father|\s+mother|$|,)/i
  );
  if (fallback && fallback[1]) {
    return [toTitleCase(fallback[1].trim())];
  }

  const firstWord = rawSegment.replace(/\b(?:please\s+)?(?:add|create|register|enroll)\s+(?:a\s+)?(?:new\s+)?student(s)?\s*(?:named?|called)?\s*/gi, "").split(/\s+/)[0];
  if (firstWord && firstWord.length >= 2 && /^[A-Za-z]+$/.test(firstWord)) {
    return [toTitleCase(firstWord)];
  }

  return [];
}

/**
 * Main parse: input string -> ParseResult with array of ParsedStudent.
 * Handles single and multiple students; class and session and personal details.
 */
export function parseAddStudentsInput(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) {
    return { success: false, students: [], error: "Enter a message to add student(s)." };
  }

  const n = normalize(raw);
  if (!isAddStudentIntent(n) && !isAddStudentIntent(raw)) {
    return { success: false, students: [], error: "Could not detect 'add student' intent. Try: 'Add student Ashish age 25 class 4'" };
  }

  const sessionYear = extractSessionYear(raw) || extractSessionYear(n);
  const classLabel = extractClassLabel(raw) || extractClassLabel(n);
  const personalDetails = extractPersonalDetails(raw);
  const hasAnyPersonal = Object.keys(personalDetails).length > 0;

  const names = extractNames(raw);
  if (names.length === 0) {
    const nameFromSimple = raw
      .replace(/\b(?:please\s+)?(?:add|create|register|enroll)\s+(?:a\s+)?(?:new\s+)?student(s)?\s*(?:named?|called)?\s*/gi, "")
      .replace(/\s*[:\-]\s*.*$/i, "")
      .trim();
    const firstPart = nameFromSimple.split(/\s+(?:age|class|grade|session|father|mother|phone|,)/i)[0]?.trim();
    if (firstPart && firstPart.length >= 2 && /^[A-Za-z\s.]+$/.test(firstPart)) {
      names.push(firstPart);
    }
  }
  if (names.length === 0) {
    const tokenMatch = raw.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/);
    if (tokenMatch) names.push(tokenMatch[1].trim());
  }
  if (names.length === 0) {
    return { success: false, students: [], error: "Could not find student name(s). Try: 'Add student Ashish' or 'Add students Rahul and Priya'" };
  }

  const students: ParsedStudent[] = names.map((name) => ({
    name: name.trim(),
    classLabel: classLabel,
    sessionYear: sessionYear,
    personalDetails: hasAnyPersonal ? { ...personalDetails } : undefined,
  }));

  return { success: true, students };
}

/**
 * Resolve class label to class id and fee defaults from session classes.
 * Match by class name (e.g. "Class 1", "1", "Nursery").
 */
export function resolveClassLabel(
  classLabel: string | undefined,
  sessionClasses: { id: string; name: string; registrationFees: number; admissionFees: number; annualFund: number; monthlyFees: number; lateFeeAmount: number; lateFeeFrequency: "daily" | "weekly"; dueDayOfMonth: number }[]
): { classId?: string; registrationFees?: number; admissionFees?: number; annualFund?: number; monthlyFees?: number; lateFeeAmount?: number; lateFeeFrequency?: "daily" | "weekly"; dueDayOfMonth?: number } {
  if (!classLabel || sessionClasses.length === 0) {
    return {};
  }
  const label = classLabel.trim().toLowerCase();
  const byName = sessionClasses.find((c) => {
    const cn = c.name.toLowerCase();
    return cn === label || cn.replace(/\s+/g, " ") === `class ${label}` || cn.endsWith(" " + label) || cn === "class " + label;
  });
  if (byName) {
    return {
      classId: byName.id,
      registrationFees: byName.registrationFees,
      admissionFees: byName.admissionFees,
      annualFund: byName.annualFund,
      monthlyFees: byName.monthlyFees,
      lateFeeAmount: byName.lateFeeAmount,
      lateFeeFrequency: byName.lateFeeFrequency,
      dueDayOfMonth: byName.dueDayOfMonth,
    };
  }
  const byNumber = sessionClasses.find((c) => {
    const num = c.name.replace(/\D/g, "");
    return num === label || c.name.toLowerCase().includes(label);
  });
  if (byNumber) {
    return {
      classId: byNumber.id,
      registrationFees: byNumber.registrationFees,
      admissionFees: byNumber.admissionFees,
      annualFund: byNumber.annualFund,
      monthlyFees: byNumber.monthlyFees,
      lateFeeAmount: byNumber.lateFeeAmount,
      lateFeeFrequency: byNumber.lateFeeFrequency,
      dueDayOfMonth: byNumber.dueDayOfMonth,
    };
  }
  return {};
}
