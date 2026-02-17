import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const events = [
  { value: "compra_aprovada", label: "Compra aprovada" },
  { value: "assinatura_renovada", label: "Assinatura renovada" },
  { value: "assinatura_atrasada", label: "Assinatura atrasada" },
  { value: "assinatura_cancelada", label: "Assinatura cancelada" },
  { value: "pix_gerado", label: "Pix gerado" },
];

const AdminWebhooks = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [simEmail, setSimEmail] = useState("");
  const [simEvent, setSimEvent] = useState("compra_aprovada");
  const [simulating, setSimulating] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(10);
    setLogs(data || []);
  };

  useEffect(() => { fetchLogs(); }, []);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kiwify-webhook`;

  const simulate = async () => {
    if (!simEmail.trim()) { toast.error("Email obrigatório"); return; }
    setSimulating(true);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: simEmail.trim(),
          evento: simEvent,
          token: "SIMULATED_ADMIN_TOKEN",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Webhook simulado com sucesso!");
      } else {
        toast.error(data.error || "Erro na simulação");
      }
      fetchLogs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Webhooks</h1>

      {/* Endpoint URL */}
      <div className="p-4 rounded-xl bg-card border border-border/50 mb-6">
        <Label>URL do Webhook (cadastrar na Kiwify)</Label>
        <div className="flex gap-2 mt-1">
          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copiado!"); }}>Copiar</Button>
        </div>
      </div>

      {/* Simulator */}
      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Simulador de Webhook</h2>
        <div className="grid gap-3">
          <div><Label>Email</Label><Input value={simEmail} onChange={(e) => setSimEmail(e.target.value)} placeholder="cliente@email.com" /></div>
          <div>
            <Label>Evento</Label>
            <Select value={simEvent} onValueChange={setSimEvent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {events.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={simulate} disabled={simulating}>{simulating ? "Simulando..." : "Simular webhook"}</Button>
        </div>
      </div>

      {/* Logs */}
      <h2 className="font-semibold mb-3">Últimos 10 logs</h2>
      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum log ainda.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{l.event_type}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${l.status_processing === "success" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                  {l.status_processing}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{l.email} • {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}</div>
              {l.error_message && <p className="text-xs text-destructive mt-1">{l.error_message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWebhooks;
