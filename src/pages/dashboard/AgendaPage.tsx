import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AgendaPage = () => (
  <div className="animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" /> Novo agendamento
      </Button>
    </div>
    <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
      <div className="text-center text-muted-foreground">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Calendário em breve</p>
        <p className="text-sm">Seus agendamentos aparecerão aqui.</p>
      </div>
    </div>
  </div>
);

export default AgendaPage;
