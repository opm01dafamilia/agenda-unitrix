import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string;
  profession_subtype: string | null;
  whatsapp: string;
  email: string;
  city: string | null;
  avatar_url: string | null;
  theme_primary_color: string;
  theme_secondary_color: string;
  operating_hours: any;
  auto_accept_appointments: boolean;
  message_template_client: string;
  message_template_professional: string;
  address_street: string | null;
  address_number: string | null;
  address_zip: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  cpf: string;
  showcase_color: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: Business | null;
  isAdmin: boolean;
  isLoading: boolean;
  isBlocked: boolean;
  accessStatus: string | null;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const ADMIN_EMAILS = ["casuplemento@gmail.com", "lp070087@gmail.com"];
const AUTH_TIMEOUT_MS = 6000;

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log("[Auth]", new Date().toISOString().slice(11, 23), ...args);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // Track which session we've already loaded to avoid duplicate work
  const loadedSessionIdRef = useRef<string | null>(null);

  const checkAdmin = useCallback(async (userId: string, email: string): Promise<boolean> => {
    if (ADMIN_EMAILS.includes(email)) return true;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "adm")
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  }, []);

  const fetchBusiness = useCallback(async (userId: string): Promise<Business | null> => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) { log("fetchBusiness error", error.message); return null; }
      return data as Business | null;
    } catch (err: any) {
      log("fetchBusiness catch", err?.message);
      return null;
    }
  }, []);

  const fetchAccessStatus = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from("access_control")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as any)?.status || null;
    } catch {
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      log("no session, clearing");
      if (mountedRef.current) {
        setSession(null); setUser(null); setBusiness(null);
        setIsAdmin(false); setIsBlocked(false); setAccessStatus(null);
        setIsLoading(false); setAuthError(null);
      }
      return;
    }

    // Skip if we already loaded this exact session
    const sessionId = currentSession.access_token?.slice(-16) || currentSession.user.id;
    if (loadedSessionIdRef.current === sessionId) {
      log("session already loaded, skipping");
      if (mountedRef.current) setIsLoading(false);
      return;
    }

    log("loadUserData start", currentSession.user.email);

    // Immediately set user/session so ProtectedRoute sees authenticated user
    if (mountedRef.current) {
      setSession(currentSession);
      setUser(currentSession.user);
      setAuthError(null);
    }

    try {
      // All three queries in parallel
      const [adminResult, businessResult, accessResult] = await Promise.all([
        checkAdmin(currentSession.user.id, currentSession.user.email || ""),
        fetchBusiness(currentSession.user.id),
        fetchAccessStatus(currentSession.user.id),
      ]);

      log("loadUserData done", { isAdmin: adminResult, hasBusiness: !!businessResult, access: accessResult });

      if (mountedRef.current) {
        loadedSessionIdRef.current = sessionId;
        setIsAdmin(adminResult);
        setBusiness(businessResult);
        setAccessStatus(accessResult);
        const blocked = businessResult ? businessResult.is_active === false : false;
        setIsBlocked(blocked);
      }
    } catch (err: any) {
      log("loadUserData error", err?.message);
      if (mountedRef.current) {
        // Still let user in — show error but don't block
        setAuthError("Falha ao carregar dados da conta.");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [checkAdmin, fetchBusiness, fetchAccessStatus]);

  const refreshBusiness = useCallback(async () => {
    if (!user) return;
    log("refreshBusiness");
    for (let attempt = 1; attempt <= 3; attempt++) {
      const biz = await fetchBusiness(user.id);
      if (biz) {
        log("refreshBusiness found on attempt", attempt);
        if (mountedRef.current) {
          setBusiness(biz);
          setIsBlocked(biz.is_active === false);
        }
        return;
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 500));
    }
    log("refreshBusiness: not found after retries");
  }, [user, fetchBusiness]);

  useEffect(() => {
    mountedRef.current = true;
    loadedSessionIdRef.current = null;
    log("init");

    let timeoutId: ReturnType<typeof setTimeout>;

    // Safety timeout
    timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        log("TIMEOUT — forcing isLoading=false");
        setIsLoading(false);
        if (!user) setAuthError("Tempo limite excedido. Tente novamente.");
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        log("onAuthStateChange", event);

        if (event === "SIGNED_OUT") {
          loadedSessionIdRef.current = null;
          if (mountedRef.current) {
            setSession(null); setUser(null); setBusiness(null);
            setIsAdmin(false); setIsBlocked(false); setAccessStatus(null);
            setIsLoading(false); setAuthError(null);
          }
          return;
        }

        if (newSession) {
          await loadUserData(newSession);
          clearTimeout(timeoutId);
        }
      }
    );

    // 2. getSession fallback
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      log("getSession", s ? "has session" : "no session", error?.message || "");

      if (error) {
        if (mountedRef.current) {
          setIsLoading(false);
          setAuthError("Erro ao restaurar sessão. Tente novamente.");
        }
        clearTimeout(timeoutId);
        return;
      }

      if (!s) {
        if (mountedRef.current) setIsLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      loadUserData(s).then(() => clearTimeout(timeoutId));
    }).catch((err) => {
      log("getSession catch", err);
      if (mountedRef.current) {
        setIsLoading(false);
        setAuthError("Erro de conexão. Verifique sua internet.");
      }
      clearTimeout(timeoutId);
    });

    return () => {
      log("cleanup");
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [loadUserData]);

  const retryAuth = useCallback(() => {
    log("retryAuth");
    mountedRef.current = true;
    loadedSessionIdRef.current = null;
    setIsLoading(true);
    setAuthError(null);

    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        if (mountedRef.current) { setAuthError("Erro ao restaurar sessão."); setIsLoading(false); }
        return;
      }
      loadUserData(s);
    }).catch(() => {
      if (mountedRef.current) { setAuthError("Erro de conexão."); setIsLoading(false); }
    });
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    log("signOut");
    loadedSessionIdRef.current = null;
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null); setSession(null); setBusiness(null);
      setIsAdmin(false); setIsBlocked(false); setAccessStatus(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isBlocked, accessStatus, isLoading, authError, signOut, refreshBusiness, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
