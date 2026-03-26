import { Button } from "@/components/ui/button";
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
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useAddPurchase, usePurchases } from "../hooks/useQueries";

interface Props {
  products: Product[];
  refreshProducts: () => void;
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN");
}

export default function Purchases({ products, refreshProducts }: Props) {
  const { data: purchases, isLoading } = usePurchases();
  const addPurchase = useAddPurchase();

  const todayStr = new Date().toISOString().split("T")[0];
  const [supplierName, setSupplierName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [date, setDate] = useState(todayStr);

  const handleProductChange = (v: string) => {
    setProductId(v);
    const prod = products.find((p) => String(p.id) === v);
    if (prod) setBuyingPrice(String(prod.buyingPrice));
  };

  const handleSubmit = async () => {
    if (!supplierName.trim() || !productId || !quantity || !buyingPrice) {
      toast.error("Fill all required fields");
      return;
    }
    const prod = products.find((p) => String(p.id) === productId);
    if (!prod) return;
    const dateTs = BigInt(new Date(date).getTime()) * 1_000_000n;
    try {
      await addPurchase.mutateAsync({
        supplierName: supplierName.trim(),
        productId: prod.id,
        productName: prod.name,
        quantity: BigInt(Number.parseInt(quantity)),
        buyingPrice: Number.parseFloat(buyingPrice),
        date: dateTs,
      });
      toast.success("Purchase recorded");
      setSupplierName("");
      setProductId("");
      setQuantity("");
      setBuyingPrice("");
      setDate(todayStr);
      refreshProducts();
    } catch {
      toast.error("Failed to record purchase");
    }
  };

  const sortedPurchases = [...(purchases ?? [])].sort((a, b) =>
    Number(b.date - a.date),
  );

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Record Purchase
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sname">Supplier Name *</Label>
            <Input
              id="sname"
              placeholder="e.g. Ramesh Distributors"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              data-ocid="purchases.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger data-ocid="purchases.select">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pqty">Quantity *</Label>
            <Input
              id="pqty"
              type="number"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pbprice">Buying Price (₹) *</Label>
            <Input
              id="pbprice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdate">Date *</Label>
            <Input
              id="pdate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              disabled={addPurchase.isPending}
              onClick={handleSubmit}
              className="w-full text-white"
              style={{ background: "#2A9DB0" }}
              data-ocid="purchases.submit_button"
            >
              {addPurchase.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Record Purchase
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Purchase History
          </h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="purchases.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedPurchases.length === 0 ? (
          <div
            className="text-center py-16 text-gray-400"
            data-ocid="purchases.empty_state"
          >
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No purchases recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm" data-ocid="purchases.table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  "Date",
                  "Supplier",
                  "Product",
                  "Qty",
                  "Buying Price",
                  "Total",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPurchases.map((p, i) => (
                <tr
                  key={`${String(p.date)}-${p.supplierName}-${String(p.productId)}`}
                  className="border-b border-gray-50 hover:bg-gray-50"
                  data-ocid={`purchases.item.${i + 1}`}
                >
                  <td className="px-4 py-3 text-gray-500">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.supplierName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.productName}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {String(p.quantity)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ₹{p.buyingPrice.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ₹
                    {(Number(p.quantity) * p.buyingPrice).toLocaleString(
                      "en-IN",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
