import { useState, useEffect, useCallback } from "react";
import { Scissors, Plus, Trash2, Clock, ChevronDown, ChevronUp, Settings2, CalendarDays, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getBusinessLabels } from "@/lib/businessLabels";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

interface ServiceAvailableDay {
  id: string;
  weekday: number;
  is_active: boolean;
}

interface ServiceBlockedPeriod {
  id: string;
  block_start: string;
  block_end: string;
  reason: string | null;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const ServicesPage = () => {
  const { business } = useAuth();
  const isTattoo = business?.industry === "tattoo";
  const labels = getBusinessLabels(business?.industry, business?.profession_subtype);
  const [services, setServices] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [serviceType, setServiceType] = useState("padrao");
  const [adding, setAdding] = useState(false);

  // Tattoo complexity factors
  const [complexityFactors, setComplexityFactors] = useState<ComplexityFactor[]>([]);
  const [complexityDialog, setComplexityDialog] = useState(false);
  const [newComplexity, setNewComplexity] = useState({ label: "", factor: "1.0" });

  // Duration rules
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [durationRules, setDurationRules] = useState<Record<string, DurationRule[]>>({});
  const [newRule, setNewRule] = useState({ cm_min: "", cm_max: "", base_minutes: "", cleanup_minutes: "15" });

  // Availability
  const [availabilityData, setAvailabilityData] = useState<Record<string, ServiceAvailableDay[]>>({});
  const [blockedPeriods, setBlockedPeriods] = useState<Record<string, ServiceBlockedPeriod[]>>({});
  const [blockStartDate, setBlockStartDate] = useState<Date | undefined>();
  const [blockEndDate, setBlockEndDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");

  const fetchServices = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("created_at");
    setServices(data || []);
  }, [business]);

  const fetchComplexity = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase.from("tattoo_complexity_factors").select("*").eq("business_id", business.id).order("factor");
    setComplexityFactors(data || []);
  }, [business]);

  const fetchRulesForService = async (serviceId: string) => {
    if (!business) return;
    const { data } = await supabase.from("tattoo_duration_rules").select("*")
      .eq("business_id", business.id).eq("service_id", serviceId).order("cm_min");
    setDurationRules(prev => ({ ...prev, [serviceId]: data || [] }));
  };

  const fetchAvailability = async (serviceId: string) => {
    if (!business) return;
    const [daysRes, blocksRes] = await Promise.all([
      supabase.from("service_available_days").select("*")
        .eq("service_id", serviceId).eq("business_id", business.id),
      supabase.from("service_blocked_periods").select("*")
        .eq("service_id", serviceId).eq("business_id", business.id).order("block_start"),
    ]);
    setAvailabilityData(prev => ({ ...prev, [serviceId]: daysRes.data || [] }));
    setBlockedPeriods(prev => ({ ...prev, [serviceId]: blocksRes.data || [] }));
  };

  useEffect(() => {
    fetchServices();
    if (isTattoo) fetchComplexity();
  }, [business, fetchServices, fetchComplexity, isTattoo]);

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

  const updateDuration = async (id: string, newDuration: string) => {
    const mins = parseInt(newDuration);
    if (!mins || mins < 5) return;
    await supabase.from("services").update({ duration_minutes: mins }).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, duration_minutes: mins } : s));
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

  // Availability
  const toggleExpand = (serviceId: string) => {
    if (expandedService === serviceId) {
      setExpandedService(null);
    } else {
      setExpandedService(serviceId);
      if (!durationRules[serviceId]) fetchRulesForService(serviceId);
      if (!availabilityData[serviceId]) fetchAvailability(serviceId);
    }
  };

  const toggleWeekday = async (serviceId: string, weekday: number) => {
    if (!business) return;
    const days = availabilityData[serviceId] || [];
    const existing = days.find(d => d.weekday === weekday);

    if (existing) {
      await supabase.from("service_available_days").delete().eq("id", existing.id);
    } else {
      await supabase.from("service_available_days").insert({
        service_id: serviceId,
        business_id: business.id,
        weekday,
        is_active: true,
      });
    }
    fetchAvailability(serviceId);
  };

  const addBlockedPeriod = async (serviceId: string) => {
    if (!blockStartDate || !blockEndDate) { toast.error("Selecione as datas de início e fim"); return; }
    if (!business) return;
    await supabase.from("service_blocked_periods").insert({
      service_id: serviceId,
      business_id: business.id,
      block_start: format(blockStartDate, "yyyy-MM-dd"),
      block_end: format(blockEndDate, "yyyy-MM-dd"),
      reason: blockReason || null,
    });
    setBlockStartDate(undefined);
    setBlockEndDate(undefined);
    setBlockReason("");
    toast.success("Período bloqueado!");
    fetchAvailability(serviceId);
  };

  const removeBlockedPeriod = async (blockId: string, serviceId: string) => {
    await supabase.from("service_blocked_periods").delete().eq("id", blockId);
    toast.success("Bloqueio removido!");
    fetchAvailability(serviceId);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{labels.services}</h1>
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

      {/* Add service form */}
      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Adicionar serviço</h2>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder={labels.servicesPlaceholder} /></div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
            </div>
          </div>
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
          <Button onClick={addService} disabled={adding}><Plus className="w-4 h-4 mr-2" />{adding ? "Adicionando..." : "Adicionar"}</Button>
        </div>
      </div>

      {/* Services list */}
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
          {services.map(s => {
            const isExpanded = expandedService === s.id;
            const days = availabilityData[s.id] || [];
            const blocks = blockedPeriods[s.id] || [];
            const activeDays = days.map(d => d.weekday);
            const hasDaysConfig = days.length > 0;

            return (
              <div key={s.id} className="rounded-xl bg-card border border-border/50">
                {/* Service header - focus on duration */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      {s.service_type === "tatuagem_variavel" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground">Variável</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={s.active} onCheckedChange={() => toggleActive(s.id, s.active)} />
                      <Button variant="ghost" size="icon" onClick={() => removeService(s.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Duration row - prominent */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {s.service_type === "tatuagem_variavel" ? (
                        <span className="text-sm text-muted-foreground">Duração por tamanho/complexidade</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="w-20 h-8 text-sm"
                            value={s.duration_minutes}
                            onChange={e => updateDuration(s.id, e.target.value)}
                            min={5}
                          />
                          <span className="text-sm text-muted-foreground">min</span>
                        </div>
                      )}
                    </div>

                    {/* Availability summary */}
                    <div className="flex items-center gap-1">
                      {hasDaysConfig ? (
                        <span className="text-xs text-muted-foreground">
                          {activeDays.map(d => WEEKDAY_LABELS[d]).join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Todos os dias</span>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(s.id)} className="gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-5">
                    {/* Tattoo duration rules */}
                    {isTattoo && s.service_type === "tatuagem_variavel" && (
                      <div>
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

                    {/* Availability - Days of week */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Dias disponíveis</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Selecione os dias em que este serviço pode ser agendado. Se nenhum dia for selecionado, o serviço ficará disponível todos os dias.
                      </p>
                      <div className="flex gap-1.5">
                        {WEEKDAY_LABELS.map((label, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleWeekday(s.id, idx)}
                            className={cn(
                              "flex-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                              activeDays.includes(idx)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-foreground/30"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blocked periods */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Ban className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Períodos bloqueados</h3>
                      </div>

                      {blocks.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {blocks.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
                              <div>
                                <span className="font-medium">
                                  {format(new Date(b.block_start + "T12:00:00"), "dd/MM/yyyy")} — {format(new Date(b.block_end + "T12:00:00"), "dd/MM/yyyy")}
                                </span>
                                {b.reason && <span className="text-muted-foreground ml-2">({b.reason})</span>}
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeBlockedPeriod(b.id, s.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">De</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !blockStartDate && "text-muted-foreground")}>
                                {blockStartDate ? format(blockStartDate, "dd/MM/yyyy") : "Início"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={blockStartDate} onSelect={setBlockStartDate} locale={ptBR}
                                disabled={d => d < new Date(new Date().setHours(0,0,0,0))}
                                className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-xs">Até</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !blockEndDate && "text-muted-foreground")}>
                                {blockEndDate ? format(blockEndDate, "dd/MM/yyyy") : "Fim"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={blockEndDate} onSelect={setBlockEndDate} locale={ptBR}
                                disabled={d => d < (blockStartDate || new Date(new Date().setHours(0,0,0,0)))}
                                className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-xs">Motivo</Label>
                          <Input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Opcional" className="h-9" />
                        </div>
                      </div>
                      <Button size="sm" className="mt-2" onClick={() => addBlockedPeriod(s.id)}>
                        <Plus className="w-3 h-3 mr-1" /> Bloquear período
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
