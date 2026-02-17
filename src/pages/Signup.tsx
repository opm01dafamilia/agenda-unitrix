import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const industries = [
  { value: "tattoo", label: "Tatuador", emoji: "🎨" },
  { value: "barber", label: "Barbearia", emoji: "💈" },
  { value: "salon", label: "Salão de Beleza", emoji: "✨" },
];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    industry: "",
    whatsapp: "",
    cpf: "",
    city: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase auth + create business
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="text-primary">IA</span> agenda
          </Link>
          <p className="text-muted-foreground mt-2">
            {step === 1 ? "Crie sua conta" : "Sobre seu negócio"}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 w-12 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
              >
                Próximo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Nome do negócio</Label>
                <Input
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Ex: Studio Ink"
                  required
                />
              </div>
              <div>
                <Label>Profissão</Label>
                <div className="grid grid-cols-3 gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => update("industry", ind.value)}
                      className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                        form.industry === ind.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{ind.emoji}</div>
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => update("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="São Paulo"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button type="submit" className="flex-1">
                  Criar conta
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
