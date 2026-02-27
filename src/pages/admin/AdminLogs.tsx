import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("admin_logs" as any).select("*").order("created_at", { ascending: false }).limit(100);
    if (sourceFilter !== "all") {
      query = query.eq("source", sourceFilter);
    }
    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [sourceFilter]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Auditoria / Logs</h1>

      <div className="mb-4">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar por source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="kiwify">Kiwify</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
          Nenhum log registrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Evento</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{l.event_type}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted">{l.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    {l.payload ? (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPayload(l.payload)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

export default AdminLogs;
