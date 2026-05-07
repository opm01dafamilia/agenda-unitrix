import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, MessageCircle, CheckCircle, Upload, Image, AlertTriangle, MapPin } from "lucide-react";
import { getShowcaseHSL } from "@/lib/businessLabels";
import { getAvailableSlots, type WorkHourEntry, type TimeBlockEntry, type AppointmentEntry } from "@/lib/availabilityUtils";

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const bodyLocations = [
  "Braço", "Antebraço", "Ombro", "Costas", "Peito", "Perna",
  "Coxa", "Panturrilha", "Mão", "Pé", "Pescoço", "Costela", "Outro"
];

const PublicBooking = () => {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [workHours, setWorkHours] = useState<WorkHourEntry[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockEntry[]>([]);
  const [dayAppointments, setDayAppointments] = useState<AppointmentEntry[]>([]);

  // Service availability
  const [serviceAvailDays, setServiceAvailDays] = useState<number[]>([]);
  const [serviceBlockedPeriods, setServiceBlockedPeriods] = useState<{block_start: string; block_end: string}[]>([]);

  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [clientForm, setClientForm] = useState({
    name: "", whatsapp: "", email: "", city: "",
  });
  const [detailsForm, setDetailsForm] = useState({
    bodyLocation: "", sizeCm: "", hasPrevious: "", observations: "", serviceId: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");

  const accentHsl = getShowcaseHSL(business?.showcase_color || "gold");

  useEffect(() => {
    const fetchBusiness = async () => {
      // Hard safety timeout — never stay loading forever
      const safetyTimer = setTimeout(() => {
        if (import.meta.env.DEV) console.warn("[PublicBooking] safety timeout — forcing loading=false");
        setLoading(false);
      }, 12000);
      try {
        if (import.meta.env.DEV) console.log("[PublicBooking] fetching slug:", slug);
        const { data: bizData, error: bizErr } = await supabase
          .from("businesses_public" as any).select("*").eq("slug", slug).maybeSingle();
        if (bizErr) { if (import.meta.env.DEV) console.error("[PublicBooking] biz error:", bizErr); }
        if (bizData) {
          const bizId = (bizData as any).id;
          // Fetch showcase_color in parallel; non-blocking — fallback to gold if it fails
          const showcaseRes = await supabase.from("businesses")
            .select("showcase_color").eq("id", bizId).maybeSingle();
          const merged = Object.assign({}, bizData, { showcase_color: (showcaseRes.data as any)?.showcase_color || "gold" });
          setBusiness(merged);
          if (import.meta.env.DEV) console.log("[PublicBooking] loading services/pros for", bizId);
          const [galRes, prosRes, svcRes] = await Promise.all([
            supabase.from("gallery_images").select("*").eq("business_id", bizId).order("sort_order"),
            supabase.from("professionals").select("*").eq("business_id", bizId).eq("active", true),
            (bizData as any).industry !== "tattoo"
              ? supabase.from("services").select("*").eq("business_id", bizId).eq("active", true)
              : Promise.resolve({ data: [] }),
          ]);
          setGallery(galRes.data || []);
          setProfessionals(prosRes.data || []);
          setServices(svcRes.data || []);
          if (import.meta.env.DEV) console.log("[PublicBooking] loaded:", { gallery: galRes.data?.length, pros: prosRes.data?.length, services: svcRes.data?.length });
        } else {
          if (import.meta.env.DEV) console.log("[PublicBooking] business not found for slug:", slug);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("[PublicBooking] fetch error:", err);
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    };
    if (slug) fetchBusiness();
    else setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (!selectedProfessional) { setWorkHours([]); setTimeBlocks([]); return; }
    Promise.all([
      supabase.from("professional_work_hours").select("weekday, start_time, end_time, is_active")
        .eq("professional_id", selectedProfessional).eq("is_active", true),
      supabase.from("professional_time_blocks").select("block_start, block_end")
        .eq("professional_id", selectedProfessional),
    ]).then(([whRes, tbRes]) => {
      setWorkHours(whRes.data || []);
      setTimeBlocks(tbRes.data || []);
    });
  }, [selectedProfessional]);

  // Fetch service availability when service is selected
  useEffect(() => {
    const serviceId = detailsForm.serviceId;
    if (!serviceId || !business) {
      setServiceAvailDays([]);
      setServiceBlockedPeriods([]);
      return;
    }
    Promise.all([
      supabase.from("service_available_days").select("weekday").eq("service_id", serviceId),
      supabase.from("service_blocked_periods").select("block_start, block_end").eq("service_id", serviceId),
    ]).then(([daysRes, blocksRes]) => {
      setServiceAvailDays((daysRes.data || []).map((d: any) => d.weekday));
      setServiceBlockedPeriods(blocksRes.data || []);
    });
  }, [detailsForm.serviceId, business]);

  useEffect(() => {
    if (!selectedDate || !business) { setDayAppointments([]); return; }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const fetchDay = () => {
      supabase.from("appointments").select("start_time, end_time, calculated_duration_minutes, status")
        .eq("business_id", business.id).eq("appointment_date", dateStr).neq("status", "cancelled")
        .then(({ data }) => setDayAppointments(data || []));
    };
    fetchDay();
    const channel = supabase
      .channel(`appts-${business.id}-${dateStr}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `business_id=eq.${business.id}` }, () => fetchDay())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, business]);

  const serviceDuration = useMemo(() => {
    if (!detailsForm.serviceId) return 30;
    const svc = services.find(s => s.id === detailsForm.serviceId);
    return svc?.duration_minutes || 30;
  }, [detailsForm.serviceId, services]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    if (professionals.length > 0 && !selectedProfessional) return [];
    if (selectedProfessional && workHours.length === 0) return [];
    if (professionals.length === 0) {
      const result = [];
      for (let m = 8 * 60; m < 20 * 60; m += 15) {
        const h = Math.floor(m / 60);
        const mi = m % 60;
        const slot = `${h.toString().padStart(2, "0")}:${mi.toString().padStart(2, "0")}`;
        const occupied = dayAppointments.some(a => {
          if (!a.start_time) return false;
          const [sh, sm] = a.start_time.split(":").map(Number);
          const aStart = sh * 60 + sm;
          const aDur = a.calculated_duration_minutes || 30;
          return m < aStart + aDur && m + serviceDuration > aStart;
        });
        result.push({ slot, available: !occupied });
      }
      return result;
    }
    return getAvailableSlots(selectedDate, workHours, timeBlocks, dayAppointments, serviceDuration);
  }, [selectedDate, workHours, timeBlocks, dayAppointments, serviceDuration, selectedProfessional, professionals]);

  const noWorkHoursConfigured = selectedProfessional && workHours.length === 0;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setReferencePhoto(file); setReferencePreview(URL.createObjectURL(file)); }
  };

  const goStep2 = () => {
    if (!clientForm.name || !clientForm.whatsapp) { toast.error("Preencha nome e WhatsApp"); return; }
    setStep(2);
  };

  const goStep3 = () => {
    if (business?.industry === "tattoo") {
      if (!detailsForm.bodyLocation) { toast.error("Selecione o local do corpo"); return; }
      if (!referencePhoto) { toast.error("Foto de referência obrigatória"); return; }
    }
    if (business?.industry !== "tattoo" && !detailsForm.serviceId && services.length > 0) {
      toast.error("Selecione um serviço"); return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) { toast.error("Selecione data e horário"); return; }
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (referencePhoto && business) {
        const ext = referencePhoto.name.split(".").pop();
        const path = `${business.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("appointments").upload(path, referencePhoto);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("appointments").getPublicUrl(path);
        photoUrl = publicUrl;
      }

      // Anon cannot read clients (RLS); generate a client_id locally so we don't need .select() after insert.
      const whatsappClean = clientForm.whatsapp.replace(/\D/g, "");
      const clientId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
      const { error: clientErr } = await supabase.from("clients").insert({
        id: clientId,
        business_id: business.id, name: clientForm.name,
        cpf: whatsappClean, whatsapp: whatsappClean,
        email: clientForm.email || null, city: clientForm.city || null,
      });
      if (clientErr) {
        if (import.meta.env.DEV) console.error("[PublicBooking] client insert error:", clientErr);
        throw clientErr;
      }

      // Re-check slot conflict right before insert (race-free best-effort)
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: conflicts } = await supabase.from("appointments")
        .select("start_time, calculated_duration_minutes, status")
        .eq("business_id", business.id).eq("appointment_date", dateStr).neq("status", "cancelled");
      const startMin = (() => { const [h,m] = selectedTime.split(":").map(Number); return h*60+m; })();
      const conflict = (conflicts || []).some((a: any) => {
        if (!a.start_time) return false;
        const [sh, sm] = a.start_time.split(":").map(Number);
        const aStart = sh * 60 + sm;
        const aDur = a.calculated_duration_minutes || 30;
        return startMin < aStart + aDur && startMin + serviceDuration > aStart;
      });
      if (conflict) {
        toast.error("Este horário acabou de ser reservado. Escolha outro.");
        setDayAppointments(conflicts as any || []);
        setSelectedTime("");
        setSubmitting(false);
        return;
      }

      const status = business.auto_accept_appointments ? "confirmed" : "pending";
      const { error } = await supabase.from("appointments").insert({
        business_id: business.id, client_id: clientId,
        professional_id: selectedProfessional || null, service_id: detailsForm.serviceId || null,
        status, appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        calculated_duration_minutes: serviceDuration,
        body_location: detailsForm.bodyLocation || null,
        size_cm: detailsForm.sizeCm ? parseFloat(detailsForm.sizeCm) : null,
        has_previous_tattoo: detailsForm.hasPrevious === "yes" ? true : detailsForm.hasPrevious === "no" ? false : null,
        observations: detailsForm.observations || null, reference_photo_url: photoUrl,
        client_name: clientForm.name,
        client_whatsapp: whatsappClean,
        client_email: clientForm.email || null, client_city: clientForm.city || null,
      });
      if (error) {
        if (import.meta.env.DEV) console.error("[PublicBooking] appointment insert error:", error);
        throw error;
      }
      toast.success("Agendamento confirmado!");
      setDone(true);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[PublicBooking] submit error:", err);
      const msg = err?.message || "Erro ao agendar. Tente novamente em instantes.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Carregando agendamento...</p>
      </div>
    </div>
  );
  if (!business) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-2">Link de agendamento indisponível</h2>
        <p className="text-muted-foreground text-sm mb-4">Não foi possível carregar esta página agora.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    </div>
  );

  const selectedPro = professionals.find(p => p.id === selectedProfessional);
  const whatsappNumber = selectedPro?.whatsapp || null;
  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de agendar pelo IA agenda para ${selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : ""} às ${selectedTime}.${referencePhoto ? " Segue a foto de referência." : ""}`
  );

  const accentStyle = { color: `hsl(${accentHsl})` };
  const accentBgStyle = { backgroundColor: `hsl(${accentHsl})` };
  const accentBorderStyle = { borderColor: `hsl(${accentHsl})` };
  const accentBgLightStyle = { backgroundColor: `hsl(${accentHsl} / 0.1)` };

  const proAddress = selectedPro?.address_line
    ? `${selectedPro.address_line}${selectedPro.address_city ? `, ${selectedPro.address_city}` : ""}${selectedPro.address_state ? ` - ${selectedPro.address_state}` : ""}`
    : null;
  const mapsUrl = proAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(proAddress)}` : null;

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in max-w-sm">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={accentStyle} />
          <h1 className="text-2xl font-bold mb-2">Agendamento realizado! 🎉</h1>
          <p className="text-muted-foreground mb-1">
            {selectedDate && <><strong>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</strong> às <strong>{selectedTime}</strong></>}
          </p>
          <p className="text-muted-foreground mb-4 text-sm">
            {business.auto_accept_appointments
              ? "Seu horário está confirmado. Até lá!"
              : "Aguarde a confirmação do profissional. Você será avisado."}
          </p>
          {/* Address summary */}
          {selectedPro && (
            <div className="mb-4 p-4 rounded-xl border border-border bg-card text-left">
              <p className="font-medium text-sm mb-1">{selectedPro.name}</p>
              {proAddress ? (
                <>
                  <p className="text-sm text-muted-foreground">{proAddress}</p>
                  {selectedPro.address_reference && (
                    <p className="text-xs text-muted-foreground mt-0.5">Ref: {selectedPro.address_reference}</p>
                  )}
                  <a href={mapsUrl!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm mt-2" style={accentStyle}>
                    <MapPin className="w-3 h-3" /> Abrir no Maps
                  </a>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Endereço não informado pelo profissional.</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">Chegue com 10 min de antecedência.</p>
            </div>
          )}
          {(whatsappNumber || business.whatsapp) && (
            <a href={`https://wa.me/55${whatsappNumber || business.whatsapp}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full" style={accentBgStyle}>
                <MessageCircle className="w-4 h-4 mr-2" /> Chamar no WhatsApp
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Gallery Marquee Background */}
      {gallery.length > 0 && <GalleryMarquee gallery={gallery} accentHsl={accentHsl} />}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            {business.avatar_url && (
              <img src={business.avatar_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2" style={{ borderColor: `hsl(${accentHsl} / 0.5)` }} />
            )}
            <h1 className="text-xl font-bold">{business.name}</h1>
            <p className="text-muted-foreground text-sm">{business.city}</p>
            <div className="flex gap-2 justify-center mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="h-1 w-10 rounded-full transition-colors"
                  style={s <= step ? accentBgStyle : { backgroundColor: "hsl(var(--muted))" }} />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border/50 backdrop-blur-xl">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Seus dados</h2>
                <div><Label>Nome completo *</Label><Input value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" /></div>
                <div><Label>WhatsApp *</Label><Input value={clientForm.whatsapp} onChange={(e) => setClientForm(p => ({ ...p, whatsapp: formatPhone(e.target.value) }))} placeholder="(11) 99999-9999" /></div>
                <div><Label>Email</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" /></div>
                <div><Label>Cidade</Label><Input value={clientForm.city} onChange={(e) => setClientForm(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo" /></div>
                <Button className="w-full" onClick={goStep2} style={accentBgStyle}>
                  Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {business.industry === "tattoo" ? (
                  <>
                    <h2 className="font-semibold">Sobre a tatuagem</h2>
                    <div>
                      <Label>Local do corpo *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {bodyLocations.map((loc) => (
                          <button key={loc} type="button" onClick={() => setDetailsForm(p => ({ ...p, bodyLocation: loc }))}
                            className="p-2 rounded-lg border text-xs transition-colors"
                            style={detailsForm.bodyLocation === loc ? { ...accentBorderStyle, ...accentBgLightStyle, ...accentStyle } : undefined}>
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div><Label>Tamanho (cm)</Label><Input type="number" value={detailsForm.sizeCm} onChange={(e) => setDetailsForm(p => ({ ...p, sizeCm: e.target.value }))} placeholder="Ex: 15" /></div>
                    <div>
                      <Label>Já fez tatuagem antes?</Label>
                      <div className="flex gap-2 mt-1">
                        {[{ v: "yes", l: "Sim" }, { v: "no", l: "Não" }].map((o) => (
                          <button key={o.v} type="button" onClick={() => setDetailsForm(p => ({ ...p, hasPrevious: o.v }))}
                            className="flex-1 p-2 rounded-lg border text-sm"
                            style={detailsForm.hasPrevious === o.v ? { ...accentBorderStyle, ...accentBgLightStyle, ...accentStyle } : undefined}>
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Foto de referência *</Label>
                      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      {referencePreview ? (
                        <div className="mt-2 relative">
                          <img src={referencePreview} alt="Referência" className="w-full h-40 object-cover rounded-lg border border-border" />
                          <button onClick={() => { setReferencePhoto(null); setReferencePreview(null); }}
                            className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => photoRef.current?.click()} className="mt-2 w-full h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-opacity-50 transition-colors"
                          style={{ borderColor: `hsl(${accentHsl} / 0.3)` }}>
                          <Image className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">Toque para enviar foto</span>
                        </button>
                      )}
                    </div>
                    <div><Label>Observações</Label><Input value={detailsForm.observations} onChange={(e) => setDetailsForm(p => ({ ...p, observations: e.target.value }))} placeholder="Detalhes sobre o desenho" /></div>
                  </>
                ) : (
                  <>
                    <h2 className="font-semibold">Escolha o serviço</h2>
                    <div className="space-y-2">
                      {services.map((s) => (
                        <button key={s.id} type="button" onClick={() => setDetailsForm(p => ({ ...p, serviceId: s.id }))}
                          className="w-full p-3 rounded-lg border text-left transition-colors"
                          style={detailsForm.serviceId === s.id ? { ...accentBorderStyle, ...accentBgLightStyle } : undefined}>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.duration_minutes}min{s.price ? ` • R$ ${Number(s.price).toFixed(2)}` : ""}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {professionals.length > 0 && (
                  <div>
                    <Label>Profissional</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {professionals.map((p) => (
                        <button key={p.id} type="button" onClick={() => setSelectedProfessional(p.id)}
                          className="p-2 rounded-lg border text-sm"
                          style={selectedProfessional === p.id ? { ...accentBorderStyle, ...accentBgLightStyle, ...accentStyle } : undefined}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /></Button>
                  <Button className="flex-1" onClick={goStep3} style={accentBgStyle}>Próximo <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Escolha data e horário</h2>
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                  disabled={(date) => {
                    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                    // Filter by service available days (if configured)
                    if (serviceAvailDays.length > 0 && !serviceAvailDays.includes(date.getDay())) return true;
                    // Filter by service blocked periods
                    const dateStr = format(date, "yyyy-MM-dd");
                    if (serviceBlockedPeriods.some(b => dateStr >= b.block_start && dateStr <= b.block_end)) return true;
                    return false;
                  }}
                  className="rounded-md border mx-auto pointer-events-auto" />
                {selectedDate && (
                  <>
                    {noWorkHoursConfigured && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Este profissional ainda não configurou seus horários. Entre em contato diretamente.</span>
                      </div>
                    )}
                    {!noWorkHoursConfigured && (
                      <div>
                        <Label>Horários disponíveis</Label>
                        {professionals.length > 0 && !selectedProfessional ? (
                          <p className="text-sm text-muted-foreground mt-1">Selecione um profissional na etapa anterior.</p>
                        ) : slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-2">Nenhum horário disponível para esta data. Tente outro dia.</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 mt-1">
                            {slots.map(({ slot, available }) => (
                              <button key={slot} type="button" onClick={() => available && setSelectedTime(slot)}
                                disabled={!available}
                                title={!available ? "Horário indisponível" : undefined}
                                aria-label={!available ? `${slot} - Horário indisponível` : slot}
                                className={`p-2 rounded-lg border text-sm transition-colors ${
                                  !available ? "border-destructive/40 bg-destructive/15 text-destructive cursor-not-allowed opacity-70 line-through" : "hover:bg-accent"
                                }`}
                                style={selectedTime === slot && available ? { ...accentBorderStyle, ...accentBgLightStyle, ...accentStyle } : undefined}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /></Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={submitting} style={accentBgStyle}>
                    {submitting ? "Agendando..." : "Confirmar agendamento"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Gallery Marquee Component ---
const GalleryMarquee = ({ gallery, accentHsl }: { gallery: any[]; accentHsl: string }) => {
  const rows = useMemo(() => {
    if (gallery.length <= 4) return [gallery];
    if (gallery.length <= 8) {
      const mid = Math.ceil(gallery.length / 2);
      return [gallery.slice(0, mid), gallery.slice(mid)];
    }
    const third = Math.ceil(gallery.length / 3);
    return [gallery.slice(0, third), gallery.slice(third, third * 2), gallery.slice(third * 2)];
  }, [gallery]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden opacity-15 flex flex-col justify-center gap-3">
      {rows.map((row, rowIdx) => {
        const doubled = [...row, ...row, ...row, ...row];
        const direction = rowIdx % 2 === 0 ? "left" : "right";
        const duration = 30 + rowIdx * 10;
        return (
          <div key={rowIdx} className="marquee-row relative overflow-hidden" style={{ "--marquee-duration": `${duration}s`, "--marquee-direction": direction === "left" ? "normal" : "reverse" } as React.CSSProperties}>
            <div className="marquee-track flex gap-3">
              {doubled.map((img, i) => (
                <img key={`${img.id}-${i}`} src={img.image_url} alt={img.caption || ""}
                  className="h-40 w-auto rounded-xl object-cover flex-shrink-0 border-2"
                  style={{ borderColor: `hsl(${accentHsl} / 0.2)` }}
                  loading="lazy" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicBooking;
