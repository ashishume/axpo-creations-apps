import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessMode, BusinessMode } from "@/contexts/BusinessModeContext";
import { cn } from "@/lib/utils";
import {
  Box,
  LayoutDashboard,
  Settings,
  Package,
  Users,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Gem,
  LogOut,
  Menu,
  Truck,
  ShoppingCart,
  Factory,
  Store,
  Boxes,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  mode?: "factory" | "shop" | "shared";
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, mode: "shared" },
  { href: "/setup", label: "Setup", icon: Settings, mode: "shared" },
  { href: "/products", label: "Products", icon: Package, mode: "shared" },
  // Factory-specific
  { href: "/suppliers", label: "Suppliers", icon: Truck, mode: "factory" },
  { href: "/purchase-invoices", label: "Purchases", icon: ShoppingCart, mode: "factory" },
  { href: "/expenses", label: "Expenses", icon: Receipt, mode: "factory" },
  { href: "/stock", label: "Stock", icon: Boxes, mode: "factory" },
  // Shop-specific
  { href: "/customers", label: "Customers", icon: Users, mode: "shop" },
  { href: "/invoices", label: "Sales Invoices", icon: FileText, mode: "shop" },
  { href: "/payments", label: "Payments", icon: CreditCard, mode: "shop" },
  // Shared
  { href: "/reports", label: "Reports", icon: BarChart3, mode: "shared" },
  { href: "/subscription", label: "Subscription", icon: Gem, mode: "shared" },
];

function getFilteredNav(mode: BusinessMode): NavItem[] {
  return navItems.filter((item) => item.mode === "shared" || item.mode === mode);
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuth();
  const { mode, setMode } = useBusinessMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = getFilteredNav(mode);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    setSidebarOpen(isDesktop);
  }, []);

  const isPublicPage = ["/login", "/signup"].some((p) => location.pathname.startsWith(p));
  if (isPublicPage || !isAuthenticated) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "no-print fixed inset-0 z-40 bg-slate-900/50 transition-opacity md:hidden",
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-50 transition-transform duration-200 ease-out md:static md:translate-x-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-slate-200 p-4">
          <NavLink to="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Box className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold text-indigo-700">Axpo Billing</span>
          </NavLink>
          <p className="text-xs text-slate-500 mt-0.5">GST-compliant billing</p>
        </div>

        {/* Mode Switcher */}
        <div className="p-3 border-b border-slate-200">
          <div className="flex rounded-lg bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => setMode("factory")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "factory"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Factory className="h-4 w-4" />
              Factory
            </button>
            <button
              type="button"
              onClick={() => setMode("shop")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "shop"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Store className="h-4 w-4" />
              Shop
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {filteredNav.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors min-h-[44px]",
                  isActive ? "bg-indigo-100 text-indigo-800" : "text-slate-700 hover:bg-slate-100"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role || "user"}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="shrink-0 rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors touch-manipulation"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:px-6">
          <button
            type="button"
            className="md:hidden shrink-0 rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:bg-slate-100 touch-manipulation"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-slate-900 truncate">Axpo Billing</span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
