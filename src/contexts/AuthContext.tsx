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
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
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
  if (import.meta.env.DEV) console.log("[Auth]", ...args);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const checkAdmin = async (userId: string, email: string) => {
    log("checkAdmin", email);
    if (ADMIN_EMAILS.includes(email)) {
      setIsAdmin(true);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "adm")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchBusiness = async (userId: string) => {
    log("fetchBusiness", userId);
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    log("business result", data ? "found" : "none");
    setBusiness(data as Business | null);
  };

  const refreshBusiness = async () => {
    if (user) await fetchBusiness(user.id);
  };

  const handleSession = async (newSession: Session | null) => {
    log("handleSession", newSession ? "authenticated" : "no session");
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
    setIsLoading(false);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      log("timeout reached, forcing isLoading=false");
      setIsLoading(false);
    }, AUTH_TIMEOUT_MS);

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        log("onAuthStateChange", _event);
        await handleSession(newSession);
        clearTimeout(timeout);
      }
    );

    // Then get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      log("getSession result", currentSession ? "has session" : "no session");
      handleSession(currentSession).then(() => clearTimeout(timeout));
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusiness(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, business, isAdmin, isLoading, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
};
