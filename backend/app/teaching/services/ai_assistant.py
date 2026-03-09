"""AI Assistant (Axpo Assistant) service - OpenRouter integration for intent parsing."""
import json
import logging
from datetime import date
from typing import Any

import httpx

from app.config import get_settings

MAX_BATCH_SIZE = 15
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

logger = logging.getLogger(__name__)


def _system_prompt() -> str:
    today = date.today().isoformat()
    return f"""You are Axpo Assistant, an AI for a school management app. Parse user messages and return ONLY valid JSON.

## Supported Intents

### Student Operations
- add_student: Add one or more students. For multiple (e.g. "add Rahul, Priya and Amit to class 2") return data as an array. Max {MAX_BATCH_SIZE} items.
- update_student: Modify existing student details
- delete_student: Remove a student

### Class Operations
- add_class: Add one or more new classes. For multiple (e.g. "add Class 1, Class 2 and Nursery") return data as an array. Max {MAX_BATCH_SIZE} items. Each class can have optional fee structure.

### Staff Operations
- add_staff: Add one or more staff. For multiple (e.g. "add staff John, Mary and Raj as teachers") return data as an array. Max {MAX_BATCH_SIZE} items.
- update_staff: Modify staff details
- delete_staff: Remove staff
- pay_salary: Record salary payment for one or more staff. For multiple (e.g. "pay salary to all teachers for this month" or "pay John and Mary for February") return data as an array. Max {MAX_BATCH_SIZE} items.

### Expense Operations
- add_expense: Record one or more expenses. For multiple (e.g. "add expenses: rent 5000, electricity 2000") return data as an array. Max {MAX_BATCH_SIZE} items.
- update_expense: Modify expense
- delete_expense: Remove expense

### Stock Operations
- add_stock: Add one or more stock/publisher credits. For multiple return data as an array. Max {MAX_BATCH_SIZE} items.
- update_stock: Modify stock
- delete_stock: Remove stock
- record_stock_transaction: Record sale/return for existing stock

### Fixed Cost Operations
- add_fixed_cost: Add one or more recurring monthly costs. For multiple return data as an array. Max {MAX_BATCH_SIZE} items.
- update_fixed_cost: Modify fixed cost
- delete_fixed_cost: Remove fixed cost

### Analytics Queries
- query_analytics: Get dashboard metrics, summaries

## Output JSON Schema

{{
  "intent": "add_student | update_student | delete_student | add_class | add_staff | update_staff | delete_staff | pay_salary | add_expense | update_expense | delete_expense | add_stock | update_stock | delete_stock | record_stock_transaction | add_fixed_cost | update_fixed_cost | delete_fixed_cost | query_analytics | unknown",
  "entity": "student | staff | expense | stock | fixedCost | salaryPayment | class | null",
  "operation": "add | update | delete | query | null",
  "data": {{ }},
  "filters": {{
    "id": "string or null",
    "name": "string or null",
    "studentId": "string or null",
    "employeeId": "string or null"
  }},
  "message": "Friendly response describing what will happen"
}}

## Rules

1. If the message doesn't match any intent, use "intent": "unknown" and provide a helpful message.
2. For any add operation or pay_salary: when the user asks for MULTIPLE items, return "data" as an ARRAY of objects. Never return more than {MAX_BATCH_SIZE} items.
3. For update/delete, extract filters to identify the entity (name, id, etc). Single entity only.
4. Always include a friendly "message" describing the action.
5. Use today's date for analytics if "this month" is mentioned. Today is {today}.
6. Return ONLY the JSON object, no markdown or explanation.
"""


def is_ai_available() -> bool:
    """Return True if OpenRouter API key is configured."""
    settings = get_settings()
    return bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip())


def _normalize_filters(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    """Normalize filter keys to camelCase for frontend compatibility."""
    if not raw:
        return None
    return {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "studentId": raw.get("studentId"),
        "employeeId": raw.get("employeeId"),
    }


def _parse_intent_response(text: str) -> dict[str, Any]:
    """Parse LLM response text into intent result dict."""
    trimmed = text.strip()
    json_str = trimmed.replace("```json", "").replace("```", "").strip()
    # Handle optional leading/trailing markers
    if json_str.startswith("```"):
        json_str = json_str.split("```", 1)[1].strip()
    if json_str.endswith("```"):
        json_str = json_str.rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.warning("AI response JSON parse error: %s", e)
        return {
            "success": False,
            "intent": "unknown",
            "error": f"Failed to parse response: {e!s}",
        }

    intent = (parsed.get("intent") or "unknown").strip()
    entity = parsed.get("entity")
    operation = parsed.get("operation")
    data = parsed.get("data")
    if data is not None and isinstance(data, list) and len(data) > MAX_BATCH_SIZE:
        data = data[:MAX_BATCH_SIZE]

    filters_raw = parsed.get("filters")
    filters = _normalize_filters(filters_raw) if isinstance(filters_raw, dict) else None

    return {
        "success": intent != "unknown",
        "intent": intent,
        "entity": entity,
        "operation": operation,
        "data": data,
        "filters": filters,
        "message": parsed.get("message"),
        "error": parsed.get("error"),
    }


async def call_openrouter(messages: list[dict[str, str]], temperature: float = 0.1, max_tokens: int = 2048) -> str:
    """Call OpenRouter chat completions API. Returns assistant message content or raises."""
    settings = get_settings()
    api_key = (settings.OPENROUTER_API_KEY or "").strip()
    if not api_key:
        raise ValueError("OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.")

    model = (settings.OPENROUTER_MODEL or "google/gemini-2.0-flash").strip()
    payload = {
        "model": model,
        "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=payload,
        )

    text = resp.text
    if not resp.is_success:
        err_msg = text[:300] if text else f"API error ({resp.status_code})"
        try:
            err_json = json.loads(text)
            err_msg = err_json.get("error", {}).get("message", err_json.get("error", err_msg))
        except (json.JSONDecodeError, TypeError):
            pass
        if resp.status_code == 429:
            raise ValueError("Rate limit exceeded. Please try again in a moment.")
        raise ValueError(err_msg)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        raise ValueError("Invalid response from model.")

    content = None
    choices = data.get("choices")
    if choices and len(choices) > 0:
        msg = choices[0].get("message")
        if msg:
            content = msg.get("content")

    if content is None or (isinstance(content, str) and not content.strip()):
        raise ValueError("No response from model.")

    return content if isinstance(content, str) else json.dumps(content)


async def parse_intent(user_input: str) -> dict[str, Any]:
    """
    Parse user natural language input into an intent result.
    Returns a dict compatible with ParseResponse (success, intent, entity, operation, data, filters, message, error).
    """
    trimmed = (user_input or "").strip()
    if not trimmed:
        return {"success": False, "intent": "unknown", "error": "Please enter a message."}

    if not is_ai_available():
        return {
            "success": False,
            "intent": "unknown",
            "error": "OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.",
        }

    try:
        content = await call_openrouter(
            [
                {"role": "system", "content": _system_prompt()},
                {"role": "user", "content": f'User message:\n"{trimmed}"'},
            ],
            temperature=0.1,
            max_tokens=2048,
        )
        return _parse_intent_response(content)
    except Exception as e:
        logger.exception("OpenRouter parse_intent failed: %s", e)
        return {
            "success": False,
            "intent": "unknown",
            "error": str(e) if str(e) else "An error occurred.",
        }
