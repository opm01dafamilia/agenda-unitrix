import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    // TODO: supabase.auth.resetPasswordForEmail
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="text-primary">IA</span> agenda
          </Link>
          <p className="text-muted-foreground mt-2">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">✉️</span>
            </div>
            <p className="font-medium mb-2">Email enviado!</p>
            <p className="text-sm text-muted-foreground mb-6">
              Verifique sua caixa de entrada para o link de redefinição.
            </p>
            <Link to="/login">
              <Button variant="outline">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar link de recuperação
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link
            to="/login"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
