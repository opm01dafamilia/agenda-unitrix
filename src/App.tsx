import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/Dashboard";
import AgendaPage from "./pages/dashboard/AgendaPage";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ProfessionalsPage from "./pages/dashboard/ProfessionalsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import PlanPage from "./pages/dashboard/PlanPage";
import ThemesPage from "./pages/dashboard/ThemesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="professionals" element={<ProfessionalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="themes" element={<ThemesPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
