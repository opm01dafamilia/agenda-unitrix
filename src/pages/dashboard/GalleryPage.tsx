import { useState, useEffect, useRef } from "react";
import { Upload, X, Image, Save, GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getBusinessLabels, getShowcaseHSL } from "@/lib/businessLabels";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number | null;
}

const GalleryPage = () => {
  const { business } = useAuth();
  const labels = getBusinessLabels(business?.industry, business?.profession_subtype);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [localGallery, setLocalGallery] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accentHsl = getShowcaseHSL(business?.showcase_color || "gold");

  const fetchGallery = async () => {
    if (!business) return;
    const { data } = await supabase.from("gallery_images").select("*").eq("business_id", business.id).order("sort_order");
    const items = (data || []) as GalleryItem[];
    setGallery(items);
    setLocalGallery(items.map(i => ({ ...i })));
    setHasChanges(false);
  };

  useEffect(() => { fetchGallery(); }, [business]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !business) return;
    if (localGallery.length + files.length > 50) {
      toast.error("Limite de 50 fotos atingido");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${business.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(path);
        const { data: inserted } = await supabase.from("gallery_images").insert({
          business_id: business.id,
          image_url: publicUrl,
          sort_order: localGallery.length,
        }).select().single();
        if (inserted) {
          setLocalGallery(prev => [...prev, inserted as GalleryItem]);
          setGallery(prev => [...prev, inserted as GalleryItem]);
        }
      }
      toast.success("Fotos adicionadas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setLocalGallery(prev => prev.filter(g => g.id !== id));
    setHasChanges(true);
  };

  const updateCaption = (id: string, caption: string) => {
    setLocalGallery(prev => prev.map(g => g.id === id ? { ...g, caption } : g));
    setHasChanges(true);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localGallery.length) return;
    const items = [...localGallery];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setLocalGallery(items);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!business) return;
    setSaving(true);
    try {
      // Delete removed images
      const localIds = new Set(localGallery.map(g => g.id));
      const removed = gallery.filter(g => !localIds.has(g.id));
      for (const r of removed) {
        await supabase.from("gallery_images").delete().eq("id", r.id);
      }

      // Update captions and sort_order
      for (let i = 0; i < localGallery.length; i++) {
        const item = localGallery[i];
        await supabase.from("gallery_images").update({
          caption: item.caption || null,
          sort_order: i,
        }).eq("id", item.id);
      }

      toast.success("Alterações salvas!");
      await fetchGallery();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{labels.gallery}</h1>
          <p className="text-sm text-muted-foreground mt-1">{localGallery.length}/50 fotos • Aparece no link público</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? "Ocultar" : "Pré-visualizar"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || localGallery.length >= 50}>
            <Upload className="w-4 h-4 mr-2" />{uploading ? "Enviando..." : "Adicionar"}
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && localGallery.length > 0 && (
        <div className="mb-6 rounded-xl border border-border overflow-hidden">
          <div className="p-3 bg-muted/30 border-b border-border flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Pré-visualização do Link Público</span>
          </div>
          <div className="p-4 bg-card">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {localGallery.map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden border-2 transition-colors" style={{ borderColor: `hsl(${accentHsl} / 0.3)` }}>
                  <img src={img.image_url} alt={img.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                  {img.caption && (
                    <div className="relative -mt-8 px-2 pb-1">
                      <span className="text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">{img.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {localGallery.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Adicione fotos para sua vitrine.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {localGallery.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <GripVertical className="w-4 h-4 rotate-180" />
                </button>
                <button onClick={() => moveItem(idx, 1)} disabled={idx === localGallery.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>
              <img src={img.image_url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Input
                  value={img.caption || ""}
                  onChange={e => updateCaption(img.id, e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">#{idx + 1}</span>
              </div>
              <button onClick={() => removeImage(img.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="mt-6">
          <Button className="w-full" onClick={saveChanges} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
