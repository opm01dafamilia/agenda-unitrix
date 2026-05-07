/** Returns dynamic labels based on business industry + subtype */
export function getBusinessLabels(industry?: string, subtype?: string | null) {
  if (industry === "design" && subtype === "unha") {
    return {
      agenda: "Atendimentos",
      services: "Serviços de Unha",
      gallery: "Galeria de Unhas",
      servicesPlaceholder: "Ex: Manicure",
    };
  }
  if (industry === "design" && subtype === "sobrancelha") {
    return {
      agenda: "Atendimentos",
      services: "Serviços de Sobrancelha",
      gallery: "Galeria de Sobrancelhas",
      servicesPlaceholder: "Ex: Design de sobrancelha",
    };
  }
  if (industry === "tattoo") {
    return {
      agenda: "Agenda",
      services: "Serviços",
      gallery: "Galeria Vitrine",
      servicesPlaceholder: "Ex: Tatuagem blackwork",
    };
  }
  if (industry === "barber") {
    return {
      agenda: "Agenda",
      services: "Serviços",
      gallery: "Galeria Vitrine",
      servicesPlaceholder: "Ex: Corte masculino",
    };
  }
  return {
    agenda: "Agenda",
    services: "Serviços",
    gallery: "Galeria Vitrine",
    servicesPlaceholder: "Ex: Corte feminino",
  };
}

/** Showcase color palette */
export const showcaseColors = [
  { value: "default", label: "Cor padrão", hsl: "240 5.9% 10%" },
  { value: "gold", label: "Dourado", hsl: "45 93% 47%" },
  { value: "green", label: "Verde", hsl: "142 71% 45%" },
  { value: "blue", label: "Azul", hsl: "217 91% 60%" },
  { value: "purple", label: "Roxo", hsl: "263 70% 50%" },
  { value: "pink", label: "Rosa", hsl: "330 81% 60%" },
] as const;

export function getShowcaseHSL(color: string): string {
  if (color === "default") {
    if (typeof window !== "undefined") {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      if (v) return v;
    }
    return "240 5.9% 10%";
  }
  const found = showcaseColors.find(c => c.value === color);
  return found?.hsl || "45 93% 47%";
}

/** Default services seed for design businesses */
export const designServiceSeeds: Record<string, { name: string; duration: number }[]> = {
  unha: [
    { name: "Manicure", duration: 45 },
    { name: "Pedicure", duration: 60 },
    { name: "Esmaltação em gel", duration: 90 },
    { name: "Alongamento", duration: 90 },
    { name: "Manutenção", duration: 60 },
  ],
  sobrancelha: [
    { name: "Design de sobrancelha", duration: 45 },
    { name: "Henna", duration: 45 },
    { name: "Brow lamination", duration: 60 },
    { name: "Manutenção", duration: 30 },
  ],
};
