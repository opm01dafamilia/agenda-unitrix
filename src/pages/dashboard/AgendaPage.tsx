import { useState, useEffect } from "react";
import { Calendar, Plus, Check, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-blue-500/20 text-blue-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Finalizado",
};

const AgendaPage = () => {
  const { business, isPremium, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business.id)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });
    setAppointments(data || []);
  };

  useEffect(() => { fetchAppointments(); }, [business]);

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "completed") {
      update.completed_at = new Date().toISOString();
      update.completed_by = user?.id;
    }
    await supabase.from("appointments").update(update).eq("id", id);
    toast.success(`Agendamento ${statusLabels[status]?.toLowerCase()}`);
    fetchAppointments();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        {isPremium && (
          <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo agendamento</Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum agendamento</p>
            <p className="text-sm">Seus agendamentos aparecerão aqui.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{a.client_name || "Cliente"}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(a.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {a.start_time?.slice(0, 5)}
                  </div>
                  {a.body_location && <div className="text-xs text-muted-foreground mt-1">{a.body_location} • {a.size_cm}cm</div>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                  {statusLabels[a.status]}
                </span>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-green-400" onClick={() => updateStatus(a.id, "confirmed")}>
                    <Check className="w-3 h-3 mr-1" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>
                    <X className="w-3 h-3 mr-1" /> Recusar
                  </Button>
                </div>
              )}
              {a.status === "confirmed" && (
                <Button size="sm" variant="outline" className="mt-3 text-blue-400" onClick={() => updateStatus(a.id, "completed")}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Finalizar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaPage;
