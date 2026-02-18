/**
 * Parse CSV string into array of row objects (first row = headers).
 * Handles quoted fields (e.g. "name, with comma").
 */
export function parseCSV(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      lines.push(current);
      current = "";
      continue;
    }
    current += c;
  }
  if (current.length > 0) lines.push(current);

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && c === ",") {
        fields.push(field.trim());
        field = "";
        continue;
      }
      field += c;
    }
    fields.push(field.trim());
    return fields;
  };

  const rows = lines.map((line) => parseRow(line)).filter((r) => r.some((c) => c.length > 0));
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
  return { headers, rows: data };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** Get value from row by header (case-insensitive, ignores spaces). */
export function getColumn(row: Record<string, string>, possibleNames: string[]): string {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const n = normalizeHeader(name);
    const k = keys.find((key) => normalizeHeader(key) === n);
    if (k !== undefined) return (row[k] ?? "").trim();
  }
  return "";
}
