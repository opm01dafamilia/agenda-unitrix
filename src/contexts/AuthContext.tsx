import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
const AUTH_TIMEOUT_MS = 8000;

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log("[Auth]", ...args);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const handlingRef = useRef(false);

  const checkAdmin = async (userId: string, email: string) => {
    log("checkAdmin", email);
    if (ADMIN_EMAILS.includes(email)) {
      setIsAdmin(true);
      return;
    }
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "adm")
        .maybeSingle();
      setIsAdmin(!!data);
    } catch (err) {
      log("checkAdmin error", err);
      setIsAdmin(false);
    }
  };

  const fetchBusiness = async (userId: string) => {
    log("fetchBusiness", userId);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) {
        log("fetchBusiness error", error);
        setBusiness(null);
        return;
      }
      log("business result", data ? "found" : "none");
      setBusiness(data as Business | null);
    } catch (err) {
      log("fetchBusiness catch", err);
      setBusiness(null);
    }
  };

  const refreshBusiness = async () => {
    if (user) await fetchBusiness(user.id);
  };

  const handleSession = async (newSession: Session | null) => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      log("handleSession", newSession ? "authenticated" : "no session");
      setAuthError(null);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await Promise.all([
          checkAdmin(newSession.user.id, newSession.user.email || ""),
          fetchBusiness(newSession.user.id),
        ]);
      } else {
        setBusiness(null);
        setIsAdmin(false);
      }
    } catch (err) {
      log("handleSession error", err);
      setAuthError("Erro ao carregar dados do usuário.");
    } finally {
      setIsLoading(false);
      handlingRef.current = false;
    }
  };

  const initAuth = () => {
    setIsLoading(true);
    setAuthError(null);
    initializedRef.current = true;

    const timeout = setTimeout(() => {
      log("timeout reached, forcing isLoading=false");
      setIsLoading(false);
      if (!session && !user) {
        setAuthError(null); // No session = just show login
      }
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        log("onAuthStateChange", _event);
        await handleSession(newSession);
        clearTimeout(timeout);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      log("getSession result", currentSession ? "has session" : "no session", error ? error.message : "");
      if (error) {
        log("getSession error", error);
        setIsLoading(false);
        clearTimeout(timeout);
        return;
      }
      handleSession(currentSession).then(() => clearTimeout(timeout));
    }).catch((err) => {
      log("getSession catch", err);
      setIsLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  };

  useEffect(() => {
    if (initializedRef.current) return;
    return initAuth();
  }, []);

  const retryAuth = () => {
    initializedRef.current = false;
    handlingRef.current = false;
    initAuth();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusiness(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isLoading, authError, signOut, refreshBusiness, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
