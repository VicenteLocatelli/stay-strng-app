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
      "Acesso completo ao aplicativo (Modo Foco e Histórico)",
      "Treinos personalizados atualizados pelo treinador",
      "Biblioteca completa de exercícios com instruções",
      "Gamificação: níveis, streak e pontos",
      "Registro de cargas e volume de treino",
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
      "Prescrição de treinos avançados focados no objetivo",
      "Acompanhamento de métricas (peso, medidas e gráficos)",
      "Bônus de disciplina e pontuação extra por precisão",
      "Canal de mensagens e feedback periódico programado",
    ],
  },
  {
    id: "elite",
    name: "STAY STRNG ELITE",
    price: 247,
    originalPrice: 397,
    features: [
      "Tudo do plano Performance",
      "Consultoria totalmente individualizada com ajustes frequentes",
      "Acompanhamento de fotos de evolução e metas customizadas",
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
