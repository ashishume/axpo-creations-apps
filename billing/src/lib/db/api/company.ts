import { billingFetchJson } from "@/lib/api/client";
import type { CompanyRepository } from "../repository";
import type { Company } from "../types";

function mapFromApi(r: Record<string, unknown>): Company {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    address: String(r.address ?? ""),
    gstin: String(r.gstin ?? ""),
    pan: String(r.pan ?? ""),
    phone: String(r.phone ?? ""),
    email: String(r.email ?? ""),
    bankName: String(r.bank_name ?? ""),
    bankAccount: String(r.bank_account ?? ""),
    bankIfsc: String(r.bank_ifsc ?? ""),
    logoPath: String(r.logo_path ?? ""),
    financialYearStart: Number(r.financial_year_start ?? new Date().getFullYear()),
    stateCode: String(r.state_code ?? ""),
  };
}

function toApi(c: Omit<Company, "id">): Record<string, unknown> {
  return {
    name: c.name,
    address: c.address,
    gstin: c.gstin,
    pan: c.pan,
    phone: c.phone,
    email: c.email,
    bank_name: c.bankName,
    bank_account: c.bankAccount,
    bank_ifsc: c.bankIfsc,
    logo_path: c.logoPath,
    financial_year_start: c.financialYearStart,
    state_code: c.stateCode,
  };
}

export const companyRepositoryApi: CompanyRepository = {
  async get(): Promise<Company | null> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/companies");
    if (!Array.isArray(list) || list.length === 0) return null;
    return mapFromApi(list[0]);
  },

  async set(companyData: Omit<Company, "id">): Promise<Company> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/companies");
    if (Array.isArray(list) && list.length > 0) {
      const id = (list[0] as Record<string, unknown>).id;
      const updated = await billingFetchJson<Record<string, unknown>>(`/companies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(toApi(companyData)),
      });
      return mapFromApi(updated);
    }
    const created = await billingFetchJson<Record<string, unknown>>("/companies", {
      method: "POST",
      body: JSON.stringify(toApi(companyData)),
    });
    return mapFromApi(created);
  },
};
