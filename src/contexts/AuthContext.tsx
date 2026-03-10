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
const AUTH_TIMEOUT_MS = 12000;

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
  const loadingRef = useRef(false); // prevent concurrent loadUserData

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
      log("business result", data ? `found (is_active=${data.is_active})` : "none");
      return data as Business | null;
    } catch (err) {
      log("fetchBusiness catch", err);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      log("loadUserData skipped — already loading");
      return;
    }

    log("loadUserData", currentSession ? "has session" : "no session");

    if (!currentSession?.user) {
      log("no user in session, clearing state");
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
        // Check if business is blocked
        const blocked = businessResult ? businessResult.is_active === false : false;
        setIsBlocked(blocked);
        log("user data loaded", { isAdmin: adminResult, hasBusiness: !!businessResult, isBlocked: blocked });
      }
    } catch (err) {
      log("loadUserData error", err);
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
    log("refreshBusiness start");

    // Try up to 2 times with a small delay (handles DB commit timing)
    for (let attempt = 1; attempt <= 2; attempt++) {
      const biz = await fetchBusiness(user.id);
      if (biz) {
        log("refreshBusiness success on attempt", attempt);
        if (mountedRef.current) {
          setBusiness(biz);
          setIsBlocked(biz.is_active === false);
        }
        return;
      }
      if (attempt < 2) {
        log("refreshBusiness attempt", attempt, "returned null, retrying...");
        await new Promise(r => setTimeout(r, 500));
      }
    }
    log("refreshBusiness: business not found after retries");
  }, [user, fetchBusiness]);

  useEffect(() => {
    mountedRef.current = true;
    loadingRef.current = false;
    log("init");

    let timeoutId: ReturnType<typeof setTimeout>;
    let initialLoadDone = false;

    // Safety timeout
    timeoutId = setTimeout(() => {
      if (!initialLoadDone && mountedRef.current) {
        log("timeout reached — forcing isLoading=false");
        loadingRef.current = false;
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Set up listener FIRST
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
          initialLoadDone = true;
          clearTimeout(timeoutId);
          return;
        }

        // For INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED
        if (newSession) {
          await loadUserData(newSession);
          initialLoadDone = true;
          clearTimeout(timeoutId);
        }
      }
    );

    // 2. Check existing session (fallback for when onAuthStateChange doesn't fire)
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      log("getSession result", currentSession ? "has session" : "no session", error?.message || "");

      if (error) {
        log("getSession error", error);
        if (mountedRef.current) {
          setIsLoading(false);
          setAuthError("Erro ao restaurar sessão. Tente novamente.");
        }
        initialLoadDone = true;
        clearTimeout(timeoutId);
        return;
      }

      // If no session, stop loading
      if (!currentSession) {
        log("no existing session");
        if (mountedRef.current) {
          setIsLoading(false);
        }
        initialLoadDone = true;
        clearTimeout(timeoutId);
        return;
      }

      // If we have a session but onAuthStateChange hasn't loaded yet, load now
      // The loadingRef guard prevents double-loading if onAuthStateChange already started
      loadUserData(currentSession).then(() => {
        initialLoadDone = true;
        clearTimeout(timeoutId);
      });
    }).catch((err) => {
      log("getSession catch", err);
      if (mountedRef.current) {
        setIsLoading(false);
        setAuthError("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      initialLoadDone = true;
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
    loadingRef.current = false;
    setIsLoading(true);
    setAuthError(null);

    const doRetry = async () => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (error) {
          log("retryAuth error", error);
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
      setIsBlocked(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isBlocked, isLoading, authError, signOut, refreshBusiness, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
