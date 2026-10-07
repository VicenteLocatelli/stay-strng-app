/**
 * Lógica nutricional da aba Dieta, espelhando a planilha Plan-Diet:
 * TMB (4 métodos), fator de atividade, GED, calorias de treino/descanso e macros.
 */

export const TMB_METHODS = [
  { id: "mifflin", label: "Mifflin-St Jeor" },
  { id: "harris", label: "Harris-Benedict (revisado)" },
  { id: "katch", label: "Katch-McArdle" },
  { id: "tinsley", label: "Tinsley" },
] as const;
export type TmbMethod = (typeof TMB_METHODS)[number]["id"];

export const ACTIVITY_FACTORS = [
  { value: 1.1, label: "Sedentário (1.1)" },
  { value: 1.3, label: "Levemente ativo (1.3)" },
  { value: 1.5, label: "Moderadamente ativo (1.5)" },
  { value: 1.7, label: "Muito ativo (1.7)" },
  { value: 1.9, label: "Extremamente ativo (1.9)" },
] as const;

export const DIET_GOALS = [
  { id: "cut", label: "Definição (déficit calórico)" },
  { id: "maintain", label: "Manutenção" },
  { id: "bulk", label: "Ganho de massa (superávit)" },
] as const;

/** Padrões de distribuição de macros inspirados na aba "Padrões" da Plan-Diet. */
export const MACRO_PRESETS = [
  { id: "balanced", label: "Equilibrado 30/40/30", protein_pct: 30, carbs_pct: 40, fat_pct: 30 },
  { id: "high_protein", label: "Alta proteína 35/35/30", protein_pct: 35, carbs_pct: 35, fat_pct: 30 },
  { id: "low_carb", label: "Low carb 35/25/40", protein_pct: 35, carbs_pct: 25, fat_pct: 40 },
  { id: "high_carb", label: "Alto carbo 25/55/20", protein_pct: 25, carbs_pct: 55, fat_pct: 20 },
] as const;

export type DietInputs = {
  sex?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  bodyFat?: number | null;
};

export function leanMassKg(weightKg?: number | null, bodyFat?: number | null) {
  if (!weightKg) return null;
  if (bodyFat == null) return null;
  return weightKg * (1 - bodyFat / 100);
}

/** TMB em kcal/dia conforme o método escolhido. */
export function computeTmb(method: TmbMethod, input: DietInputs): number | null {
  const w = input.weightKg;
  if (!w) return null;
  const h = input.heightCm;
  const a = input.age;
  const male = (input.sex ?? "male") !== "female";
  const lean = leanMassKg(w, input.bodyFat) ?? w * (male ? 0.8 : 0.75);

  switch (method) {
    case "mifflin": {
      if (!h || !a) return null;
      return 10 * w + 6.25 * h - 5 * a + (male ? 5 : -161);
    }
    case "harris": {
      if (!h || !a) return null;
      return male
        ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
        : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a;
    }
    case "katch":
      return 370 + 21.6 * lean;
    case "tinsley":
      return 24.8 * lean + 10;
  }
}

export type CaloriePlan = {
  tmb: number;
  tdee: number;
  kcalTraining: number;
  kcalRest: number;
};

/**
 * GED (TDEE) = TMB × fator de atividade.
 * Ajuste de meta aplica déficit (cut) ou superávit (bulk) nos dois tipos de dia;
 * dia de descanso usa um ajuste levemente menor (5 p.p. a menos), como na Plan-Diet.
 */
export function computeCalories(args: {
  tmb: number;
  activityFactor: number;
  goal: string;
  adjustPct: number;
}): CaloriePlan {
  const tdee = args.tmb * args.activityFactor;
  const dir = args.goal === "cut" ? -1 : args.goal === "bulk" ? 1 : 0;
  const adjTraining = (dir * args.adjustPct) / 100;
  // Dia de descanso sempre recebe 5 p.p. a menos de calorias que o dia de treino
  // (déficit maior no cut, superávit menor no bulk).
  const adjRest = adjTraining - 0.05;
  return {
    tmb: args.tmb,
    tdee,
    kcalTraining: tdee * (1 + adjTraining),
    kcalRest: tdee * (1 + adjRest),
  };
}

/** Converte percentuais de macro em gramas para um alvo calórico. */
export function macroGrams(kcal: number, proteinPct: number, carbsPct: number, fatPct: number) {
  return {
    protein_g: (kcal * proteinPct) / 100 / 4,
    carbs_g: (kcal * carbsPct) / 100 / 4,
    fat_g: (kcal * fatPct) / 100 / 9,
  };
}

export type FoodMacros = {
  kcal: number;
  protein_animal_g: number;
  protein_veg_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  portion_g: number;
};

/** Totais de um item: quantidade em gramas sobre a porção-base do alimento. */
export function itemTotals(food: FoodMacros, quantityG: number) {
  const ratio = quantityG / (food.portion_g || 100);
  return {
    kcal: food.kcal * ratio,
    protein_g: (food.protein_animal_g + food.protein_veg_g) * ratio,
    fat_g: food.fat_g * ratio,
    carbs_g: food.carbs_g * ratio,
    fiber_g: food.fiber_g * ratio,
  };
}

export function tmbMethodLabel(id: string) {
  return TMB_METHODS.find((m) => m.id === id)?.label ?? id;
}

export function goalLabel(id?: string | null) {
  return DIET_GOALS.find((g) => g.id === id)?.label ?? "Manutenção";
}
