import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Produto", href: "/" },
  { label: "Dashboard", href: "/dashboard", auth: true },
  { label: "Planos", href: "/planos" },
  { label: "APIs", href: "/apis" },
  { label: "Integrações", href: "/integracoes" },
  { label: "Billing", href: "/billing" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-24 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CreativeFlow AI" className="h-20 w-auto" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.filter(item => !item.auth || user).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.href
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/briefing" className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
                Novo briefing
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              {isAdmin && (
                <Link to="/admin" className="p-2 rounded-md text-primary hover:text-primary/80 transition-colors" title="Admin">
                  <Shield className="h-4 w-4" />
                </Link>
              )}
              <button onClick={signOut} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link to="/auth" className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
                Testar agora
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/briefing" onClick={() => setOpen(false)} className="block mt-2 text-center py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground">
                Novo briefing
              </Link>
              <button onClick={() => { signOut(); setOpen(false); }} className="block w-full mt-2 text-center py-2 text-sm text-muted-foreground">
                Sair ({user.email})
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="block mt-2 text-center py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground">
              Entrar / Criar conta
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
