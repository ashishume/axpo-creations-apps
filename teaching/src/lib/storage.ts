// Selection only — persisted in sessionStorage so it survives refresh without using localStorage for app data.
// All app data is loaded from Supabase via repositories.

const SELECTION_KEY = "sfms_selection";

export interface SelectionState {
  schoolId: string | null;
  sessionId: string | null;
}

export function loadSelection(): SelectionState {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY);
    if (!raw) return { schoolId: null, sessionId: null };
    const parsed = JSON.parse(raw) as SelectionState;
    return {
      schoolId: parsed.schoolId ?? null,
      sessionId: parsed.sessionId ?? null,
    };
  } catch {
    return { schoolId: null, sessionId: null };
  }
}

export function saveSelection(selection: SelectionState): void {
  sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
}
