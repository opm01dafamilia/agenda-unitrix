import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Zap, ExternalLink } from "lucide-react";

const KIWIFY_MONTHLY = "https://pay.kiwify.com.br/Hhoa7EB";
const KIWIFY_ANNUAL = "https://pay.kiwify.com.br/6HxBH3e";

const AdminPlans = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Planos</h1>
      <p className="text-muted-foreground mb-8">Planos disponíveis no sistema Agenda IA 01.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardDescription>Economize mais de 50% comparado ao plano mensal</CardDescription>
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
              <p className="text-sm text-muted-foreground">Renovação anual: <span className="font-medium text-foreground">R$ 247,00</span></p>
              <p className="text-xs text-green-500 font-medium">Economize mais de 50% comparado ao mensal.</p>
            </div>
            <Button className="w-full" onClick={() => window.open(KIWIFY_ANNUAL, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Assinar Anual
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPlans;
