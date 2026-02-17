import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Eye, EyeOff, Upload, X, Camera } from "lucide-react";

const SettingsPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [slug, setSlug] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [address, setAddress] = useState({ street: "", number: "", zip: "", neighborhood: "", complement: "" });
  const [templates, setTemplates] = useState({ client: "", professional: "" });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Gallery
  const [gallery, setGallery] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Change password
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (business) {
      setSlug(business.slug);
      setAutoAccept(business.auto_accept_appointments);
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
      // Fetch gallery
      supabase.from("gallery_images").select("*").eq("business_id", business.id).order("sort_order")
        .then(({ data }) => setGallery(data || []));
    }
  }, [business]);

  const publicUrl = `${window.location.origin}/a/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !business) return;
    if (gallery.length + files.length > 50) {
      toast.error("Limite de 50 fotos atingido");
      return;
    }
    setUploadingGallery(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${business.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl: url } } = supabase.storage.from("gallery").getPublicUrl(path);
        await supabase.from("gallery_images").insert({
          business_id: business.id,
          image_url: url,
          sort_order: gallery.length,
        });
      }
      const { data } = await supabase.from("gallery_images").select("*").eq("business_id", business.id).order("sort_order");
      setGallery(data || []);
      toast.success("Fotos adicionadas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (id: string) => {
    await supabase.from("gallery_images").delete().eq("id", id);
    setGallery(prev => prev.filter(g => g.id !== id));
    toast.success("Foto removida!");
  };

  const saveSettings = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, "");
      if (!cleanSlug) { toast.error("Slug inválido"); return; }

      // Check slug availability
      if (cleanSlug !== business.slug) {
        const { data: existing } = await supabase.from("businesses").select("id").eq("slug", cleanSlug).neq("id", business.id).maybeSingle();
        if (existing) { toast.error("Esse link já está em uso"); setSaving(false); return; }
      }

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
        {/* Avatar */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-semibold mb-3">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                <Upload className="w-4 h-4 mr-2" />{uploadingAvatar ? "Enviando..." : "Alterar foto"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Aparece no link público de agendamento</p>
            </div>
          </div>
        </div>

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

        {/* Gallery */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Galeria / Vitrine ({gallery.length}/50)</h2>
            <div>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
              <Button variant="outline" size="sm" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery || gallery.length >= 50}>
                <Upload className="w-4 h-4 mr-2" />{uploadingGallery ? "Enviando..." : "Adicionar fotos"}
              </Button>
            </div>
          </div>
          {gallery.length === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione fotos para aparecer como vitrine no link público.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {gallery.map((img) => (
                <div key={img.id} className="relative group aspect-square">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg" loading="lazy" />
                  <button onClick={() => removeGalleryImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
          <h2 className="font-semibold mb-3">Segurança — Trocar senha</h2>
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
