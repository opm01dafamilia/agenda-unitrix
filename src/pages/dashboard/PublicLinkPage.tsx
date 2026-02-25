import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PublicLinkPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [slug, setSlug] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setSlug(business.slug);
      setAutoAccept(business.auto_accept_appointments);
    }
  }, [business]);

  const publicUrl = `${window.location.origin}/a/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, "");
      if (!cleanSlug) { toast.error("Link inválido"); setSaving(false); return; }

      if (cleanSlug !== business.slug) {
        const { data: existing } = await supabase.from("businesses").select("id").eq("slug", cleanSlug).neq("id", business.id).maybeSingle();
        if (existing) { toast.error("Esse link já está em uso"); setSaving(false); return; }
      }

      await supabase.from("businesses").update({
        slug: cleanSlug,
        auto_accept_appointments: autoAccept,
      }).eq("id", business.id);

      toast.success("Configurações salvas!");
      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Link Público</h1>

      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-card">
          <Label className="text-base font-semibold">Seu link de agendamento</Label>
          <div className="flex gap-2 mt-3">
            <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="meu-negocio" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon"><ExternalLink className="w-4 h-4" /></Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{publicUrl}</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Aprovação automática</h2>
              <p className="text-sm text-muted-foreground">Aceitar agendamentos automaticamente</p>
            </div>
            <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
};

export default PublicLinkPage;
