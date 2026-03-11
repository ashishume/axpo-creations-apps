/**
 * Hook to combine loading states from multiple data hooks
 * 
 * @example
 * const { data: invoices, loading: invoicesLoading } = useInvoices();
 * const { data: customers, loading: customersLoading } = useCustomers();
 * const loading = useCombinedLoading(invoicesLoading, customersLoading);
 */
export function useCombinedLoading(...loadingStates: boolean[]): boolean {
  return loadingStates.some(Boolean);
}
