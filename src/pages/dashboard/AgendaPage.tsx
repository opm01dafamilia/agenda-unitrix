import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Check, X, CheckCircle } from "lucide-react";
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

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

const timeSlots = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

const AgendaPage = () => {
  const { business, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ clientName: "", clientWhatsapp: "" });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("appointments").select("*").eq("business_id", business.id)
      .order("appointment_date", { ascending: true }).order("start_time", { ascending: true });
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
    }
    await supabase.from("appointments").update(update).eq("id", id);
    toast.success(`Agendamento ${statusLabels[status]?.toLowerCase()}`);
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
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        status: "confirmed",
      });
      if (error) throw error;
      toast.success("Agendamento criado!");
      setDialogOpen(false);
      setManualForm({ clientName: "", clientWhatsapp: "" });
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome do cliente</Label><Input value={manualForm.clientName} onChange={e => setManualForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Nome" /></div>
              <div><Label>WhatsApp</Label><Input value={manualForm.clientWhatsapp} onChange={e => setManualForm(p => ({ ...p, clientWhatsapp: e.target.value }))} placeholder="(11) 99999-9999" /></div>
              <div>
                <Label>Data</Label>
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                  disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border mx-auto mt-1" />
              </div>
              {selectedDate && (
                <div>
                  <Label>Horário</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {availableSlots.map(t => (
                      <button key={t} type="button" onClick={() => setSelectedTime(t)}
                        className={`p-2 rounded-lg border text-sm transition-colors ${selectedTime === t ? "border-foreground bg-accent" : "border-border hover:border-foreground/30"}`}>
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
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
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
