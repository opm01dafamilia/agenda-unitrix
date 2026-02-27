import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_roles: { id: string; role: string }[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, user_roles(id, role)")
      .order("created_at", { ascending: false });
    setUsers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, currentRole: string | null) => {
    const newRole = currentRole === "adm" ? null : "adm";

    if (currentRole === "adm") {
      // Remove adm role
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "adm");
      toast.success("Role alterada para usuário comum");
    } else {
      // Add adm role
      await supabase.from("user_roles").insert({ user_id: userId, role: "adm" as any });
      toast.success("Role alterada para admin");
    }

    // Log the action
    await supabase.from("admin_logs" as any).insert({
      event_type: "role_change",
      source: "admin",
      payload: { user_id: userId, from: currentRole || "user", to: newRole ? "adm" : "user" },
    });

    fetchUsers();
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => {
            const role = u.user_roles?.find((r: any) => r.role === "adm") ? "adm" : "user";
            return (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === "adm" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {role === "adm" ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.full_name || "Sem nome"}</div>
                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                  </div>
                </div>
                <Select value={role} onValueChange={() => changeRole(u.id, role === "adm" ? "adm" : null)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="adm">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
