import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sourceColor = (source: string) => {
    switch (source) {
      case "kiwify": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "admin": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "system": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Auditoria / Logs</h1>
      <p className="text-muted-foreground mb-6">Registro de eventos do sistema.</p>

      <div className="mb-5">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
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
        <Card className="shadow-md">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum log registrado.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Evento</th>
                  <th className="text-left px-4 py-3 font-medium">Origem</th>
                  <th className="text-left px-4 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <>
                    <tr key={l.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{l.event_type}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={sourceColor(l.source)}>{l.source}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {l.payload ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleRow(l.id)}>
                              {expandedRows.has(l.id) ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                              {expandedRows.has(l.id) ? "Fechar" : "Expandir"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPayload(l.payload)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver
                            </Button>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                    {expandedRows.has(l.id) && l.payload && (
                      <tr key={`${l.id}-expanded`}>
                        <td colSpan={4} className="px-4 py-3 bg-muted/20">
                          <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap font-mono rounded-lg bg-muted p-3">
                            {JSON.stringify(l.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
