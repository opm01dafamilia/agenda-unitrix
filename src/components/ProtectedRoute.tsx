import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log("[ProtectedRoute]", ...args);
};

const LoadingFallback = () => {
  const { authError, retryAuth } = useAuth();

  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Não foi possível carregar</h2>
          <p className="text-muted-foreground text-sm mb-4">{authError}</p>
          <Button variant="outline" onClick={retryAuth} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, business, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingFallback />;

  if (!user) {
    log("no user, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (business && location.pathname === "/onboarding") {
    log("has business, redirecting from onboarding to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  if (!business && location.pathname !== "/onboarding") {
    log("no business, redirecting to /onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingFallback />;

  if (!user || !isAdmin) {
    log("not admin, redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
