import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Timer, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useLevels } from "@/hooks/use-strng";
import { computeStreak, resolveLevel, weekKey } from "@/lib/strng";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Meus treinos — STAY STRNG" },
      { name: "description", content: "Escolha seu treino do dia e registre sua evolução." },
      { property: "og:title", content: "Meus treinos — STAY STRNG" },
      { property: "og:description", content: "Escolha seu treino e registre sua evolução." },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const { data: me } = useProfile();
  const { data: levels } = useLevels();
  const studentId = me?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ["student-home", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [workouts, sessions, points] = await Promise.all([
        supabase
          .from("student_workouts")
          .select("id,name,objective,estimated_minutes,workout_exercises(id)")
          .eq("student_id", studentId!)
          .eq("active", true)
          .order("created_at"),
        supabase
          .from("workout_sessions")
          .select("id,student_workout_id,completed_at")
          .eq("student_id", studentId!)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
        supabase.from("points_transactions").select("points").eq("student_id", studentId!),
      ]);
      return {
        workouts: workouts.data ?? [],
        sessions: sessions.data ?? [],
        totalPoints: (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0),
      };
    },
  });

  const target = me?.profile?.weekly_target ?? 4;
  const completedDates = (data?.sessions ?? [])
    .map((s) => s.completed_at)
    .filter(Boolean) as string[];
  const thisWeek = completedDates.filter((d) => weekKey(new Date(d)) === weekKey(new Date())).length;
  const streak = computeStreak(completedDates, target);
  const level = resolveLevel(data?.totalPoints ?? 0, levels ?? []);
  const firstName = (me?.profile?.full_name ?? "").split(" ")[0] || "Atleta";

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
        OLÁ, {firstName.toUpperCase()}
      </p>
      <h1 className="mt-2 text-3xl leading-tight font-bold">
        What&apos;s your <span className="text-primary">next win?</span>
      </h1>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">
              META SEMANAL
            </p>
            <p className="strng-title mt-1 text-3xl font-bold">
              {thisWeek}
              <span className="text-muted-foreground">/{target}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="strng-title text-sm font-bold text-gold">{level.current?.name}</p>
            <p className="text-xs text-muted-foreground">{data?.totalPoints ?? 0} pts</p>
          </div>
        </div>
        <Progress value={Math.min(100, (thisWeek / Math.max(1, target)) * 100)} className="mt-4 h-2" />
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Flame className="h-4 w-4 text-primary" />} label="Streak" value={`${streak.current}s`} />
          <Stat icon={<Trophy className="h-4 w-4 text-gold" />} label="Treinos" value={`${completedDates.length}`} />
          <Stat icon={<Timer className="h-4 w-4 text-muted-foreground" />} label="Nível" value={`${level.current?.level ?? 1}`} />
        </div>
      </section>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        TREINOS ATIVOS
      </h2>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && (data?.workouts.length ?? 0) === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum treino ativo ainda. Seu treinador vai prescrever em breve.
        </p>
      )}

      <ul className="space-y-3">
        {(data?.workouts ?? []).map((w) => {
          const done = (data?.sessions ?? []).filter(
            (s) => s.student_workout_id === w.id && weekKey(new Date(s.completed_at!)) === weekKey(new Date()),
          ).length;
          return (
            <li key={w.id}>
              <Link
                to="/train/$workoutId"
                params={{ workoutId: w.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary"
              >
                <div>
                  <p className="strng-title text-lg font-bold">{w.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {w.workout_exercises?.length ?? 0} exercícios
                    {w.estimated_minutes ? ` · ~${w.estimated_minutes} min` : ""}
                    {done > 0 ? ` · ${done}x nesta semana` : ""}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center justify-center gap-1">{icon}</div>
      <p className="strng-title mt-1 text-lg font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
