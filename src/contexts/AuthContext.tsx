import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string;
  premium_status: string;
  premium_until: string | null;
  grace_period_until: string | null;
  auto_accept_appointments: boolean;
  whatsapp: string;
  email: string;
  city: string | null;
  avatar_url: string | null;
  theme_primary_color: string;
  theme_secondary_color: string;
  operating_hours: any;
  message_template_client: string;
  message_template_professional: string;
  cpf: string;
  address_street: string | null;
  address_number: string | null;
  address_zip: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  premium_plan: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: Business | null;
  isAdmin: boolean;
  isPremium: boolean;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdmin = async (userId: string, email: string) => {
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
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    setBusiness(data as Business | null);
  };

  const refreshBusiness = async () => {
    if (user) await fetchBusiness(user.id);
  };

  const isPremium = (() => {
    if (!user) return false;
    if (ADMIN_EMAILS.includes(user.email || "")) return true;
    if (!business) return false;
    const s = business.premium_status;
    if (s === "active" || s === "trial") return true;
    if (s === "past_due" && business.grace_period_until) {
      return new Date(business.grace_period_until) > new Date();
    }
    return false;
  })();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdmin(session.user.id, session.user.email || "");
          await fetchBusiness(session.user.id);
        } else {
          setBusiness(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id, session.user.email || "");
        fetchBusiness(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusiness(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, business, isAdmin, isPremium, isLoading, signOut, refreshBusiness }}
    >
      {children}
    </AuthContext.Provider>
  );
};
