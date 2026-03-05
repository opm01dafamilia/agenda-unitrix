import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Camera, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { showcaseColors, designServiceSeeds } from "@/lib/businessLabels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const industries = [
  { value: "tattoo", label: "Tatuador" },
  { value: "barber", label: "Barbearia" },
  { value: "salon", label: "Salão de Beleza" },
  { value: "design", label: "Design" },
];

const designSubtypes = [
  { value: "unha", label: "Unha" },
  { value: "sobrancelha", label: "Sobrancelha" },
];

const SettingsPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [address, setAddress] = useState({ street: "", number: "", zip: "", neighborhood: "", complement: "" });
  const [templates, setTemplates] = useState({ client: "", professional: "" });
  const [showcaseColor, setShowcaseColor] = useState("gold");
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Change password
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Profession editor
  const [profIndustry, setProfIndustry] = useState("");
  const [profSubtype, setProfSubtype] = useState("");
  const [savingProf, setSavingProf] = useState(false);
  const [showProfConfirm, setShowProfConfirm] = useState(false);
  const [showSeedButton, setShowSeedButton] = useState(false);
  const [seedingServices, setSeedingServices] = useState(false);

  useEffect(() => {
    if (business) {
      setAvatarUrl(business.avatar_url);
      setShowcaseColor(business.showcase_color || "gold");
      setProfIndustry(business.industry);
      setProfSubtype(business.profession_subtype || "");
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
        showcase_color: showcaseColor,
      } as any).eq("id", business.id);
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

  // Profession save logic
  const handleProfessionSave = () => {
    if (!profIndustry) { toast.error("Selecione uma profissão"); return; }
    if (profIndustry === "design" && !profSubtype) { toast.error("Selecione a subcategoria"); return; }
    setShowProfConfirm(true);
  };

  const confirmProfessionSave = async () => {
    if (!business) return;
    setShowProfConfirm(false);
    setSavingProf(true);
    try {
      const subtypeValue = profIndustry === "design" ? profSubtype : null;
      await supabase.from("businesses").update({
        industry: profIndustry as any,
        profession_subtype: subtypeValue,
      }).eq("id", business.id);

      // If changed to design, check if should seed services
      if (profIndustry === "design" && subtypeValue) {
        const { data: existingServices } = await supabase
          .from("services")
          .select("name")
          .eq("business_id", business.id);

        if (!existingServices || existingServices.length === 0) {
          // No services exist — auto-seed
          const seeds = designServiceSeeds[subtypeValue];
          if (seeds) {
            await supabase.from("services").insert(
              seeds.map(s => ({
                business_id: business.id,
                name: s.name,
                duration_minutes: s.duration,
                service_type: "padrao",
              }))
            );
          }
          toast.success("Profissão atualizada e serviços padrão criados!");
        } else {
          // Services exist — offer seed button
          setShowSeedButton(true);
          toast.success("Profissão atualizada!");
        }
      } else {
        setShowSeedButton(false);
        toast.success("Profissão atualizada!");
      }

      await refreshBusiness();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar profissão");
    } finally {
      setSavingProf(false);
    }
  };

  const seedRecommendedServices = async () => {
    if (!business || !profSubtype) return;
    setSeedingServices(true);
    try {
      const seeds = designServiceSeeds[profSubtype];
      if (!seeds) return;

      const { data: existing } = await supabase
        .from("services")
        .select("name")
        .eq("business_id", business.id);

      const existingNames = new Set((existing || []).map((s: any) => s.name));
      const toInsert = seeds
        .filter(s => !existingNames.has(s.name))
        .map(s => ({
          business_id: business.id,
          name: s.name,
          duration_minutes: s.duration,
          service_type: "padrao",
        }));

      if (toInsert.length > 0) {
        await supabase.from("services").insert(toInsert);
        toast.success(`${toInsert.length} serviço(s) adicionado(s)!`);
      } else {
        toast.info("Todos os serviços recomendados já existem.");
      }
      setShowSeedButton(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSeedingServices(false);
    }
  };

  const professionChanged = business && (profIndustry !== business.industry || (profIndustry === "design" ? profSubtype !== (business.profession_subtype || "") : false));

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

        {/* Profession Editor */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Profissão do Negócio</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Profissão atual: <span className="font-medium text-foreground">{industries.find(i => i.value === business?.industry)?.label || "—"}</span>
            {business?.profession_subtype && (
              <> · <span className="font-medium text-foreground">{designSubtypes.find(s => s.value === business.profession_subtype)?.label}</span></>
            )}
          </p>

          <div className="space-y-3">
            <div>
              <Label>Profissão</Label>
              <Select value={profIndustry} onValueChange={(v) => { setProfIndustry(v); if (v !== "design") setProfSubtype(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {industries.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {profIndustry === "design" && (
              <div>
                <Label>Subcategoria</Label>
                <Select value={profSubtype} onValueChange={setProfSubtype}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {designSubtypes.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleProfessionSave} disabled={savingProf || !professionChanged} className="w-full">
              {savingProf ? "Salvando..." : "Salvar profissão"}
            </Button>

            {showSeedButton && profIndustry === "design" && (
              <Button variant="outline" onClick={seedRecommendedServices} disabled={seedingServices} className="w-full">
                {seedingServices ? "Adicionando..." : "Adicionar serviços recomendados"}
              </Button>
            )}
          </div>
        </div>

        {/* Showcase Color */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Cor da vitrine</h2>
          <p className="text-sm text-muted-foreground mb-3">Escolha a cor de destaque do seu link público.</p>
          <div className="flex gap-3">
            {showcaseColors.map(c => (
              <button
                key={c.value}
                onClick={() => setShowcaseColor(c.value)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${showcaseColor === c.value ? "border-foreground scale-105" : "border-transparent hover:border-border"}`}
              >
                <div className="w-10 h-10 rounded-full border border-border" style={{ backgroundColor: `hsl(${c.hsl})` }} />
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
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

      {/* Profession change confirmation dialog */}
      <AlertDialog open={showProfConfirm} onOpenChange={setShowProfConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Alterar profissão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Alterar a profissão muda textos e sugestões, mas não apaga seus dados (agendamentos, clientes, serviços).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmProfessionSave}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
