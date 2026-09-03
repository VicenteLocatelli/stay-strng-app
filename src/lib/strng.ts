import { supabase } from "@/integrations/supabase/client";

export const POINTS = {
  WORKOUT: 60,
  PHOTO: 25,
  PERFECT_ORDER: 40,
  WEEK_TARGET: 120,
} as const;

export const SLOGAN = "DON'T CHASE PERFECTION. STAY STRNG.";

/** Único treinador principal autorizado no sistema. */
export const MAIN_TRAINER_EMAIL = "vicente.locatelli@gmail.com";

export function isMainTrainerEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === MAIN_TRAINER_EMAIL;
}

/** Resolve o papel do usuário: e-mail do treinador principal sempre é "trainer". */
export async function resolveRole(userId: string, email?: string | null) {
  if (isMainTrainerEmail(email)) return "trainer" as const;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data?.[0]?.role ?? "student") as "trainer" | "student";
}

/** Intensidade recomendada legível a partir da carga prescrita. */
export function loadHint(recommended?: string | null) {
  const v = (recommended ?? "").toLowerCase();
  if (!v) return null;
  if (/leve|light/.test(v)) return "LEVE";
  if (/moderad|médi|medi/.test(v)) return "MODERADA";
  if (/pesad|heavy|máx|max/.test(v)) return "PESADA";
  return null;
}

export type LevelRow = { level: number; name: string; min_points: number };

export const FALLBACK_LEVELS: LevelRow[] = [
  { level: 1, name: "START", min_points: 0 },
  { level: 2, name: "BUILD", min_points: 1500 },
  { level: 3, name: "GRIND", min_points: 5000 },
  { level: 4, name: "STRONG", min_points: 12000 },
  { level: 5, name: "ELITE", min_points: 25000 },
  { level: 6, name: "UNSTOPPABLE", min_points: 45000 },
  { level: 7, name: "LEGEND", min_points: 75000 },
];

export function resolveLevel(points: number, levels: LevelRow[]) {
  const sorted = [...levels].sort((a, b) => a.min_points - b.min_points);
  let current = sorted[0]!;
  for (const l of sorted) if (points >= l.min_points) current = l;
  const next = sorted.find((l) => l.min_points > current.min_points) ?? null;
  const span = next ? next.min_points - current.min_points : 1;
  const progress = next
    ? Math.min(100, Math.round(((points - current.min_points) / span) * 100))
    : 100;
  return { current, next, progress };
}

/** Segunda-feira da semana de uma data (horário local). */
export function weekStart(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function weekKey(date: Date) {
  const d = weekStart(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Streak = semanas consecutivas (terminando na semana atual ou anterior)
 * em que o aluno atingiu a meta de treinos. Independe do dia da semana.
 */
export function computeStreak(completedDates: string[], weeklyTarget: number) {
  const counts = new Map<string, number>();
  for (const iso of completedDates) {
    const key = weekKey(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const target = Math.max(1, weeklyTarget);
  let current = 0;
  const cursor = weekStart(new Date());
  // A semana corrente só quebra o streak depois que ela termina.
  if ((counts.get(weekKey(cursor)) ?? 0) >= target) current += 1;
  cursor.setDate(cursor.getDate() - 7);
  while ((counts.get(weekKey(cursor)) ?? 0) >= target) {
    current += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  let best = 0;
  let run = 0;
  const keys = [...counts.keys()].sort();
  let prev: string | null = null;
  for (const k of keys) {
    if (prev) {
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() + 7);
      if (weekKey(prevDate) !== k) run = 0;
    }
    if ((counts.get(k) ?? 0) >= target) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    prev = k;
  }
  return { current, best: Math.max(best, current) };
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export async function signOutAndRedirect() {
  await supabase.auth.signOut();
}
