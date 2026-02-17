import { useState, useEffect } from "react";
import { UserPlus, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfessionalsPage = () => {
  const { business } = useAuth();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchPros = async () => {
    if (!business) return;
    const { data } = await supabase.from("professionals").select("*").eq("business_id", business.id).order("created_at");
    setProfessionals(data || []);
  };

  useEffect(() => { fetchPros(); }, [business]);

  const addPro = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!business) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("professionals").insert({
        business_id: business.id,
        name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, "") || null,
      });
      if (error) throw error;
      setName(""); setWhatsapp("");
      toast.success("Profissional adicionado!");
      fetchPros();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("professionals").update({ active: !active }).eq("id", id);
    fetchPros();
  };

  const deletePro = async (id: string) => {
    await supabase.from("professionals").delete().eq("id", id);
    toast.success("Removido!");
    fetchPros();
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profissionais</h1>

      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Adicionar profissional</h2>
        <div className="grid gap-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do profissional" /></div>
          <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" /></div>
          <Button onClick={addPro} disabled={adding}><UserPlus className="w-4 h-4 mr-2" />{adding ? "Adicionando..." : "Adicionar"}</Button>
        </div>
      </div>

      {professionals.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum profissional</p>
            <p className="text-sm">Adicione profissionais da sua equipe.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.whatsapp && <div className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{p.whatsapp}</div>}
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id, p.active)} />
                <Button variant="ghost" size="icon" onClick={() => deletePro(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
