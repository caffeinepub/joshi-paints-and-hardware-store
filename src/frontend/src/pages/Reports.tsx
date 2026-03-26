import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, IndianRupee, ShoppingBag, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBills } from "../hooks/useQueries";

type Period = "today" | "week" | "month" | "custom";

function getRange(
  period: Period,
  customStart: string,
  customEnd: string,
): { start: Date; end: Date } {
  const now = new Date();
  if (period === "today") {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (period === "week") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    s.setHours(0, 0, 0, 0);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (period === "month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  return {
    start: customStart ? new Date(customStart) : new Date(0),
    end: customEnd
      ? (() => {
          const d = new Date(customEnd);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : new Date(),
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function Reports() {
  const { data: bills, isLoading } = useBills();
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(
    () => getRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const filtered = useMemo(() => {
    if (!bills) return [];
    return bills.filter((b) => {
      const d = new Date(Number(b.date / 1_000_000n));
      return d >= range.start && d <= range.end;
    });
  }, [bills, range]);

  const stats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let itemsSold = 0;
    for (const bill of filtered) {
      revenue += bill.totalAmount;
      for (const item of bill.items) {
        profit += (item.sellingPrice - item.buyingPrice) * Number(item.qty);
        itemsSold += Number(item.qty);
      }
    }
    return { revenue, profit, itemsSold, billCount: filtered.length };
  }, [filtered]);

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bill of filtered) {
      const d = new Date(Number(bill.date / 1_000_000n));
      const key = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      map[key] = (map[key] ?? 0) + bill.totalAmount;
    }
    return Object.entries(map)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const kpis = [
    {
      label: "Total Revenue",
      value: `₹${fmt(stats.revenue)}`,
      icon: IndianRupee,
      color: "#2A9DB0",
      bg: "#E0F2F8",
    },
    {
      label: "Total Profit",
      value: `₹${fmt(stats.profit)}`,
      icon: TrendingUp,
      color: "#22C55E",
      bg: "#DCFCE7",
    },
    {
      label: "Total Bills",
      value: String(stats.billCount),
      icon: ShoppingBag,
      color: "#3B82F6",
      bg: "#DBEAFE",
    },
    {
      label: "Items Sold",
      value: String(stats.itemsSold),
      icon: BarChart2,
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {(["today", "week", "month", "custom"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className={period === p ? "text-white" : ""}
              style={period === p ? { background: "#2A9DB0" } : {}}
              onClick={() => setPeriod(p)}
              data-ocid={`reports.${p}.tab`}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                  ? "This Week"
                  : p === "month"
                    ? "This Month"
                    : "Custom"}
            </Button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">From:</Label>
                <Input
                  type="date"
                  className="h-8 text-sm w-36"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  data-ocid="reports.input"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">To:</Label>
                <Input
                  type="date"
                  className="h-8 text-sm w-36"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="reports.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="border border-gray-200 shadow-card"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {kpi.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {kpi.value}
                      </p>
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
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Revenue by Day
        </h2>
        {chartData.length === 0 ? (
          <div
            className="text-center py-16 text-gray-400"
            data-ocid="reports.empty_state"
          >
            <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No sales data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${fmt(value)}`, "Revenue"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="revenue" fill="#2A9DB0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
