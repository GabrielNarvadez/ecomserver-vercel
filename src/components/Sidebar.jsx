import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Users, Package, BarChart3, Settings, X, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ onClose }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">OrderFlow</span>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(to)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}