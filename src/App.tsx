import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/Dashboard";
import AgendaPage from "./pages/dashboard/AgendaPage";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ProfessionalsPage from "./pages/dashboard/ProfessionalsPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import PlanPage from "./pages/dashboard/PlanPage";
import ThemesPage from "./pages/dashboard/ThemesPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrials from "./pages/admin/AdminTrials";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/a/:slug" element={<PublicBooking />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="professionals" element={<ProfessionalsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="themes" element={<ThemesPage />} />
            </Route>
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="trials" element={<AdminTrials />} />
              <Route path="webhooks" element={<AdminWebhooks />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
