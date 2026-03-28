import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Tag,
  TrendingUp,
  Shield,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuários", href: "/admin/users", icon: Users },
  { label: "Assinaturas", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Planos", href: "/admin/plans", icon: Tag },
  { label: "Vendas & MRR", href: "/admin/revenue", icon: TrendingUp },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card fixed top-16 bottom-0 left-0 hidden lg:flex flex-col p-4 gap-1">
        <div className="flex items-center gap-2 mb-6 px-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Painel Admin</span>
        </div>

        {adminNav.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              location.pathname === item.href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <div className="mt-auto">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-card border-b border-border overflow-x-auto">
        <div className="flex p-2 gap-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors",
                location.pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 mt-12 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
