import { Plug } from "lucide-react";

const AdminIntegrations = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Integrações</h1>

      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Plug className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Kiwify</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure o webhook da Kiwify para receber notificações de eventos.
        </p>
        <div className="p-3 rounded-lg bg-muted font-mono text-xs break-all">
          Em breve — configuração de webhooks.
        </div>
      </div>
    </div>
  );
};

export default AdminIntegrations;
