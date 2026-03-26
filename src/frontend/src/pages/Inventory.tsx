import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Loader2, PackageX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useAddProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";

interface Props {
  refreshLowStock: () => void;
}

const SEED_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Asian Paints Emulsion 1L",
    category: "Paint",
    unit: "Litre",
    buyingPrice: 250,
    sellingPrice: 320,
    stockQty: 50n,
    minStockQty: 10n,
  },
  {
    name: "Berger Enamel Paint 500ml",
    category: "Paint",
    unit: "Piece",
    buyingPrice: 180,
    sellingPrice: 240,
    stockQty: 3n,
    minStockQty: 5n,
  },
  {
    name: "Hammer Claw 300g",
    category: "Hardware",
    unit: "Piece",
    buyingPrice: 120,
    sellingPrice: 180,
    stockQty: 25n,
    minStockQty: 5n,
  },
  {
    name: "PVC Pipe 1inch 3m",
    category: "Hardware",
    unit: "Piece",
    buyingPrice: 85,
    sellingPrice: 120,
    stockQty: 2n,
    minStockQty: 10n,
  },
  {
    name: "Wall Putty 5kg",
    category: "Paint",
    unit: "Bag",
    buyingPrice: 280,
    sellingPrice: 380,
    stockQty: 30n,
    minStockQty: 8n,
  },
  {
    name: "Basin Tap Chrome",
    category: "Sanitary",
    unit: "Piece",
    buyingPrice: 350,
    sellingPrice: 520,
    stockQty: 15n,
    minStockQty: 3n,
  },
  {
    name: "Toilet Seat White",
    category: "Sanitary",
    unit: "Piece",
    buyingPrice: 1200,
    sellingPrice: 1800,
    stockQty: 8n,
    minStockQty: 2n,
  },
  {
    name: "Drill Bits Set 10pc",
    category: "Hardware",
    unit: "Set",
    buyingPrice: 220,
    sellingPrice: 320,
    stockQty: 12n,
    minStockQty: 5n,
  },
];

const EMPTY_FORM = {
  name: "",
  category: "Paint",
  unit: "",
  buyingPrice: "",
  sellingPrice: "",
  stockQty: "",
  minStockQty: "",
};

type FormState = typeof EMPTY_FORM;

function categoryBadge(cat: string) {
  if (cat === "Paint") return { bg: "#DBEAFE", color: "#1D4ED8" };
  if (cat === "Hardware") return { bg: "#F3F4F6", color: "#374151" };
  return { bg: "#DCFCE7", color: "#15803D" };
}

export default function Inventory({ refreshLowStock }: Props) {
  const { data: products, isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { actor } = useActor();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Seed products if empty
  useEffect(() => {
    if (!actor || seeded || !products) return;
    if (products.length === 0) {
      setSeeded(true);
      Promise.all(
        SEED_PRODUCTS.map((p) => actor.addProduct({ ...p, id: 0n })),
      ).catch(() => {});
    }
  }, [actor, products, seeded]);

  const filtered = (products ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      buyingPrice: String(p.buyingPrice),
      sellingPrice: String(p.sellingPrice),
      stockQty: String(p.stockQty),
      minStockQty: String(p.minStockQty),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.unit ||
      !form.buyingPrice ||
      !form.sellingPrice ||
      !form.stockQty ||
      !form.minStockQty
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    const product: Product = {
      id: editingProduct?.id ?? 0n,
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
      buyingPrice: Number.parseFloat(form.buyingPrice),
      sellingPrice: Number.parseFloat(form.sellingPrice),
      stockQty: BigInt(Number.parseInt(form.stockQty)),
      minStockQty: BigInt(Number.parseInt(form.minStockQty)),
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync(product);
        toast.success("Product updated");
      } else {
        await addProduct.mutateAsync(product);
        toast.success("Product added");
      }
      setModalOpen(false);
      refreshLowStock();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success("Product deleted");
      refreshLowStock();
    } catch {
      toast.error("Failed to delete product");
    }
    setDeleteId(null);
  };

  const isBusy = addProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="inventory.search_input"
          />
        </div>
        <Button
          onClick={openAdd}
          className="text-white"
          style={{ background: "#2A9DB0" }}
          data-ocid="inventory.add_button"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="inventory.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 text-gray-400"
            data-ocid="inventory.empty_state"
          >
            <PackageX className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">
              Add your first product to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="inventory.table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    "Name",
                    "Category",
                    "Unit",
                    "Buy ₹",
                    "Sell ₹",
                    "Stock",
                    "Min",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isLow = p.stockQty < p.minStockQty;
                  const cat = categoryBadge(p.category);
                  return (
                    <tr
                      key={String(p.id)}
                      data-ocid={`inventory.item.${i + 1}`}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        isLow ? "border-l-2" : ""
                      }`}
                      style={isLow ? { borderLeftColor: "#F59E0B" } : {}}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                      <td className="px-4 py-3 text-gray-700">
                        ₹{p.buyingPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{p.sellingPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className={isLow ? "text-amber-600" : "text-gray-800"}
                        >
                          {String(p.stockQty)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {String(p.minStockQty)}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge
                            className="text-xs"
                            style={{
                              background: "#FEF3C7",
                              color: "#92400E",
                              border: "1px solid #FDE68A",
                            }}
                          >
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            className="text-xs"
                            style={{
                              background: "#DCFCE7",
                              color: "#15803D",
                              border: "1px solid #BBF7D0",
                            }}
                          >
                            OK
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(p)}
                            data-ocid={`inventory.edit_button.${i + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(p.id)}
                            data-ocid={`inventory.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="pname">Product Name *</Label>
              <Input
                id="pname"
                placeholder="e.g. Asian Paints Emulsion 1L"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="inventory.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger data-ocid="inventory.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paint">Paint</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Sanitary">Sanitary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="punit">Unit *</Label>
              <Input
                id="punit"
                placeholder="e.g. Litre, Piece, Kg"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pbuy">Buying Price (₹) *</Label>
              <Input
                id="pbuy"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.buyingPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, buyingPrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="psell">Selling Price (₹) *</Label>
              <Input
                id="psell"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sellingPrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock Qty *</Label>
              <Input
                id="pstock"
                type="number"
                min="0"
                placeholder="0"
                value={form.stockQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockQty: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmin">Min Stock Qty *</Label>
              <Input
                id="pmin"
                type="number"
                min="0"
                placeholder="0"
                value={form.minStockQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minStockQty: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="inventory.cancel_button"
            >
              Cancel
            </Button>
            <Button
              disabled={isBusy}
              onClick={handleSubmit}
              className="text-white"
              style={{ background: "#2A9DB0" }}
              data-ocid="inventory.submit_button"
            >
              {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="inventory.delete_button.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              data-ocid="inventory.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
