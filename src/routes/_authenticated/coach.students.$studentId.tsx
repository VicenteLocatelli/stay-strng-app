import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, weekKey, computeStreak } from "@/lib/strng";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coach/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Aluno — STAY STRNG" },
      { name: "description", content: "Evolução, adesão e treinos do aluno." },
      { property: "og:title", content: "Aluno — STAY STRNG" },
      { property: "og:description", content: "Evolução e adesão do aluno." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { studentId } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["coach-student", studentId],
    queryFn: async () => {
      const [profile, sessions, workouts] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", studentId).maybeSingle(),
        supabase
          .from("workout_sessions")
          .select("id,workout_name,completed_at,duration_seconds,total_sets,total_volume,followed_order,points_awarded")
          .eq("student_id", studentId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
        supabase
          .from("student_workouts")
          .select("id,name,objective,active")
          .eq("student_id", studentId)
          .eq("active", true),
      ]);
      return {
        profile: profile.data,
        sessions: sessions.data ?? [],
        workouts: workouts.data ?? [],
      };
    },
  });

  const target = data?.profile?.weekly_target ?? 4;
  const dates = (data?.sessions ?? []).map((s) => s.completed_at).filter(Boolean) as string[];
  const week = dates.filter((d) => weekKey(new Date(d)) === weekKey(new Date())).length;
  const streak = computeStreak(dates, target);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-10">
      <Link to="/coach/students" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Alunos
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{data?.profile?.full_name ?? "Aluno"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data?.profile?.goal || "Sem objetivo definido"}
      </p>

      <section className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Box label="Semana" value={`${week}/${target}`} />
        <Box label="Streak" value={`${streak.current}s`} />
        <Box label="Treinos" value={`${dates.length}`} />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        TREINOS ATIVOS
      </h2>
      <ul className="space-y-2">
        {(data?.workouts ?? []).map((w) => (
          <li key={w.id} className="rounded-lg border border-border bg-card p-4">
            <p className="strng-title font-bold">{w.name}</p>
            <p className="text-xs text-muted-foreground">{w.objective}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        ÚLTIMAS SESSÕES
      </h2>
      <ul className="space-y-2">
        {(data?.sessions ?? []).slice(0, 20).map((s) => (
          <li key={s.id} className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{s.workout_name}</span>
              <span className="text-gold">+{s.points_awarded}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.completed_at ? new Date(s.completed_at).toLocaleDateString("pt-BR") : ""} ·{" "}
              {formatDuration(s.duration_seconds ?? 0)} · {s.total_sets} séries ·{" "}
              {Math.round(Number(s.total_volume ?? 0))} kg
              {s.followed_order ? " · ordem perfeita" : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="strng-title text-xl font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
