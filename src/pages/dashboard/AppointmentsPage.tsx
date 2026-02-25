import { useState, useEffect } from "react";
import { CalendarCheck, Search, Check, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

const AppointmentsPage = () => {
  const { business, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetch = async () => {
    if (!business) return;
    let query = supabase.from("appointments").select("*").eq("business_id", business.id).order("appointment_date", { ascending: false }).order("start_time", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data } = await query;
    setAppointments(data || []);
  };

  useEffect(() => { fetch(); }, [business, filter]);

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "completed") {
      update.completed_at = new Date().toISOString();
      update.completed_by = user?.id;
    }
    await supabase.from("appointments").update(update).eq("id", id);
    toast.success(`Agendamento ${statusLabels[status]?.toLowerCase()}`);
    fetch();
  };

  const filtered = appointments.filter(a =>
    !search || (a.client_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "confirmed", label: "Confirmados" },
    { value: "completed", label: "Concluídos" },
    { value: "cancelled", label: "Cancelados" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Agendamentos</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f.value ? "bg-foreground text-background font-medium" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum agendamento encontrado.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{a.client_name || "Cliente"}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(a.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {a.start_time?.slice(0, 5)}
                  </div>
                  {a.body_location && <div className="text-xs text-muted-foreground mt-0.5">{a.body_location} • {a.size_cm}cm</div>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground`}>
                  {statusLabels[a.status]}
                </span>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "confirmed")}>
                    <Check className="w-3 h-3 mr-1" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "cancelled")}>
                    <X className="w-3 h-3 mr-1" /> Recusar
                  </Button>
                </div>
              )}
              {a.status === "confirmed" && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => updateStatus(a.id, "completed")}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Concluir
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
