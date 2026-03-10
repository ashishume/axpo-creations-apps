import { useMemo, useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useStudentsBySessionInfinite, useCreateStudent, useCreateStudentsBulk, useUpdateStudent, useDeleteStudent, useAddStudentPayment } from "../hooks/useStudents";
import { useClassesBySession, useCreateClass, useUpdateClass, useDeleteClass } from "../hooks/useClasses";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, DollarSign, Upload, BookOpen, Eye, Camera, X, User } from "lucide-react";
import { BulkImportModal } from "../components/import/BulkImportModal";
import { PaymentReceiptModal } from "../components/receipt/PaymentReceiptModal";
import { StudentDetailsModal } from "../components/students/StudentDetailsModal";
import { AddStudentsVerifyModal, type PendingStudent } from "../components/students/AddStudentsVerifyModal";
import type { Student as StudentType, FeeType, PaymentMethod, StudentClass, StudentPersonalDetails } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import {
  getTotalPaid,
  getRemaining,
  getPaymentStatus,
  getRunningBalances,
  getTotalFine,
  getPaymentsByCategory,
  type PaymentStatus,
} from "../lib/studentUtils";
import { cn } from "../lib/utils";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterChips } from "../components/ui/FilterChips";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";

const statusBadgeVariant: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  "Fully Paid": "success",
  "Partially Paid": "warning",
  "Not Paid": "danger",
};

export function StudentsPage() {
  const {
    schools,
    sessions,
    selectedSchoolId,
    selectedSessionId,
    toast,
  } = useApp();

  const createStudent = useCreateStudent();
  const createStudentsBulk = useCreateStudentsBulk();
  const updateStudentMut = useUpdateStudent();
  const deleteStudentMut = useDeleteStudent();
  const addPaymentMut = useAddStudentPayment();
  const createClass = useCreateClass();
  const updateClassMut = useUpdateClass();
  const deleteClassMut = useDeleteClass();

  const addStudent = (data: Omit<StudentType, "id" | "payments">) => createStudent.mutate(data);
  const updateStudent = (id: string, data: Partial<StudentType>) => updateStudentMut.mutate({ id, updates: data });
  const deleteStudent = (id: string) => deleteStudentMut.mutate(id);
  const addFeePayment = async (studentId: string, payment: Omit<import("../types").FeePayment, "id">) => {
    return addPaymentMut.mutateAsync({ studentId, payment });
  };
  const addClass = (data: Omit<StudentClass, "id">) => createClass.mutate(data);
  const updateClass = (id: string, data: Partial<StudentClass>) => updateClassMut.mutate({ id, updates: data });
  const deleteClass = (id: string) => deleteClassMut.mutate(id);
  const studentFormRef = useRef<HTMLFormElement>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement>(null);
  const [studentModal, setStudentModal] = useState<{ open: boolean; student?: StudentType }>({ open: false });
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; student: StudentType } | null>(null);
  const [historyStudent, setHistoryStudent] = useState<StudentType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [classesModalOpen, setClassesModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>("");
  const [detailsStudent, setDetailsStudent] = useState<{ student: StudentType; initialTab?: "overview" | "fees" | "personal" | "payments" } | null>(null);
  const [receiptData, setReceiptData] = useState<{
    student: StudentType;
    payment: { date: string; amount: number; method: PaymentMethod; receiptNumber: string };
    remainingAfter: number;
  } | null>(null);
  const [verifyAddModalOpen, setVerifyAddModalOpen] = useState(false);
  const [pendingAddStudents, setPendingAddStudents] = useState<PendingStudent[]>([]);
  const [isAddingStudents, setIsAddingStudents] = useState(false);

  const hasFilters = !!(statusFilter || classFilter || feeTypeFilter || searchQuery.trim());
  const {
    students,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: studentsLoading,
  } = useStudentsBySessionInfinite(selectedSessionId ?? "", { hasFilters });
  const { data: sessionClasses = [], isLoading: classesLoading } = useClassesBySession(selectedSessionId ?? "");
  const isAppLoading = studentsLoading || classesLoading;

  const list = students;

  // Keep details modal in sync with context (e.g. after recording a payment)
  useEffect(() => {
    if (!detailsStudent) return;
    const fresh = students.find((s) => s.id === detailsStudent.student.id);
    if (fresh) setDetailsStudent((prev) => prev ? { ...prev, student: fresh } : null);
  }, [students]);

  const filteredList = useMemo(() => {
    let out = list;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q))
      );
    }
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
  }, [list, searchQuery, statusFilter, classFilter, feeTypeFilter]);

  const handleClassSelectChange = (classId: string) => {
    if (!classId || !studentFormRef.current) return;
    const cls = sessionClasses.find((c) => c.id === classId);
    if (!cls) return;
    const form = studentFormRef.current;
    // Fill fees from class
    (form.elements.namedItem("registrationFees") as HTMLInputElement).value = String(cls.registrationFees);
    (form.elements.namedItem("admissionFees") as HTMLInputElement).value = String(cls.admissionFees);
    (form.elements.namedItem("annualFund") as HTMLInputElement).value = String(cls.annualFund);
    (form.elements.namedItem("monthlyFees") as HTMLInputElement).value = String(cls.monthlyFees);
    (form.elements.namedItem("dueDay") as HTMLInputElement).value = String(cls.dueDayOfMonth);
    (form.elements.namedItem("lateFeeAmount") as HTMLInputElement).value = String(cls.lateFeeAmount);
    (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value = cls.lateFeeFrequency;
  };

  // Handle student photo selection with size validation
  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStudentPhotoPreview(null);
      return;
    }

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      toast("Photo must be under 2MB. Please select a smaller file.", "error");
      e.target.value = "";
      setStudentPhotoPreview(null);
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setStudentPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const studentId = (form.elements.namedItem("studentId") as HTMLInputElement).value.trim();
    const feeType = (form.elements.namedItem("feeType") as HTMLSelectElement).value as FeeType;
    const classId = (form.elements.namedItem("classId") as HTMLSelectElement).value || undefined;

    // Fee fields
    const registrationFees = Number((form.elements.namedItem("registrationFees") as HTMLInputElement).value) || undefined;
    const admissionFees = Number((form.elements.namedItem("admissionFees") as HTMLInputElement).value) || undefined;
    const annualFund = Number((form.elements.namedItem("annualFund") as HTMLInputElement).value) || undefined;
    const monthlyFees = Number((form.elements.namedItem("monthlyFees") as HTMLInputElement).value) || undefined;
    const transportFees = Number((form.elements.namedItem("transportFees") as HTMLInputElement).value) || undefined;

    // Due date & late fee
    const dueDay = (form.elements.namedItem("dueDay") as HTMLInputElement).value;
    const lateFeeAmount = Number((form.elements.namedItem("lateFeeAmount") as HTMLInputElement).value) || undefined;
    const lateFeeFrequency = (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value as "daily" | "weekly" | "";

    // Sibling
    const siblingId = (form.elements.namedItem("siblingId") as HTMLSelectElement).value || undefined;

    if (!selectedSessionId || !name) return;

    // TODO: Upload photo and get URL (currently using base64 preview for demo)
    const photoUrl = studentPhotoPreview || studentModal.student?.photoUrl;

    const studentData = {
      name,
      studentId: studentId || undefined,
      feeType,
      classId: classId || undefined,
      registrationFees,
      admissionFees,
      annualFund,
      monthlyFees,
      transportFees,
      dueDayOfMonth: dueDay ? Number(dueDay) : undefined,
      lateFeeAmount,
      lateFeeFrequency: lateFeeFrequency || undefined,
      photoUrl,
      siblingId,
    };

    if (studentModal.student) {
      updateStudent(studentModal.student.id, studentData);

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
      addStudent({
        sessionId: selectedSessionId,
        ...studentData,
        studentId: studentData.studentId || `STU-${Date.now()}`,
      });
      // Note: For new students, we can't easily update sibling since we don't have the new ID yet
      // This would require a callback from addStudent
      toast("Student added");
    }
    setStudentModal({ open: false });
    setStudentPhotoPreview(null);
  };

  const handleSaveClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("className") as HTMLInputElement).value.trim();
    const registrationFees = Number((form.elements.namedItem("registrationFees") as HTMLInputElement).value) || 0;
    const admissionFees = Number((form.elements.namedItem("admissionFees") as HTMLInputElement).value) || 0;
    const annualFund = Number((form.elements.namedItem("annualFund") as HTMLInputElement).value) || 0;
    const monthlyFees = Number((form.elements.namedItem("monthlyFees") as HTMLInputElement).value) || 0;
    const lateFeeAmount = Number((form.elements.namedItem("lateFeeAmount") as HTMLInputElement).value) || 0;
    const lateFeeFrequency = (form.elements.namedItem("lateFeeFrequency") as HTMLSelectElement).value as "daily" | "weekly";
    const dueDayOfMonth = Number((form.elements.namedItem("dueDayOfMonth") as HTMLInputElement).value) || 10;

    if (!name) return;

    const classData = {
      name,
      registrationFees,
      admissionFees,
      annualFund,
      monthlyFees,
      lateFeeAmount,
      lateFeeFrequency,
      dueDayOfMonth,
    };

    if (editingClass) {
      updateClass(editingClass.id, classData);
      toast("Class updated");
      setEditingClass(null);
    } else {
      addClass({ sessionId: selectedSessionId, ...classData });
      toast("Class added");
    }
    form.reset();
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentModal) return;
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as PaymentMethod;
    const receiptNumber = (form.elements.namedItem("receiptNumber") as HTMLInputElement).value.trim();
    if (!date || amount <= 0) return;
    const remainingBefore = getRemaining(paymentModal.student);
    addFeePayment(paymentModal.student.id, {
      date,
      amount,
      method,
      receiptNumber: receiptNumber || "-",
      feeCategory: "monthly" // Default to monthly fee payment
    });
    toast("Payment recorded");
    setPaymentModal(null);
    setReceiptData({
      student: paymentModal.student,
      payment: { date, amount, method, receiptNumber: receiptNumber || "-" },
      remainingAfter: Math.max(0, remainingBefore - amount),
    });
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
            disabled={!selectedSessionId}
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            size="sm"
            disabled={!selectedSessionId}
            onClick={() => setStudentModal({ open: true })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add student
          </Button>
        </div>
      </div>

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view students.
          </CardContent>
        </Card>
      ) : isAppLoading ? (
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
              <CardTitle>Students ({filteredList.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name or ID..."
                  className="max-w-xs"
                />
                <div className="flex flex-wrap items-center gap-2">
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
                              <div className="flex gap-1 [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:touch-manipulation md:[&_button]:min-h-0 md:[&_button]:min-w-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsStudent({ student: s, initialTab: "overview" })}
                                  title="View student details"
                                >
                                  <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsStudent({ student: s, initialTab: "payments" })}
                                  title="Record payment"
                                >
                                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setStudentModal({ open: true, student: s })}
                                  title="Edit student"
                                >
                                  <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                  onClick={() => setConfirmDelete({ id: s.id, name: s.name })}
                                  title="Delete student"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                  await addStudent({
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
        </>
      )}

      <Modal
        open={studentModal.open}
        onClose={() => {
          setStudentModal({ open: false });
          setStudentPhotoPreview(null);
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
            <FormField label="Sibling (30% monthly fee discount)" helperText="Both siblings will get 30% discount on monthly fees">
              <Select
                name="siblingId"
                defaultValue={studentModal.student?.siblingId ?? ""}
              >
                <option value="">— No sibling —</option>
                {list
                  .filter((s) => s.id !== studentModal.student?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentId}) - {sessionClasses.find(c => c.id === s.classId)?.name ?? "No class"}
                    </option>
                  ))}
              </Select>
            </FormField>
          </div>

          {/* Fee Structure */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1">Fee Structure</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecting a class auto-fills these. You can override if needed.</p>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Registration (one-time)">
                <Input
                  name="registrationFees"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.registrationFees ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.registrationFees ?? ""}
                  placeholder="₹"
                />
              </FormField>
              <FormField label="Admission (one-time)">
                <Input
                  name="admissionFees"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.admissionFees ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.admissionFees ?? ""}
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
            <div className="grid grid-cols-2 gap-3">
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
                  defaultValue={studentModal.student?.dueDayOfMonth ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.dueDayOfMonth ?? 10}
                />
              </FormField>
              <FormField label="Late fee (₹)">
                <Input
                  name="lateFeeAmount"
                  type="number"
                  min={0}
                  defaultValue={studentModal.student?.lateFeeAmount ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.lateFeeAmount ?? 50}
                />
              </FormField>
              <FormField label="Frequency">
                <Select
                  name="lateFeeFrequency"
                  defaultValue={studentModal.student?.lateFeeFrequency ?? sessionClasses.find(c => c.id === studentModal.student?.classId)?.lateFeeFrequency ?? "weekly"}
                >
                  <option value="weekly">Per week</option>
                  <option value="daily">Per day</option>
                </Select>
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setStudentModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId}>Save</Button>
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
              <Button type="submit">Record payment</Button>
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
                  defaultValue={editingClass?.dueDayOfMonth ?? 10}
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <FormField label="Registration">
                <Input
                  name="registrationFees"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.registrationFees ?? 500}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Admission">
                <Input
                  name="admissionFees"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.admissionFees ?? 2500}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Annual Fund">
                <Input
                  name="annualFund"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.annualFund ?? 1500}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Monthly Fee">
                <Input
                  name="monthlyFees"
                  type="number"
                  min={0}
                  defaultValue={editingClass?.monthlyFees ?? 3000}
                  placeholder="₹"
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
                  defaultValue={editingClass?.lateFeeAmount ?? 50}
                  placeholder="₹"
                  className="rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Late fee frequency">
                <Select
                  name="lateFeeFrequency"
                  defaultValue={editingClass?.lateFeeFrequency ?? "weekly"}
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
              <Button type="submit" size="sm">
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
                        Reg: ₹{c.registrationFees} + Adm: ₹{c.admissionFees} + AF: ₹{c.annualFund}
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
              admissionFees: r.admissionFees ?? matchedClass?.admissionFees,
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
          await createStudentsBulk.mutateAsync(studentsToCreate);
          toast(`${rows.length} student(s) imported`);
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
          initialTab={detailsStudent.initialTab}
          onAddPayment={async (payment) => {
            const student = detailsStudent.student;
            const studentClass = sessionClasses.find((c) => c.id === student.classId);
            const paidByCategory = getPaymentsByCategory(student);
            const regFees = student.registrationFees ?? studentClass?.registrationFees ?? 0;
            const admFees = student.admissionFees ?? studentClass?.admissionFees ?? 0;
            const annFees = student.annualFund ?? studentClass?.annualFund ?? 0;

            // Prevent double payment: one-time fees
            if (payment.feeCategory === "registration" && regFees > 0 && paidByCategory.registration >= regFees) {
              toast("Registration fee already paid for this session.", "error");
              return;
            }
            if (payment.feeCategory === "admission" && admFees > 0 && paidByCategory.admission >= admFees) {
              toast("Admission fee already paid for this session.", "error");
              return;
            }
            if (payment.feeCategory === "annualFund" && annFees > 0 && paidByCategory.annualFund >= annFees) {
              toast("Annual fund already paid for this session.", "error");
              return;
            }

            // Prevent double payment: monthly tuition for same month
            if (payment.feeCategory === "monthly" && payment.month) {
              const alreadyPaidForMonth = student.payments.some(
                (p) => p.feeCategory === "monthly" && p.month === payment.month
              );
              if (alreadyPaidForMonth) {
                toast(`Monthly tuition for ${payment.month} is already recorded.`, "error");
                return;
              }
            }

            // Prevent double payment: transport for same month
            if (payment.feeCategory === "transport" && payment.month) {
              const alreadyPaidForMonth = student.payments.some(
                (p) => p.feeCategory === "transport" && p.month === payment.month
              );
              if (alreadyPaidForMonth) {
                toast(`Transport fee for ${payment.month} is already recorded.`, "error");
                return;
              }
            }

            const createdPayment = await addFeePayment(detailsStudent.student.id, payment);
            toast("Payment recorded");
            // Keep new row visible: optimistically merge created payment (refetch state may not be updated yet)
            if (createdPayment) {
              setDetailsStudent({
                student: {
                  ...detailsStudent.student,
                  payments: [...detailsStudent.student.payments, createdPayment],
                },
                initialTab: "payments",
              });
            }
          }}
          onUpdateStudent={(data) => {
            updateStudent(detailsStudent.student.id, data);
            toast("Student updated");
            setDetailsStudent({ student: { ...detailsStudent.student, ...data }, initialTab: detailsStudent.initialTab });
          }}
        />
      )}
    </div>
  );
}
