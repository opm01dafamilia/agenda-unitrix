import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Auditoria / Logs</h1>
      {logs.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
          Nenhum log registrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Evento</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}</td>
                  <td className="px-4 py-3">{l.email || "—"}</td>
                  <td className="px-4 py-3">{l.event_type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.status_processing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
