import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Loader2, Plus, Printer, Receipt, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Bill, BillItem, Product } from "../backend";
import { useAddBill, useBills } from "../hooks/useQueries";

interface Props {
  products: Product[];
  refreshProducts: () => void;
}

let rowCounter = 0;
interface BillRow {
  id: number;
  productId: string;
  qty: string;
  price: string;
}

function newRow(): BillRow {
  return { id: ++rowCounter, productId: "", qty: "1", price: "" };
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN");
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function Sales({ products, refreshProducts }: Props) {
  const { data: bills, isLoading } = useBills();
  const addBill = useAddBill();

  const [customerName, setCustomerName] = useState("");
  const [rows, setRows] = useState<BillRow[]>([newRow()]);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const addRow = () => setRows((r) => [...r, newRow()]);
  const removeRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const updateRow = (
    id: number,
    field: keyof Omit<BillRow, "id">,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "productId") {
          const prod = products.find((p) => String(p.id) === value);
          if (prod) updated.price = String(prod.sellingPrice);
        }
        return updated;
      }),
    );
  };

  const total = rows.reduce((sum, r) => {
    const qty = Number.parseFloat(r.qty) || 0;
    const price = Number.parseFloat(r.price) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error("Enter customer name");
      return;
    }
    const validRows = rows.filter(
      (r) =>
        r.productId &&
        Number.parseFloat(r.qty) > 0 &&
        Number.parseFloat(r.price) >= 0,
    );
    if (validRows.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const items: BillItem[] = validRows.map((r) => {
      const prod = products.find((p) => String(p.id) === r.productId)!;
      return {
        productId: prod.id,
        productName: prod.name,
        qty: BigInt(Number.parseInt(r.qty)),
        sellingPrice: Number.parseFloat(r.price),
        buyingPrice: prod.buyingPrice,
      };
    });

    try {
      await addBill.mutateAsync({
        billNumber: 0n,
        customerName: customerName.trim(),
        date: BigInt(Date.now()) * 1_000_000n,
        items,
        totalAmount: total,
      });
      toast.success("Bill created successfully!");
      setCustomerName("");
      setRows([newRow()]);
      refreshProducts();
    } catch {
      toast.error("Failed to create bill");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sortedBills = [...(bills ?? [])].sort((a, b) =>
    Number(b.date - a.date),
  );

  return (
    <div className="space-y-6">
      {/* Create Bill */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Create New Bill
        </h2>
        <div className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="cname">Customer Name *</Label>
            <Input
              id="cname"
              className="mt-1"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-ocid="sales.input"
            />
          </div>

          {/* Item rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 pr-2 text-xs font-semibold text-gray-500">
                    Product
                  </th>
                  <th className="text-left pb-2 pr-2 text-xs font-semibold text-gray-500 w-24">
                    Qty
                  </th>
                  <th className="text-left pb-2 pr-2 text-xs font-semibold text-gray-500 w-28">
                    Price (₹)
                  </th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 w-28">
                    Amount
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} data-ocid={`sales.item.${i + 1}`}>
                    <td className="py-1.5 pr-2">
                      <Select
                        value={row.productId}
                        onValueChange={(v) => updateRow(row.id, "productId", v)}
                      >
                        <SelectTrigger
                          className="w-full"
                          data-ocid="sales.select"
                        >
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={String(p.id)} value={String(p.id)}>
                              {p.name} (Stock: {String(p.stockQty)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-24"
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(row.id, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-28"
                        value={row.price}
                        onChange={(e) =>
                          updateRow(row.id, "price", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-1.5 pr-2 font-medium text-gray-800">
                      ₹
                      {fmt(
                        (Number.parseFloat(row.qty) || 0) *
                          (Number.parseFloat(row.price) || 0),
                      )}
                    </td>
                    <td className="py-1.5">
                      {rows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeRow(row.id)}
                          data-ocid={`sales.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              data-ocid="sales.secondary_button"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{fmt(total)}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={addBill.isPending}
              onClick={handleSubmit}
              className="text-white px-6"
              style={{ background: "#2A9DB0" }}
              data-ocid="sales.submit_button"
            >
              {addBill.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Bills list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All Bills</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="sales.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedBills.length === 0 ? (
          <div
            className="text-center py-16 text-gray-400"
            data-ocid="sales.empty_state"
          >
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No bills yet. Create your first bill above.</p>
          </div>
        ) : (
          <table className="w-full text-sm" data-ocid="sales.table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Bill #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">
                  Total
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sortedBills.map((bill, i) => (
                <tr
                  key={String(bill.billNumber)}
                  className="border-b border-gray-50 hover:bg-gray-50"
                  data-ocid={`sales.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    #{String(bill.billNumber)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {bill.customerName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {fmtDate(bill.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {bill.items.length} items
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ₹{fmt(bill.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      style={{ color: "#2A9DB0" }}
                      onClick={() => setViewBill(bill)}
                      data-ocid={`sales.secondary_button.${i + 1}`}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Bill Modal */}
      <Dialog open={!!viewBill} onOpenChange={(o) => !o && setViewBill(null)}>
        <DialogContent className="sm:max-w-lg" data-ocid="sales.dialog">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {viewBill && (
            <div ref={printRef} className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Joshi Paints and Hardware Store
                </h2>
                <p className="text-sm text-gray-500">
                  Quality Products for Every Need
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">Bill No:</p>
                  <p className="font-semibold">
                    #{String(viewBill.billNumber)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Date:</p>
                  <p className="font-semibold">{fmtDate(viewBill.date)}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-gray-500">Customer:</p>
                <p className="font-semibold">{viewBill.customerName}</p>
              </div>
              <table className="w-full text-sm border-t">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">
                      Sr
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">
                      Item
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">
                      Qty
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">
                      Rate
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {viewBill.items.map((item, i) => (
                    <tr
                      key={`${String(item.productId)}-${item.productName}`}
                      className="border-b border-gray-50"
                    >
                      <td className="py-2 text-gray-500">{i + 1}</td>
                      <td className="py-2">{item.productName}</td>
                      <td className="py-2 text-right">{String(item.qty)}</td>
                      <td className="py-2 text-right">
                        ₹{fmt(item.sellingPrice)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        ₹{fmt(Number(item.qty) * item.sellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={4} className="py-3 font-bold text-right">
                      Total
                    </td>
                    <td className="py-3 font-bold text-right text-lg">
                      ₹{fmt(viewBill.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-center text-sm text-gray-400 italic">
                Thank you for your business!
              </p>
              <div className="flex justify-end no-print">
                <Button
                  type="button"
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  data-ocid="sales.primary_button"
                >
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
