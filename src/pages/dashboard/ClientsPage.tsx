import { useState, useEffect } from "react";
import { Users, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClientsPage = () => {
  const { business } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!business) return;
    supabase.from("clients").select("*").eq("business_id", business.id).order("created_at", { ascending: false })
      .then(({ data }) => setClients(data || []));
  }, [business]);

  const toggleClient = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      return;
    }
    setExpandedClient(clientId);
    if (!clientAppointments[clientId]) {
      const { data } = await supabase.from("appointments")
        .select("*")
        .eq("business_id", business!.id)
        .eq("client_id", clientId)
        .order("appointment_date", { ascending: false });
      setClientAppointments(prev => ({ ...prev, [clientId]: data || [] }));
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search) ||
    c.whatsapp?.includes(search)
  );

  const isTattoo = business?.industry === "tattoo";

  const getClientStats = (appointments: any[]) => {
    const completed = appointments.filter(a => a.status === "completed");
    const totalValue = completed.reduce((sum, a) => sum + (Number(a.tattoo_value) || 0), 0);
    return { total: completed.length, totalValue };
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum cliente ainda</p>
            <p className="text-sm">Seus clientes aparecerão aqui após o primeiro agendamento.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isExpanded = expandedClient === c.id;
            const appts = clientAppointments[c.id] || [];
            const stats = getClientStats(appts);

            return (
              <div key={c.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                <button onClick={() => toggleClient(c.id)} className="w-full p-4 flex items-center justify-between text-left">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.whatsapp} • {c.city || "—"}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3">
                    {isTattoo && stats.total > 0 && (
                      <div className="flex gap-4 mb-3 text-sm">
                        <span className="text-muted-foreground">Tatuagens: <span className="text-foreground font-medium">{stats.total}</span></span>
                        <span className="text-muted-foreground">Total: <span className="text-foreground font-medium">R$ {stats.totalValue.toFixed(2)}</span></span>
                      </div>
                    )}
                    {appts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {appts.slice(0, 10).map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                            <div>
                              <span>{format(new Date(a.appointment_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                              <span className="text-muted-foreground ml-2">{a.start_time?.slice(0, 5)}</span>
                              {a.body_location && <span className="text-muted-foreground ml-2">• {a.body_location}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {a.tattoo_value && <span className="text-primary">R$ {Number(a.tattoo_value).toFixed(2)}</span>}
                              <span className={`px-1.5 py-0.5 rounded text-xs ${a.status === "completed" ? "bg-blue-500/20 text-blue-400" : a.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                                {a.status === "completed" ? "Finalizado" : a.status === "confirmed" ? "Confirmado" : a.status === "pending" ? "Pendente" : "Cancelado"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
