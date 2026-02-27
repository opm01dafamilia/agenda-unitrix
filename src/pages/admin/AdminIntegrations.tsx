import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plug, CheckCircle, XCircle, TestTube, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminIntegrations = () => {
  const [connected] = useState(false); // mock
  const [webhookSecret, setWebhookSecret] = useState("");
  const [kiwifyLogs, setKiwifyLogs] = useState<any[]>([]);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  useEffect(() => {
    supabase.from("admin_logs" as any)
      .select("*")
      .eq("source", "kiwify")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setKiwifyLogs(data || []));
  }, []);

  const testIntegration = () => {
    toast.info("Teste de integração simulado. Webhook não configurado ainda.");
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Integrações</h1>

      <div className="space-y-6">
        {/* Status Card */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Plug className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Kiwify</h2>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
              {connected ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {connected ? "Conectado" : "Desconectado"}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Integre com a Kiwify para gerenciar acessos automaticamente via webhook.
          </p>
        </div>

        {/* Webhook Secret */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-medium mb-3">Webhook Secret</h3>
          <div className="flex gap-2">
            <Input
              type="password"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              placeholder="Cole o secret do webhook aqui"
              className="flex-1"
            />
            <Button variant="outline" onClick={() => toast.info("Secret salvo localmente (mock)")}>
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Este secret será usado para validar os webhooks recebidos da Kiwify.
          </p>
        </div>

        {/* Test Button */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <Button variant="outline" onClick={testIntegration}>
            <TestTube className="w-4 h-4 mr-2" /> Testar integração
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Simula o recebimento de um evento webhook para verificar a configuração.
          </p>
        </div>

        {/* Kiwify Events */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h3 className="font-medium mb-3">Eventos recebidos</h3>
          {kiwifyLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento Kiwify registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Data</th>
                    <th className="text-left px-3 py-2 font-medium">Evento</th>
                    <th className="text-left px-3 py-2 font-medium">Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {kiwifyLogs.map(l => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{l.event_type}</td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPayload(l.payload)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedPayload} onOpenChange={() => setSelectedPayload(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payload</DialogTitle></DialogHeader>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(selectedPayload, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIntegrations;
