/**
 * Normalizes a student CSV so every row has exactly 22 columns (matching the app's
 * student import format). Empty fields stay empty; no column shifting.
 * Usage: node scripts/normalize-student-csv.js < input.csv > output.csv
 *    or: node scripts/normalize-student-csv.js input.csv output.csv
 */

import { readFileSync, writeFileSync } from "fs";

const STUDENT_CSV_HEADERS = [
  "name", "studentId", "admissionNumber", "class", "feeType", "registrationFees", "admissionFees", "annualFund",
  "monthlyFees", "transportFees", "dueDayOfMonth", "lateFeeAmount", "lateFeeFrequency",
  "fatherName", "motherName", "guardianPhone", "bloodGroup", "currentAddress", "permanentAddress", "healthIssues",
  "aadhaarNumber", "dateOfBirth",
];

const EXPECTED_COLS = STUDENT_CSV_HEADERS.length;

function parseRow(line) {
  const fields = [];
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
}

function escapeCSV(value) {
  if (value == null) return "";
  const str = String(value).trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function normalizeRow(fields) {
  const normalized = fields.slice(0, EXPECTED_COLS);
  while (normalized.length < EXPECTED_COLS) normalized.push("");
  return normalized.map(escapeCSV).join(",");
}

function main() {
  const readFromFile = process.argv[2];
  const writeToFile = process.argv[3];
  let input;
  if (readFromFile) {
    input = readFileSync(readFromFile, "utf8");
  } else {
    input = readFileSync(0, "utf8");
  }
  const lines = input.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    process.stderr.write("No lines in input.\n");
    process.exit(1);
  }
  // Use canonical header order so column alignment is consistent
  const headerLine = STUDENT_CSV_HEADERS.map((h) => escapeCSV(h)).join(",");
  const dataLines = lines.slice(1).map((line) => normalizeRow(parseRow(line)));
  const out = [headerLine, ...dataLines].join("\n") + "\n";
  if (writeToFile) {
    writeFileSync(writeToFile, out, "utf8");
    console.error(`Wrote normalized CSV to ${writeToFile} (${dataLines.length} rows, ${EXPECTED_COLS} columns).`);
  } else {
    process.stdout.write(out);
  }
}

main();
