import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, MessageCircle, CheckCircle, Upload, Image } from "lucide-react";
import { getShowcaseHSL } from "@/lib/businessLabels";

const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const validateCPF = (cpf: string) => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11; if (r === 10) r = 0;
  return r === parseInt(d[10]);
};

const bodyLocations = [
  "Braço", "Antebraço", "Ombro", "Costas", "Peito", "Perna",
  "Coxa", "Panturrilha", "Mão", "Pé", "Pescoço", "Costela", "Outro"
];

const timeSlots = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [clientForm, setClientForm] = useState({
    name: "", cpf: "", whatsapp: "", email: "", city: "",
  });
  const [detailsForm, setDetailsForm] = useState({
    bodyLocation: "", sizeCm: "", hasPrevious: "", observations: "", serviceId: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");

  // Showcase color
  const accentHsl = getShowcaseHSL(business?.showcase_color || "gold");

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: bizData } = await supabase
        .from("businesses_public" as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (bizData) {
        // Fetch full business data for showcase_color
        const { data: fullBiz } = await supabase
          .from("businesses")
          .select("showcase_color")
          .eq("id", (bizData as any).id)
          .maybeSingle();
        
        setBusiness({ ...bizData, showcase_color: (fullBiz as any)?.showcase_color || "gold" });
        const bizId = (bizData as any).id;
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
      }
      setLoading(false);
    };
    if (slug) fetchBusiness();
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !business) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    supabase.from("appointments").select("start_time").eq("business_id", business.id).eq("appointment_date", dateStr)
      .then(({ data }) => setBookedSlots((data || []).map((a: any) => a.start_time?.slice(0, 5))));
  }, [selectedDate, business]);

  const availableSlots = timeSlots.filter(t => !bookedSlots.includes(t));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferencePhoto(file);
      setReferencePreview(URL.createObjectURL(file));
    }
  };

  const goStep2 = () => {
    if (!clientForm.name || !clientForm.cpf || !clientForm.whatsapp) {
      toast.error("Preencha nome, CPF e WhatsApp"); return;
    }
    if (!validateCPF(clientForm.cpf)) { toast.error("CPF inválido"); return; }
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

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("business_id", business.id)
        .eq("cpf", clientForm.cpf.replace(/\D/g, ""))
        .maybeSingle();

      let clientId = existingClient?.id;
      if (!clientId) {
        const { data: newClient, error: clientErr } = await supabase.from("clients").insert({
          business_id: business.id,
          name: clientForm.name,
          cpf: clientForm.cpf.replace(/\D/g, ""),
          whatsapp: clientForm.whatsapp.replace(/\D/g, ""),
          email: clientForm.email || null,
          city: clientForm.city || null,
        }).select("id").single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      const status = business.auto_accept_appointments ? "confirmed" : "pending";

      const { error } = await supabase.from("appointments").insert({
        business_id: business.id,
        client_id: clientId,
        professional_id: selectedProfessional || null,
        service_id: detailsForm.serviceId || null,
        status,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime + ":00",
        body_location: detailsForm.bodyLocation || null,
        size_cm: detailsForm.sizeCm ? parseFloat(detailsForm.sizeCm) : null,
        has_previous_tattoo: detailsForm.hasPrevious === "yes" ? true : detailsForm.hasPrevious === "no" ? false : null,
        observations: detailsForm.observations || null,
        reference_photo_url: photoUrl,
        client_name: clientForm.name,
        client_cpf: clientForm.cpf.replace(/\D/g, ""),
        client_whatsapp: clientForm.whatsapp.replace(/\D/g, ""),
        client_email: clientForm.email || null,
        client_city: clientForm.city || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!business) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Negócio não encontrado</div>;

  const whatsappNumber = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.whatsapp || null
    : null;

  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de agendar pelo IA agenda para ${selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : ""} às ${selectedTime}.${referencePhoto ? " Segue a foto de referência." : ""}`
  );

  // Dynamic accent style
  const accentStyle = { color: `hsl(${accentHsl})` };
  const accentBgStyle = { backgroundColor: `hsl(${accentHsl})` };
  const accentBorderStyle = { borderColor: `hsl(${accentHsl})` };
  const accentBgLightStyle = { backgroundColor: `hsl(${accentHsl} / 0.1)` };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center animate-fade-in max-w-sm">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={accentStyle} />
          <h1 className="text-2xl font-bold mb-2">Agendamento realizado!</h1>
          <p className="text-muted-foreground mb-6">
            {business.auto_accept_appointments ? "Seu horário está confirmado." : "Aguarde a confirmação do profissional."}
          </p>
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
      {/* Gallery background */}
      {gallery.length > 0 && (
        <div className="fixed inset-0 z-0 overflow-hidden opacity-15">
          <div className="flex animate-scroll-x gap-4 h-full items-center">
            {[...gallery, ...gallery].map((img, i) => (
              <img key={i} src={img.image_url} alt="" className="h-64 w-auto rounded-xl object-cover flex-shrink-0" loading="lazy" />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
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

          {/* Gallery showcase */}
          {gallery.length > 0 && step === 1 && (
            <div className="mb-4 -mx-2">
              <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
                {gallery.slice(0, 8).map((img) => (
                  <div key={img.id} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors"
                    style={{ borderColor: `hsl(${accentHsl} / 0.3)` }}>
                    <img src={img.image_url} alt={img.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded-xl bg-card border border-border/50 backdrop-blur-xl">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Seus dados</h2>
                <div><Label>Nome completo *</Label><Input value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" /></div>
                <div><Label>CPF *</Label><Input value={clientForm.cpf} onChange={(e) => setClientForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" /></div>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /></Button>
                  <Button className="flex-1" onClick={goStep3} style={accentBgStyle}>Próximo <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Escolha data e horário</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border mx-auto"
                />
                {selectedDate && (
                  <>
                    <div>
                      <Label>Horários disponíveis</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {availableSlots.map((t) => (
                          <button key={t} type="button" onClick={() => setSelectedTime(t)}
                            className="p-2 rounded-lg border text-sm transition-colors"
                            style={selectedTime === t ? { ...accentBorderStyle, ...accentBgLightStyle, ...accentStyle } : undefined}>
                            {t}
                          </button>
                        ))}
                      </div>
                      {availableSlots.length === 0 && <p className="text-sm text-muted-foreground mt-2">Sem horários disponíveis neste dia.</p>}
                    </div>
                    {professionals.length > 0 && (
                      <div>
                        <Label>Profissional (opcional)</Label>
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

export default PublicBooking;
