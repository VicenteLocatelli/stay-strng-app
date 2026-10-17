export type PlanId = "base" | "performance" | "elite";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  originalPrice: number;
  highlight?: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "base",
    name: "STAY STRNG BASE",
    price: 67,
    originalPrice: 97,
    features: [
      "Treinos personalizados para academia e casa",
      "Modo Foco e Modo Lista, timer de descanso",
      "Sobrecarga progressiva (veja sua última carga)",
      "Pontos, streak e metas semanais",
      "Hidratação e cardio",
      "BLDNG: peso, medidas e fotos de evolução",
      "Sem dieta (disponível a partir do Performance)",
    ],
  },
  {
    id: "performance",
    name: "STAY STRNG PERFORMANCE",
    price: 127,
    originalPrice: 197,
    highlight: "MAIS POPULAR · LANÇAMENTO",
    features: [
      "Tudo do plano Base",
      "Dieta personalizada com macros calculados",
      "IA de substituições de alimentos 24h",
      "Feedback periódico programado com o coach",
    ],
  },
  {
    id: "elite",
    name: "STAY STRNG ELITE",
    price: 247,
    originalPrice: 397,
    features: [
      "Tudo do plano Performance",
      "Check-in semanal com ajustes frequentes",
      "Análise de vídeo da sua execução",
      "Prioridade máxima no atendimento e suporte direto",
    ],
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PlanId, Plan>,
);

export function planLabel(id: string | null | undefined) {
  const plan = PLAN_BY_ID[(id ?? "base") as PlanId];
  return plan ? plan.name.replace("STAY STRNG ", "") : "BASE";
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const FEEDBACK_INTERVALS = [7, 15, 30] as const;

export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Quadríceps",
  "Posterior de Coxa",
  "Glúteos",
  "Panturrilha",
  "Cardio",
  "Corpo inteiro",
] as const;
