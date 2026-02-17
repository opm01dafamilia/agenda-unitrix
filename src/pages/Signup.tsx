import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const industries = [
  { value: "tattoo", label: "Tatuador", emoji: "🎨" },
  { value: "barber", label: "Barbearia", emoji: "💈" },
  { value: "salon", label: "Salão de Beleza", emoji: "✨" },
];

const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const validateCPF = (cpf: string) => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10]);
};

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", businessName: "",
    industry: "", whatsapp: "", cpf: "", city: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (!form.email || !form.password) {
      toast.error("Preencha email e senha");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.industry || !form.whatsapp || !form.cpf || !form.city) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!validateCPF(form.cpf)) {
      toast.error("CPF inválido");
      return;
    }
    const phone = form.whatsapp.replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 11) {
      toast.error("WhatsApp inválido");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta");

      const slug = form.businessName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error: bizError } = await supabase.from("businesses").insert({
        owner_id: authData.user.id,
        name: form.businessName,
        slug: slug + "-" + Date.now().toString(36),
        industry: form.industry as any,
        cpf: form.cpf.replace(/\D/g, ""),
        whatsapp: phone,
        email: form.email,
        city: form.city,
      });
      if (bizError) throw bizError;

      toast.success("Conta criada! Verifique seu email para confirmar.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="text-primary">IA</span> agenda
          </Link>
          <p className="text-muted-foreground mt-2">
            {step === 1 ? "Crie sua conta" : "Sobre seu negócio"}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="seu@email.com" required /></div>
              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Mínimo 6 caracteres" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="button" className="w-full" onClick={handleNext}>
                Próximo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div><Label>Nome do negócio</Label><Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Ex: Studio Ink" required /></div>
              <div>
                <Label>Profissão</Label>
                <div className="grid grid-cols-3 gap-2">
                  {industries.map((ind) => (
                    <button key={ind.value} type="button" onClick={() => update("industry", ind.value)}
                      className={`p-3 rounded-lg border text-center text-sm transition-colors ${form.industry === ind.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                      <div className="text-xl mb-1">{ind.emoji}</div>{ind.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => update("whatsapp", formatPhone(e.target.value))} placeholder="(11) 99999-9999" required /></div>
              <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => update("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" required /></div>
              <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="São Paulo" required /></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /></Button>
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
