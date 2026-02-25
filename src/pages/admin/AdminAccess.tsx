import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminAccess = () => {
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("user_roles").select("*, profiles(email, full_name)").order("created_at", { ascending: false })
      .then(({ data }) => setRoles(data || []));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Acessos</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Usuário</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{(r.profiles as any)?.email || r.user_id}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAccess;
