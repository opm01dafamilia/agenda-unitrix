import { Calendar, Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Finalizado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-blue-500/20 text-blue-400",
};

const DashboardHome = () => {
  const { business, user } = useAuth();
  const [stats, setStats] = useState({ today: 0, week: 0, clients: 0, pending: 0, completed: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    if (!business) return;
    const today = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    Promise.all([
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("appointment_date", today),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", business.id).gte("appointment_date", today).lte("appointment_date", weekEnd),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "pending"),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "completed"),
      supabase.from("appointments").select("*").eq("business_id", business.id).gte("appointment_date", today).neq("status", "cancelled").order("appointment_date").order("start_time").limit(10),
    ]).then(([todayR, weekR, clientsR, pendingR, completedR, upcomingR]) => {
      setStats({
        today: todayR.count || 0,
        week: weekR.count || 0,
        clients: clientsR.count || 0,
        pending: pendingR.count || 0,
        completed: completedR.count || 0,
      });
      setUpcoming(upcomingR.data || []);
    });
  }, [business]);

  const completeAppointment = async (id: string) => {
    await supabase.from("appointments").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.id,
    }).eq("id", id);
    // Refresh
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("appointments").select("*").eq("business_id", business!.id).gte("appointment_date", today).neq("status", "cancelled").order("appointment_date").order("start_time").limit(10);
    setUpcoming(data || []);
    setStats(s => ({ ...s, completed: s.completed + 1 }));
  };

  const statCards = [
    { label: "Hoje", value: stats.today, icon: Calendar },
    { label: "Semana", value: stats.week, icon: Clock },
    { label: "Clientes", value: stats.clients, icon: Users },
    { label: "Pendentes", value: stats.pending, icon: AlertCircle },
    { label: "Finalizados", value: stats.completed, icon: CheckCircle },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border/50">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Próximos agendamentos</h2>
      {upcoming.length === 0 ? (
        <div className="p-6 rounded-xl bg-card border border-border/50 text-center text-muted-foreground">
          Nenhum agendamento próximo.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.client_name || "Cliente"}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {a.body_location ? `${a.body_location} • ${a.size_cm}cm` : a.observations || ""}
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-primary font-semibold">{a.start_time?.slice(0, 5)}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(a.appointment_date), "dd/MM", { locale: ptBR })}</div>
                </div>
                {a.status === "confirmed" && (
                  <Button size="sm" variant="outline" className="text-blue-400" onClick={() => completeAppointment(a.id)}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
