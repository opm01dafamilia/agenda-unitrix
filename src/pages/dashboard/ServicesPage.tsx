import { useState, useEffect } from "react";
import { Scissors, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ServicesPage = () => {
  const { business } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const fetch = async () => {
    if (!business) return;
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("created_at");
    setServices(data || []);
  };

  useEffect(() => { fetch(); }, [business]);

  const add = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!business) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("services").insert({
        business_id: business.id,
        name: name.trim(),
        duration_minutes: parseInt(duration) || 30,
        price: price ? parseFloat(price) : null,
      });
      if (error) throw error;
      setName(""); setDuration("30"); setPrice("");
      toast.success("Serviço adicionado!");
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active: !active }).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    toast.success("Serviço removido!");
    fetch();
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Adicionar serviço</h2>
        <div className="grid gap-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Corte masculino" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duração (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" /></div>
            <div><Label>Preço (R$)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50.00" /></div>
          </div>
          <Button onClick={add} disabled={adding}><Plus className="w-4 h-4 mr-2" />{adding ? "Adicionando..." : "Adicionar"}</Button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum serviço</p>
            <p className="text-sm">Adicione serviços para seus clientes agendarem.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">
                  {s.duration_minutes}min{s.price ? ` • R$ ${Number(s.price).toFixed(2)}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={s.active} onCheckedChange={() => toggleActive(s.id, s.active)} />
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
