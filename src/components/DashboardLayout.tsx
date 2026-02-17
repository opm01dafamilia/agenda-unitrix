import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, UserPlus, Settings,
  CreditCard, Palette, LogOut, Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
  { path: "/dashboard/clients", icon: Users, label: "Clientes" },
  { path: "/dashboard/professionals", icon: UserPlus, label: "Profissionais" },
  { path: "/dashboard/settings", icon: Settings, label: "Configurações" },
  { path: "/dashboard/plan", icon: CreditCard, label: "Plano" },
  { path: "/dashboard/themes", icon: Palette, label: "Temas" },
];

const mobileNavItems = navItems.slice(0, 4);

const DashboardLayout = () => {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setSheetOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive(item.path)
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border/50 flex-col bg-sidebar">
        <div className="p-4 border-b border-border/50">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-primary">IA</span> agenda
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="text-primary">IA</span> agenda
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b border-border/50">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-primary">IA</span> agenda
              </span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-xl z-50">
        <div className="flex justify-around py-2">
          {mobileNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
