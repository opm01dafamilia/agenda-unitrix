import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/Dashboard";
import AgendaPage from "./pages/dashboard/AgendaPage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ProfessionalsPage from "./pages/dashboard/ProfessionalsPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import PublicLinkPage from "./pages/dashboard/PublicLinkPage";
import GalleryPage from "./pages/dashboard/GalleryPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import PlansPage from "./pages/dashboard/PlansPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminPlans from "./pages/admin/AdminPlans";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/a/:slug" element={<PublicBooking />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="professionals" element={<ProfessionalsPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="public-link" element={<PublicLinkPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="businesses" element={<AdminBusinesses />} />
                <Route path="access" element={<AdminAccess />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="integrations" element={<AdminIntegrations />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
