/**
 * CSV Parser for Axpo Assistant
 * Parses CSV text into structured data for students, staff, classes, etc.
 */

export interface CSVParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  rowCount: number;
}

/**
 * Parse CSV text into rows
 */
function parseCSVText(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    // Simple CSV parsing (handles quoted fields with commas)
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Detect if input looks like CSV data
 */
export function detectCSV(text: string): boolean {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return false;

  // Check if first line looks like a header with commas
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  
  // At least 1 comma and consistent comma count in first few lines
  if (commaCount < 1) return false;

  // Check consistency in first 3 lines (or fewer if not enough)
  const linesToCheck = Math.min(3, lines.length);
  for (let i = 1; i < linesToCheck; i++) {
    const lineCommas = (lines[i].match(/,/g) || []).length;
    if (Math.abs(lineCommas - commaCount) > 1) return false;
  }

  return true;
}

/**
 * Parse students from CSV
 * Expected columns: name, class, studentId (optional), feeType (optional), fatherName (optional), phone (optional)
 */
export interface ParsedStudentCSV {
  name: string;
  classLabel?: string;
  studentId?: string;
  feeType?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
}

export function parseStudentsCSV(text: string): CSVParseResult<ParsedStudentCSV> {
  const rows = parseCSVText(text);
  if (rows.length < 2) {
    return { success: false, data: [], errors: ["CSV must have a header row and at least one data row"], rowCount: 0 };
  }

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const nameIndex = header.findIndex((h) => h.includes("name") && !h.includes("father") && !h.includes("mother"));
  const classIndex = header.findIndex((h) => h.includes("class"));
  const studentIdIndex = header.findIndex((h) => h.includes("id") || h.includes("roll"));
  const feeTypeIndex = header.findIndex((h) => h.includes("fee") && h.includes("type"));
  const fatherIndex = header.findIndex((h) => h.includes("father"));
  const motherIndex = header.findIndex((h) => h.includes("mother"));
  const phoneIndex = header.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("contact"));

  if (nameIndex === -1) {
    return { success: false, data: [], errors: ["CSV must have a 'name' column"], rowCount: 0 };
  }

  const students: ParsedStudentCSV[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex]?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Missing name`);
      continue;
    }

    students.push({
      name,
      classLabel: classIndex >= 0 ? row[classIndex]?.trim() : undefined,
      studentId: studentIdIndex >= 0 ? row[studentIdIndex]?.trim() : undefined,
      feeType: feeTypeIndex >= 0 ? row[feeTypeIndex]?.trim() : undefined,
      fatherName: fatherIndex >= 0 ? row[fatherIndex]?.trim() : undefined,
      motherName: motherIndex >= 0 ? row[motherIndex]?.trim() : undefined,
      phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() : undefined,
    });
  }

  return {
    success: students.length > 0,
    data: students,
    errors,
    rowCount: students.length,
  };
}

/**
 * Parse staff from CSV
 * Expected columns: name, role (optional), salary (optional), employeeId (optional)
 */
export interface ParsedStaffCSV {
  name: string;
  role?: string;
  monthlySalary?: number;
  employeeId?: string;
  subjectOrGrade?: string;
}

export function parseStaffCSV(text: string): CSVParseResult<ParsedStaffCSV> {
  const rows = parseCSVText(text);
  if (rows.length < 2) {
    return { success: false, data: [], errors: ["CSV must have a header row and at least one data row"], rowCount: 0 };
  }

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const nameIndex = header.findIndex((h) => h.includes("name"));
  const roleIndex = header.findIndex((h) => h.includes("role") || h.includes("position") || h.includes("designation"));
  const salaryIndex = header.findIndex((h) => h.includes("salary"));
  const employeeIdIndex = header.findIndex((h) => h.includes("id") || h.includes("emp"));
  const subjectIndex = header.findIndex((h) => h.includes("subject") || h.includes("grade"));

  if (nameIndex === -1) {
    return { success: false, data: [], errors: ["CSV must have a 'name' column"], rowCount: 0 };
  }

  const staffList: ParsedStaffCSV[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex]?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Missing name`);
      continue;
    }

    const salaryStr = salaryIndex >= 0 ? row[salaryIndex]?.trim().replace(/[₹,\s]/g, "") : undefined;
    const salary = salaryStr ? parseFloat(salaryStr) : undefined;

    staffList.push({
      name,
      role: roleIndex >= 0 ? row[roleIndex]?.trim() : undefined,
      monthlySalary: salary && !isNaN(salary) ? salary : undefined,
      employeeId: employeeIdIndex >= 0 ? row[employeeIdIndex]?.trim() : undefined,
      subjectOrGrade: subjectIndex >= 0 ? row[subjectIndex]?.trim() : undefined,
    });
  }

  return {
    success: staffList.length > 0,
    data: staffList,
    errors,
    rowCount: staffList.length,
  };
}

/**
 * Parse classes from CSV
 * Expected columns: name, monthlyFees (optional), admissionFees (optional), etc.
 */
export interface ParsedClassCSV {
  name: string;
  monthlyFees?: number;
  admissionFees?: number;
  registrationFees?: number;
  annualFund?: number;
  lateFeeAmount?: number;
  dueDayOfMonth?: number;
}

export function parseClassesCSV(text: string): CSVParseResult<ParsedClassCSV> {
  const rows = parseCSVText(text);
  if (rows.length < 2) {
    return { success: false, data: [], errors: ["CSV must have a header row and at least one data row"], rowCount: 0 };
  }

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const nameIndex = header.findIndex((h) => h.includes("name") || h.includes("class"));
  const monthlyIndex = header.findIndex((h) => h.includes("monthly"));
  const admissionIndex = header.findIndex((h) => h.includes("admission"));
  const registrationIndex = header.findIndex((h) => h.includes("registration"));
  const annualIndex = header.findIndex((h) => h.includes("annual"));
  const lateFeeIndex = header.findIndex((h) => h.includes("late"));
  const dueDayIndex = header.findIndex((h) => h.includes("due") && h.includes("day"));

  if (nameIndex === -1) {
    return { success: false, data: [], errors: ["CSV must have a 'name' or 'class' column"], rowCount: 0 };
  }

  const classes: ParsedClassCSV[] = [];
  const errors: string[] = [];

  const parseNum = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const num = parseFloat(val.replace(/[₹,\s]/g, ""));
    return isNaN(num) ? undefined : num;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex]?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Missing name`);
      continue;
    }

    classes.push({
      name,
      monthlyFees: monthlyIndex >= 0 ? parseNum(row[monthlyIndex]) : undefined,
      admissionFees: admissionIndex >= 0 ? parseNum(row[admissionIndex]) : undefined,
      registrationFees: registrationIndex >= 0 ? parseNum(row[registrationIndex]) : undefined,
      annualFund: annualIndex >= 0 ? parseNum(row[annualIndex]) : undefined,
      lateFeeAmount: lateFeeIndex >= 0 ? parseNum(row[lateFeeIndex]) : undefined,
      dueDayOfMonth: dueDayIndex >= 0 ? parseNum(row[dueDayIndex]) : undefined,
    });
  }

  return {
    success: classes.length > 0,
    data: classes,
    errors,
    rowCount: classes.length,
  };
}

/**
 * Detect what type of data the CSV likely contains
 */
export function detectCSVType(text: string): "students" | "staff" | "classes" | "unknown" {
  const header = text.split(/\r?\n/)[0]?.toLowerCase() || "";
  
  if (header.includes("class") && (header.includes("monthly") || header.includes("admission") || header.includes("fee"))) {
    // If it has class AND fee columns, it's class data
    if (!header.includes("student") && !header.includes("father")) {
      return "classes";
    }
  }
  
  if (header.includes("salary") || header.includes("employee") || header.includes("designation")) {
    return "staff";
  }
  
  if (header.includes("student") || header.includes("father") || header.includes("mother") || header.includes("roll")) {
    return "students";
  }
  
  // Default to students if it has name and class
  if (header.includes("name") && header.includes("class")) {
    return "students";
  }
  
  return "unknown";
}
