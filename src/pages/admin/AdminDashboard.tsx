import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ businesses: 0, users: 0, appointments: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
    ]).then(([b, u, a]) => {
      setCounts({
        businesses: b.count || 0,
        users: u.count || 0,
        appointments: a.count || 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total de Negócios", value: counts.businesses, icon: Building2 },
    { label: "Total de Usuários", value: counts.users, icon: Users },
    { label: "Total de Agendamentos", value: counts.appointments, icon: CalendarCheck },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Admin — Visão Geral</h1>
      <p className="text-muted-foreground mb-6">Métricas do sistema de agenda.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map(c => (
          <Card key={c.label} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <c.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{c.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
