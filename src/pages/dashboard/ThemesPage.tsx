import { Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const presets: Record<string, { primary: string; secondary: string; label: string }> = {
  tattoo: { primary: "#EF4444", secondary: "#1C1917", label: "🎨 Tatuador" },
  barber: { primary: "#3B82F6", secondary: "#1E293B", label: "💈 Barbearia" },
  salon: { primary: "#EC4899", secondary: "#1E1B2E", label: "✨ Salão" },
};

const ThemesPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [primary, setPrimary] = useState("#EAB308");
  const [secondary, setSecondary] = useState("#1E1E1E");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setPrimary(business.theme_primary_color || "#EAB308");
      setSecondary(business.theme_secondary_color || "#1E1E1E");
    }
  }, [business]);

  const applyPreset = (industry: string) => {
    const p = presets[industry];
    if (p) { setPrimary(p.primary); setSecondary(p.secondary); }
  };

  const save = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("businesses").update({
        theme_primary_color: primary,
        theme_secondary_color: secondary,
      }).eq("id", business.id);
      if (error) throw error;
      toast.success("Tema salvo!");
      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Temas</h1>

      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Personalizar cores</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="mb-2 block">Cor principal</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-28" />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Cor secundária</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} className="w-28" />
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar tema"}</Button>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50">
        <h2 className="font-semibold mb-4">Temas por profissão</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(presets).map(([key, preset]) => (
            <button key={key} onClick={() => applyPreset(key)}
              className="p-4 rounded-lg border-2 text-center cursor-pointer hover:bg-accent transition-colors"
              style={{ borderColor: preset.primary + "80" }}>
              <div className="text-2xl mb-2">{preset.label.split(" ")[0]}</div>
              <div className="text-sm font-medium">{preset.label.split(" ").slice(1).join(" ")}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemesPage;
