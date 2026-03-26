import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  useBills,
  useDashboardSummary,
  useLowStockProducts,
} from "../hooks/useQueries";

type Page =
  | "dashboard"
  | "inventory"
  | "sales"
  | "purchases"
  | "reports"
  | "credit";

interface Props {
  onNavigate: (page: Page) => void;
  refreshLowStock: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN");
}

export default function Dashboard({ onNavigate }: Props) {
  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = BigInt(d.getTime()) * 1_000_000n;
    d.setHours(23, 59, 59, 999);
    const end = BigInt(d.getTime()) * 1_000_000n;
    return { start, end };
  }, []);

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(
    now.start,
    now.end,
  );
  const { data: bills, isLoading: billsLoading } = useBills();
  const { data: lowStock, isLoading: lowLoading } = useLowStockProducts();

  const recentBills = useMemo(() => {
    if (!bills) return [];
    return [...bills].sort((a, b) => Number(b.date - a.date)).slice(0, 5);
  }, [bills]);

  const kpis = [
    {
      title: "Today's Sales",
      value: `₹${fmt(summary?.todaysSales ?? 0)}`,
      icon: TrendingUp,
      color: "#2A9DB0",
      bg: "#E0F2F8",
      ocid: "dashboard.sales.card",
    },
    {
      title: "Inventory Value",
      value: `₹${fmt(summary?.inventoryValue ?? 0)}`,
      icon: Package,
      color: "#22C55E",
      bg: "#DCFCE7",
      ocid: "dashboard.inventory.card",
    },
    {
      title: "Outstanding Loans",
      value: `₹${fmt(summary?.outstandingLoans ?? 0)}`,
      icon: Users,
      color: "#3B82F6",
      bg: "#DBEAFE",
      ocid: "dashboard.loans.card",
    },
    {
      title: "Low Stock Items",
      value: String(summary?.lowStockCount ?? 0),
      icon: AlertTriangle,
      color: "#D97706",
      bg: "#FEF3C7",
      amber: true,
      ocid: "dashboard.lowstock.card",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              data-ocid={kpi.ocid}
              className="border border-gray-200 shadow-card"
              style={kpi.amber ? { background: "#FEF9EE" } : {}}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {kpi.title}
                    </p>
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {kpi.value}
                      </p>
                    )}
                  </div>
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ background: kpi.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card className="border border-gray-200 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Bills
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                style={{ color: "#2A9DB0" }}
                onClick={() => onNavigate("sales")}
                data-ocid="dashboard.sales.link"
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {billsLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recentBills.length === 0 ? (
              <div
                className="text-center py-8 text-gray-400"
                data-ocid="dashboard.bills.empty_state"
              >
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No bills yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                      Bill #
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                      Customer
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                      Date
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((bill, i) => (
                    <tr
                      key={String(bill.billNumber)}
                      className="border-b border-gray-50 hover:bg-gray-50"
                      data-ocid={`dashboard.bills.item.${i + 1}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                        #{String(bill.billNumber)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                        {bill.customerName}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {fmtDate(bill.date)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        ₹{fmt(bill.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="border border-gray-200 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Low Stock Alert
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                style={{ color: "#2A9DB0" }}
                onClick={() => onNavigate("inventory")}
                data-ocid="dashboard.inventory.link"
              >
                Manage <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lowLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !lowStock || lowStock.length === 0 ? (
              <div
                className="text-center py-8 text-gray-400"
                data-ocid="dashboard.lowstock.empty_state"
              >
                <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">All products are well stocked!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lowStock.map((p, i) => (
                  <div
                    key={String(p.id)}
                    className="flex items-center justify-between px-4 py-3"
                    data-ocid={`dashboard.lowstock.item.${i + 1}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold"
                        style={{
                          background: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                        }}
                      >
                        {String(p.stockQty)} / {String(p.minStockQty)} {p.unit}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
