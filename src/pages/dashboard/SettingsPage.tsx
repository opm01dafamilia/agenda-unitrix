import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

const SettingsPage = () => {
  const { business, refreshBusiness, user } = useAuth();
  const [slug, setSlug] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [address, setAddress] = useState({ street: "", number: "", zip: "", neighborhood: "", complement: "" });
  const [templates, setTemplates] = useState({ client: "", professional: "" });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Change password
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (business) {
      setSlug(business.slug);
      setAutoAccept(business.auto_accept_appointments);
      setAddress({
        street: business.address_street || "",
        number: business.address_number || "",
        zip: business.address_zip || "",
        neighborhood: business.address_neighborhood || "",
        complement: business.address_complement || "",
      });
      setTemplates({
        client: business.message_template_client || "",
        professional: business.message_template_professional || "",
      });
    }
  }, [business]);

  const publicUrl = `${window.location.origin}/a/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, "");
      if (!cleanSlug) { toast.error("Slug inválido"); return; }

      const { error } = await supabase.from("businesses").update({
        slug: cleanSlug,
        auto_accept_appointments: autoAccept,
        address_street: address.street || null,
        address_number: address.number || null,
        address_zip: address.zip || null,
        address_neighborhood: address.neighborhood || null,
        address_complement: address.complement || null,
        message_template_client: templates.client,
        message_template_professional: templates.professional,
      }).eq("id", business.id);
      if (error) throw error;
      toast.success("Configurações salvas!");
      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) { toast.error("As senhas não coincidem"); return; }
    if (passwords.new.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres"); return; }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success("Senha atualizada!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <div className="space-y-6">
        {/* Public link */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold mb-3">Link público</h2>
          <div className="flex gap-2 mb-2">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="meu-negocio" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{publicUrl}</p>
        </div>

        {/* Auto accept */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Aprovação automática</h2>
              <p className="text-sm text-muted-foreground">Aceitar agendamentos automaticamente</p>
            </div>
            <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
          </div>
        </div>

        {/* Address */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold mb-3">Endereço</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Rua</Label><Input value={address.street} onChange={(e) => setAddress(p => ({ ...p, street: e.target.value }))} /></div>
            <div><Label>Número</Label><Input value={address.number} onChange={(e) => setAddress(p => ({ ...p, number: e.target.value }))} /></div>
            <div><Label>CEP</Label><Input value={address.zip} onChange={(e) => setAddress(p => ({ ...p, zip: e.target.value }))} /></div>
            <div><Label>Bairro</Label><Input value={address.neighborhood} onChange={(e) => setAddress(p => ({ ...p, neighborhood: e.target.value }))} /></div>
            <div><Label>Complemento</Label><Input value={address.complement} onChange={(e) => setAddress(p => ({ ...p, complement: e.target.value }))} /></div>
          </div>
        </div>

        {/* Message templates */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold mb-3">Mensagens automáticas</h2>
          <div className="space-y-3">
            <div><Label>Para o cliente</Label><Input value={templates.client} onChange={(e) => setTemplates(p => ({ ...p, client: e.target.value }))} /></div>
            <div><Label>Para o profissional</Label><Input value={templates.professional} onChange={(e) => setTemplates(p => ({ ...p, professional: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">Use {"{hora}"} para inserir o horário automaticamente.</p>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar configurações"}</Button>

        {/* Change password */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold mb-3">Trocar senha</h2>
          <div className="space-y-3">
            <div>
              <Label>Nova senha</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div><Label>Confirmar senha</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repita a senha" /></div>
            <Button variant="outline" onClick={changePassword} disabled={changingPw}>{changingPw ? "Atualizando..." : "Atualizar senha"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
