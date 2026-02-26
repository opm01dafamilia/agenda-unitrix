import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Preencha email e senha");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation is enabled — user needs to verify
        toast.success("Conta criada! Verifique sua caixa de entrada para confirmar o email.");
        navigate("/login");
      } else if (data.session) {
        // Auto-confirm is on — user is logged in automatically
        toast.success("Conta criada com sucesso!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        toast.error("Este email já está cadastrado. Tente fazer login.");
      } else {
        toast.error(err.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight">IA agenda</Link>
          <p className="text-muted-foreground mt-2">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Mínimo 6 caracteres" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta? <Link to="/login" className="text-foreground hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
