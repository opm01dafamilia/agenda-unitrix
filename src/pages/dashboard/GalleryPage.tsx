import { useState, useEffect, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GalleryPage = () => {
  const { business } = useAuth();
  const [gallery, setGallery] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    if (!business) return;
    const { data } = await supabase.from("gallery_images").select("*").eq("business_id", business.id).order("sort_order");
    setGallery(data || []);
  };

  useEffect(() => { fetchGallery(); }, [business]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !business) return;
    if (gallery.length + files.length > 50) {
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
        await supabase.from("gallery_images").insert({
          business_id: business.id,
          image_url: publicUrl,
          sort_order: gallery.length,
        });
      }
      toast.success("Fotos adicionadas!");
      fetchGallery();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: string) => {
    await supabase.from("gallery_images").delete().eq("id", id);
    setGallery(prev => prev.filter(g => g.id !== id));
    toast.success("Foto removida!");
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Galeria Vitrine</h1>
          <p className="text-sm text-muted-foreground mt-1">{gallery.length}/50 fotos • Aparece no link público</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || gallery.length >= 50}>
            <Upload className="w-4 h-4 mr-2" />{uploading ? "Enviando..." : "Adicionar"}
          </Button>
        </div>
      </div>

      {gallery.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Adicione fotos para sua vitrine.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {gallery.map(img => (
            <div key={img.id} className="relative group aspect-square">
              <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg" loading="lazy" />
              <button onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
