
import { useEffect, useState } from "react";
import { useCompany } from "@/hooks/useStore";
import { setCompanyAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import type { Company } from "@/lib/db/types";
import { Card, Input, Textarea, Skeleton } from "@/components/ui";

const currentFY = new Date().getMonth() >= 2 ? new Date().getFullYear() : new Date().getFullYear() - 1;

export function SetupPage() {
  const { mode } = useBusinessMode();
  const { data: company, loading } = useCompany();
  const [form, setForm] = useState<Partial<Company>>({
    name: "",
    address: "",
    gstin: "",
    pan: "",
    phone: "",
    email: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    logoPath: "",
    financialYearStart: currentFY,
    stateCode: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        id: company.id,
        name: company.name,
        address: company.address || "",
        gstin: company.gstin,
        pan: company.pan,
        phone: company.phone,
        email: company.email,
        bankName: company.bankName || "",
        bankAccount: company.bankAccount || "",
        bankIfsc: company.bankIfsc || "",
        logoPath: company.logoPath || "",
        financialYearStart: company.financialYearStart ?? currentFY,
        stateCode: company.stateCode || "",
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.gstin || !form.pan || !form.phone || !form.email) {
      alert("Please fill required fields: Name, GSTIN, PAN, Phone, Email");
      return;
    }
    setSaving(true);
    try {
      await setCompanyAsync({
        name: form.name,
        address: form.address || "",
        gstin: form.gstin,
        pan: form.pan,
        phone: form.phone,
        email: form.email,
        bankName: form.bankName || "",
        bankAccount: form.bankAccount || "",
        bankIfsc: form.bankIfsc || "",
        logoPath: form.logoPath || "",
        financialYearStart: form.financialYearStart ?? currentFY,
        stateCode: form.stateCode || "",
        businessType: mode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error saving company profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="max-w-[500px] space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Company Profile
      </h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Set your company details for invoices and receipts. Financial year is April–March.
      </p>
      <Card className="mt-6 max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Name"
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Textarea
              label="Address"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
            />
            <Input
              label="GSTIN (15 chars)"
              type="text"
              value={form.gstin || ""}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              maxLength={15}
              required
            />
            <Input
              label="PAN"
              type="text"
              value={form.pan || ""}
              onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              maxLength={10}
              required
            />
            <Input
              label="Phone"
              type="text"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Bank Name"
              type="text"
              value={form.bankName || ""}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
            <Input
              label="Bank Account Number"
              type="text"
              value={form.bankAccount || ""}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
            />
            <Input
              label="IFSC Code"
              type="text"
              value={form.bankIfsc || ""}
              onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })}
            />
            <Input
              label="State Code (e.g. 09 for UP, for GST)"
              type="text"
              value={form.stateCode || ""}
              onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
              placeholder="09"
            />
            <div>
              <Input
                label="Financial Year Start (April)"
                type="number"
                value={form.financialYearStart ?? currentFY}
                onChange={(e) => setForm({ ...form, financialYearStart: parseInt(e.target.value, 10) })}
                min={2020}
                max={2030}
              />
              <small className="mt-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
                e.g. 2024 for FY 2024-25
              </small>
            </div>
            <Input
              label="Logo URL (path or link)"
              type="text"
              value={form.logoPath || ""}
              onChange={(e) => setForm({ ...form, logoPath: e.target.value })}
              placeholder="/logo.png or full URL"
            />
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Company Profile"}
            </button>
            {saved && (
              <span style={{ color: "var(--success)" }}>Saved.</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
