/**
 * Axpo Assistant - Multi-intent natural language parser using Google Gemini API.
 * Handles CRUD for students, staff, expenses, stocks, fixed costs, and analytics queries.
 */

import type {
  FeeType,
  PaymentMethod,
  StaffRole,
  ExpenseCategory,
  StudentPersonalDetails,
} from "../types";

// ============================================================================
// Types
// ============================================================================

export type IntentType =
  // Student CRUD
  | "add_student"
  | "update_student"
  | "delete_student"
  // Class CRUD
  | "add_class"
  // Staff CRUD
  | "add_staff"
  | "update_staff"
  | "delete_staff"
  | "pay_salary"
  // Expense CRUD
  | "add_expense"
  | "update_expense"
  | "delete_expense"
  // Stock CRUD
  | "add_stock"
  | "update_stock"
  | "delete_stock"
  | "record_stock_transaction"
  // Fixed Cost CRUD
  | "add_fixed_cost"
  | "update_fixed_cost"
  | "delete_fixed_cost"
  // Analytics
  | "query_analytics"
  // Unknown
  | "unknown";

export type AnalyticsQueryType =
  | "salary_summary"
  | "fee_collection_summary"
  | "expenses_summary"
  | "outstanding_fees"
  | "stock_balance"
  | "dashboard_overview"
  | "unknown";

// Parsed student data (matches existing parser)
export interface ParsedStudentData {
  name: string;
  classLabel?: string;
  sessionYear?: string;
  feeType?: FeeType;
  studentId?: string;
  personalDetails?: Partial<StudentPersonalDetails>;
}

// Parsed staff data
export interface ParsedStaffData {
  name: string;
  employeeId?: string;
  role?: StaffRole;
  monthlySalary?: number;
  subjectOrGrade?: string;
}

// Parsed salary payment data
export interface ParsedSalaryPaymentData {
  staffName?: string;
  staffId?: string;
  month: string; // YYYY-MM
  amount?: number;
  status?: "Paid" | "Pending" | "Partially Paid";
  paymentDate?: string;
  method?: PaymentMethod;
}

// Parsed expense data
export interface ParsedExpenseData {
  date?: string;
  amount: number;
  category?: ExpenseCategory;
  description: string;
  vendorPayee?: string;
  paymentMethod?: PaymentMethod;
}

// Parsed stock data
export interface ParsedStockData {
  publisherName: string;
  description?: string;
  purchaseDate?: string;
  totalCreditAmount: number;
}

// Parsed stock transaction data
export interface ParsedStockTransactionData {
  stockId?: string;
  publisherName?: string;
  type: "purchase" | "sale" | "return";
  amount: number;
  quantity?: number;
  description?: string;
}

// Parsed class data (for add_class: class name and fee structure)
export interface ParsedClassData {
  name: string;
  registrationFees?: number;
  admissionFees?: number;
  annualFund?: number;
  monthlyFees?: number;
  lateFeeAmount?: number;
  lateFeeFrequency?: "daily" | "weekly";
  dueDayOfMonth?: number;
}

// Parsed fixed cost data
export interface ParsedFixedCostData {
  name: string;
  amount: number;
  category?: ExpenseCategory;
  isActive?: boolean;
}

// Analytics query data
export interface ParsedAnalyticsQuery {
  queryType: AnalyticsQueryType;
  period?: "current_month" | "last_month" | "current_year" | "all_time";
  month?: string; // YYYY-MM for specific month
  category?: string; // For filtering
}

// Filters for update/delete operations
export interface EntityFilters {
  id?: string;
  name?: string;
  studentId?: string;
  employeeId?: string;
}

// Maximum items per batch (add multiple / pay multiple salaries) to avoid bloating payload
export const MAX_BATCH_SIZE = 15;

// Main intent result
export interface IntentResult {
  success: boolean;
  intent: IntentType;
  entity?: "student" | "staff" | "expense" | "stock" | "fixedCost" | "salaryPayment" | "class";
  operation?: "add" | "update" | "delete" | "query";
  data?:
    | ParsedStudentData
    | ParsedStudentData[]
    | ParsedStaffData
    | ParsedStaffData[]
    | ParsedSalaryPaymentData
    | ParsedSalaryPaymentData[]
    | ParsedExpenseData
    | ParsedExpenseData[]
    | ParsedStockData
    | ParsedStockData[]
    | ParsedFixedCostData
    | ParsedFixedCostData[]
    | ParsedClassData
    | ParsedClassData[]
    | ParsedStockTransactionData
    | ParsedAnalyticsQuery;
  filters?: EntityFilters;
  message?: string; // Assistant response message
  error?: string;
}

// ============================================================================
// Gemini API Configuration
// ============================================================================

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

function getModelsToTry(): string[] {
  const envModel =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL
      ? String(import.meta.env.VITE_GEMINI_MODEL).trim()
      : "";
  if (envModel) return [envModel, ...DEFAULT_MODELS.filter((m) => m !== envModel)];
  return DEFAULT_MODELS;
}

function getApiKey(): string | undefined {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY
    ? String(import.meta.env.VITE_GEMINI_API_KEY).trim()
    : undefined;
}

export function getGeminiApiKey(): string | undefined {
  return getApiKey();
}

export function isGeminiAvailable(): boolean {
  return !!getApiKey();
}

// ============================================================================
// OpenAI API Configuration
// ============================================================================

const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

function getOpenAIKey(): string | undefined {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAI_API_KEY
    ? String(import.meta.env.VITE_OPENAI_API_KEY).trim()
    : undefined;
}

function getOpenAIModel(): string {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENAI_MODEL
    ? String(import.meta.env.VITE_OPENAI_MODEL).trim()
    : OPENAI_DEFAULT_MODEL;
}

export function isOpenAIAvailable(): boolean {
  return !!getOpenAIKey();
}

/** Which LLM provider to prefer when both API keys are set. */
function getPreferredProvider(): "gemini" | "openai" | null {
  const env = typeof import.meta !== "undefined" && import.meta.env?.VITE_LLM_PROVIDER
    ? String(import.meta.env.VITE_LLM_PROVIDER).trim().toLowerCase()
    : "";
  if (env === "openai") return "openai";
  if (env === "gemini") return "gemini";
  if (getApiKey()) return "gemini";
  if (getOpenAIKey()) return "openai";
  return null;
}

/** True if at least one LLM (Gemini or OpenAI) is configured. */
export function isLLMAvailable(): boolean {
  return isGeminiAvailable() || isOpenAIAvailable();
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are Axpo Assistant, an AI for a school management app. Parse user messages and return ONLY valid JSON.

## Supported Intents

### Student Operations
- add_student: Add one or more students. For multiple (e.g. "add Rahul, Priya and Amit to class 2") return data as an array. Max ${MAX_BATCH_SIZE} items.
- update_student: Modify existing student details
- delete_student: Remove a student

### Class Operations
- add_class: Add one or more new classes. For multiple (e.g. "add Class 1, Class 2 and Nursery") return data as an array. Max ${MAX_BATCH_SIZE} items. Each class can have optional fee structure.

### Staff Operations
- add_staff: Add one or more staff. For multiple (e.g. "add staff John, Mary and Raj as teachers") return data as an array. Max ${MAX_BATCH_SIZE} items.
- update_staff: Modify staff details
- delete_staff: Remove staff
- pay_salary: Record salary payment for one or more staff. For multiple (e.g. "pay salary to all teachers for this month" or "pay John and Mary for February") return data as an array. Max ${MAX_BATCH_SIZE} items.

### Expense Operations
- add_expense: Record one or more expenses. For multiple (e.g. "add expenses: rent 5000, electricity 2000") return data as an array. Max ${MAX_BATCH_SIZE} items.
- update_expense: Modify expense
- delete_expense: Remove expense

### Stock Operations
- add_stock: Add one or more stock/publisher credits. For multiple return data as an array. Max ${MAX_BATCH_SIZE} items.
- update_stock: Modify stock
- delete_stock: Remove stock
- record_stock_transaction: Record sale/return for existing stock

### Fixed Cost Operations
- add_fixed_cost: Add one or more recurring monthly costs. For multiple return data as an array. Max ${MAX_BATCH_SIZE} items.
- update_fixed_cost: Modify fixed cost
- delete_fixed_cost: Remove fixed cost

### Analytics Queries
- query_analytics: Get dashboard metrics, summaries

## Output JSON Schema

{
  "intent": "add_student | update_student | delete_student | add_class | add_staff | update_staff | delete_staff | pay_salary | add_expense | update_expense | delete_expense | add_stock | update_stock | delete_stock | record_stock_transaction | add_fixed_cost | update_fixed_cost | delete_fixed_cost | query_analytics | unknown",
  "entity": "student | staff | expense | stock | fixedCost | salaryPayment | class | null",
  "operation": "add | update | delete | query | null",
  "data": {
    // Entity-specific fields - see below
  },
  "filters": {
    // For update/delete: how to find the entity
    "id": "string or null",
    "name": "string or null",
    "studentId": "string or null",
    "employeeId": "string or null"
  },
  "message": "Friendly response describing what will happen"
}

## Entity Data Schemas

### Class (add_class - for the current session)
{
  "name": "string (required, e.g. Class 1, Nursery)",
  "registrationFees": "number or null (one-time registration)",
  "admissionFees": "number or null (one-time admission)",
  "annualFund": "number or null (annual fund one-time)",
  "monthlyFees": "number or null (monthly tuition)",
  "lateFeeAmount": "number or null (late payment fine amount)",
  "lateFeeFrequency": "daily | weekly | null",
  "dueDayOfMonth": "number 1-28 or null (day of month fee is due)"
}
For add_class always set "entity": "class" and "operation": "add". Extract any fees the user mentions (annual fees, admission fees, monthly fees, etc).

### Student (add_student: single object OR array of up to ${MAX_BATCH_SIZE} students)
{
  "name": "string (required)",
  "classLabel": "string or null (just the number/name: 1, 2, nursery)",
  "sessionYear": "string or null (e.g. 2024-2025)",
  "feeType": "Regular | Boarding | Day Scholar + Meals | Boarding + Meals | null",
  "studentId": "string or null",
  "personalDetails": { ... } or null
}

### Staff (add_staff: single object OR array of up to ${MAX_BATCH_SIZE})
{
  "name": "string (required)",
  "employeeId": "string or null",
  "role": "Teacher | Administrative | Bus Driver | Support Staff | null",
  "monthlySalary": "number or null",
  "subjectOrGrade": "string or null"
}

### SalaryPayment (pay_salary: single object OR array of up to ${MAX_BATCH_SIZE})
{
  "staffName": "string (to find the staff)",
  "staffId": "string or null",
  "month": "YYYY-MM (required, e.g. 2026-02)",
  "amount": "number or null (if null, use staff's monthlySalary)",
  "status": "Paid | Pending | Partially Paid",
  "paymentDate": "YYYY-MM-DD or null",
  "method": "Cash | Cheque | Online | Bank Transfer | null"
}

### Expense (add_expense: single object OR array of up to ${MAX_BATCH_SIZE})
{
  "date": "YYYY-MM-DD or null (default today)",
  "amount": "number (required)",
  "category": "Transportation | Events | Utilities | Supplies | Infrastructure | Miscellaneous | null",
  "description": "string (required)",
  "vendorPayee": "string or null",
  "paymentMethod": "Cash | Cheque | Online | Bank Transfer | null"
}

### Stock (add_stock: single object OR array of up to ${MAX_BATCH_SIZE})
{
  "publisherName": "string (required)",
  "description": "string or null",
  "purchaseDate": "YYYY-MM-DD or null",
  "totalCreditAmount": "number (required)"
}

### StockTransaction (for record_stock_transaction)
{
  "publisherName": "string (to find the stock)",
  "stockId": "string or null",
  "type": "purchase | sale | return",
  "amount": "number (required)",
  "quantity": "number or null",
  "description": "string or null"
}

### FixedCost (add_fixed_cost: single object OR array of up to ${MAX_BATCH_SIZE})
{
  "name": "string (required, e.g. Rent, Internet)",
  "amount": "number (required)",
  "category": "Utilities | Infrastructure | Miscellaneous | null",
  "isActive": "boolean (default true)"
}

### AnalyticsQuery
{
  "queryType": "salary_summary | fee_collection_summary | expenses_summary | outstanding_fees | stock_balance | dashboard_overview | unknown",
  "period": "current_month | last_month | current_year | all_time | null",
  "month": "YYYY-MM or null (for specific month)",
  "category": "string or null (for filtering)"
}

## Rules

1. If the message doesn't match any intent, use "intent": "unknown" and provide a helpful message.
2. For any add operation (add_student, add_staff, add_expense, add_stock, add_fixed_cost, add_class) or pay_salary: when the user asks for MULTIPLE items (e.g. "add staff A, B, C", "add 3 expenses", "pay salary to John and Mary"), return "data" as an ARRAY of objects. Never return more than ${MAX_BATCH_SIZE} items; if the user asks for more, cap at ${MAX_BATCH_SIZE} and mention it in "message".
3. For update/delete, extract filters to identify the entity (name, id, etc). Single entity only.
4. Always include a friendly "message" describing the action.
5. Use today's date for analytics if "this month" is mentioned. Today is ${new Date().toISOString().split('T')[0]}.
6. Return ONLY the JSON object, no markdown or explanation.
`;

// ============================================================================
// API Functions
// ============================================================================

interface GeminiPart {
  text?: string;
}
interface GeminiContent {
  parts?: GeminiPart[];
}
interface GeminiCandidate {
  content?: GeminiContent;
}

function capArray<T>(arr: T[]): T[] {
  return arr.length > MAX_BATCH_SIZE ? arr.slice(0, MAX_BATCH_SIZE) : arr;
}

function normalizeParsedData(_intent: IntentType, data: unknown): IntentResult["data"] {
  if (data == null) return undefined;
  if (!Array.isArray(data)) return data as IntentResult["data"];
  const capped = capArray(data as object[]);
  return capped as IntentResult["data"];
}

function parseGeminiResponse(text: string): IntentResult {
  const trimmed = text.trim();
  // Strip markdown code block if present
  const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(jsonStr) as {
      intent?: string;
      entity?: string;
      operation?: string;
      data?: unknown;
      filters?: EntityFilters;
      message?: string;
      error?: string;
    };

    const intent = (parsed.intent || "unknown") as IntentType;
    const entity = parsed.entity as IntentResult["entity"];
    const operation = parsed.operation as IntentResult["operation"];
    const data = normalizeParsedData(intent, parsed.data);

    return {
      success: intent !== "unknown",
      intent,
      entity,
      operation,
      data,
      filters: parsed.filters,
      message: parsed.message,
      error: parsed.error,
    };
  } catch (e) {
    return {
      success: false,
      intent: "unknown",
      error: `Failed to parse response: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function parseAxpoIntentWithGemini(trimmed: string): Promise<IntentResult> {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, intent: "unknown", error: "Gemini API key not configured." };

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + "\n\nUser message:\n\"" + trimmed + "\"" }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

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
        const isModelNotFound = res.status === 404 || /not found|not supported for generateContent/i.test(responseText);
        lastError = (() => {
          try {
            const errJson = JSON.parse(responseText);
            return errJson?.error?.message ?? responseText?.slice(0, 200) ?? `API error (${res.status})`;
          } catch {
            return responseText?.slice(0, 200) || `API error (${res.status})`;
          }
        })();
        if (isModelNotFound) continue;
        if (res.status === 429) return { success: false, intent: "unknown", error: "Rate limit exceeded. Please try again in a moment." };
        return { success: false, intent: "unknown", error: lastError };
      }
      const data = JSON.parse(responseText) as { candidates?: GeminiCandidate[] };
      const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textPart) return { success: false, intent: "unknown", error: "No response from Gemini." };
      return parseGeminiResponse(textPart);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { success: false, intent: "unknown", error: lastError || "No Gemini model available." };
}

async function parseAxpoIntentWithOpenAI(trimmed: string): Promise<IntentResult> {
  const apiKey = getOpenAIKey();
  if (!apiKey) return { success: false, intent: "unknown", error: "OpenAI API key not configured." };

  try {
    const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getOpenAIModel(),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `User message:\n"${trimmed}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });
    const responseText = await res.text();
    if (!res.ok) {
      let errMsg = responseText?.slice(0, 200) || `API error (${res.status})`;
      try {
        const errJson = JSON.parse(responseText);
        errMsg = errJson?.error?.message ?? errMsg;
      } catch {
        // use errMsg as is
      }
      if (res.status === 429) return { success: false, intent: "unknown", error: "Rate limit exceeded. Please try again in a moment." };
      return { success: false, intent: "unknown", error: errMsg };
    }
    const data = JSON.parse(responseText) as { choices?: Array<{ message?: { content?: string } }> };
    const textPart = data?.choices?.[0]?.message?.content;
    if (!textPart) return { success: false, intent: "unknown", error: "No response from OpenAI." };
    return parseGeminiResponse(textPart);
  } catch (e) {
    return {
      success: false,
      intent: "unknown",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function parseAxpoIntent(userInput: string): Promise<IntentResult> {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return { success: false, intent: "unknown", error: "Please enter a message." };
  }

  const provider = getPreferredProvider();
  if (!provider) {
    return {
      success: false,
      intent: "unknown",
      error: "No LLM configured. Add VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY to your .env.local file.",
    };
  }

  if (provider === "openai") {
    const result = await parseAxpoIntentWithOpenAI(trimmed);
    if (result.success) return result;
    if (isGeminiAvailable()) return parseAxpoIntentWithGemini(trimmed);
    return result;
  }

  const result = await parseAxpoIntentWithGemini(trimmed);
  if (result.success) return result;
  if (isOpenAIAvailable()) return parseAxpoIntentWithOpenAI(trimmed);
  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determines if the data is an array (for multiple students).
 */
export function isMultipleStudents(data: IntentResult["data"]): data is ParsedStudentData[] {
  return Array.isArray(data);
}

export function isMultipleStaff(data: IntentResult["data"]): data is ParsedStaffData[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as ParsedStaffData)?.name === "string";
}

export function isMultipleExpenses(data: IntentResult["data"]): data is ParsedExpenseData[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as ParsedExpenseData)?.amount === "number";
}

export function isMultipleStocks(data: IntentResult["data"]): data is ParsedStockData[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as ParsedStockData)?.publisherName === "string";
}

export function isMultipleFixedCosts(data: IntentResult["data"]): data is ParsedFixedCostData[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as ParsedFixedCostData)?.name === "string";
}

export function isMultipleClasses(data: IntentResult["data"]): data is ParsedClassData[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as ParsedClassData)?.name === "string";
}

export function isMultipleSalaryPayments(data: IntentResult["data"]): data is ParsedSalaryPaymentData[] {
  return Array.isArray(data) && data.length > 0 && (data[0] as ParsedSalaryPaymentData)?.month != null;
}

/**
 * Gets a human-readable description of the intent.
 */
export function getIntentDescription(intent: IntentType): string {
  const descriptions: Record<IntentType, string> = {
    add_student: "Add Student",
    update_student: "Update Student",
    delete_student: "Delete Student",
    add_staff: "Add Staff",
    update_staff: "Update Staff",
    delete_staff: "Delete Staff",
    pay_salary: "Pay Salary",
    add_expense: "Add Expense",
    update_expense: "Update Expense",
    delete_expense: "Delete Expense",
    add_stock: "Add Stock",
    update_stock: "Update Stock",
    delete_stock: "Delete Stock",
    record_stock_transaction: "Record Stock Transaction",
    add_fixed_cost: "Add Fixed Cost",
    update_fixed_cost: "Update Fixed Cost",
    delete_fixed_cost: "Delete Fixed Cost",
    add_class: "Add Class",
    query_analytics: "Analytics Query",
    unknown: "Unknown",
  };
  return descriptions[intent] || intent;
}
