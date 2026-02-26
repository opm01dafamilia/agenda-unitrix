import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, CalendarCheck, Users, UserPlus, Settings,
  LogOut, Menu, Shield, Scissors, Link2, Image, Sun, Moon
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const DashboardLayout = () => {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { signOut, business, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // If no business created yet, redirect to onboarding
  if (!business) {
    return <Navigate to="/onboarding" replace />;
  }

  // If business is blocked by admin
  if (business && (business as any).is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-bold mb-2">Conta bloqueada</h1>
          <p className="text-muted-foreground mb-4">Sua conta foi temporariamente suspensa. Entre em contato com o suporte.</p>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
    { path: "/dashboard/appointments", icon: CalendarCheck, label: "Agendamentos" },
    { path: "/dashboard/clients", icon: Users, label: "Clientes" },
  ];

  // Services available for all industries (tattoo uses variable duration)
  navItems.push({ path: "/dashboard/services", icon: Scissors, label: "Serviços" });

  navItems.push(
    { path: "/dashboard/professionals", icon: UserPlus, label: "Profissionais" },
    { path: "/dashboard/public-link", icon: Link2, label: "Link Público" },
    { path: "/dashboard/gallery", icon: Image, label: "Galeria" },
    { path: "/dashboard/settings", icon: Settings, label: "Configurações" },
  );

  if (isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  const mobileNavItems = navItems.slice(0, 5);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} onClick={() => setSheetOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.path) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
          <item.icon className="w-4 h-4" />{item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 border-r border-border flex-col bg-sidebar">
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="text-lg font-semibold tracking-tight">
            IA agenda
          </Link>
          {business && <p className="text-xs text-muted-foreground mt-0.5 truncate">{business.name}</p>}
        </div>
        <div className="flex-1 overflow-y-auto"><NavLinks /></div>
        <div className="p-3 border-t border-border space-y-1">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-background/95 backdrop-blur-xl z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight">IA agenda</Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <div className="p-4 border-b border-border">
                <span className="text-lg font-semibold tracking-tight">IA agenda</span>
              </div>
              <NavLinks />
              <div className="p-3 border-t border-border">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-xl z-50">
        <div className="flex justify-around py-2">
          {mobileNavItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-5xl"><Outlet /></div>
      </main>
    </div>
  );
};

export default DashboardLayout;
