import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

const stats = [
  { label: "Hoje", value: "3", icon: Calendar },
  { label: "Semana", value: "12", icon: Clock },
  { label: "Clientes", value: "48", icon: Users },
  { label: "Pendentes", value: "2", icon: CheckCircle },
];

const DashboardHome = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border/50">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Próximos agendamentos</h2>
      <div className="space-y-3">
        {[
          { name: "João Silva", time: "14:00", service: "Corte masculino" },
          { name: "Maria Santos", time: "15:30", service: "Coloração" },
          { name: "Carlos Oliveira", time: "16:00", service: "Barba" },
        ].map((a, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
          >
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-muted-foreground">{a.service}</div>
            </div>
            <div className="text-primary font-semibold">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;
