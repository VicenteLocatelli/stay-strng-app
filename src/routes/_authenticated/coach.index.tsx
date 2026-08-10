import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Users, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { weekKey } from "@/lib/strng";

export const Route = createFileRoute("/_authenticated/coach/")({
  head: () => ({
    meta: [
      { title: "Painel do treinador — STAY STRNG" },
      { name: "description", content: "Acompanhe adesão, alunos em risco e atividade recente." },
      { property: "og:title", content: "Painel do treinador — STAY STRNG" },
      { property: "og:description", content: "Adesão, alunos em risco e atividade recente." },
    ],
  }),
  component: CoachDashboard,
});

function CoachDashboard() {
  const { data: me } = useProfile();

  const { data } = useQuery({
    queryKey: ["coach-dashboard", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("trainer_students")
        .select("student_id, profiles:student_id(id,full_name,weekly_target)")
        .eq("trainer_id", me!.userId)
        .eq("active", true);

      const ids = (links ?? []).map((l) => l.student_id);
      const { data: sessions } = ids.length
        ? await supabase
            .from("workout_sessions")
            .select("id,student_id,workout_name,completed_at")
            .in("student_id", ids)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
        : { data: [] };

      return { links: links ?? [], sessions: sessions ?? [] };
    },
  });

  const students = (data?.links ?? []).map((l) => {
    const prof = l.profiles as { id: string; full_name: string; weekly_target: number } | null;
    const mine = (data?.sessions ?? []).filter((s) => s.student_id === l.student_id);
    const week = mine.filter((s) => weekKey(new Date(s.completed_at!)) === weekKey(new Date())).length;
    const last = mine[0]?.completed_at ?? null;
    const daysSince = last
      ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000)
      : null;
    return {
      id: l.student_id,
      name: prof?.full_name ?? "Aluno",
      target: prof?.weekly_target ?? 4,
      week,
      daysSince,
      atRisk: daysSince === null || daysSince >= 5,
    };
  });

  const atRisk = students.filter((s) => s.atRisk);
  const weekTotal = students.reduce((s, x) => s + x.week, 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8">
      <h1 className="text-3xl font-bold">Painel</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua consultoria.</p>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Card icon={<Users className="h-4 w-4 text-primary" />} label="Alunos" value={`${students.length}`} />
        <Card icon={<Activity className="h-4 w-4 text-gold" />} label="Treinos na semana" value={`${weekTotal}`} />
        <Card
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="Em risco"
          value={`${atRisk.length}`}
        />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-destructive">
        ALUNOS EM RISCO
      </h2>
      {atRisk.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Ninguém em risco. Consultoria rodando redonda.
        </p>
      ) : (
        <ul className="space-y-2">
          {atRisk.map((s) => (
            <li key={s.id}>
              <Link
                to="/coach/students/$studentId"
                params={{ studentId: s.id }}
                className="flex items-center justify-between rounded-lg border border-destructive/40 bg-card p-4"
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-destructive">
                  {s.daysSince === null ? "nunca treinou" : `${s.daysSince} dias sem treinar`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        ADESÃO SEMANAL
      </h2>
      <ul className="space-y-2">
        {students.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <Link to="/coach/students/$studentId" params={{ studentId: s.id }} className="font-semibold">
              {s.name}
            </Link>
            <span className="strng-title text-sm font-bold">
              {s.week}
              <span className="text-muted-foreground">/{s.target}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        ATIVIDADE RECENTE
      </h2>
      <ul className="space-y-2 pb-10">
        {(data?.sessions ?? []).slice(0, 10).map((s) => (
          <li key={s.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <span className="font-semibold">
              {students.find((x) => x.id === s.student_id)?.name ?? "Aluno"}
            </span>{" "}
            <span className="text-muted-foreground">concluiu {s.workout_name} ·{" "}
              {s.completed_at ? new Date(s.completed_at).toLocaleDateString("pt-BR") : ""}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {icon}
      <p className="strng-title mt-2 text-2xl font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
