import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AdminTrials = () => {
  const { user } = useAuth();
  const [trials, setTrials] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTrials = async () => {
    const { data } = await supabase.from("trial_codes").select("*").order("created_at", { ascending: false });
    setTrials(data || []);
  };

  useEffect(() => { fetchTrials(); }, []);

  const generateCode = () => {
    return "TRIAL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createTrial = async () => {
    if (!email.trim()) { toast.error("Email obrigatório"); return; }
    setCreating(true);
    try {
      const code = generateCode();
      const { error } = await supabase.from("trial_codes").insert({
        code,
        email: email.trim().toLowerCase(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), // code valid for 30 days to be used
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success(`Código criado: ${code}`);
      setEmail("");
      fetchTrials();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Trials</h1>

      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Gerar código de trial</h2>
        <div className="flex gap-2">
          <div className="flex-1"><Label>Email do usuário</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" /></div>
        </div>
        <Button onClick={createTrial} disabled={creating} className="mt-3">{creating ? "Gerando..." : "Gerar código"}</Button>
      </div>

      <div className="space-y-3">
        {trials.map((t) => (
          <div key={t.id} className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-primary">{t.code}</div>
                <div className="text-sm text-muted-foreground">{t.email}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.used ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>
                {t.used ? "Usado" : "Disponível"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTrials;
