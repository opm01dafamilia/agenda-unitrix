import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Camera, Eye, EyeOff } from "lucide-react";

const SettingsPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [address, setAddress] = useState({ street: "", number: "", zip: "", neighborhood: "", complement: "" });
  const [templates, setTemplates] = useState({ client: "", professional: "" });
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Change password
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (business) {
      setAvatarUrl(business.avatar_url);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${business.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl: url } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("businesses").update({ avatar_url: url }).eq("id", business.id);
      setAvatarUrl(url);
      toast.success("Avatar atualizado!");
      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveSettings = async () => {
    if (!business) return;
    setSaving(true);
    try {
      await supabase.from("businesses").update({
        address_street: address.street || null,
        address_number: address.number || null,
        address_zip: address.zip || null,
        address_neighborhood: address.neighborhood || null,
        address_complement: address.complement || null,
        message_template_client: templates.client,
        message_template_professional: templates.professional,
      }).eq("id", business.id);
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
      setPasswords({ new: "", confirm: "" });
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
        {/* Avatar */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                <Upload className="w-4 h-4 mr-2" />{uploadingAvatar ? "Enviando..." : "Alterar foto"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Aparece no link público</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Endereço</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Rua</Label><Input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} /></div>
            <div><Label>Número</Label><Input value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} /></div>
            <div><Label>CEP</Label><Input value={address.zip} onChange={e => setAddress(p => ({ ...p, zip: e.target.value }))} /></div>
            <div><Label>Bairro</Label><Input value={address.neighborhood} onChange={e => setAddress(p => ({ ...p, neighborhood: e.target.value }))} /></div>
            <div><Label>Complemento</Label><Input value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))} /></div>
          </div>
        </div>

        {/* Message templates */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Mensagens automáticas</h2>
          <div className="space-y-3">
            <div><Label>Para o cliente</Label><Input value={templates.client} onChange={e => setTemplates(p => ({ ...p, client: e.target.value }))} /></div>
            <div><Label>Para o profissional</Label><Input value={templates.professional} onChange={e => setTemplates(p => ({ ...p, professional: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">Use {"{hora}"} para inserir o horário.</p>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar configurações"}</Button>

        {/* Change password */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Segurança — Trocar senha</h2>
          <div className="space-y-3">
            <div>
              <Label>Nova senha</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div><Label>Confirmar senha</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repita a senha" /></div>
            <Button variant="outline" onClick={changePassword} disabled={changingPw}>{changingPw ? "Atualizando..." : "Atualizar senha"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
