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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Loader2, Plus, Users } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import type { CreditCustomer } from "../backend";
import {
  useAddCreditCustomer,
  useCreditCustomers,
  useRecordPayment,
} from "../hooks/useQueries";

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN");
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function CustomerCredit() {
  const { data: customers, isLoading } = useCreditCustomers();
  const addCustomer = useAddCreditCustomer();
  const recordPayment = useRecordPayment();

  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CreditCustomer | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    amount: "",
    note: "",
  });
  const [payForm, setPayForm] = useState({ amount: "", note: "" });

  const toggleExpand = (name: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.phone.trim() || !addForm.amount) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      await addCustomer.mutateAsync({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        totalOwed: Number.parseFloat(addForm.amount),
        dateCreated: BigInt(Date.now()) * 1_000_000n,
        payments: [],
      });
      toast.success("Credit customer added");
      setAddOpen(false);
      setAddForm({ name: "", phone: "", amount: "", note: "" });
    } catch {
      toast.error("Failed to add customer");
    }
  };

  const handlePayment = async () => {
    if (!selectedCustomer || !payForm.amount) {
      toast.error("Enter payment amount");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        name: selectedCustomer.name,
        amount: Number.parseFloat(payForm.amount),
      });
      toast.success("Payment recorded");
      setPayOpen(false);
      setPayForm({ amount: "", note: "" });
      setSelectedCustomer(null);
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const openPayment = (c: CreditCustomer) => {
    setSelectedCustomer(c);
    setPayForm({ amount: "", note: "" });
    setPayOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          className="text-white"
          style={{ background: "#2A9DB0" }}
          data-ocid="credit.open_modal_button"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Credit Customer
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="credit.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !customers || customers.length === 0 ? (
          <div
            className="text-center py-16 text-gray-400"
            data-ocid="credit.empty_state"
          >
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No credit customers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm" data-ocid="credit.table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  "Name",
                  "Phone",
                  "Amount Owed",
                  "Date Added",
                  "Actions",
                  "",
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
              {customers.map((c, i) => {
                const isExpanded = expandedRows.has(c.name);
                const isOwed = c.totalOwed > 0;
                return (
                  <Fragment key={c.name}>
                    <tr
                      data-ocid={`credit.item.${i + 1}`}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(c.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          toggleExpand(c.name);
                      }}
                      tabIndex={0}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                      <td
                        className="px-4 py-3 font-semibold"
                        style={{ color: isOwed ? "#DC2626" : "#15803D" }}
                      >
                        ₹{fmt(c.totalOwed)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {fmtDate(c.dateCreated)}
                      </td>
                      <td className="px-4 py-3">
                        {isOwed && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            style={{ borderColor: "#2A9DB0", color: "#2A9DB0" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openPayment(c);
                            }}
                            data-ocid={`credit.primary_button.${i + 1}`}
                          >
                            Record Payment
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr data-ocid={`credit.panel.${i + 1}`}>
                        <td colSpan={6} className="px-8 py-4 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 mb-2">
                            Payment History
                          </p>
                          {c.payments.length === 0 ? (
                            <p className="text-sm text-gray-400">
                              No payments recorded yet.
                            </p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left pb-1 text-xs text-gray-500">
                                    Date
                                  </th>
                                  <th className="text-left pb-1 text-xs text-gray-500">
                                    Amount
                                  </th>
                                  <th className="text-left pb-1 text-xs text-gray-500">
                                    Note
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.payments.map((pay) => (
                                  <tr
                                    key={`${String(pay.date)}-${pay.amount}`}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="py-1.5 text-gray-500">
                                      {fmtDate(pay.date)}
                                    </td>
                                    <td
                                      className="py-1.5 font-semibold"
                                      style={{ color: "#15803D" }}
                                    >
                                      ₹{fmt(pay.amount)}
                                    </td>
                                    <td className="py-1.5 text-gray-500">
                                      {pay.note || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="credit.dialog">
          <DialogHeader>
            <DialogTitle>Add Credit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Customer Name *</Label>
              <Input
                id="cname"
                placeholder="Full name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="credit.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Phone Number *</Label>
              <Input
                id="cphone"
                type="tel"
                placeholder="10-digit mobile number"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camount">Amount Owed (₹) *</Label>
              <Input
                id="camount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={addForm.amount}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnote">Note (optional)</Label>
              <Textarea
                id="cnote"
                placeholder="Details about the credit..."
                value={addForm.note}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, note: e.target.value }))
                }
                data-ocid="credit.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="credit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={addCustomer.isPending}
              onClick={handleAdd}
              className="text-white"
              style={{ background: "#2A9DB0" }}
              data-ocid="credit.submit_button"
            >
              {addCustomer.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="credit.payment.dialog"
        >
          <DialogHeader>
            <DialogTitle>Record Payment — {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pamount">Amount (₹) *</Label>
              <Input
                id="pamount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, amount: e.target.value }))
                }
                data-ocid="credit.payment.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnote">Note (optional)</Label>
              <Input
                id="pnote"
                placeholder="e.g. Cash payment"
                value={payForm.note}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayOpen(false)}
              data-ocid="credit.payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={recordPayment.isPending}
              onClick={handlePayment}
              className="text-white"
              style={{ background: "#22C55E" }}
              data-ocid="credit.payment.confirm_button"
            >
              {recordPayment.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
