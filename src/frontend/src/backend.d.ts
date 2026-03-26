import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BillItem {
    qty: bigint;
    sellingPrice: number;
    productId: bigint;
    productName: string;
    buyingPrice: number;
}
export type Time = bigint;
export interface CreditCustomer {
    payments: Array<PaymentRecord>;
    dateCreated: Time;
    name: string;
    totalOwed: number;
    phone: string;
}
export interface PaymentRecord {
    date: Time;
    note: string;
    amount: number;
}
export interface Bill {
    customerName: string;
    date: Time;
    totalAmount: number;
    billNumber: bigint;
    items: Array<BillItem>;
}
export interface Purchase {
    supplierName: string;
    date: Time;
    productId: bigint;
    productName: string;
    quantity: bigint;
    buyingPrice: number;
}
export interface DashboardSummary {
    totalProducts: bigint;
    outstandingLoans: number;
    lowStockCount: bigint;
    todaysSales: number;
    inventoryValue: number;
}
export interface Product {
    id: bigint;
    stockQty: bigint;
    name: string;
    unit: string;
    sellingPrice: number;
    minStockQty: bigint;
    category: string;
    buyingPrice: number;
}
export interface backendInterface {
    addBill(bill: Bill): Promise<bigint>;
    addCreditCustomer(customer: CreditCustomer): Promise<void>;
    addProduct(product: Product): Promise<bigint>;
    addPurchase(purchase: Purchase): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getAllBills(): Promise<Array<Bill>>;
    getAllCreditCustomers(): Promise<Array<CreditCustomer>>;
    getAllCreditCustomersSortedByAmount(): Promise<Array<CreditCustomer>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllProductsSorted(): Promise<Array<Product>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getBill(billNumber: bigint): Promise<Bill>;
    getDashboardSummary(startTime: Time, endTime: Time): Promise<DashboardSummary>;
    getLowStockProducts(): Promise<Array<Product>>;
    getOutstandingCreditCustomers(): Promise<Array<CreditCustomer>>;
    getProduct(id: bigint): Promise<Product>;
    recordPayment(customerName: string, amount: number): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
