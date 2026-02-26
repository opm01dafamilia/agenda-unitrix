import { useState, useEffect } from "react";
import { Scissors, Plus, Trash2, Clock, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DurationRule {
  id: string;
  cm_min: number;
  cm_max: number;
  base_minutes: number;
  cleanup_minutes: number;
  is_active: boolean;
}

interface ComplexityFactor {
  id: string;
  label: string;
  factor: number;
}

const ServicesPage = () => {
  const { business } = useAuth();
  const isTattoo = business?.industry === "tattoo";
  const [services, setServices] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [serviceType, setServiceType] = useState("padrao");
  const [adding, setAdding] = useState(false);

  // Tattoo complexity factors (per business)
  const [complexityFactors, setComplexityFactors] = useState<ComplexityFactor[]>([]);
  const [complexityDialog, setComplexityDialog] = useState(false);
  const [newComplexity, setNewComplexity] = useState({ label: "", factor: "1.0" });

  // Duration rules (per service)
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [durationRules, setDurationRules] = useState<Record<string, DurationRule[]>>({});
  const [newRule, setNewRule] = useState({ cm_min: "", cm_max: "", base_minutes: "", cleanup_minutes: "15" });

  const fetchServices = async () => {
    if (!business) return;
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("created_at");
    setServices(data || []);
  };

  const fetchComplexity = async () => {
    if (!business) return;
    const { data } = await supabase.from("tattoo_complexity_factors").select("*").eq("business_id", business.id).order("factor");
    setComplexityFactors(data || []);
  };

  const fetchRulesForService = async (serviceId: string) => {
    if (!business) return;
    const { data } = await supabase.from("tattoo_duration_rules").select("*")
      .eq("business_id", business.id).eq("service_id", serviceId).order("cm_min");
    setDurationRules(prev => ({ ...prev, [serviceId]: data || [] }));
  };

  useEffect(() => {
    fetchServices();
    if (isTattoo) fetchComplexity();
  }, [business]);

  const addService = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!business) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("services").insert({
        business_id: business.id,
        name: name.trim(),
        duration_minutes: parseInt(duration) || 30,
        service_type: isTattoo ? serviceType : "padrao",
      });
      if (error) throw error;
      setName(""); setDuration("30"); setServiceType("padrao");
      toast.success("Serviço adicionado!");
      fetchServices();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("services").update({ active: !active }).eq("id", id);
    fetchServices();
  };

  const removeService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    toast.success("Serviço removido!");
    fetchServices();
  };

  // Complexity factors
  const addComplexity = async () => {
    if (!newComplexity.label.trim()) { toast.error("Label obrigatório"); return; }
    if (!business) return;
    await supabase.from("tattoo_complexity_factors").insert({
      business_id: business.id,
      label: newComplexity.label.trim(),
      factor: parseFloat(newComplexity.factor) || 1.0,
    });
    setNewComplexity({ label: "", factor: "1.0" });
    toast.success("Complexidade adicionada!");
    fetchComplexity();
  };

  const removeComplexity = async (id: string) => {
    await supabase.from("tattoo_complexity_factors").delete().eq("id", id);
    toast.success("Removido!");
    fetchComplexity();
  };

  // Duration rules
  const toggleExpand = (serviceId: string) => {
    if (expandedService === serviceId) {
      setExpandedService(null);
    } else {
      setExpandedService(serviceId);
      if (!durationRules[serviceId]) fetchRulesForService(serviceId);
    }
  };

  const addDurationRule = async (serviceId: string) => {
    if (!newRule.cm_min || !newRule.cm_max || !newRule.base_minutes) {
      toast.error("Preencha faixa e tempo base"); return;
    }
    if (!business) return;
    await supabase.from("tattoo_duration_rules").insert({
      business_id: business.id,
      service_id: serviceId,
      cm_min: parseInt(newRule.cm_min),
      cm_max: parseInt(newRule.cm_max),
      base_minutes: parseInt(newRule.base_minutes),
      cleanup_minutes: parseInt(newRule.cleanup_minutes) || 0,
    });
    setNewRule({ cm_min: "", cm_max: "", base_minutes: "", cleanup_minutes: "15" });
    toast.success("Regra adicionada!");
    fetchRulesForService(serviceId);
  };

  const removeRule = async (ruleId: string, serviceId: string) => {
    await supabase.from("tattoo_duration_rules").delete().eq("id", ruleId);
    toast.success("Regra removida!");
    fetchRulesForService(serviceId);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Serviços</h1>
        {isTattoo && (
          <Dialog open={complexityDialog} onOpenChange={setComplexityDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Settings2 className="w-4 h-4 mr-2" /> Complexidades</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Fatores de Complexidade</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground mb-3">Define multiplicadores para o tempo base (ex: Detalhado = 1.5x).</p>
              <div className="space-y-2 mb-4">
                {complexityFactors.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div><span className="font-medium">{c.label}</span> <span className="text-muted-foreground ml-2">×{Number(c.factor).toFixed(1)}</span></div>
                    <Button variant="ghost" size="icon" onClick={() => removeComplexity(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                {complexityFactors.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma complexidade cadastrada. Sugestão: Simples (1.0), Médio (1.2), Detalhado (1.5)</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Label</Label><Input value={newComplexity.label} onChange={e => setNewComplexity(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Detalhado" /></div>
                <div><Label>Fator (×)</Label><Input type="number" step="0.1" value={newComplexity.factor} onChange={e => setNewComplexity(p => ({ ...p, factor: e.target.value }))} placeholder="1.5" /></div>
              </div>
              <Button className="w-full mt-2" onClick={addComplexity}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Adicionar serviço</h2>
        <div className="grid gap-3">
          <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder={isTattoo ? "Ex: Tatuagem blackwork" : "Ex: Corte masculino"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duração padrão (min)</Label><Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" /></div>
            {isTattoo && (
              <div>
                <Label>Tipo</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Duração fixa</SelectItem>
                    <SelectItem value="tatuagem_variavel">Duração variável (por tamanho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={addService} disabled={adding}><Plus className="w-4 h-4 mr-2" />{adding ? "Adicionando..." : "Adicionar"}</Button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum serviço</p>
            <p className="text-sm">Adicione serviços para seus clientes agendarem.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    {s.service_type === "tatuagem_variavel" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground">Variável</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.service_type === "tatuagem_variavel" ? "Duração por tamanho/complexidade" : `${s.duration_minutes}min`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.active} onCheckedChange={() => toggleActive(s.id, s.active)} />
                  {isTattoo && s.service_type === "tatuagem_variavel" && (
                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(s.id)}>
                      {expandedService === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removeService(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>

              {/* Duration Rules Panel */}
              {expandedService === s.id && s.service_type === "tatuagem_variavel" && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Regras de duração</h3>
                  </div>

                  {(durationRules[s.id] || []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {(durationRules[s.id] || []).map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
                          <div>
                            <span className="font-medium">{rule.cm_min}–{rule.cm_max}cm</span>
                            <span className="text-muted-foreground ml-3">{rule.base_minutes}min base</span>
                            {rule.cleanup_minutes > 0 && <span className="text-muted-foreground ml-2">+ {rule.cleanup_minutes}min limpeza</span>}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id, s.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div><Label className="text-xs">cm mín</Label><Input type="number" value={newRule.cm_min} onChange={e => setNewRule(p => ({ ...p, cm_min: e.target.value }))} placeholder="5" /></div>
                    <div><Label className="text-xs">cm máx</Label><Input type="number" value={newRule.cm_max} onChange={e => setNewRule(p => ({ ...p, cm_max: e.target.value }))} placeholder="15" /></div>
                    <div><Label className="text-xs">Base (min)</Label><Input type="number" value={newRule.base_minutes} onChange={e => setNewRule(p => ({ ...p, base_minutes: e.target.value }))} placeholder="120" /></div>
                    <div><Label className="text-xs">Limpeza (min)</Label><Input type="number" value={newRule.cleanup_minutes} onChange={e => setNewRule(p => ({ ...p, cleanup_minutes: e.target.value }))} placeholder="15" /></div>
                  </div>
                  <Button size="sm" className="mt-2" onClick={() => addDurationRule(s.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar regra
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
