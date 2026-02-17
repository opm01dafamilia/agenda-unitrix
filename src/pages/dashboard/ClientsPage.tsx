import { Users } from "lucide-react";

const ClientsPage = () => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold mb-6">Clientes</h1>
    <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
      <div className="text-center text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nenhum cliente ainda</p>
        <p className="text-sm">Seus clientes aparecerão aqui após o primeiro agendamento.</p>
      </div>
    </div>
  </div>
);

export default ClientsPage;
