import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bill,
  CreditCustomer,
  DashboardSummary,
  Product,
  Purchase,
} from "../backend";
import { useActor } from "./useActor";

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLowStockProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["lowstock"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBills() {
  const { actor, isFetching } = useActor();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBills();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePurchases() {
  const { actor, isFetching } = useActor();
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreditCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<CreditCustomer[]>({
    queryKey: ["creditCustomers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCreditCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDashboardSummary(startTime: bigint, endTime: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard", startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor)
        return {
          todaysSales: 0,
          inventoryValue: 0,
          outstandingLoans: 0,
          lowStockCount: 0n,
          totalProducts: 0n,
        };
      return actor.getDashboardSummary(startTime, endTime);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: Product) => actor!.addProduct(product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: Product) => actor!.updateProduct(product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useAddBill() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bill: Bill) => actor!.addBill(bill),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useAddPurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (purchase: Purchase) => actor!.addPurchase(purchase),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAddCreditCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (customer: CreditCustomer) =>
      actor!.addCreditCustomer(customer),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creditCustomers"] }),
  });
}

export function useRecordPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, amount }: { name: string; amount: number }) =>
      actor!.recordPayment(name, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creditCustomers"] }),
  });
}
