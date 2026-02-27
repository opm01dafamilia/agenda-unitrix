import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, ShieldCheck, ShieldOff, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  active: { label: "Ativo", icon: ShieldCheck, color: "text-green-500" },
  blocked: { label: "Bloqueado", icon: ShieldOff, color: "text-destructive" },
  trial: { label: "Trial", icon: Clock, color: "text-yellow-500" },
};

const AdminAccess = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("access_control" as any)
      .select("*")
      .order("created_at", { ascending: false });

    // Enrich with profile data
    const enriched = await Promise.all(
      (data || []).map(async (rec: any) => {
        const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", rec.user_id).maybeSingle();
        return { ...rec, profile };
      })
    );
    setRecords(enriched);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("access_control" as any).update({ status }).eq("id", id);
    await supabase.from("admin_logs" as any).insert({
      event_type: "access_status_change",
      source: "admin",
      payload: { access_control_id: id, new_status: status },
    });
    toast.success(`Status alterado para ${statusConfig[status]?.label || status}`);
    fetch();
  };

  const createManual = async () => {
    if (!newEmail) { toast.error("Informe o email"); return; }
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", newEmail).maybeSingle();
    if (!profile) { toast.error("Usuário não encontrado"); return; }

    const { error } = await supabase.from("access_control" as any).insert({
      user_id: profile.id,
      status: newStatus,
      source: "manual",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Acesso criado");
    setDialogOpen(false);
    setNewEmail("");
    fetch();
  };

  const filtered = records.filter(r =>
    (r.profile?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.profile?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Acessos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Criar acesso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar acesso manual</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Email do usuário</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@email.com" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={createManual}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por email ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg = statusConfig[r.status] || statusConfig.active;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.profile?.full_name || r.profile?.email || r.user_id}</div>
                    <div className="text-sm text-muted-foreground">{r.profile?.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.source} • {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              Nenhum acesso encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAccess;
