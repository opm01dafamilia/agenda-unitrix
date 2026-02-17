import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminSubscriptions = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);

  const fetchBusinesses = async () => {
    const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
    setBusinesses(data || []);
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const togglePremium = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    const update: any = { premium_status: newStatus };
    if (newStatus === "active") {
      update.premium_until = new Date(Date.now() + 30 * 86400000).toISOString();
    }
    await supabase.from("businesses").update(update).eq("id", id);
    toast.success(`Status alterado para ${newStatus}`);
    fetchBusinesses();
  };

  const statusColors: Record<string, string> = {
    active: "bg-primary/20 text-primary",
    trial: "bg-blue-500/20 text-blue-400",
    past_due: "bg-destructive/20 text-destructive",
    inactive: "bg-muted text-muted-foreground",
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Assinaturas</h1>
      <div className="space-y-3">
        {businesses.map((b) => (
          <div key={b.id} className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-sm text-muted-foreground">{b.email} • {b.industry}</div>
                {b.premium_until && <div className="text-xs text-muted-foreground">Vence: {new Date(b.premium_until).toLocaleDateString("pt-BR")}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.premium_status] || statusColors.inactive}`}>
                  {b.premium_status}
                </span>
                <Button size="sm" variant="outline" onClick={() => togglePremium(b.id, b.premium_status)}>
                  {b.premium_status === "active" ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
