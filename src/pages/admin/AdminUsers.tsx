import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id: string) => {
    // Can only delete profile, not auth user from client
    await supabase.from("profiles").delete().eq("id", id);
    toast.success("Perfil removido");
    fetchUsers();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div>
              <div className="font-medium">{u.email}</div>
              <div className="text-sm text-muted-foreground">
                {u.full_name || "Sem nome"} • Roles: {u.user_roles?.map((r: any) => r.role).join(", ") || "nenhuma"}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
