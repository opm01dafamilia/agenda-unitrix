import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const industries = [
  { value: "tattoo", label: "Tatuador", emoji: "🎨" },
  { value: "barber", label: "Barbearia", emoji: "💈" },
  { value: "salon", label: "Salão de Beleza", emoji: "✨" },
  { value: "design", label: "Design", emoji: "💅" },
];

const designSubtypes = [
  { value: "unha", label: "Unha", emoji: "💅" },
  { value: "sobrancelha", label: "Sobrancelha", emoji: "🖌️" },
];

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshBusiness } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    subtype: "",
    whatsapp: "",
    city: "",
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.industry || !form.whatsapp || !form.city) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (form.industry === "design" && !form.subtype) {
      toast.error("Selecione a subcategoria");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const slug = form.name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

      const { error } = await supabase.from("businesses").insert({
        owner_id: user.id,
        name: form.name,
        slug,
        industry: form.industry as any,
        profession_subtype: form.industry === "design" ? form.subtype : null,
        cpf: "00000000000",
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        email: user.email || "",
        city: form.city,
      });
      if (error) throw error;
      await refreshBusiness();
      toast.success("Negócio criado com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar negócio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Sobre seu negócio</h1>
          <p className="text-muted-foreground mt-2">Configure seu espaço para começar a usar o IA agenda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Nome do negócio</Label>
            <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ex: Studio Ink" required />
          </div>

          <div>
            <Label>Profissão</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {industries.map(ind => (
                <button key={ind.value} type="button" onClick={() => { update("industry", ind.value); if (ind.value !== "design") update("subtype", ""); }}
                  className={`p-3 rounded-lg border text-center text-sm transition-colors ${form.industry === ind.value ? "border-foreground bg-accent" : "border-border hover:border-foreground/30"}`}>
                  <div className="text-xl mb-1">{ind.emoji}</div>{ind.label}
                </button>
              ))}
            </div>
          </div>

          {form.industry === "design" && (
            <div>
              <Label>Subcategoria</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {designSubtypes.map(sub => (
                  <button key={sub.value} type="button" onClick={() => update("subtype", sub.value)}
                    className={`p-3 rounded-lg border text-center text-sm transition-colors ${form.subtype === sub.value ? "border-foreground bg-accent" : "border-border hover:border-foreground/30"}`}>
                    <div className="text-xl mb-1">{sub.emoji}</div>{sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={e => update("whatsapp", formatPhone(e.target.value))} placeholder="(11) 99999-9999" required />
          </div>

          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="São Paulo" required />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar meu negócio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
