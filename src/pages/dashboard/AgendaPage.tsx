import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Check, X, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-blue-500/20 text-blue-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Finalizado",
};

const timeSlots = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

const AgendaPage = () => {
  const { business, isPremium, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valueDialogId, setValueDialogId] = useState<string | null>(null);
  const [tattooValue, setTattooValue] = useState("");

  // Manual appointment form
  const [manualForm, setManualForm] = useState({
    clientName: "", clientWhatsapp: "", clientCpf: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business.id)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });
    setAppointments(data || []);
  };

  useEffect(() => { fetchAppointments(); }, [business]);

  useEffect(() => {
    if (!selectedDate || !business) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    supabase.from("appointments").select("start_time").eq("business_id", business.id).eq("appointment_date", dateStr)
      .then(({ data }) => setBookedSlots((data || []).map((a: any) => a.start_time?.slice(0, 5))));
  }, [selectedDate, business]);

  const availableSlots = timeSlots.filter(t => !bookedSlots.includes(t));

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "completed") {
      update.completed_at = new Date().toISOString();
      update.completed_by = user?.id;
      // If tattoo, ask for value
      if (business?.industry === "tattoo") {
        setValueDialogId(id);
        return;
      }
    }
    await supabase.from("appointments").update(update).eq("id", id);
    toast.success(`Agendamento ${statusLabels[status]?.toLowerCase()}`);
    fetchAppointments();
  };

  const completeWithValue = async () => {
    if (!valueDialogId) return;
    await supabase.from("appointments").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.id,
      tattoo_value: tattooValue ? parseFloat(tattooValue) : null,
    }).eq("id", valueDialogId);
    toast.success("Agendamento finalizado!");
    setValueDialogId(null);
    setTattooValue("");
    fetchAppointments();
  };

  const createManual = async () => {
    if (!manualForm.clientName || !selectedDate || !selectedTime) {
      toast.error("Preencha nome, data e horário"); return;
    }
    if (!business) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        business_id: business.id,
        client_name: manualForm.clientName,
        client_whatsapp: manualForm.clientWhatsapp.replace(/\D/g, "") || null,
        client_cpf: manualForm.clientCpf.replace(/\D/g, "") || null,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        status: "confirmed",
      });
      if (error) throw error;
      toast.success("Agendamento criado!");
      setDialogOpen(false);
      setManualForm({ clientName: "", clientWhatsapp: "", clientCpf: "" });
      setSelectedDate(undefined);
      setSelectedTime("");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        {isPremium && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo agendamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo agendamento manual</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome do cliente</Label><Input value={manualForm.clientName} onChange={(e) => setManualForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Nome" /></div>
                <div><Label>WhatsApp</Label><Input value={manualForm.clientWhatsapp} onChange={(e) => setManualForm(p => ({ ...p, clientWhatsapp: e.target.value }))} placeholder="(11) 99999-9999" /></div>
                <div><Label>CPF</Label><Input value={manualForm.clientCpf} onChange={(e) => setManualForm(p => ({ ...p, clientCpf: e.target.value }))} placeholder="000.000.000-00" /></div>
                <div>
                  <Label>Data</Label>
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border mx-auto mt-1" />
                </div>
                {selectedDate && (
                  <div>
                    <Label>Horário</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {availableSlots.map((t) => (
                        <button key={t} type="button" onClick={() => setSelectedTime(t)}
                          className={`p-2 rounded-lg border text-sm transition-colors ${selectedTime === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    {availableSlots.length === 0 && <p className="text-sm text-muted-foreground mt-2">Sem horários disponíveis.</p>}
                  </div>
                )}
                <Button className="w-full" onClick={createManual} disabled={submitting}>{submitting ? "Criando..." : "Criar agendamento"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Value dialog for tattoo completion */}
      <Dialog open={!!valueDialogId} onOpenChange={(open) => { if (!open) setValueDialogId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Valor da tatuagem</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Valor cobrado (R$)</Label><Input type="number" value={tattooValue} onChange={(e) => setTattooValue(e.target.value)} placeholder="Ex: 500.00" /></div>
            <Button className="w-full" onClick={completeWithValue}><DollarSign className="w-4 h-4 mr-2" /> Finalizar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {appointments.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border/50 border-dashed">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum agendamento</p>
            <p className="text-sm">Seus agendamentos aparecerão aqui.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{a.client_name || "Cliente"}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(a.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {a.start_time?.slice(0, 5)}
                  </div>
                  {a.body_location && <div className="text-xs text-muted-foreground mt-1">{a.body_location} • {a.size_cm}cm</div>}
                  {a.tattoo_value && <div className="text-xs text-primary mt-1">R$ {Number(a.tattoo_value).toFixed(2)}</div>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                  {statusLabels[a.status]}
                </span>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-green-400" onClick={() => updateStatus(a.id, "confirmed")}>
                    <Check className="w-3 h-3 mr-1" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>
                    <X className="w-3 h-3 mr-1" /> Recusar
                  </Button>
                </div>
              )}
              {a.status === "confirmed" && (
                <Button size="sm" variant="outline" className="mt-3 text-blue-400" onClick={() => updateStatus(a.id, "completed")}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Finalizar
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
