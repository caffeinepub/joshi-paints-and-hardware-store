import { Toaster } from "@/components/ui/sonner";
import {
  AlertTriangle,
  BarChart2,
  LayoutDashboard,
  Package,
  PaintBucket,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "./backend";
import { useActor } from "./hooks/useActor";
import CustomerCredit from "./pages/CustomerCredit";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";

type Page =
  | "dashboard"
  | "inventory"
  | "sales"
  | "purchases"
  | "reports"
  | "credit";

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "sales", label: "Sales & Billing", icon: Receipt },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "credit", label: "Customer Credit", icon: Users },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [lowStockCount, setLowStockCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getLowStockProducts()
      .then((items) => setLowStockCount(items.length))
      .catch(() => {});
    actor
      .getAllProducts()
      .then(setProducts)
      .catch(() => {});
  }, [actor, isFetching]);

  const refreshLowStock = () => {
    if (!actor) return;
    actor
      .getLowStockProducts()
      .then((items) => setLowStockCount(items.length))
      .catch(() => {});
    actor
      .getAllProducts()
      .then(setProducts)
      .catch(() => {});
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pageTitle: Record<Page, string> = {
    dashboard: "Dashboard",
    inventory: "Inventory Management",
    sales: "Sales & Billing",
    purchases: "Purchase Management",
    reports: "Sales Reports",
    credit: "Customer Credit",
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            refreshLowStock={refreshLowStock}
          />
        );
      case "inventory":
        return <Inventory refreshLowStock={refreshLowStock} />;
      case "sales":
        return <Sales products={products} refreshProducts={refreshLowStock} />;
      case "purchases":
        return (
          <Purchases products={products} refreshProducts={refreshLowStock} />
        );
      case "reports":
        return <Reports />;
      case "credit":
        return <CustomerCredit />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-64 flex-shrink-0 h-full"
        style={{
          background: "linear-gradient(180deg, #0B1F3A 0%, #0A2A55 100%)",
        }}
      >
        {/* Brand */}
        <div className="flex items-start gap-3 px-5 py-6 border-b border-white/10">
          <div
            className="mt-0.5 p-2 rounded-lg"
            style={{ background: "rgba(31,126,152,0.3)" }}
          >
            <PaintBucket className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">
              Joshi Paints
            </p>
            <p className="text-white/60 text-xs mt-0.5">&amp; Hardware Store</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="nav.panel">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                style={isActive ? { background: "#1F7E98" } : {}}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {item.id === "inventory" && lowStockCount > 0 && (
                  <span className="ml-auto text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5 font-semibold">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">
            © {new Date().getFullYear()} Built with{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white/50"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900">
            {pageTitle[currentPage]}
          </h1>
          <span className="text-sm text-gray-500">{today}</span>
        </header>

        {/* Low stock banner */}
        {lowStockCount > 0 && (
          <div
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium"
            style={{ background: "#FEF3C7", color: "#92400E" }}
            data-ocid="inventory.low_stock.panel"
          >
            <AlertTriangle
              className="h-4 w-4 flex-shrink-0"
              style={{ color: "#D97706" }}
            />
            <span>
              ⚠️ {lowStockCount} product{lowStockCount > 1 ? "s are" : " is"} low
              on stock — check Inventory for details.
            </span>
          </div>
        )}

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "#F3F5F7" }}
        >
          {renderPage()}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
