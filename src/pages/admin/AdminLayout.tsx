import { Link, Outlet, useLocation } from "react-router-dom";
import { Shield, Users, Building2, LayoutDashboard, Activity, Plug } from "lucide-react";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Visão geral" },
  { path: "/admin/businesses", icon: Building2, label: "Negócios" },
  { path: "/admin/users", icon: Users, label: "Usuários" },
  { path: "/admin/access", icon: Shield, label: "Acessos" },
  { path: "/admin/logs", icon: Activity, label: "Logs" },
  { path: "/admin/integrations", icon: Plug, label: "Integrações" },
];

const AdminLayout = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <Link to="/admin" className="text-lg font-semibold tracking-tight">
              IA agenda <span className="text-xs text-muted-foreground ml-1">Admin</span>
            </Link>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Painel</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive(item.path) ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="container mx-auto px-4 py-6"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
