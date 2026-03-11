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
const AUTH_TIMEOUT_MS = 10000;

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log("[Auth]", new Date().toISOString().slice(11, 23), ...args);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

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
    log("fetchBusiness", userId);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) {
        log("fetchBusiness error", error.message);
        return null;
      }
      return data as Business | null;
    } catch (err: any) {
      log("fetchBusiness catch", err?.message);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    if (loadingRef.current) {
      log("loadUserData skipped — already loading");
      return;
    }

    if (!currentSession?.user) {
      log("no session, clearing");
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setBusiness(null);
        setIsAdmin(false);
        setIsBlocked(false);
        setIsLoading(false);
        setAuthError(null);
      }
      return;
    }

    loadingRef.current = true;
    log("loadUserData start", currentSession.user.email);

    if (mountedRef.current) {
      setSession(currentSession);
      setUser(currentSession.user);
      setAuthError(null);
    }

    try {
      const [adminResult, businessResult] = await Promise.all([
        checkAdmin(currentSession.user.id, currentSession.user.email || ""),
        fetchBusiness(currentSession.user.id),
      ]);

      if (mountedRef.current) {
        setIsAdmin(adminResult);
        setBusiness(businessResult);
        const blocked = businessResult ? businessResult.is_active === false : false;
        setIsBlocked(blocked);
        log("loadUserData done", { isAdmin: adminResult, hasBusiness: !!businessResult, isBlocked: blocked });
      }
    } catch (err: any) {
      log("loadUserData error", err?.message);
      if (mountedRef.current) {
        setAuthError("Falha ao carregar dados da conta. Tente novamente.");
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [checkAdmin, fetchBusiness]);

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
      if (attempt < 3) {
        log("refreshBusiness retry", attempt);
        await new Promise(r => setTimeout(r, 600));
      }
    }
    log("refreshBusiness: not found after retries");
  }, [user, fetchBusiness]);

  useEffect(() => {
    mountedRef.current = true;
    loadingRef.current = false;
    log("init");

    let timeoutId: ReturnType<typeof setTimeout>;
    let resolved = false;

    const markResolved = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
      }
    };

    // Safety timeout — force loading=false
    timeoutId = setTimeout(() => {
      if (!resolved && mountedRef.current) {
        log("TIMEOUT — forcing isLoading=false");
        loadingRef.current = false;
        setIsLoading(false);
        setAuthError("Tempo limite excedido. Tente novamente.");
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        log("onAuthStateChange", event);

        if (event === "SIGNED_OUT") {
          if (mountedRef.current) {
            setSession(null);
            setUser(null);
            setBusiness(null);
            setIsAdmin(false);
            setIsBlocked(false);
            setIsLoading(false);
            setAuthError(null);
          }
          markResolved();
          return;
        }

        if (newSession) {
          await loadUserData(newSession);
          markResolved();
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
        markResolved();
        return;
      }

      if (!s) {
        if (mountedRef.current) setIsLoading(false);
        markResolved();
        return;
      }

      // Load if not already loaded by onAuthStateChange
      loadUserData(s).then(markResolved);
    }).catch((err) => {
      log("getSession catch", err);
      if (mountedRef.current) {
        setIsLoading(false);
        setAuthError("Erro de conexão. Verifique sua internet.");
      }
      markResolved();
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
    loadingRef.current = false;
    setIsLoading(true);
    setAuthError(null);

    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        if (mountedRef.current) {
          setAuthError("Erro ao restaurar sessão.");
          setIsLoading(false);
        }
        return;
      }
      loadUserData(s);
    }).catch(() => {
      if (mountedRef.current) {
        setAuthError("Erro de conexão.");
        setIsLoading(false);
      }
    });
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    log("signOut");
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null);
      setSession(null);
      setBusiness(null);
      setIsAdmin(false);
      setIsBlocked(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isBlocked, isLoading, authError, signOut, refreshBusiness, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
