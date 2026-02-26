import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Ban, CheckCircle, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("businesses")
      .select("id, name, industry, email, city, slug, whatsapp, created_at, is_active, owner_id")
      .order("created_at", { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("businesses")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success(currentActive ? "Negócio bloqueado" : "Negócio reativado");
    fetchBusinesses();
    if (selected?.id === id) {
      setSelected((prev: any) => ({ ...prev, is_active: !currentActive }));
    }
  };

  const industryLabels: Record<string, string> = {
    tattoo: "Tatuador",
    barber: "Barbearia",
    salon: "Salão",
  };

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.industry?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q)
    );
  });

  if (selected) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <X className="w-4 h-4" /> Voltar
        </button>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{selected.name}</h2>
            <span className={`px-2 py-1 rounded text-xs font-medium ${selected.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
              {selected.is_active ? "Ativo" : "Bloqueado"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Profissão:</span> <span className="capitalize">{industryLabels[selected.industry] || selected.industry}</span></div>
            <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
            <div><span className="text-muted-foreground">WhatsApp:</span> {selected.whatsapp}</div>
            <div><span className="text-muted-foreground">Cidade:</span> {selected.city || "—"}</div>
            <div><span className="text-muted-foreground">Slug:</span> {selected.slug}</div>
            <div><span className="text-muted-foreground">Owner ID:</span> <span className="font-mono text-xs">{selected.owner_id?.slice(0, 8)}...</span></div>
            <div><span className="text-muted-foreground">Criado em:</span> {format(new Date(selected.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              variant={selected.is_active ? "destructive" : "default"}
              onClick={() => toggleActive(selected.id, selected.is_active)}
            >
              {selected.is_active ? <><Ban className="w-4 h-4 mr-2" /> Bloquear acesso</> : <><CheckCircle className="w-4 h-4 mr-2" /> Reativar acesso</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Negócios</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade, profissão ou email..."
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Profissão</th>
              <th className="text-left px-4 py-3 font-medium">Cidade</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum negócio encontrado.</td></tr>
            ) : (
              filtered.map(b => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{industryLabels[b.industry] || b.industry}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                      {b.is_active ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); toggleActive(b.id, b.is_active); }}
                      >
                        {b.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBusinesses;
