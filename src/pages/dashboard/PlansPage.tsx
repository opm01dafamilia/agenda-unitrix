import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Zap, ExternalLink, Check, ShieldCheck, ShieldOff } from "lucide-react";

const KIWIFY_MONTHLY = "https://pay.kiwify.com.br/Hhoa7EB";
const KIWIFY_ANNUAL = "https://pay.kiwify.com.br/6HxBH3e";

const benefits = [
  "Agendamentos ilimitados",
  "Link público personalizado",
  "Galeria de trabalhos",
  "Gestão de clientes",
  "Gestão de profissionais",
  "Controle de horários e bloqueios",
  "Notificações por WhatsApp",
  "Painel completo de gestão",
];

const PlansPage = () => {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("access_control")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAccessStatus((data as any)?.status || null);
        setLoading(false);
      });
  }, [user]);

  const currentPlanLabel = accessStatus === "active" ? "Ativo" : accessStatus === "trial" ? "Trial" : "Free";
  const isActive = accessStatus === "active";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Planos</h1>
        {!loading && (
          <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
            {isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
            Plano atual: {currentPlanLabel}
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground mb-8">Escolha o plano ideal para o seu negócio.</p>

      {!isActive && !loading && (
        <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 text-sm text-foreground">
          Assine um plano para ter acesso completo a todas as funcionalidades do sistema.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Plano Mensal */}
        <Card className="relative overflow-hidden border-border shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold">
              <Zap className="w-3 h-3 mr-1" />
              Oferta de entrada
            </Badge>
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Plano Mensal</CardTitle>
            <CardDescription>Acesso completo ao sistema de agenda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">R$ 17,00</span>
                <span className="text-sm text-muted-foreground">primeiro mês</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold">R$ 37,00</span>
                <span className="text-sm text-muted-foreground">/ mês após</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Renovação automática mensal.</p>
            </div>
            <Button className="w-full" onClick={() => window.open(KIWIFY_MONTHLY, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Assinar Mensal
            </Button>
          </CardContent>
        </Card>

        {/* Plano Anual */}
        <Card className="relative overflow-hidden border-primary/30 shadow-md hover:shadow-lg transition-shadow ring-1 ring-primary/20">
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground font-semibold">
              <Crown className="w-3 h-3 mr-1" />
              Melhor custo-benefício
            </Badge>
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Plano Anual</CardTitle>
            <CardDescription>Economize mais de 50% comparado ao mensal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">12x R$ 15,20</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">ou</span>
                <span className="text-xl font-semibold">R$ 147,00</span>
                <span className="text-sm text-muted-foreground">à vista</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border space-y-1">
              <p className="text-sm text-muted-foreground">Renovação anual: <span className="font-medium text-foreground">R$ 297,00</span></p>
              <p className="text-xs text-green-500 font-medium">Economize mais de 50% comparado ao mensal.</p>
            </div>
            <Button className="w-full" onClick={() => window.open(KIWIFY_ANNUAL, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Assinar Anual
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Benefícios */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">O que está incluído</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
