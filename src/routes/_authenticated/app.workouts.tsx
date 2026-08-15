import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { formatDuration, weekKey } from "@/lib/strng";

export const Route = createFileRoute("/_authenticated/app/workouts")({
  head: () => ({
    meta: [
      { title: "Treino — STAY STRNG" },
      { name: "description", content: "Seus treinos ativos e as últimas sessões concluídas." },
      { property: "og:title", content: "Treino — STAY STRNG" },
      { property: "og:description", content: "Treinos ativos e sessões concluídas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const { data: me } = useProfile();
  const studentId = me?.userId;

  const { data } = useQuery({
    queryKey: ["student-workouts-tab", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [workouts, sessions] = await Promise.all([
        supabase
          .from("student_workouts")
          .select("id,name,objective,estimated_minutes,workout_exercises(id,exercises(is_cardio))")
          .eq("student_id", studentId!)
          .eq("active", true)
          .order("created_at"),
        supabase
          .from("workout_sessions")
          .select("id,workout_name,student_workout_id,completed_at,duration_seconds,total_sets,points_awarded")
          .eq("student_id", studentId!)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(8),
      ]);
      return { workouts: workouts.data ?? [], sessions: sessions.data ?? [] };
    },
  });

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">Treino</h1>
      <p className="mt-1 text-sm text-muted-foreground">Escolha o treino do dia. Você decide a ordem.</p>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {(data?.workouts ?? []).map((w) => {
          const done = (data?.sessions ?? []).filter(
            (s) => s.student_workout_id === w.id && s.completed_at && weekKey(new Date(s.completed_at)) === weekKey(new Date()),
          ).length;
          const cardio = (w.workout_exercises ?? []).some((we) => we.exercises?.is_cardio);
          return (
            <li key={w.id}>
              <Link
                to="/train/$workoutId"
                params={{ workoutId: w.id }}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {cardio && <HeartPulse className="h-4 w-4 shrink-0 text-primary" />}
                    <p className="strng-title truncate text-base font-bold">{w.name}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {w.objective || "Treino prescrito"}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {w.workout_exercises?.length ?? 0} ex.
                    {w.estimated_minutes ? ` · ~${w.estimated_minutes} min` : ""}
                    {done > 0 ? ` · ${done}x` : ""}
                  </span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {(data?.workouts.length ?? 0) === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum treino ativo ainda. Seu treinador vai prescrever em breve.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground">ÚLTIMAS SESSÕES</h2>
        <Link to="/app/history" className="text-[11px] font-semibold tracking-widest text-primary">
          VER TUDO
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {(data?.sessions ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="strng-title truncate text-sm font-bold">{s.workout_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.completed_at ? new Date(s.completed_at).toLocaleDateString("pt-BR") : ""} ·{" "}
                {formatDuration(s.duration_seconds ?? 0)} · {s.total_sets} séries
              </p>
            </div>
            <span className="strng-title shrink-0 text-sm font-bold text-gold">+{s.points_awarded}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
