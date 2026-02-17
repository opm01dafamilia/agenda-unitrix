import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar, Link2, Image, Users, Palette, CheckCircle,
  ArrowRight, Sparkles, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Gerencie agendamentos com calendário visual e aprovação automática." },
  { icon: Link2, title: "Link público", desc: "Compartilhe seu link e receba agendamentos 24h por dia." },
  { icon: Image, title: "Galeria vitrine", desc: "Mostre seu trabalho com galeria animada no link público." },
  { icon: Users, title: "Multi-profissionais", desc: "Adicione sua equipe com WhatsApp individual." },
  { icon: Palette, title: "Temas personalizados", desc: "Customize cores e visual por profissão." },
  { icon: CheckCircle, title: "Aprovação de agenda", desc: "Aceite ou recuse agendamentos com um toque." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">IA</span> agenda
          </Link>
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Começar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />

        <div className="container mx-auto text-center max-w-4xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Agendamento profissional
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              Sua agenda{" "}
              <span className="text-primary">premium</span>
              <br />
              num só lugar
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Para tatuadores, barbearias e salões de beleza. Link público,
              galeria, aprovação automática e muito mais.
            </p>

            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                Criar minha agenda <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Tudo que você precisa</h2>
            <p className="text-muted-foreground">Ferramentas pensadas para seu negócio crescer.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <f.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Plano Premium</h2>
            <p className="text-muted-foreground">Um único plano com tudo incluso.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
              <h3 className="font-semibold mb-2">Mensal</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-primary">R$ 37</span>
                <span className="text-muted-foreground text-sm"> /1º mês</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Depois R$ 97/mês</p>
              <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
                <Button className="w-full">Assinar mensal</Button>
              </a>
            </div>
            <div className="p-6 rounded-xl bg-card border-2 border-primary/50 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Melhor valor
              </div>
              <h3 className="font-semibold mb-2">Anual</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-primary">R$ 747</span>
                <span className="text-muted-foreground text-sm"> /1º ano</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Depois R$ 1.164/ano</p>
              <a href="https://pay.kiwify.com.br/9VbCkJt" target="_blank" rel="noopener noreferrer">
                <Button className="w-full">Assinar anual</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para profissionalizar sua agenda?
          </h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta em minutos e comece a receber agendamentos.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Começar agora <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2026 IA agenda. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
