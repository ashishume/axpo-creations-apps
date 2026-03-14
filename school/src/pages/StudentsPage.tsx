import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useStudentsBySessionInfinite, useStudentsBySession, useCreateStudent, useCreateStudentsBulk, useUpdateStudent, useDeleteStudent, useDeleteAllStudentsBySession, useAddStudentPayment, useTransferStudentsToSession } from "../hooks/useStudents";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useClassesBySession, useCreateClass, useUpdateClass, useDeleteClass } from "../hooks/useClasses";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, DollarSign, Upload, Download, BookOpen, Camera, X, User, Calendar, MoreVertical, ArrowRightLeft } from "lucide-react";
import { BulkImportModal, exportStudentsToCSV } from "../components/import/BulkImportModal";
import { PaymentReceiptModal } from "../components/receipt/PaymentReceiptModal";
import { StudentDetailsModal } from "../components/students/StudentDetailsModal";
import { AddStudentsVerifyModal, type PendingStudent } from "../components/students/AddStudentsVerifyModal";
import type { Student as StudentType, SessionStudent, FeeType, PaymentMethod, StudentClass, StudentPersonalDetails } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import {
  getTotalPaid,
  getRemaining,
  getPaymentStatus,
  getRunningBalances,
  getTotalFine,
  getPaymentsByCategory,
  getRemainingForCategory,
  type PaymentStatus,
} from "../lib/studentUtils";
import { cn } from "../lib/utils";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterChips } from "../components/ui/FilterChips";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { FormField } from "../components/ui/FormField";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PermissionGate } from "../components/auth/PermissionGate";
import { isTeachingApiConfigured } from "../lib/api/client";
import { uploadStudentPhoto } from "../lib/api/upload";

const statusBadgeVariant: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  "Fully Paid": "success",
  "Partially Paid": "warning",
  "Not Paid": "danger",
};

/** Default values for class fee structure (Add/Edit class form and fallbacks when class is not set). */
const CLASS_FEE_DEFAULTS = {
  dueDayOfMonth: 8,
  registrationFees: 0,
  annualFund: 0,
  monthlyFees: 0,
  lateFeeAmount: 50,
  lateFeeFrequency: "weekly" as const,
};

export function StudentsPage() {
  const {
    schools,
    sessions,
    selectedSchoolId,
    selectedSessionId,
    toast,
  } = useApp();
  const { hasPermission, hasAnyPermission } = useAuth();
  const canRecordFees = hasAnyPermission(["fees:record", "students:edit"]);
  const canEditStudent = hasPermission("students:edit");

  const createStudent = useCreateStudent();
  const createStudentsBulk = useCreateStudentsBulk();
  const updateStudentMut = useUpdateStudent();
  const deleteStudentMut = useDeleteStudent();
  const deleteAllStudentsMut = useDeleteAllStudentsBySession();
  const addPaymentMut = useAddStudentPayment();
  const transferStudentsMut = useTransferStudentsToSession();
  const createClass = useCreateClass();
  const updateClassMut = useUpdateClass();
  const deleteClassMut = useDeleteClass();

  const addStudentAsync = (data: Omit<StudentType, "id" | "payments">) => createStudent.mutateAsync(data);
  const updateStudent = (id: string, data: Partial<StudentType>) =>
    updateStudentMut.mutate({ id, updates: data, sessionId: selectedSessionId ?? undefined });
  const updateStudentAsync = (id: string, data: Partial<StudentType>) =>
    updateStudentMut.mutateAsync({ id, updates: data, sessionId: selectedSessionId ?? undefined });
  const deleteStudent = (id: string) =>
    deleteStudentMut.mutate(selectedSessionId ? { id, sessionId: selectedSessionId } : id);
  const addFeePayment = async (
    studentId: string,
    payment: Omit<import("../types").FeePayment, "id" | "enrollmentId">,
    enrollmentId?: string,
    sessionId?: string
  ) => {
    return addPaymentMut.mutateAsync({
      studentId,
      payment,
      enrollmentId,
      sessionId: sessionId ?? selectedSessionId ?? undefined,
    });
  };
  const addClass = (data: Omit<StudentClass, "id">) => createClass.mutate(data);
  const updateClass = (id: string, data: Partial<StudentClass>) => updateClassMut.mutate({ id, updates: data });
  const deleteClass = (id: string) => deleteClassMut.mutate(id);
  const studentFormRef = useRef<HTMLFormElement>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement>(null);
  const studentPhotoFileRef = useRef<File | null>(null);
  const [studentModal, setStudentModal] = useState<{ open: boolean; student?: SessionStudent }>({ open: false });
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);
  const [selectedSiblingId, setSelectedSiblingId] = useState<string>("");
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; student: SessionStudent } | null>(null);
  const [historyStudent, setHistoryStudent] = useState<SessionStudent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [classesModalOpen, setClassesModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>("");
  const [detailsStudent, setDetailsStudent] = useState<{ student: SessionStudent; initialTab?: "overview" | "fees" | "personal" | "payments" | "feeHistory" } | null>(null);
  const [receiptData, setReceiptData] = useState<{
    student: SessionStudent;
    payment: { date: string; amount: number; method: PaymentMethod; receiptNumber: string };
    remainingAfter: number;
  } | null>(null);
  const [verifyAddModalOpen, setVerifyAddModalOpen] = useState(false);
  const [pendingAddStudents, setPendingAddStudents] = useState<PendingStudent[]>([]);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionMenuStudent, setActionMenuStudent] = useState<SessionStudent | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferStep, setTransferStep] = useState<"select" | "preview">("select");
  const [transferTargetSessionId, setTransferTargetSessionId] = useState<string | null>(null);
  const [transferSelectedIds, setTransferSelectedIds] = useState<Set<string>>(new Set());
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [isClassSubmitting, setIsClassSubmitting] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);
  const hasFilters = !!(statusFilter || classFilter || feeTypeFilter || debouncedSearch);
  const {
    students,
    total: studentsTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: studentsLoading,
  } = useStudentsBySessionInfinite(selectedSessionId ?? "", {
    hasFilters,
    search: debouncedSearch || undefined,
  });
  const { data: allSessionStudents = [], isLoading: allStudentsLoading } = useStudentsBySession(selectedSessionId ?? "");
  const { data: sessionClasses = [], isLoading: classesLoading } = useClassesBySession(selectedSessionId ?? "");
  const isInitialLoading = (studentsLoading && students.length === 0) || classesLoading;

  const list = students;

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const targetSessions = sessions.filter(
    (s) => s.schoolId === currentSession?.schoolId && s.id !== selectedSessionId
  );

  // Keep details modal in sync with context (e.g. after recording a payment)
  useEffect(() => {
    if (!detailsStudent) return;
    const fresh = students.find((s) => s.id === detailsStudent.student.id);
    if (fresh) setDetailsStudent((prev) => prev ? { ...prev, student: fresh } : null);
  }, [students]);

  // Initialize sibling selection when student modal opens
  useEffect(() => {
    if (studentModal.open) {
      setSelectedSiblingId(studentModal.student?.siblingId ?? "");
    }
  }, [studentModal.open, studentModal.student?.siblingId]);

  // Close actions dropdown on scroll/resize so it doesn't stay mispositioned
  useEffect(() => {
    if (!actionMenuStudent) return;
    const close = () => {
      setActionMenuStudent(null);
      setActionMenuPosition(null);
      setActionMenuOpen(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenuStudent]);

  // Search is applied on backend; status, class, feeType filters on client
  const filteredList = useMemo(() => {
    let out = list;
    if (statusFilter) {
      out = out.filter((s) => getPaymentStatus(s) === statusFilter);
    }
    if (classFilter) {
      out = out.filter((s) => s.classId === classFilter);
    }
    if (feeTypeFilter) {
      out = out.filter((s) => s.feeType === feeTypeFilter);
    }
    return out;
  }, [list, statusFilter, classFilter, feeTypeFilter]);

  const handleClassSelectChange = (classId: string) => {
    if (!classId || !studentFormRef.current) return;
    const cls = sessionClasses.find((c) => c.id === classId);
    if (!cls) return;
    const form = studentFormRef.current;
    // Fill fees from class only when class value is non-zero; otherwise keep existing user input
    const setIfNonZero = (name: string, classValue: number) => {
      if (classValue != null && Number(classValue) !== 0) {
        (form.elements.namedItem(name) as HTMLInputElement).value = String(classValue);
      }
    };
    setIfNonZero("registrationFees", cls.registrationFees);
    setIfNonZero("annualFund", cls.annualFund);
    setIfNonZero("monthlyFees", cls.monthlyFees);
    setIfNonZero("dueDay", cls.dueDayOfMonth);
    setIfNonZero("lateFeeAmount", cls.lateFeeAmount);
    if (cls.lateFeeFrequency) {
      (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value = cls.lateFeeFrequency;
    }
  };

  // Handle student photo selection with size validation (max 2MB)
  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStudentPhotoPreview(null);
      studentPhotoFileRef.current = null;
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("Photo must be under 2MB. Please select a smaller file.", "error");
      e.target.value = "";
      setStudentPhotoPreview(null);
      studentPhotoFileRef.current = null;
      return;
    }

    studentPhotoFileRef.current = file;
    const reader = new FileReader();
    reader.onloadend = () => {
      setStudentPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isStudentSubmitting) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const studentId = (form.elements.namedItem("studentId") as HTMLInputElement).value.trim();
    const admissionNumber = (form.elements.namedItem("admissionNumber") as HTMLInputElement).value.trim();
    const feeType = (form.elements.namedItem("feeType") as HTMLSelectElement).value as FeeType;
    const classId = (form.elements.namedItem("classId") as HTMLSelectElement).value || undefined;

    // Fee fields - use parseFloat to preserve 0 values
    const registrationFeesVal = (form.elements.namedItem("registrationFees") as HTMLInputElement).value;
    const annualFundVal = (form.elements.namedItem("annualFund") as HTMLInputElement).value;
    const monthlyFeesVal = (form.elements.namedItem("monthlyFees") as HTMLInputElement).value;
    const transportFeesVal = (form.elements.namedItem("transportFees") as HTMLInputElement).value;

    const registrationFees = registrationFeesVal !== "" ? Number(registrationFeesVal) : undefined;
    const annualFund = annualFundVal !== "" ? Number(annualFundVal) : undefined;
    const monthlyFees = monthlyFeesVal !== "" ? Number(monthlyFeesVal) : undefined;
    const transportFees = transportFeesVal !== "" ? Number(transportFeesVal) : undefined;

    // Due date & late fee
    const dueDay = (form.elements.namedItem("dueDay") as HTMLInputElement).value;
    const lateFeeAmountVal = (form.elements.namedItem("lateFeeAmount") as HTMLInputElement).value;
    const lateFeeAmount = lateFeeAmountVal !== "" ? Number(lateFeeAmountVal) : undefined;
    const lateFeeFrequency = (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value as "daily" | "weekly" | "";

    // Sibling - uses controlled state from SearchableSelect
    const siblingId = selectedSiblingId || undefined;
    const hasSiblingDiscount = siblingId
      ? (form.elements.namedItem("hasSiblingDiscount") as HTMLInputElement)?.checked ?? false
      : undefined;

    if (!selectedSessionId || !name || !admissionNumber) {
      if (!admissionNumber) toast("Admission number is required", "error");
      return;
    }

    let photoUrl: string | undefined;
    if (studentPhotoFileRef.current && isTeachingApiConfigured()) {
      try {
        photoUrl = await uploadStudentPhoto(studentPhotoFileRef.current);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Photo upload failed", "error");
        return;
      }
    } else if (studentPhotoPreview && !studentPhotoPreview.startsWith("data:")) {
      photoUrl = studentPhotoPreview;
    } else {
      photoUrl = studentModal.student?.photoUrl;
    }

    const studentData: Record<string, unknown> = {
      name,
      studentId: studentId || undefined,
      admissionNumber,
      feeType,
      classId: classId || undefined,
      registrationFees,
      annualFund,
      monthlyFees,
      transportFees,
      dueDayOfMonth: dueDay ? Number(dueDay) : undefined,
      lateFeeAmount,
      lateFeeFrequency: lateFeeFrequency || undefined,
      photoUrl,
      siblingId,
      hasSiblingDiscount,
    };
    const studentWithEnrollment = studentModal.student as unknown as { enrollmentId?: string; sessionId?: string };
    if (studentModal.student && studentWithEnrollment.enrollmentId) {
      studentData.enrollmentId = studentWithEnrollment.enrollmentId;
      studentData.sessionId = studentWithEnrollment.sessionId;
    }

    setIsStudentSubmitting(true);
    try {
      if (studentModal.student) {
        updateStudent(studentModal.student.id, studentData as Partial<StudentType>);

        // If sibling is assigned, update the sibling to point back
        if (siblingId) {
          updateStudent(siblingId, { siblingId: studentModal.student.id });
        }

        // If sibling was removed, clear the reverse link
        const oldSiblingId = studentModal.student.siblingId;
        if (oldSiblingId && oldSiblingId !== siblingId) {
          updateStudent(oldSiblingId, { siblingId: undefined });
        }

        toast("Student updated");
      } else {
        const newStudent = await addStudentAsync({
          sessionId: selectedSessionId,
          ...studentData,
          studentId: (studentData.studentId as string) || `STU-${Date.now()}`,
        } as unknown as Omit<StudentType, "id" | "payments">);

        // If sibling is assigned, update the sibling to point back to the new student
        if (siblingId && newStudent) {
          await updateStudentAsync(siblingId, { siblingId: newStudent.id });
        }

        toast("Student added");
      }
      setStudentModal({ open: false });
      setStudentPhotoPreview(null);
      studentPhotoFileRef.current = null;
      setSelectedSiblingId("");
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSessionId || isClassSubmitting) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("className") as HTMLInputElement).value.trim();
    const registrationFees = Number((form.elements.namedItem("registrationFees") as HTMLInputElement).value) || 0;
    const annualFund = Number((form.elements.namedItem("annualFund") as HTMLInputElement).value) || 0;
    const monthlyFees = Number((form.elements.namedItem("monthlyFees") as HTMLInputElement).value) || 0;
    const lateFeeAmount = Number((form.elements.namedItem("lateFeeAmount") as HTMLInputElement).value) || 0;
    const lateFeeFrequency = (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value as "daily" | "weekly";
    const dueDayOfMonth = Number((form.elements.namedItem("dueDayOfMonth") as HTMLInputElement).value) || CLASS_FEE_DEFAULTS.dueDayOfMonth;

    if (!name) return;

    if (monthlyFees <= 0) {
      toast("Monthly fees must be greater than zero.", "error");
      return;
    }

    const classData = {
      name,
      registrationFees,
      annualFund,
      monthlyFees,
      lateFeeAmount,
      lateFeeFrequency,
      dueDayOfMonth,
    };

    setIsClassSubmitting(true);
    try {
      if (editingClass) {
        await updateClassMut.mutateAsync({ id: editingClass.id, updates: classData });
        toast("Class updated");
        setEditingClass(null);
      } else {
        await createClass.mutateAsync({ sessionId: selectedSessionId, ...classData });
        toast("Class added");
      }
      form.reset();
    } finally {
      setIsClassSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentModal || isPaymentSubmitting) return;
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as PaymentMethod;
    const receiptNumber = (form.elements.namedItem("receiptNumber") as HTMLInputElement).value.trim();
    if (!date || amount <= 0) return;
    const remainingBefore = getRemaining(paymentModal.student);
    const studentRef = paymentModal.student;
    setIsPaymentSubmitting(true);
    try {
      await addFeePayment(
        studentRef.id,
        {
          date,
          amount,
          method,
          receiptNumber: receiptNumber || "-",
          feeCategory: "monthly" // Default to monthly fee payment
        },
        (studentRef as { enrollmentId?: string }).enrollmentId,
        (studentRef as { sessionId?: string }).sessionId
      );
      toast("Fees captured");
      setPaymentModal(null);
      setReceiptData({
        student: studentRef,
        payment: { date, amount, method, receiptNumber: receiptNumber || "-" },
        remainingAfter: Math.max(0, remainingBefore - amount),
      });
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-2xl">Students & Fees</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">Track student fees and payments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 [&_button]:touch-manipulation [&_button]:min-h-[44px] md:[&_button]:min-h-0">
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId}
            onClick={() => setClassesModalOpen(true)}
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Manage classes
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId || allSessionStudents.length === 0}
            onClick={() => {
              const csv = exportStudentsToCSV(
                allSessionStudents.map((s) => {
                  const pd = s.personalDetails;
                  return {
                    name: s.name,
                    studentId: s.studentId,
                    classId: s.classId,
                    feeType: s.feeType,
                    registrationFees: s.registrationFees,
                    annualFund: s.annualFund,
                    monthlyFees: s.monthlyFees,
                    transportFees: s.transportFees,
                    dueDayOfMonth: s.dueDayOfMonth,
                    lateFeeAmount: s.lateFeeAmount,
                    lateFeeFrequency: s.lateFeeFrequency,
                    fatherName: pd?.fatherName ?? s.fatherName,
                    motherName: pd?.motherName ?? s.motherName,
                    guardianPhone: pd?.guardianPhone ?? s.guardianPhone,
                    bloodGroup: pd?.bloodGroup ?? s.bloodGroup,
                    currentAddress: pd?.currentAddress ?? s.currentAddress,
                    permanentAddress: pd?.permanentAddress ?? s.permanentAddress,
                    healthIssues: pd?.healthIssues ?? s.healthIssues,
                  };
                }),
                sessionClasses.map((c) => ({ id: c.id, name: c.name }))
              );
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast("Students exported to CSV");
            }}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId}
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
          <PermissionGate anyPermission={["students:create", "students:edit"]}>
            <Button
              size="sm"
              disabled={!selectedSessionId}
              onClick={() => setStudentModal({ open: true })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add student
            </Button>
          </PermissionGate>
          {import.meta.env.DEV && (
            <Button
              size="sm"
              variant="danger"
              disabled={!selectedSessionId}
              onClick={() => setConfirmDeleteAll(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete all students (Danger)
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId}
            onClick={() => {
              setTransferModalOpen(true);
              setTransferStep("select");
              setTransferTargetSessionId(null);
              setTransferSelectedIds(new Set());
            }}
          >
            <ArrowRightLeft className="mr-1 h-4 w-4" />
            Transfer to new session
          </Button>
        </div>
      </div>

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view students.
          </CardContent>
        </Card>
      ) : isInitialLoading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <SkeletonTable rows={8} columns={6} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Students ({studentsTotal})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name or ID..."
                  className="max-w-xs"
                />
                <div className="flex flex-wrap items-center gap-2 min-h-13">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</span>
                  <FilterChips
                    options={[
                      { value: "", label: "All" },
                      { value: "Fully Paid", label: "Fully Paid" },
                      { value: "Partially Paid", label: "Partially Paid" },
                      { value: "Not Paid", label: "Not Paid" },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Class:</span>
                  <Select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-auto min-w-[140px]"
                  >
                    <option value="">All Classes</option>
                    {sessionClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fee Type:</span>
                  <Select
                    value={feeTypeFilter}
                    onChange={(e) => setFeeTypeFilter(e.target.value)}
                    className="w-auto min-w-[160px]"
                  >
                    <option value="">All Fee Types</option>
                    <option value="Regular">Regular</option>
                    <option value="Boarding">Boarding</option>
                    <option value="Day Scholar + Meals">Day Scholar + Meals</option>
                    <option value="Boarding + Meals">Boarding + Meals</option>
                  </Select>
                </div>
              </div>
              {list.length === 0 ? (
                <EmptyState message="No students in this session. Add one to get started." />
              ) : filteredList.length === 0 ? (
                <EmptyState message="No students match your search or filter." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                        <th className="pb-2 pr-4 font-medium">Name</th>
                        <th className="pb-2 pr-4 font-medium">ID</th>
                        <th className="pb-2 pr-4 font-medium">Class</th>
                        <th className="pb-2 pr-4 font-medium">Fee type</th>
                        <th className="pb-2 pr-4 font-medium">Target</th>
                        <th className="pb-2 pr-4 font-medium">Paid</th>
                        <th className="pb-2 pr-4 font-medium">Remaining</th>
                        <th className="pb-2 pr-4 font-medium">Fine</th>
                        <th className="pb-2 pr-4 font-medium">Total due</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((s) => {
                        const paid = getTotalPaid(s);
                        const remaining = getRemaining(s);
                        const fine = getTotalFine(s);
                        const totalDue = remaining + fine;
                        const status = getPaymentStatus(s);
                        const target = s.targetAmount ?? 0;
                        const pct = target > 0 ? Math.min(100, (paid / target) * 100) : 0;
                        return (
                          <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                            <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{s.studentId}</td>
                            <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                              {s.classId ? sessionClasses.find((c) => c.id === s.classId)?.name ?? "—" : "—"}
                            </td>
                            <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{s.feeType}</td>
                            <td className="py-3 pr-4 text-slate-900 dark:text-slate-100">{formatCurrency(target)}</td>
                            <td className="py-3 pr-4 text-slate-900 dark:text-slate-100">{formatCurrency(paid)}</td>
                            <td className="py-3 pr-4 text-slate-900 dark:text-slate-100">{formatCurrency(remaining)}</td>
                            <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                              {fine > 0 ? formatCurrency(fine) : "—"}
                            </td>
                            <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                              {fine > 0 ? formatCurrency(totalDue) : formatCurrency(remaining)}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={statusBadgeVariant[status]}>
                                {status}
                              </Badge>
                              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    status === "Fully Paid" ? "bg-green-500" : status === "Partially Paid" ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex gap-1 items-center [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:touch-manipulation md:[&_button]:min-h-0 md:[&_button]:min-w-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsStudent({ student: s, initialTab: "feeHistory" })}
                                  title="View fee history"
                                >
                                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <PermissionGate anyPermission={["fees:record", "students:edit"]}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDetailsStudent({ student: s, initialTab: "payments" })}
                                    title="Record payment"
                                  >
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </Button>
                                </PermissionGate>
                                <div className="relative">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (actionMenuOpen === s.id) {
                                        setActionMenuOpen(null);
                                        setActionMenuStudent(null);
                                        setActionMenuPosition(null);
                                      } else {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setActionMenuPosition({ top: rect.bottom + 4, left: rect.right - 144 });
                                        setActionMenuOpen(s.id);
                                        setActionMenuStudent(s);
                                      }
                                    }}
                                    title="More actions"
                                  >
                                    <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {hasNextPage && list.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <AddStudentsVerifyModal
            open={verifyAddModalOpen}
            onClose={() => {
              setVerifyAddModalOpen(false);
              setPendingAddStudents([]);
            }}
            pending={pendingAddStudents}
            sessionClasses={sessionClasses}
            isSubmitting={isAddingStudents}
            onConfirm={async (toAdd) => {
              setIsAddingStudents(true);
              try {
                for (let i = 0; i < toAdd.length; i++) {
                  const s = toAdd[i];
                  await addStudentAsync({
                    ...s,
                    studentId: s.studentId?.trim() || `STU-${Date.now()}-${i}`,
                  });
                }
                toast(toAdd.length === 1 ? "Student added" : `${toAdd.length} students added`);
                setVerifyAddModalOpen(false);
                setPendingAddStudents([]);
              } catch (e) {
                toast(e instanceof Error ? e.message : "Failed to add student(s)", "error");
              } finally {
                setIsAddingStudents(false);
              }
            }}
          />
          {actionMenuStudent &&
            actionMenuPosition &&
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-9998"
                  onClick={() => {
                    setActionMenuOpen(null);
                    setActionMenuStudent(null);
                    setActionMenuPosition(null);
                  }}
                  aria-hidden
                />
                <div
                  className="fixed z-9999 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1"
                  style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                  role="menu"
                >
                  <PermissionGate permission="students:edit">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      onClick={() => {
                        setStudentModal({ open: true, student: actionMenuStudent });
                        setActionMenuOpen(null);
                        setActionMenuStudent(null);
                        setActionMenuPosition(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="students:delete">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      onClick={() => {
                        setConfirmDelete({ id: actionMenuStudent.id, name: actionMenuStudent.name });
                        setActionMenuOpen(null);
                        setActionMenuStudent(null);
                        setActionMenuPosition(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </PermissionGate>
                </div>
              </>,
              document.body
            )}
        </>
      )}

      <Modal
        open={studentModal.open}
        onClose={() => {
          setStudentModal({ open: false });
          setStudentPhotoPreview(null);
          setSelectedSiblingId("");
        }}
        title={studentModal.student ? "Edit student" : "Add student"}
      >
        <form ref={studentFormRef} onSubmit={handleSaveStudent} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <input type="hidden" name="sessionId" value={selectedSessionId ?? ""} />

          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Basic Info</h4>

            {/* Student Photo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {(studentPhotoPreview || studentModal.student?.photoUrl) ? (
                  <img
                    src={studentPhotoPreview || studentModal.student?.photoUrl}
                    alt="Student"
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    <User className="h-10 w-10 text-slate-400 dark:text-slate-400" />
                  </div>
                )}
                {(studentPhotoPreview || studentModal.student?.photoUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentPhotoPreview(null);
                      studentPhotoFileRef.current = null;
                      if (studentModal.student) {
                        updateStudent(studentModal.student.id, { photoUrl: undefined });
                      }
                      if (studentPhotoInputRef.current) studentPhotoInputRef.current.value = "";
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <input
                  ref={studentPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStudentPhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => studentPhotoInputRef.current?.click()}
                >
                  <Camera className="mr-1 h-4 w-4" />
                  {(studentPhotoPreview || studentModal.student?.photoUrl) ? "Change Photo" : "Add Photo"}
                </Button>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 2MB, JPG or PNG</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name *" required>
                <Input
                  name="name"
                  type="text"
                  required
                  defaultValue={studentModal.student?.name}
                />
              </FormField>
              <FormField label="Student ID">
                <Input
                  name="studentId"
                  type="text"
                  defaultValue={studentModal.student?.studentId}
                  placeholder="Auto-generated if empty"
                />
              </FormField>
            </div>
            <FormField label="Admission Number *" required helperText="Unique admission number for this student">
              <Input
                name="admissionNumber"
                type="text"
                required
                defaultValue={studentModal.student?.admissionNumber ?? ""}
                placeholder="e.g., ADM-2024-001"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Class *" required>
                <Select
                  name="classId"
                  required
                  defaultValue={studentModal.student?.classId ?? ""}
                  onChange={(e) => handleClassSelectChange(e.target.value)}
                >
                  <option value="">— Select class —</option>
                  {sessionClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₹{c.monthlyFees.toLocaleString()}/month)
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Fee type">
                <Select
                  name="feeType"
                  defaultValue={studentModal.student?.feeType ?? "Regular"}
                >
                  <option value="Regular">Regular</option>
                  <option value="Boarding">Boarding</option>
                  <option value="Day Scholar + Meals">Day Scholar + Meals</option>
                  <option value="Boarding + Meals">Boarding + Meals</option>
                </Select>
              </FormField>
            </div>

            {/* Sibling Selection */}
            <FormField label="Sibling" helperText="Link to sibling student (20% discount applied to ONE sibling only)">
              <SearchableSelect
                name="siblingId"
                value={selectedSiblingId}
                onChange={setSelectedSiblingId}
                placeholder="Search by name or ID..."
                emptyOption="— No sibling —"
                options={list
                  .filter((s) => s.id !== studentModal.student?.id)
                  .map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.studentId || "—"}) - ${sessionClasses.find(c => c.id === s.classId)?.name ?? "No class"}`,
                    searchText: `${s.name} ${s.studentId || ""}`,
                  }))}
              />
            </FormField>

            {/* Sibling Discount Toggle */}
            {selectedSiblingId && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <input
                  type="checkbox"
                  id="hasSiblingDiscount"
                  name="hasSiblingDiscount"
                  defaultChecked={studentModal.student?.hasSiblingDiscount ?? true}
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="hasSiblingDiscount" className="text-sm text-green-800 dark:text-green-200">
                  Apply 20% sibling discount to THIS student
                </label>
                <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                  (Only one sibling should have this enabled)
                </span>
              </div>
            )}
          </div>

          {/* Fee Structure */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Fee Structure</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecting a class auto-fills these. You can override if needed.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Registration/Admission fees (one-time)">
                <Input
                  name="registrationFees"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.registrationFees ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.registrationFees ?? ""}
                  placeholder="₹"
                />
              </FormField>
              <FormField label="Annual Fund (one-time)">
                <Input
                  name="annualFund"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.annualFund ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.annualFund ?? ""}
                  placeholder="₹"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Monthly Tuition (₹/month)">
                <Input
                  name="monthlyFees"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.monthlyFees ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.monthlyFees ?? ""}
                  placeholder="₹"
                />
              </FormField>
              <FormField label="Transport (₹/month, optional)">
                <Input
                  name="transportFees"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.transportFees ?? ""}
                  placeholder="Based on distance"
                />
              </FormField>
            </div>
          </div>

          {/* Late Fee Config */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Late Fee Configuration</h4>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Due day (1–28)">
                <Input
                  name="dueDay"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={studentModal.student?.dueDayOfMonth ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.dueDayOfMonth ?? CLASS_FEE_DEFAULTS.dueDayOfMonth}
                />
              </FormField>
              <FormField label="Late fee (₹)">
                <Input
                  name="lateFeeAmount"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.lateFeeAmount ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.lateFeeAmount ?? CLASS_FEE_DEFAULTS.lateFeeAmount}
                />
              </FormField>
              <FormField label="Frequency">
                <Select
                  name="lateFeeFrequency"
                  defaultValue={studentModal.student?.lateFeeFrequency ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.lateFeeFrequency ?? CLASS_FEE_DEFAULTS.lateFeeFrequency}
                >
                  <option value="weekly">Per week</option>
                  <option value="daily">Per day</option>
                </Select>
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setStudentModal({ open: false })} disabled={isStudentSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId || isStudentSubmitting} loading={isStudentSubmitting} loadingText="Saving...">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {paymentModal && (
        <Modal
          open={paymentModal.open}
          onClose={() => setPaymentModal(null)}
          title={`Add payment – ${paymentModal.student.name}`}
        >
          <form onSubmit={handleAddPayment} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Remaining: {formatCurrency(getRemaining(paymentModal.student))}
            </p>
            <FormField label="Date *" required>
              <Input
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </FormField>
            <FormField label="Amount (₹) *" required>
              <Input
                name="amount"
                type="number"
                required
                min={0.01}
                step={0.01}
              />
            </FormField>
            <FormField label="Method">
              <Select name="method">
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormField>
            <FormField label="Receipt number">
              <Input name="receiptNumber" type="text" />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPaymentModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPaymentSubmitting} loading={isPaymentSubmitting} loadingText="Recording...">
                Record payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {historyStudent && (
        <Modal
          open={!!historyStudent}
          onClose={() => setHistoryStudent(null)}
          title={`Payment history – ${historyStudent.name}`}
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Target: {formatCurrency(historyStudent.targetAmount ?? 0)} · Paid:{" "}
              {formatCurrency(getTotalPaid(historyStudent))} · Remaining:{" "}
              {formatCurrency(getRemaining(historyStudent))}
              {getTotalFine(historyStudent) > 0 && (
                <> · Fine: {formatCurrency(getTotalFine(historyStudent))} · Total due: {formatCurrency(getRemaining(historyStudent) + getTotalFine(historyStudent))}</>
              )}
            </p>
            {historyStudent.payments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No payments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                    <th className="pb-1 pr-2 font-medium">Date</th>
                    <th className="pb-1 pr-2 font-medium">Amount</th>
                    <th className="pb-1 pr-2 font-medium">Method</th>
                    <th className="pb-1 pr-2 font-medium">Receipt</th>
                    <th className="pb-1 font-medium">Balance after</th>
                  </tr>
                </thead>
                <tbody>
                  {getRunningBalances(historyStudent).map(({ afterPayment, payment }) => (
                    <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-1.5 pr-2 text-slate-900 dark:text-slate-100">{formatDate(payment.date)}</td>
                      <td className="py-1.5 pr-2 text-slate-900 dark:text-slate-100">{formatCurrency(payment.amount)}</td>
                      <td className="py-1.5 pr-2 text-slate-900 dark:text-slate-100">{payment.method}</td>
                      <td className="py-1.5 pr-2 text-slate-900 dark:text-slate-100">{payment.receiptNumber}</td>
                      <td className="py-1.5 text-slate-900 dark:text-slate-100">{formatCurrency(afterPayment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {receiptData && (
        <PaymentReceiptModal
          open={!!receiptData}
          onClose={() => setReceiptData(null)}
          schoolName={schools.find((sc) => sc.id === selectedSchoolId)?.name ?? "School"}
          sessionYear={sessions.find((s) => s.id === selectedSessionId)?.year ?? ""}
          studentName={receiptData.student.name}
          studentId={receiptData.student.studentId}
          payment={receiptData.payment}
          remainingAfter={receiptData.remainingAfter}
        />
      )}

      <Modal
        open={classesModalOpen}
        onClose={() => {
          setClassesModalOpen(false);
          setEditingClass(null);
        }}
        title="Manage classes"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Define fee structure per class. Students assigned to a class will auto-fill these fees.
          </p>
          <form key={editingClass?.id ?? "new"} onSubmit={handleSaveClass} className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Class name *" required>
                <Input
                  name="className"
                  type="text"
                  required
                  defaultValue={editingClass?.name}
                  placeholder="e.g. Class 1"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Due day (1-28)">
                <Input
                  name="dueDayOfMonth"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={editingClass?.dueDayOfMonth ?? CLASS_FEE_DEFAULTS.dueDayOfMonth}
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <FormField label="Registration/Admission fees">
                <Input
                  name="registrationFees"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.registrationFees ?? CLASS_FEE_DEFAULTS.registrationFees}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Annual Fund">
                <Input
                  name="annualFund"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.annualFund ?? CLASS_FEE_DEFAULTS.annualFund}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Monthly Fee">
                <Input
                  name="monthlyFees"
                  type="number"
                  min={0.01}
                  step="any"
                  defaultValue={editingClass?.monthlyFees ?? CLASS_FEE_DEFAULTS.monthlyFees}
                  placeholder="₹ (required, must be &gt; 0)"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Late fee amount">
                <Input
                  name="lateFeeAmount"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.lateFeeAmount ?? CLASS_FEE_DEFAULTS.lateFeeAmount}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Late fee frequency">
                <Select
                  name="lateFeeFrequency"
                  defaultValue={editingClass?.lateFeeFrequency ?? CLASS_FEE_DEFAULTS.lateFeeFrequency}
                  className="rounded px-2 py-1.5 text-sm"
                >
                  <option value="weekly">Per week</option>
                  <option value="daily">Per day</option>
                </Select>
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {editingClass && (
                <Button type="button" size="sm" variant="secondary" onClick={() => setEditingClass(null)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size="sm" disabled={isClassSubmitting} loading={isClassSubmitting} loadingText={editingClass ? "Updating..." : "Adding..."}>
                {editingClass ? "Update class" : "Add class"}
              </Button>
            </div>
          </form>
          {sessionClasses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No classes yet. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                    <th className="pb-2 pr-2 font-medium">Class</th>
                    <th className="pb-2 pr-2 font-medium">Monthly</th>
                    <th className="pb-2 pr-2 font-medium">One-time</th>
                    <th className="pb-2 pr-2 font-medium">Late fee</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionClasses.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2 pr-2 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                      <td className="py-2 pr-2 text-slate-900 dark:text-slate-100">{formatCurrency(c.monthlyFees)}/mo</td>
                      <td className="py-2 pr-2 text-xs text-slate-600 dark:text-slate-300">
                        Reg/Adm: ₹{c.registrationFees} + AF: ₹{c.annualFund}
                      </td>
                      <td className="py-2 pr-2 text-slate-900 dark:text-slate-100">₹{c.lateFeeAmount}/{c.lateFeeFrequency === "weekly" ? "wk" : "day"}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClass(c)}
                            title="Edit class"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={() => {
                              deleteClass(c.id);
                              toast("Class removed");
                            }}
                            title="Delete class"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteStudent(confirmDelete.id);
            toast("Student deleted");
            setConfirmDelete(null);
          }
        }}
        title="Delete student"
        message={`Delete "${confirmDelete?.name}"? Payment history will be removed.`}
        confirmLabel="Delete"
      />

      {import.meta.env.DEV && (
        <ConfirmDialog
          open={confirmDeleteAll}
          onClose={() => setConfirmDeleteAll(false)}
          onConfirm={() => {
            if (!selectedSessionId) return;
            deleteAllStudentsMut.mutate(selectedSessionId, {
              onSuccess: (deleted) => {
                toast(deleted > 0 ? `Deleted ${deleted} student(s)` : "No students to delete");
                setConfirmDeleteAll(false);
              },
              onError: (err) => {
                toast(err instanceof Error ? err.message : "Failed to delete all students", "error");
              },
            });
          }}
          title="Delete all students"
          message="This will permanently delete all students in this session and their fee history. This action cannot be undone. Are you sure?"
          confirmLabel="Delete all"
        />
      )}

      <BulkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="students"
        sessionId={selectedSessionId}
        onImportStudents={async (rows) => {
          if (!selectedSessionId) return;
          const studentsToCreate = rows.map((r, idx) => {
            let classId: string | undefined;
            let matchedClass: typeof sessionClasses[0] | undefined;
            if (r.className) {
              matchedClass = sessionClasses.find(
                (c) => c.name.toLowerCase() === r.className!.toLowerCase()
              );
              classId = matchedClass?.id;
            }
            return {
              sessionId: selectedSessionId,
              name: r.name,
              studentId: r.studentId ?? `STU-${Date.now()}-${idx}`,
              classId,
              feeType: r.feeType,
              registrationFees: r.registrationFees ?? matchedClass?.registrationFees,
              annualFund: r.annualFund ?? matchedClass?.annualFund,
              monthlyFees: r.monthlyFees ?? matchedClass?.monthlyFees,
              transportFees: r.transportFees,
              dueDayOfMonth: r.dueDayOfMonth ?? matchedClass?.dueDayOfMonth,
              lateFeeAmount: r.lateFeeAmount ?? matchedClass?.lateFeeAmount,
              lateFeeFrequency: r.lateFeeFrequency ?? matchedClass?.lateFeeFrequency,
              personalDetails: (r.fatherName || r.motherName || r.guardianPhone || r.bloodGroup || r.currentAddress || r.permanentAddress || r.healthIssues) ? {
                fatherName: r.fatherName,
                motherName: r.motherName,
                guardianPhone: r.guardianPhone,
                bloodGroup: ((r.bloodGroup && ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(r.bloodGroup)) ? r.bloodGroup : "") as StudentPersonalDetails["bloodGroup"],
                currentAddress: r.currentAddress,
                permanentAddress: r.permanentAddress,
                healthIssues: r.healthIssues,
              } : undefined,
              targetAmount: r.targetAmount,
              dueFrequency: r.dueFrequency,
              finePerDay: r.finePerDay,
            };
          });
          await createStudentsBulk.mutateAsync(studentsToCreate as unknown as Omit<StudentType, "id" | "payments">[]);
          toast(`${rows.length} student(s) imported`);
          setImportModalOpen(false);
        }}
        onImportStaff={() => { }}
      />

      {/* Student Details Modal */}
      {detailsStudent && (
        <StudentDetailsModal
          open={!!detailsStudent}
          onClose={() => setDetailsStudent(null)}
          student={detailsStudent.student}
          studentClass={sessionClasses.find((c) => c.id === detailsStudent.student.classId)}
          session={sessions.find((s) => s.id === selectedSessionId)}
          initialTab={detailsStudent.initialTab}
          onAddPayment={canRecordFees ? async (payment) => {
            const student = detailsStudent.student;
            const studentClass = sessionClasses.find((c) => c.id === student.classId);
            const paidByCategory = getPaymentsByCategory(student);
            const regFees = student.registrationFees ?? studentClass?.registrationFees ?? 0;
            const annFees = student.annualFund ?? studentClass?.annualFund ?? 0;

            // Prevent double payment: one-time fees (registration = Registration/Admission fees)
            if (payment.feeCategory === "registration" && regFees > 0 && paidByCategory.registration >= regFees) {
              toast("Registration/Admission fee already paid for this session.", "error");
              return;
            }
            if (payment.feeCategory === "annualFund" && annFees > 0 && paidByCategory.annualFund >= annFees) {
              toast("Annual fund already paid for this session.", "error");
              return;
            }

            // Allow partial payments: only block when the month is fully paid
            if (payment.feeCategory === "monthly" && payment.month) {
              const remainingForMonth = getRemainingForCategory(student, studentClass ?? undefined, "monthly", payment.month);
              if (remainingForMonth <= 0) {
                toast(`Monthly tuition for ${payment.month} is already fully paid.`, "error");
                return;
              }
            }

            if (payment.feeCategory === "transport" && payment.month) {
              const remainingForMonth = getRemainingForCategory(student, studentClass ?? undefined, "transport", payment.month);
              if (remainingForMonth <= 0) {
                toast(`Transport fee for ${payment.month} is already fully paid.`, "error");
                return;
              }
            }

            const enrollmentId = (detailsStudent.student as { enrollmentId?: string }).enrollmentId;
            const sessionId = (detailsStudent.student as { sessionId?: string }).sessionId;
            const createdPayment = await addFeePayment(detailsStudent.student.id, payment, enrollmentId, sessionId);
            toast("Fees captured");
            // Keep new row visible: optimistically merge created payment (refetch state may not be updated yet)
            if (createdPayment) {
              setDetailsStudent({
                student: {
                  ...detailsStudent.student,
                  payments: [...detailsStudent.student.payments, createdPayment],
                },
                initialTab: "feeHistory",
              });
            }
          } : undefined}
          onPaymentSuccess={() => {
            setDetailsStudent((prev) => prev ? { ...prev, initialTab: "feeHistory" } : null);
          }}
          onUpdateStudent={canEditStudent ? (data) => {
            updateStudent(detailsStudent.student.id, data);
            toast("Student updated");
            setDetailsStudent({ student: { ...detailsStudent.student, ...data }, initialTab: detailsStudent.initialTab });
          } : undefined}
          onFreezeAccount={canEditStudent ? async (freeze) => {
            const frozenData = freeze
              ? { isFrozen: true, frozenAt: new Date().toISOString() }
              : { isFrozen: false, frozenAt: undefined };
            updateStudent(detailsStudent.student.id, frozenData);
            toast(freeze ? "Student account frozen" : "Student account unfrozen");
            setDetailsStudent({
              student: { ...detailsStudent.student, ...frozenData },
              initialTab: detailsStudent.initialTab
            });
          } : undefined}
        />
      )}

      {/* Transfer to new session modal */}
      <Modal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setTransferStep("select");
          setTransferTargetSessionId(null);
          setTransferSelectedIds(new Set());
        }}
        title={transferStep === "select" ? "Transfer students to new session" : "Preview – Select students to transfer"}
      >
        <div className="space-y-4">
          {transferStep === "select" && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This session has ended. Select the target session to move students to. You can remove any student from the transfer in the next step.
              </p>
              <FormField label="Target session" required>
                <Select
                  value={transferTargetSessionId ?? ""}
                  onChange={(e) => setTransferTargetSessionId(e.target.value || null)}
                >
                  <option value="">Select session</option>
                  {targetSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.year} ({s.startDate} – {s.endDate})
                    </option>
                  ))}
                </Select>
              </FormField>
              {targetSessions.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  No other session found for this school. Create a new session first.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTransferModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!transferTargetSessionId}
                  onClick={() => {
                    setTransferStep("preview");
                    setTransferSelectedIds(new Set(allSessionStudents.map((s) => s.id)));
                  }}
                >
                  Next – Preview
                </Button>
              </div>
            </>
          )}

          {transferStep === "preview" && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Uncheck any student you do not want to transfer. Class assignment will be cleared in the new session; you can reassign after transfer.
              </p>
              {allStudentsLoading ? (
                <p className="text-sm text-slate-500">Loading students…</p>
              ) : allSessionStudents.length === 0 ? (
                <p className="text-sm text-slate-500">No students in this session.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                        <th className="w-10 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={transferSelectedIds.size === allSessionStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTransferSelectedIds(new Set(allSessionStudents.map((s) => s.id)));
                              } else {
                                setTransferSelectedIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">ID</th>
                        <th className="px-3 py-2 font-medium">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSessionStudents.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="w-10 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={transferSelectedIds.has(s.id)}
                              onChange={(e) => {
                                setTransferSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(s.id);
                                  else next.delete(s.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">{s.name}</td>
                          <td className="px-3 py-2">{s.studentId ?? "—"}</td>
                          <td className="px-3 py-2">{sessionClasses.find((c) => c.id === s.classId)?.name ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {transferSelectedIds.size} of {allSessionStudents.length} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTransferStep("select")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={transferSelectedIds.size === 0 || transferSubmitting}
                    onClick={async () => {
                      if (!transferTargetSessionId) return;
                      setTransferSubmitting(true);
                      try {
                        const studentIds = Array.from(transferSelectedIds);
                        const count = await transferStudentsMut.mutateAsync({
                          fromSessionId: selectedSessionId ?? "",
                          studentIds,
                          newSessionId: transferTargetSessionId,
                        });
                        toast(`${count} student(s) transferred`);
                        setTransferModalOpen(false);
                        setTransferStep("select");
                        setTransferTargetSessionId(null);
                        setTransferSelectedIds(new Set());
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Transfer failed", "error");
                      } finally {
                        setTransferSubmitting(false);
                      }
                    }}
                  >
                    {transferSubmitting ? "Transferring…" : `Transfer ${transferSelectedIds.size} student(s)`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
