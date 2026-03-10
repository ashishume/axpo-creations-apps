import { useState, useCallback, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { parseCSV, getColumn } from "../../lib/csv";
import type { FeeType } from "../../types";
import type { StaffRole } from "../../types";
import { Upload, FileText, Download, Loader2 } from "lucide-react";

const FEE_TYPES: FeeType[] = [
  "Regular",
  "Boarding",
  "Day Scholar + Meals",
  "Boarding + Meals",
];
const STAFF_ROLES: StaffRole[] = [
  "Teacher",
  "Administrative",
  "Bus Driver",
  "Support Staff",
];

export type ImportType = "students" | "staff";

export interface StudentImportRow {
  name: string;
  studentId?: string;
  className?: string; // Class name for matching to class
  feeType: FeeType;
  // Fee structure
  registrationFees?: number;
  admissionFees?: number;
  annualFund?: number;
  monthlyFees?: number;
  transportFees?: number;
  // Late fee config
  dueDayOfMonth?: number;
  lateFeeAmount?: number;
  lateFeeFrequency?: "daily" | "weekly";
  // Personal details (aligned with Add/Edit student form)
  fatherName?: string;
  motherName?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  currentAddress?: string;
  permanentAddress?: string;
  healthIssues?: string;
  // Legacy
  targetAmount?: number;
  dueFrequency?: "monthly" | "quarterly";
  finePerDay?: number;
}

export interface StaffImportRow {
  name: string;
  employeeId?: string;
  role: StaffRole;
  monthlySalary: number;
  subjectOrGrade?: string;
}

interface ParsedRow {
  index: number;
  data: Record<string, string>;
  error?: string;
  valid: boolean;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
  sessionId: string | null;
  onImportStudents: (rows: StudentImportRow[]) => Promise<void> | void;
  onImportStaff: (rows: StaffImportRow[]) => Promise<void> | void;
}

function validateStudentRow(
  row: Record<string, string>
): { error?: string; valid: boolean; data?: StudentImportRow } {
  const name = getColumn(row, ["name", "Name", "Student Name"]).trim();
  const studentId = getColumn(row, ["studentId", "student_id", "Student ID", "ID"]).trim();
  const className = getColumn(row, ["class", "Class", "className", "class_name", "Class Name"]).trim();
  const feeType = getColumn(row, ["feeType", "fee_type", "Fee Type", "FeeType"]).trim();
  
  // Fee structure
  const registrationFeesStr = getColumn(row, ["registrationFees", "registration_fees", "Registration Fees", "Registration"]).trim();
  const admissionFeesStr = getColumn(row, ["admissionFees", "admission_fees", "Admission Fees", "Admission"]).trim();
  const annualFundStr = getColumn(row, ["annualFund", "annual_fund", "Annual Fund"]).trim();
  const monthlyFeesStr = getColumn(row, ["monthlyFees", "monthly_fees", "Monthly Fees", "Monthly"]).trim();
  const transportFeesStr = getColumn(row, ["transportFees", "transport_fees", "Transport Fees", "Transport"]).trim();
  
  // Late fee config
  const dueDayStr = getColumn(row, ["dueDayOfMonth", "due_day", "Due Day"]).trim();
  const lateFeeAmountStr = getColumn(row, ["lateFeeAmount", "late_fee_amount", "Late Fee", "lateFee"]).trim();
  const lateFeeFreq = getColumn(row, ["lateFeeFrequency", "late_fee_frequency", "Late Fee Frequency"]).trim();
  
  // Personal details
  const fatherName = getColumn(row, ["fatherName", "father_name", "Father Name", "Father"]).trim();
  const motherName = getColumn(row, ["motherName", "mother_name", "Mother Name", "Mother"]).trim();
  const guardianPhone = getColumn(row, ["guardianPhone", "guardian_phone", "Guardian Phone", "Phone"]).trim();
  const bloodGroup = getColumn(row, ["bloodGroup", "blood_group", "Blood Group"]).trim();
  const currentAddress = getColumn(row, ["currentAddress", "current_address", "Address"]).trim();
  const permanentAddress = getColumn(row, ["permanentAddress", "permanent_address", "Permanent Address"]).trim();
  const healthIssues = getColumn(row, ["healthIssues", "health_issues", "Health Issues"]).trim();

  // Legacy fields for backward compatibility
  const targetAmountStr = getColumn(row, ["targetAmount", "target_amount", "Target Amount", "Amount"]).trim();
  const dueFreq = getColumn(row, ["dueFrequency", "due_frequency", "Due Frequency"]).trim();
  const fineStr = getColumn(row, ["finePerDay", "fine_per_day", "Fine Per Day"]).trim();

  if (!name) return { valid: false, error: "Name is required" };
  
  // At least one fee field or targetAmount or className should be provided
  // (if className is provided, fees can come from the class)
  const hasNewFees = registrationFeesStr || admissionFeesStr || annualFundStr || monthlyFeesStr;
  const targetAmount = targetAmountStr ? Number(targetAmountStr) : undefined;
  
  if (!hasNewFees && !className && (!targetAmountStr || isNaN(targetAmount!) || targetAmount! <= 0)) {
    return { valid: false, error: "Either class, fee fields, or target amount required" };
  }
  
  const feeTypeNorm = FEE_TYPES.find((f) => f.toLowerCase() === feeType.toLowerCase() || f.replace(/\s+/g, "") === feeType.replace(/\s+/g, ""));
  if (!feeTypeNorm && feeType)
    return { valid: false, error: `Fee type must be one of: ${FEE_TYPES.join(", ")}` };
  
  const dueDay = dueDayStr ? parseInt(dueDayStr, 10) : undefined;
  if (dueDayStr && (isNaN(dueDay!) || dueDay! < 1 || dueDay! > 28))
    return { valid: false, error: "Due day must be 1–28" };
  
  const lateFeeAmount = lateFeeAmountStr ? parseInt(lateFeeAmountStr, 10) : undefined;
  const lateFeeFrequency = lateFeeFreq.toLowerCase() === "daily" ? "daily" : lateFeeFreq.toLowerCase() === "weekly" ? "weekly" : undefined;
  
  // Legacy frequency
  const dueFrequency = dueFreq.toLowerCase() === "monthly" ? "monthly" : dueFreq.toLowerCase() === "quarterly" ? "quarterly" : undefined;
  const finePerDay = fineStr ? parseInt(fineStr, 10) : undefined;

  return {
    valid: true,
    data: {
      name,
      studentId: studentId || undefined,
      className: className || undefined,
      feeType: feeTypeNorm ?? "Regular",
      // Fee structure
      registrationFees: registrationFeesStr ? Number(registrationFeesStr) : undefined,
      admissionFees: admissionFeesStr ? Number(admissionFeesStr) : undefined,
      annualFund: annualFundStr ? Number(annualFundStr) : undefined,
      monthlyFees: monthlyFeesStr ? Number(monthlyFeesStr) : undefined,
      transportFees: transportFeesStr ? Number(transportFeesStr) : undefined,
      // Late fee
      dueDayOfMonth: dueDay,
      lateFeeAmount,
      lateFeeFrequency,
      // Personal
      fatherName: fatherName || undefined,
      motherName: motherName || undefined,
      guardianPhone: guardianPhone || undefined,
      bloodGroup: bloodGroup || undefined,
      currentAddress: currentAddress || undefined,
      permanentAddress: permanentAddress || undefined,
      healthIssues: healthIssues || undefined,
      // Legacy
      targetAmount,
      dueFrequency,
      finePerDay,
    },
  };
}

function validateStaffRow(
  row: Record<string, string>
): { error?: string; valid: boolean; data?: StaffImportRow } {
  const name = getColumn(row, ["name", "Name", "Employee Name"]).trim();
  const employeeId = getColumn(row, ["employeeId", "employee_id", "Employee ID", "ID"]).trim();
  const role = getColumn(row, ["role", "Role", "Designation"]).trim();
  const salaryStr = getColumn(row, ["monthlySalary", "monthly_salary", "Monthly Salary", "Salary"]).trim();
  const subjectOrGrade = getColumn(row, ["subjectOrGrade", "subject_or_grade", "Subject/Grade", "Subject"]).trim();

  if (!name) return { valid: false, error: "Name is required" };
  const roleNorm = STAFF_ROLES.find((r) => r.toLowerCase() === role.toLowerCase());
  if (!roleNorm && role)
    return { valid: false, error: `Role must be one of: ${STAFF_ROLES.join(", ")}` };
  const monthlySalary = salaryStr ? Number(salaryStr) : NaN;
  if (!salaryStr || isNaN(monthlySalary) || monthlySalary <= 0)
    return { valid: false, error: "Monthly salary must be a positive number" };

  return {
    valid: true,
    data: {
      name,
      employeeId: employeeId || undefined,
      role: roleNorm ?? "Support Staff",
      monthlySalary,
      subjectOrGrade: subjectOrGrade || undefined,
    },
  };
}

export function getStudentSampleCSV(): string {
  return [
    "name,studentId,class,feeType,registrationFees,admissionFees,annualFund,monthlyFees,transportFees,dueDayOfMonth,lateFeeAmount,lateFeeFrequency,fatherName,motherName,guardianPhone,bloodGroup,currentAddress,permanentAddress,healthIssues",
    "Aarav Sharma,STU-001,Class 1,Regular,500,2500,1500,3000,500,10,50,weekly,Ramesh Sharma,Sunita Sharma,9876543210,A+,\"123 Main St, City\",\"Same as current\",",
    "Priya Patel,STU-002,Class 2,Regular,500,2500,1500,3500,,10,50,weekly,Mukesh Patel,Rani Patel,9876543211,B+,\"45 Park Ave\",,",
    "Rahul Kumar,STU-003,Class 5,Boarding,500,3000,2000,5000,1000,10,100,weekly,,,9876543212,,,,\"Asthma - carry inhaler\"",
    "Ananya Singh,STU-004,Nursery,Regular,,,,,400,10,50,weekly,Raj Singh,Meera Singh,9876543213,O+,\"78 Hill Road\",,",
  ].join("\n");
}

export function getStaffSampleCSV(): string {
  return [
    "name,employeeId,role,monthlySalary,subjectOrGrade",
    "Suresh Kumar,EMP-001,Teacher,45000,Mathematics",
    "Lakshmi Nair,EMP-002,Teacher,42000,Science",
    "Geeta Sharma,EMP-003,Administrative,35000,",
    "Rajesh Driver,EMP-004,Bus Driver,28000,",
  ].join("\n");
}

export function BulkImportModal({
  open,
  onClose,
  type,
  sessionId,
  onImportStudents,
  onImportStaff,
}: BulkImportModalProps) {
  const [rawCsv, setRawCsv] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [shouldProcess, setShouldProcess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const processCSV = useCallback(() => {
    if (!rawCsv.trim()) {
      setParsed([]);
      return;
    }
    const { rows } = parseCSV(rawCsv);
    const validated: ParsedRow[] = rows.map((row, i) => {
      const result = type === "students" ? validateStudentRow(row) : validateStaffRow(row);
      return {
        index: i + 2,
        data: row,
        error: result.error,
        valid: result.valid,
      };
    });
    setParsed(validated);
    setImportResult(null);
  }, [rawCsv, type]);

  // Auto-process CSV when shouldProcess flag is set (after file upload)
  useEffect(() => {
    if (shouldProcess && rawCsv.trim()) {
      processCSV();
      setShouldProcess(false);
    }
  }, [shouldProcess, rawCsv, processCSV]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setRawCsv(content);
      setShouldProcess(true); // Trigger processing on next render after state updates
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleImport = async () => {
    const validRows = parsed.filter((p) => p.valid);
    if (validRows.length === 0 || !sessionId) return;
    const results = validRows.map((r) => {
      const result = type === "students" ? validateStudentRow(r.data) : validateStaffRow(r.data);
      return result.data!;
    });
    setIsImporting(true);
    setImportError(null);
    try {
      if (type === "students") {
        await onImportStudents(results as StudentImportRow[]);
      } else {
        await onImportStaff(results as StaffImportRow[]);
      }
      setImportResult({ success: results.length, failed: parsed.filter((p) => !p.valid).length });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    setRawCsv("");
    setParsed([]);
    setImportResult(null);
    setImportError(null);
    onClose();
  };

  const sampleCSV = type === "students" ? getStudentSampleCSV() : getStaffSampleCSV();
  const sampleFilename = type === "students" ? "students_sample.csv" : "staff_sample.csv";
  const validCount = parsed.filter((p) => p.valid).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={type === "students" ? "Bulk import students (CSV)" : "Bulk import staff (CSV)"}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {type === "students"
            ? "Upload a CSV with columns: name, studentId, class, feeType, registrationFees, admissionFees, annualFund, monthlyFees, transportFees, dueDayOfMonth, lateFeeAmount, lateFeeFrequency, fatherName, motherName, guardianPhone, bloodGroup, currentAddress, permanentAddress, healthIssues. If class is provided, fees are auto-filled from class defaults. Download sample for full format."
            : "Upload a CSV with columns: name, employeeId, role, monthlySalary, subjectOrGrade (optional)."}
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <Upload className="h-4 w-4" />
            Choose file
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(sampleCSV)}`}
            download={sampleFilename}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Download sample CSV
          </a>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Or paste CSV below</label>
          <textarea
            value={rawCsv}
            onChange={(e) => {
              setRawCsv(e.target.value);
              setImportResult(null);
            }}
            onBlur={processCSV}
            placeholder="Paste CSV content here..."
            rows={6}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={processCSV}>
            <FileText className="mr-1 h-4 w-4" />
            Preview
          </Button>
        </div>
        {parsed.length > 0 && (
          <>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="border-b border-slate-200 dark:border-slate-600 p-2 text-left font-medium text-slate-900 dark:text-slate-100">Row</th>
                    <th className="border-b border-slate-200 dark:border-slate-600 p-2 text-left font-medium text-slate-900 dark:text-slate-100">Status</th>
                    <th className="border-b border-slate-200 dark:border-slate-600 p-2 text-left font-medium text-slate-900 dark:text-slate-100">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((r) => (
                    <tr key={r.index} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="p-2 text-slate-900 dark:text-slate-100">{r.index}</td>
                      <td className="p-2">
                        {r.valid ? (
                          <span className="text-green-600 dark:text-green-400">OK</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">{r.error}</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate p-2 text-slate-600 dark:text-slate-300">
                        {Object.values(r.data).slice(0, 3).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 20 && (
              <p className="text-xs text-slate-500">Showing first 20 rows. Total: {parsed.length}</p>
            )}
            <p className="text-sm text-slate-600">
              <strong>{validCount}</strong> valid, <strong>{parsed.length - validCount}</strong> with errors
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                disabled={validCount === 0 || !sessionId || isImporting}
                onClick={handleImport}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {validCount} {type === "students" ? "students" : "staff"}</>
                )}
              </Button>
            </div>
          </>
        )}
        {importResult !== null && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Import complete: <strong>{importResult.success}</strong> added,{" "}
            {importResult.failed > 0 && (
              <><strong>{importResult.failed}</strong> skipped (validation errors)</>
            )}
            {importResult.failed === 0 && " (all rows valid)."}
          </div>
        )}
        {importError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {importError}
          </div>
        )}
      </div>
    </Modal>
  );
}
