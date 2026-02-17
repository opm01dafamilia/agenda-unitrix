import { CreditCard, Gift, CheckCircle, Star, Zap, Calendar, Image, Users, Palette, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const benefits = [
  { icon: Calendar, text: "Agenda inteligente com calendário visual" },
  { icon: Zap, text: "Link público para clientes agendarem 24h" },
  { icon: Image, text: "Galeria vitrine com até 50 fotos" },
  { icon: Users, text: "Multi-profissionais com WhatsApp individual" },
  { icon: Palette, text: "Temas personalizados por profissão" },
  { icon: CheckCircle, text: "Aprovação automática ou manual" },
  { icon: MessageSquare, text: "Mensagens automáticas para clientes" },
  { icon: Star, text: "Suporte prioritário" },
];

const PlanPage = () => {
  const { business, user, refreshBusiness } = useAuth();
  const [trialCode, setTrialCode] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabel: Record<string, { text: string; color: string }> = {
    active: { text: "✅ Ativo", color: "bg-green-500/20 text-green-400" },
    trial: { text: "🎁 Trial ativo", color: "bg-blue-500/20 text-blue-400" },
    past_due: { text: "⚠️ Atrasado", color: "bg-destructive/20 text-destructive" },
    inactive: { text: "❌ Inativo", color: "bg-muted text-muted-foreground" },
  };

  const status = statusLabel[business?.premium_status || "inactive"] || statusLabel.inactive;

  const handleActivateTrial = async () => {
    if (!trialCode.trim()) { toast.error("Insira o código"); return; }
    setLoading(true);
    try {
      const { data: code, error } = await supabase
        .from("trial_codes")
        .select("*")
        .eq("code", trialCode.trim())
        .eq("email", user?.email || "")
        .eq("used", false)
        .maybeSingle();

      if (error) throw error;
      if (!code) { toast.error("Código inválido ou não vinculado ao seu email"); return; }
      if (new Date(code.expires_at) < new Date()) { toast.error("Código expirado"); return; }

      await supabase.from("trial_codes").update({ used: true, used_at: new Date().toISOString(), used_by: user?.id }).eq("id", code.id);
      await supabase.from("businesses").update({
        premium_status: "trial" as any,
        premium_until: new Date(Date.now() + 7 * 86400000).toISOString(),
      }).eq("id", business?.id);

      toast.success("🎉 Trial de 7 dias ativado com sucesso!");
      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar código");
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = business?.premium_until
    ? Math.max(0, Math.ceil((new Date(business.premium_until).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Plano</h1>

      {/* Status */}
      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Status do Premium</h2>
        </div>
        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.text}
        </div>
        {business?.premium_until && (
          <p className="text-sm text-muted-foreground mt-3">
            {daysRemaining > 0 ? `${daysRemaining} dias restantes` : "Expirado"} •
            Vence em {new Date(business.premium_until).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-4">O que você ganha com o Premium</h2>
        <div className="grid gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <b.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
          <h3 className="font-semibold mb-2">Mensal</h3>
          <div className="text-2xl font-bold text-primary mb-1">
            R$ 37<span className="text-sm text-muted-foreground font-normal"> /1º mês</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Depois R$ 97/mês</p>
          <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Assinar mensal</Button>
          </a>
        </div>
        <div className="p-6 rounded-xl bg-card border-2 border-primary/50 text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Melhor valor
          </div>
          <h3 className="font-semibold mb-2">Anual</h3>
          <div className="text-2xl font-bold text-primary mb-1">
            R$ 747<span className="text-sm text-muted-foreground font-normal"> /1º ano</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Depois R$ 1.164/ano</p>
          <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Assinar anual</Button>
          </a>
        </div>
      </div>

      {/* Trial */}
      <div className="p-6 rounded-xl bg-card border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Código de acesso (7 dias grátis)</h2>
        </div>
        <div className="flex gap-2">
          <Input value={trialCode} onChange={(e) => setTrialCode(e.target.value)} placeholder="Insira seu código" />
          <Button onClick={handleActivateTrial} disabled={loading}>{loading ? "..." : "Ativar"}</Button>
        </div>
      </div>
    </div>
  );
};

export default PlanPage;
