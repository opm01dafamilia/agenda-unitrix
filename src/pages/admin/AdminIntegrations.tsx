import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Copy, Link2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEBHOOK_URL = `https://sesqajlcdtdbmcndczoo.supabase.co/functions/v1/kiwify-webhook`;
const WEBHOOK_TOKEN = "5j2th3200gu";

const AdminIntegrations = () => {
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_logs" as any)
      .select("*")
      .eq("source", "kiwify")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setLastEvent(data?.[0] || null);
        setLoading(false);
      });
  }, []);

  const isConnected = !!lastEvent;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Integrações</h1>
      <p className="text-muted-foreground mb-6">Configuração de integrações externas.</p>

      <div className="space-y-5">
        {/* Status */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="w-5 h-5 text-muted-foreground" />
                Webhook Kiwify
              </CardTitle>
              <Badge variant="outline" className={isConnected ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground"}>
                {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Last event */}
            {loading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : lastEvent ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Último evento: </span>
                  <span className="font-medium font-mono">{lastEvent.event_type}</span>
                  <span className="text-muted-foreground ml-2">
                    — {formatDistanceToNow(new Date(lastEvent.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                Nenhum evento recebido ainda.
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL & Token */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">URL do Webhook</Label>
              <div className="flex gap-2">
                <Input readOnly value={WEBHOOK_URL} className="flex-1 font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(WEBHOOK_URL);
                  toast.success("Webhook copiado com sucesso.");
                }}>
                  <Copy className="w-4 h-4 mr-1" /> Copiar URL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Cole esta URL na configuração de webhook da Kiwify.
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Token do Webhook</Label>
              <div className="flex gap-2">
                <Input readOnly value={WEBHOOK_TOKEN} className="flex-1 font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(WEBHOOK_TOKEN);
                  toast.success("Token copiado com sucesso.");
                }}>
                  <Copy className="w-4 h-4 mr-1" /> Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Confirme que este token é o mesmo configurado na Kiwify.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminIntegrations;
