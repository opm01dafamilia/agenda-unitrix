import { useState, useEffect } from "react";
import { UserPlus, Trash2, Phone, Clock, CalendarOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const timeOptions = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
}).filter((_, i) => i < 37); // 06:00 to 23:30

interface WorkHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface TimeBlock {
  id: string;
  block_start: string;
  block_end: string;
  reason: string | null;
}

const ProfessionalsPage = () => {
  const { business } = useAuth();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);

  const fetchPros = async () => {
    if (!business) return;
    const { data } = await supabase.from("professionals").select("*").eq("business_id", business.id).order("created_at");
    setProfessionals(data || []);
  };

  useEffect(() => { fetchPros(); }, [business]);

  const addPro = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!business) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("professionals").insert({
        business_id: business.id,
        name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, "") || null,
      });
      if (error) throw error;
      setName(""); setWhatsapp("");
      toast.success("Profissional adicionado!");
      fetchPros();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("professionals").update({ active: !active }).eq("id", id);
    fetchPros();
  };

  const deletePro = async (id: string) => {
    await supabase.from("professionals").delete().eq("id", id);
    toast.success("Removido!");
    fetchPros();
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profissionais</h1>

      <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
        <h2 className="font-semibold mb-3">Adicionar profissional</h2>
        <div className="grid gap-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do profissional" /></div>
          <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" /></div>
          <Button onClick={addPro} disabled={adding}><UserPlus className="w-4 h-4 mr-2" />{adding ? "Adicionando..." : "Adicionar"}</Button>
        </div>
      </div>

      {professionals.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum profissional</p>
            <p className="text-sm">Adicione profissionais da sua equipe.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map((p) => (
            <div key={p.id} className="rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="cursor-pointer flex-1" onClick={() => setSelectedPro(selectedPro === p.id ? null : p.id)}>
                  <div className="font-medium">{p.name}</div>
                  {p.whatsapp && <div className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{p.whatsapp}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPro(selectedPro === p.id ? null : p.id)}>
                    <Clock className="w-4 h-4 mr-1" /> Disponibilidade
                  </Button>
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id, p.active)} />
                  <Button variant="ghost" size="icon" onClick={() => deletePro(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              {selectedPro === p.id && (
                <div className="border-t border-border p-4">
                  <AvailabilityPanel professionalId={p.id} businessId={business!.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Availability Panel ---
const AvailabilityPanel = ({ professionalId, businessId }: { professionalId: string; businessId: string }) => {
  return (
    <Tabs defaultValue="hours" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="hours" className="flex-1"><Clock className="w-3 h-3 mr-1" /> Horário Semanal</TabsTrigger>
        <TabsTrigger value="blocks" className="flex-1"><CalendarOff className="w-3 h-3 mr-1" /> Bloqueios</TabsTrigger>
      </TabsList>
      <TabsContent value="hours"><WeeklyHoursEditor professionalId={professionalId} businessId={businessId} /></TabsContent>
      <TabsContent value="blocks"><BlocksEditor professionalId={professionalId} businessId={businessId} /></TabsContent>
    </Tabs>
  );
};

// --- Weekly Hours Editor ---
const WeeklyHoursEditor = ({ professionalId, businessId }: { professionalId: string; businessId: string }) => {
  const [hours, setHours] = useState<WorkHour[]>([]);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from("professional_work_hours").select("*")
      .eq("professional_id", professionalId).order("weekday").order("start_time");
    setHours(data || []);
  };

  useEffect(() => { fetch(); }, [professionalId]);

  const addInterval = async (weekday: number) => {
    const { error } = await supabase.from("professional_work_hours").insert({
      business_id: businessId,
      professional_id: professionalId,
      weekday,
      start_time: "09:00",
      end_time: "18:00",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Intervalo adicionado!");
    fetch();
  };

  const updateInterval = async (id: string, field: string, value: any) => {
    await supabase.from("professional_work_hours").update({ [field]: value }).eq("id", id);
    fetch();
  };

  const removeInterval = async (id: string) => {
    await supabase.from("professional_work_hours").delete().eq("id", id);
    toast.success("Intervalo removido!");
    fetch();
  };

  const hoursByDay = WEEKDAYS.map((_, i) => hours.filter(h => h.weekday === i));

  return (
    <div className="space-y-3 mt-3">
      {WEEKDAYS.map((day, i) => {
        const dayHours = hoursByDay[i];
        return (
          <div key={i} className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{day}</span>
              <Button variant="ghost" size="sm" onClick={() => addInterval(i)}>
                <Plus className="w-3 h-3 mr-1" /> Intervalo
              </Button>
            </div>
            {dayHours.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem horário definido (dia indisponível)</p>
            )}
            {dayHours.map(h => (
              <div key={h.id} className="flex items-center gap-2 mb-1">
                <Switch checked={h.is_active} onCheckedChange={(v) => updateInterval(h.id, "is_active", v)} />
                <select className="bg-background border border-input rounded px-2 py-1 text-sm"
                  value={h.start_time.slice(0, 5)} onChange={e => updateInterval(h.id, "start_time", e.target.value)}>
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-muted-foreground text-xs">até</span>
                <select className="bg-background border border-input rounded px-2 py-1 text-sm"
                  value={h.end_time.slice(0, 5)} onChange={e => updateInterval(h.id, "end_time", e.target.value)}>
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeInterval(h.id)}>
                  <X className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// --- Blocks Editor ---
const BlocksEditor = ({ professionalId, businessId }: { professionalId: string; businessId: string }) => {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchBlocks = async () => {
    const { data } = await supabase.from("professional_time_blocks").select("*")
      .eq("professional_id", professionalId).order("block_start", { ascending: false });
    setBlocks(data || []);
  };

  useEffect(() => { fetchBlocks(); }, [professionalId]);

  const createBlock = async () => {
    if (!selectedDate) { toast.error("Selecione uma data"); return; }
    if (blockEnd <= blockStart) { toast.error("Hora fim deve ser maior que hora início"); return; }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const bStart = new Date(`${dateStr}T${blockStart}:00`);
    const bEnd = new Date(`${dateStr}T${blockEnd}:00`);

    // Check overlap
    const dayBlocks = blocks.filter(b => {
      const bs = new Date(b.block_start);
      return format(bs, "yyyy-MM-dd") === dateStr;
    });
    const overlaps = dayBlocks.some(b => {
      const bs = new Date(b.block_start).getTime();
      const be = new Date(b.block_end).getTime();
      return bStart.getTime() < be && bEnd.getTime() > bs;
    });
    if (overlaps) { toast.error("Já existe um bloqueio nesse horário"); return; }

    setCreating(true);
    try {
      const { error } = await supabase.from("professional_time_blocks").insert({
        business_id: businessId,
        professional_id: professionalId,
        block_start: bStart.toISOString(),
        block_end: bEnd.toISOString(),
        reason: reason.trim() || null,
      });
      if (error) throw error;
      toast.success("Bloqueio criado!");
      setReason("");
      fetchBlocks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeBlock = async (id: string) => {
    await supabase.from("professional_time_blocks").delete().eq("id", id);
    toast.success("Bloqueio removido!");
    fetchBlocks();
  };

  // Filter blocks for selected date
  const filteredBlocks = selectedDate
    ? blocks.filter(b => format(new Date(b.block_start), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
    : blocks.slice(0, 20);

  return (
    <div className="space-y-4 mt-3">
      <div>
        <Label>Data do bloqueio</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
              {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
              className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>

      {selectedDate && (
        <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
          <h4 className="text-sm font-semibold">Fechar horário em {format(selectedDate, "dd/MM", { locale: ptBR })}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Início</Label>
              <select className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm"
                value={blockStart} onChange={e => setBlockStart(e.target.value)}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <select className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm"
                value={blockEnd} onChange={e => setBlockEnd(e.target.value)}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><Label className="text-xs">Motivo (opcional)</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Almoço, Compromisso" /></div>
          <Button size="sm" onClick={createBlock} disabled={creating} className="w-full">
            <CalendarOff className="w-3 h-3 mr-1" /> {creating ? "Criando..." : "Fechar horário"}
          </Button>
        </div>
      )}

      {/* Block list */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{selectedDate ? `Bloqueios em ${format(selectedDate, "dd/MM", { locale: ptBR })}` : "Bloqueios recentes"}</h4>
        {filteredBlocks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum bloqueio{selectedDate ? " neste dia" : ""}.</p>
        ) : (
          <div className="space-y-1">
            {filteredBlocks.map(b => (
              <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                <div>
                  <span className="font-medium">{format(new Date(b.block_start), "dd/MM HH:mm")} — {format(new Date(b.block_end), "HH:mm")}</span>
                  {b.reason && <span className="text-muted-foreground ml-2">({b.reason})</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeBlock(b.id)} className="text-destructive hover:text-destructive">
                  <X className="w-3 h-3 mr-1" /> Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalsPage;
