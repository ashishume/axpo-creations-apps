import { supabase } from "../client";
import type { CompanyRepository } from "../../repository";
import type { Company, BusinessType } from "../../types";

export const companyRepository: CompanyRepository = {
  async get(businessType: BusinessType): Promise<Company | null> {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("business_type", businessType)
      .limit(1)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async set(companyData: Omit<Company, "id">): Promise<Company> {
    const businessType = companyData.businessType;
    const existing = await this.get(businessType);
    
    if (existing) {
      const { data, error } = await supabase
        .from("companies")
        .update(mapToDb(companyData))
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapFromDb(data);
    } else {
      const { data, error } = await supabase
        .from("companies")
        .insert(mapToDb(companyData))
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapFromDb(data);
    }
  },
};

function mapFromDb(data: Record<string, unknown>): Company {
  return {
    id: data.id as string,
    name: data.name as string,
    address: data.address as string,
    gstin: data.gstin as string,
    pan: data.pan as string,
    phone: data.phone as string,
    email: data.email as string,
    bankName: data.bank_name as string,
    bankAccount: data.bank_account as string,
    bankIfsc: data.bank_ifsc as string,
    logoPath: data.logo_path as string,
    financialYearStart: data.financial_year_start as number,
    stateCode: data.state_code as string,
    businessType: (data.business_type as BusinessType) || "shop",
  };
}

function mapToDb(company: Omit<Company, "id">): Record<string, unknown> {
  return {
    name: company.name,
    address: company.address,
    gstin: company.gstin,
    pan: company.pan,
    phone: company.phone,
    email: company.email,
    bank_name: company.bankName,
    bank_account: company.bankAccount,
    bank_ifsc: company.bankIfsc,
    logo_path: company.logoPath,
    financial_year_start: company.financialYearStart,
    state_code: company.stateCode,
    business_type: company.businessType,
  };
}
