import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ClientsPage = () => {
  const { business } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!business) return;
    supabase.from("clients").select("*").eq("business_id", business.id).order("created_at", { ascending: false })
      .then(({ data }) => setClients(data || []));
  }, [business]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search) ||
    c.whatsapp?.includes(search)
  );

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum cliente ainda</p>
            <p className="text-sm">Seus clientes aparecerão aqui após o primeiro agendamento.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.whatsapp} • {c.city}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
