import { UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProfessionalsPage = () => (
  <div className="animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Profissionais</h1>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" /> Adicionar
      </Button>
    </div>
    <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
      <div className="text-center text-muted-foreground">
        <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nenhum profissional</p>
        <p className="text-sm">Adicione profissionais da sua equipe.</p>
      </div>
    </div>
  </div>
);

export default ProfessionalsPage;
