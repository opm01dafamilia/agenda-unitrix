import { CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const PlanPage = () => {
  const [trialCode, setTrialCode] = useState("");

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Plano</h1>

      {/* Status */}
      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Status do Premium</h2>
        </div>
        <div className="inline-flex px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
          Inativo
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Ative seu plano Premium para desbloquear todas as funcionalidades.
        </p>
      </div>

      {/* Payment options */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
          <h3 className="font-semibold mb-2">Mensal</h3>
          <div className="text-2xl font-bold text-primary mb-1">
            R$ 37
            <span className="text-sm text-muted-foreground font-normal"> /1º mês</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Depois R$ 97/mês</p>
          <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Assinar</Button>
          </a>
        </div>
        <div className="p-6 rounded-xl bg-card border-2 border-primary/50 text-center">
          <h3 className="font-semibold mb-2">Anual</h3>
          <div className="text-2xl font-bold text-primary mb-1">
            R$ 747
            <span className="text-sm text-muted-foreground font-normal"> /1º ano</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Depois R$ 1.164/ano</p>
          <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Assinar</Button>
          </a>
        </div>
      </div>

      {/* Trial code */}
      <div className="p-6 rounded-xl bg-card border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Código de acesso (7 dias grátis)</h2>
        </div>
        <div className="flex gap-2">
          <Input
            value={trialCode}
            onChange={(e) => setTrialCode(e.target.value)}
            placeholder="Insira seu código"
          />
          <Button>Ativar</Button>
        </div>
      </div>
    </div>
  );
};

export default PlanPage;
