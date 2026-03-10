import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log("[Login]", new Date().toISOString().slice(11, 23), ...args);
};

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);
    log("login attempt", email);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        log("login error", error.message, error.status);
        if (error.message === "Invalid login credentials") {
          toast.error("Email ou senha incorretos.");
        } else if (error.message === "Email not confirmed") {
          toast.error("Email não confirmado. Verifique sua caixa de entrada.");
        } else if (error.message?.includes("rate limit")) {
          toast.error("Muitas tentativas. Aguarde um momento.");
        } else if (error.status === 0 || error.message?.includes("fetch") || error.message?.includes("network")) {
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
        } else {
          toast.error(error.message || "Erro ao fazer login.");
        }
        return;
      }

      log("login success, navigating to dashboard");
      // Navigate immediately — AuthContext handles session, business loading, and is_active check
      // ProtectedRoute will show loading while AuthContext finishes, then redirect appropriately
      navigate("/dashboard");
    } catch (err: any) {
      log("login catch", err);
      if (err?.message?.includes("fetch") || err?.message?.includes("Failed")) {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        toast.error("Não foi possível concluir seu login agora. Tente novamente.");
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight">IA agenda</Link>
          <p className="text-muted-foreground mt-2">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">Esqueceu a senha?</Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta? <Link to="/signup" className="text-foreground hover:underline font-medium">Criar conta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
