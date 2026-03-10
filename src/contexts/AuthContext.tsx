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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: Business | null;
  isAdmin: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const initCountRef = useRef(0);

  const checkAdmin = useCallback(async (userId: string, email: string): Promise<boolean> => {
    log("checkAdmin", email);
    if (ADMIN_EMAILS.includes(email)) return true;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "adm")
        .maybeSingle();
      return !!data;
    } catch (err) {
      log("checkAdmin error", err);
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
        log("fetchBusiness error", error);
        return null;
      }
      log("business result", data ? "found" : "none");
      return data as Business | null;
    } catch (err) {
      log("fetchBusiness catch", err);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    log("loadUserData", currentSession ? "has session" : "no session");

    if (!currentSession?.user) {
      log("no user in session, clearing state");
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setBusiness(null);
        setIsAdmin(false);
        setIsLoading(false);
        setAuthError(null);
      }
      return;
    }

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
        log("user data loaded", { isAdmin: adminResult, hasBusiness: !!businessResult });
      }
    } catch (err) {
      log("loadUserData error", err);
      if (mountedRef.current) {
        setAuthError("Falha ao carregar dados da conta. Tente novamente.");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [checkAdmin, fetchBusiness]);

  const refreshBusiness = useCallback(async () => {
    if (user) {
      const biz = await fetchBusiness(user.id);
      if (mountedRef.current) setBusiness(biz);
    }
  }, [user, fetchBusiness]);

  useEffect(() => {
    mountedRef.current = true;
    const initId = ++initCountRef.current;
    log("init #" + initId);

    let timeoutId: ReturnType<typeof setTimeout>;

    // Safety timeout: if auth takes too long, stop loading
    timeoutId = setTimeout(() => {
      if (initId !== initCountRef.current) return; // stale
      log("timeout reached #" + initId);
      if (mountedRef.current) {
        setIsLoading(false);
        // Don't set error if we simply have no session — just let ProtectedRoute redirect
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Set up listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (initId !== initCountRef.current) return; // stale
        log("onAuthStateChange", event, newSession ? "has session" : "no session");

        // For SIGNED_OUT, clear immediately
        if (event === "SIGNED_OUT") {
          if (mountedRef.current) {
            setSession(null);
            setUser(null);
            setBusiness(null);
            setIsAdmin(false);
            setIsLoading(false);
            setAuthError(null);
          }
          clearTimeout(timeoutId);
          return;
        }

        // For other events (SIGNED_IN, TOKEN_REFRESHED, etc.), load user data
        if (newSession) {
          await loadUserData(newSession);
          clearTimeout(timeoutId);
        }
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (initId !== initCountRef.current) return; // stale
      log("getSession result", currentSession ? "has session" : "no session", error?.message || "");

      if (error) {
        log("getSession error", error);
        if (mountedRef.current) {
          setIsLoading(false);
          setAuthError("Erro ao restaurar sessão. Tente novamente.");
        }
        clearTimeout(timeoutId);
        return;
      }

      // If no session, just stop loading (onAuthStateChange won't fire for no-session)
      if (!currentSession) {
        log("no existing session");
        if (mountedRef.current) {
          setIsLoading(false);
        }
        clearTimeout(timeoutId);
        return;
      }

      // If we have a session, load data
      // Note: onAuthStateChange may also fire INITIAL_SESSION — the last call wins
      loadUserData(currentSession).then(() => {
        clearTimeout(timeoutId);
      });
    }).catch((err) => {
      if (initId !== initCountRef.current) return;
      log("getSession catch", err);
      if (mountedRef.current) {
        setIsLoading(false);
        setAuthError("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      clearTimeout(timeoutId);
    });

    return () => {
      log("cleanup #" + initId);
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [loadUserData]);

  const retryAuth = useCallback(() => {
    log("retryAuth");
    mountedRef.current = true;
    setIsLoading(true);
    setAuthError(null);
    // Force re-init by incrementing counter (will trigger useEffect re-run via loadUserData identity)
    // Instead, manually re-fetch
    const doRetry = async () => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (error) {
          log("retryAuth getSession error", error);
          if (mountedRef.current) {
            setAuthError("Erro ao restaurar sessão. Tente novamente.");
            setIsLoading(false);
          }
          return;
        }
        await loadUserData(s);
      } catch (err) {
        log("retryAuth catch", err);
        if (mountedRef.current) {
          setAuthError("Erro de conexão. Verifique sua internet.");
          setIsLoading(false);
        }
      }
    };
    doRetry();
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    log("signOut");
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null);
      setSession(null);
      setBusiness(null);
      setIsAdmin(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isLoading, authError, signOut, refreshBusiness, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
