import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardHome = () => {
  const { business } = useAuth();
  const [stats, setStats] = useState({ today: 0, week: 0, clients: 0, pending: 0 });
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
      supabase.from("appointments").select("*").eq("business_id", business.id).gte("appointment_date", today).order("appointment_date").order("start_time").limit(5),
    ]).then(([todayR, weekR, clientsR, pendingR, upcomingR]) => {
      setStats({
        today: todayR.count || 0,
        week: weekR.count || 0,
        clients: clientsR.count || 0,
        pending: pendingR.count || 0,
      });
      setUpcoming(upcomingR.data || []);
    });
  }, [business]);

  const statCards = [
    { label: "Hoje", value: stats.today, icon: Calendar },
    { label: "Semana", value: stats.week, icon: Clock },
    { label: "Clientes", value: stats.clients, icon: Users },
    { label: "Pendentes", value: stats.pending, icon: CheckCircle },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <div>
                <div className="font-medium">{a.client_name || "Cliente"}</div>
                <div className="text-sm text-muted-foreground">
                  {a.body_location ? `${a.body_location} • ${a.size_cm}cm` : a.observations || "Agendamento"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-semibold">{a.start_time?.slice(0, 5)}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(a.appointment_date), "dd/MM", { locale: ptBR })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
