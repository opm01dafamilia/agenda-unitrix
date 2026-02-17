const SettingsPage = () => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold mb-6">Configurações</h1>
    <div className="space-y-4">
      {[
        { title: "Link público", desc: "Configure seu link de agendamento público." },
        { title: "Foto de perfil", desc: "Sua foto aparecerá no link público." },
        { title: "Galeria", desc: "Até 50 fotos do seu trabalho para exibir no link público." },
        { title: "Trocar senha", desc: "Altere sua senha de acesso." },
        { title: "Horários de funcionamento", desc: "Defina seus dias e horários de atendimento." },
        { title: "Endereço", desc: "Rua, número e CEP do local de trabalho." },
        { title: "Aprovação automática", desc: "Aceitar agendamentos automaticamente ou exigir aprovação." },
        { title: "Mensagens automáticas", desc: "Templates de mensagens para clientes e profissionais." },
      ].map((section) => (
        <div
          key={section.title}
          className="p-5 rounded-xl bg-card border border-border/50"
        >
          <h2 className="font-semibold mb-1">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default SettingsPage;
