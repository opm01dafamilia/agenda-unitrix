import { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, Plus, Check, X, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAvailableSlots, type WorkHourEntry, type TimeBlockEntry, type AppointmentEntry } from "@/lib/availabilityUtils";

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", cancelled: "Cancelado", completed: "Concluído",
};

const AgendaPage = () => {
  const { business, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [tattooSize, setTattooSize] = useState("");
  const [tattooComplexity, setTattooComplexity] = useState("");
  const [observations, setObservations] = useState("");

  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [complexityFactors, setComplexityFactors] = useState<any[]>([]);
  const [durationRules, setDurationRules] = useState<any[]>([]);

  // Availability data
  const [workHours, setWorkHours] = useState<WorkHourEntry[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockEntry[]>([]);
  const [dayAppointments, setDayAppointments] = useState<AppointmentEntry[]>([]);

  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);
  const [cleanupMinutes, setCleanupMinutes] = useState<number>(0);

  const fetchAppointments = async () => {
    if (!business) return;
    const { data } = await supabase.from("appointments").select("*").eq("business_id", business.id)
      .order("appointment_date").order("start_time");
    setAppointments(data || []);
  };

  const fetchData = async () => {
    if (!business) return;
    const [sRes, pRes, cRes] = await Promise.all([
      supabase.from("services").select("*").eq("business_id", business.id).eq("active", true),
      supabase.from("professionals").select("*").eq("business_id", business.id).eq("active", true),
      supabase.from("tattoo_complexity_factors").select("*").eq("business_id", business.id).order("factor"),
    ]);
    setServices(sRes.data || []);
    setProfessionals(pRes.data || []);
    setComplexityFactors(cRes.data || []);
  };

  useEffect(() => { fetchAppointments(); fetchData(); }, [business]);

  // Fetch work hours when professional changes
  useEffect(() => {
    if (!selectedProfessional) { setWorkHours([]); return; }
    supabase.from("professional_work_hours").select("weekday, start_time, end_time, is_active")
      .eq("professional_id", selectedProfessional).eq("is_active", true)
      .then(({ data }) => setWorkHours(data || []));
  }, [selectedProfessional]);

  // Fetch blocks when professional changes
  useEffect(() => {
    if (!selectedProfessional) { setTimeBlocks([]); return; }
    supabase.from("professional_time_blocks").select("block_start, block_end")
      .eq("professional_id", selectedProfessional)
      .then(({ data }) => setTimeBlocks(data || []));
  }, [selectedProfessional]);

  // Fetch duration rules when service changes
  useEffect(() => {
    if (!selectedService || !business) { setDurationRules([]); return; }
    const svc = services.find(s => s.id === selectedService);
    if (svc?.service_type !== "tatuagem_variavel") { setDurationRules([]); return; }
    supabase.from("tattoo_duration_rules").select("*")
      .eq("business_id", business.id).eq("service_id", selectedService).eq("is_active", true).order("cm_min")
      .then(({ data }) => setDurationRules(data || []));
  }, [selectedService, business, services]);

  // Fetch day appointments when date changes
  useEffect(() => {
    if (!selectedDate || !business) { setDayAppointments([]); return; }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    supabase.from("appointments").select("start_time, end_time, calculated_duration_minutes, status")
      .eq("business_id", business.id).eq("appointment_date", dateStr).neq("status", "cancelled")
      .then(({ data }) => setDayAppointments(data || []));
  }, [selectedDate, business]);

  // Calculate duration
  useEffect(() => {
    const svc = services.find(s => s.id === selectedService);
    if (!svc) { setCalculatedDuration(null); setCleanupMinutes(0); return; }
    if (svc.service_type === "tatuagem_variavel" && tattooSize) {
      const size = parseInt(tattooSize);
      const rule = durationRules.find(r => size >= r.cm_min && size <= r.cm_max);
      if (rule) {
        let base = rule.base_minutes;
        if (tattooComplexity) {
          const cf = complexityFactors.find(c => c.label === tattooComplexity);
          if (cf) base = Math.ceil(base * Number(cf.factor));
        }
        setCalculatedDuration(base + (rule.cleanup_minutes || 0));
        setCleanupMinutes(rule.cleanup_minutes || 0);
      } else { setCalculatedDuration(null); setCleanupMinutes(0); }
    } else {
      setCalculatedDuration(svc.duration_minutes);
      setCleanupMinutes(0);
    }
  }, [selectedService, tattooSize, tattooComplexity, durationRules, complexityFactors, services]);

  // Available slots
  const slots = useMemo(() => {
    if (!selectedDate) return [];
    const dur = calculatedDuration || 30;
    // If no professional selected but there are professionals, show no slots (need to select)
    if (professionals.length > 0 && !selectedProfessional) return [];
    if (selectedProfessional && workHours.length === 0) return [];
    // If no professionals exist, show basic time grid (no availability filtering)
    if (professionals.length === 0) {
      // Fallback: show all slots from 08:00 to 20:00, only filter by existing appointments
      const allSlots = [];
      for (let m = 8 * 60; m < 20 * 60; m += 15) {
        const h = Math.floor(m / 60);
        const mi = m % 60;
        const slot = `${h.toString().padStart(2, "0")}:${mi.toString().padStart(2, "0")}`;
        const occupied = dayAppointments.some(a => {
          if (!a.start_time) return false;
          const [sh, sm] = a.start_time.split(":").map(Number);
          const aStart = sh * 60 + sm;
          const aDur = a.calculated_duration_minutes || 30;
          return m < aStart + aDur && m + dur > aStart;
        });
        allSlots.push({ slot, available: !occupied });
      }
      return allSlots;
    }
    return getAvailableSlots(selectedDate, workHours, timeBlocks, dayAppointments, dur);
  }, [selectedDate, workHours, timeBlocks, dayAppointments, calculatedDuration, selectedProfessional, professionals]);

  const noWorkHoursConfigured = selectedProfessional && workHours.length === 0;

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "completed") {
      update.completed_at = new Date().toISOString();
      update.completed_by = user?.id;
    }
    await supabase.from("appointments").update(update).eq("id", id);
    toast.success(`Agendamento ${statusLabels[status]?.toLowerCase() || status}!`);
    fetchAppointments();
  };

  const resetForm = () => {
    setClientName(""); setClientWhatsapp(""); setSelectedService("");
    setSelectedProfessional(""); setTattooSize(""); setTattooComplexity("");
    setObservations(""); setSelectedDate(undefined); setSelectedTime("");
    setCalculatedDuration(null); setCleanupMinutes(0);
  };

  const createAppointment = async () => {
    if (!clientName || !selectedDate || !selectedTime) {
      toast.error("Preencha nome, data e horário"); return;
    }
    if (!business) return;
    setSubmitting(true);
    try {
      const svc = services.find(s => s.id === selectedService);
      const dur = calculatedDuration || svc?.duration_minutes || 30;
      const [h, m] = selectedTime.split(":").map(Number);
      const endMin = h * 60 + m + dur;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00`;

      const { error } = await supabase.from("appointments").insert({
        business_id: business.id,
        client_name: clientName,
        client_whatsapp: clientWhatsapp.replace(/\D/g, "") || null,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        end_time: endTime,
        service_id: selectedService || null,
        professional_id: selectedProfessional || null,
        observations: observations || null,
        status: "confirmed",
        tattoo_size_cm: tattooSize ? parseInt(tattooSize) : null,
        tattoo_complexity_label: tattooComplexity || null,
        calculated_duration_minutes: dur,
        cleanup_minutes: cleanupMinutes || null,
      });
      if (error) throw error;
      toast.success("Agendamento criado!");
      setDialogOpen(false);
      resetForm();
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentService = services.find(s => s.id === selectedService);
  const isVariable = currentService?.service_type === "tatuagem_variavel";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome do cliente</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome" /></div>
              <div><Label>WhatsApp</Label><Input value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value)} placeholder="(11) 99999-9999" /></div>

              {professionals.length > 0 && (
                <div>
                  <Label>Profissional</Label>
                  <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {services.length > 0 && (
                <div>
                  <Label>Serviço</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.service_type === "tatuagem_variavel" ? "(variável)" : `(${s.duration_minutes}min)`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isVariable && (
                <>
                  <div>
                    <Label>Tamanho (cm)</Label>
                    <Input type="number" value={tattooSize} onChange={e => setTattooSize(e.target.value)} placeholder="Ex: 15" />
                    {durationRules.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Faixas: {durationRules.map(r => `${r.cm_min}–${r.cm_max}cm`).join(", ")}
                      </p>
                    )}
                  </div>
                  {complexityFactors.length > 0 && (
                    <div>
                      <Label>Complexidade</Label>
                      <Select value={tattooComplexity} onValueChange={setTattooComplexity}>
                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                        <SelectContent>
                          {complexityFactors.map(c => <SelectItem key={c.id} value={c.label}>{c.label} (×{Number(c.factor).toFixed(1)})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {calculatedDuration && (
                <div className="p-3 rounded-lg bg-accent/50 border border-accent flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium">Duração estimada: {calculatedDuration}min</span>
                    {cleanupMinutes > 0 && <span className="text-muted-foreground"> (inclui {cleanupMinutes}min limpeza)</span>}
                  </div>
                </div>
              )}

              <div><Label>Observações</Label><Input value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas..." /></div>

              <div>
                <Label>Data</Label>
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                  disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border mx-auto mt-1 pointer-events-auto" />
              </div>

              {selectedDate && noWorkHoursConfigured && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Configure os horários de trabalho deste profissional na aba Profissionais → Disponibilidade.</span>
                </div>
              )}

              {selectedDate && !noWorkHoursConfigured && (
                <div>
                  <Label>Horário</Label>
                  {professionals.length > 0 && !selectedProfessional ? (
                    <p className="text-sm text-muted-foreground mt-1">Selecione um profissional para ver horários.</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">Nenhum horário disponível para esta data.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {slots.map(({ slot, available }) => (
                        <button key={slot} type="button" onClick={() => available && setSelectedTime(slot)}
                          disabled={!available}
                          className={`p-2 rounded-lg border text-sm transition-colors ${
                            selectedTime === slot
                              ? "border-foreground bg-accent font-medium"
                              : available
                                ? "border-border hover:border-foreground/30"
                                : "border-destructive/30 bg-destructive/10 text-destructive cursor-not-allowed"
                          }`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" onClick={createAppointment} disabled={submitting}>
                {submitting ? "Criando..." : "Criar agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {appointments.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum agendamento</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map(a => (
            <div key={a.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-medium">{a.client_name || "Cliente"}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(a.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {a.start_time?.slice(0, 5)}
                    {a.end_time && ` — ${a.end_time.slice(0, 5)}`}
                    {a.calculated_duration_minutes && ` (${a.calculated_duration_minutes}min)`}
                  </div>
                  {a.tattoo_size_cm && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.tattoo_size_cm}cm {a.tattoo_complexity_label && `• ${a.tattoo_complexity_label}`}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  a.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" :
                  a.status === "completed" ? "bg-muted text-muted-foreground" :
                  a.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {statusLabels[a.status]}
                </span>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "confirmed")}><Check className="w-3 h-3 mr-1" /> Aceitar</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "cancelled")}><X className="w-3 h-3 mr-1" /> Recusar</Button>
                </div>
              )}
              {a.status === "confirmed" && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => updateStatus(a.id, "completed")}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Concluir
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaPage;
