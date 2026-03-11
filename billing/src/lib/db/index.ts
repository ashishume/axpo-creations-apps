/**
 * Database exports
 *
 * Uses backend API when VITE_BILLING_API_URL is set; otherwise Supabase.
 */

export * from "./types";
export * from "./repository";

import { isBillingApiConfigured } from "../api/client";
import * as apiRepos from "./api";
import * as supabaseRepos from "./supabase/repositories";
import { supabase as supabaseClient, isSupabaseConfigured as supabaseConfigured } from "./supabase/client";

const useApi = isBillingApiConfigured();

export const authRepository = useApi ? apiRepos.authRepositoryApi : supabaseRepos.authRepository;
export const companyRepository = useApi ? apiRepos.companyRepositoryApi : supabaseRepos.companyRepository;
export const productRepository = useApi ? apiRepos.productRepositoryApi : supabaseRepos.productRepository;
export const customerRepository = useApi ? apiRepos.customerRepositoryApi : supabaseRepos.customerRepository;
export const supplierRepository = useApi ? apiRepos.supplierRepositoryApi : supabaseRepos.supplierRepository;
export const invoiceRepository = useApi ? apiRepos.invoiceRepositoryApi : supabaseRepos.invoiceRepository;
export const purchaseInvoiceRepository = useApi ? apiRepos.purchaseInvoiceRepositoryApi : supabaseRepos.purchaseInvoiceRepository;
export const paymentRepository = useApi ? apiRepos.paymentRepositoryApi : supabaseRepos.paymentRepository;
export const stockMovementRepository = useApi ? apiRepos.stockMovementRepositoryApi : supabaseRepos.stockMovementRepository;
export const expenseRepository = useApi ? apiRepos.expenseRepositoryApi : supabaseRepos.expenseRepository;
export const subscriptionRepository = useApi ? apiRepos.subscriptionRepositoryApi : supabaseRepos.subscriptionRepository;

export const isSupabaseConfigured = (): boolean => !useApi && supabaseConfigured();
export const supabase = supabaseClient;
