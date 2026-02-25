import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("businesses").select("id, name, industry, email, city, created_at").order("created_at", { ascending: false })
      .then(({ data }) => setBusinesses(data || []));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Negócios</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Profissão</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Cidade</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{b.industry}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.city || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBusinesses;
