import { Palette } from "lucide-react";

const ThemesPage = () => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold mb-6">Temas</h1>
    <div className="p-6 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Personalizar cores</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Customize o visual do seu link público e painel.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Cor principal</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary border border-border" />
            <span className="text-sm text-muted-foreground">Dourado</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Cor secundária</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary border border-border" />
            <span className="text-sm text-muted-foreground">Cinza</span>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 p-6 rounded-xl bg-card border border-border/50">
      <h2 className="font-semibold mb-4">Temas por profissão</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tatuador", emoji: "🎨", color: "border-red-500/50" },
          { label: "Barbearia", emoji: "💈", color: "border-blue-500/50" },
          { label: "Salão", emoji: "✨", color: "border-pink-500/50" },
        ].map((theme) => (
          <div
            key={theme.label}
            className={`p-4 rounded-lg border-2 ${theme.color} text-center cursor-pointer hover:bg-accent transition-colors`}
          >
            <div className="text-2xl mb-2">{theme.emoji}</div>
            <div className="text-sm font-medium">{theme.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ThemesPage;
