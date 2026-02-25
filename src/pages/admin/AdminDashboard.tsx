import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    { label: "Negócios", value: counts.businesses },
    { label: "Usuários", value: counts.users },
    { label: "Agendamentos", value: counts.appointments },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Admin — Visão Geral</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="p-5 rounded-xl border border-border bg-card">
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
