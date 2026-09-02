import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Users, Activity, DollarSign, TrendingUp, Crown, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { weekKey } from "@/lib/strng";
import { formatBRL, planLabel } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/coach/")({
  head: () => ({
    meta: [
      { title: "Painel do treinador — STAY STRNG" },
      { name: "description", content: "Faturamento, adesão, destaques e alunos em risco." },
      { property: "og:title", content: "Painel do treinador — STAY STRNG" },
      { property: "og:description", content: "Faturamento, adesão, destaques e alunos em risco." },
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
        .select("student_id")
        .eq("trainer_id", me!.userId)
        .eq("active", true);

      const ids = (links ?? []).map((l) => l.student_id);
      const [profilesRes, sessionsRes, pointsRes, activeRes] = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id,full_name,weekly_target,plan,plan_price").in("id", ids)
          : Promise.resolve({ data: [] as { id: string; full_name: string; weekly_target: number; plan: string; plan_price: number }[] }),
        ids.length
          ? supabase
              .from("workout_sessions")
              .select("id,student_id,workout_name,completed_at")
              .in("student_id", ids)
              .eq("status", "completed")
              .order("completed_at", { ascending: false })
          : Promise.resolve({ data: [] as { id: string; student_id: string; workout_name: string; completed_at: string | null }[] }),
        ids.length
          ? supabase.from("points_transactions").select("student_id,points,created_at").in("student_id", ids)
          : Promise.resolve({ data: [] as { student_id: string; points: number; created_at: string }[] }),
        ids.length
          ? supabase
              .from("workout_sessions")
              .select("id,student_id,workout_name,started_at")
              .in("student_id", ids)
              .eq("status", "in_progress")
              .order("started_at", { ascending: false })
          : Promise.resolve({ data: [] as { id: string; student_id: string; workout_name: string; started_at: string }[] }),
      ]);

      return {
        links: links ?? [],
        profiles: profilesRes.data ?? [],
        sessions: sessionsRes.data ?? [],
        points: pointsRes.data ?? [],
        active: activeRes.data ?? [],
      };
    },
    refetchInterval: 60_000,
  });

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const students = (data?.links ?? []).map((l) => {
    const prof = (data?.profiles ?? []).find((p) => p.id === l.student_id) ?? null;
    const mine = (data?.sessions ?? []).filter((s) => s.student_id === l.student_id);
    const week = mine.filter((s) => weekKey(new Date(s.completed_at!)) === weekKey(now)).length;
    const month = mine.filter((s) => {
      const d = new Date(s.completed_at!);
      return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
    }).length;
    const pts = (data?.points ?? []).filter((p) => p.student_id === l.student_id);
    const weekPoints = pts
      .filter((p) => weekKey(new Date(p.created_at)) === weekKey(now))
      .reduce((s, p) => s + (p.points ?? 0), 0);
    const monthPoints = pts
      .filter((p) => {
        const d = new Date(p.created_at);
        return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
      })
      .reduce((s, p) => s + (p.points ?? 0), 0);
    const last = mine[0]?.completed_at ?? null;
    const daysSince = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000) : null;
    const target = prof?.weekly_target ?? 4;
    return {
      id: l.student_id,
      name: prof?.full_name ?? "Aluno",
      plan: prof?.plan ?? "base",
      price: Number(prof?.plan_price ?? 0),
      target,
      week,
      month,
      weekPoints,
      monthPoints,
      total: mine.length,
      daysSince,
      atRisk: daysSince === null || daysSince >= 5,
      hitTarget: week >= target,
      adherence: Math.min(100, Math.round((week / Math.max(1, target)) * 100)),
    };
  });

  const atRisk = students.filter((s) => s.atRisk);
  const hitTarget = students.filter((s) => s.hitTarget);
  const weekTotal = students.reduce((s, x) => s + x.week, 0);
  const revenue = students.reduce((s, x) => s + x.price, 0);
  const avgAdherence = students.length
    ? Math.round(students.reduce((s, x) => s + x.adherence, 0) / students.length)
    : 0;
  const totalSessions = students.reduce((s, x) => s + x.total, 0);

  const byWeek = [...students].sort((a, b) => b.weekPoints - a.weekPoints || b.week - a.week);
  const byMonth = [...students].sort((a, b) => b.monthPoints - a.monthPoints || b.month - a.month);
  const starWeek = byWeek[0]?.weekPoints ? byWeek[0] : null;
  const starMonth = byMonth[0]?.monthPoints ? byMonth[0] : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <h1 className="text-3xl font-bold">Painel</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua consultoria.</p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card icon={<DollarSign className="h-4 w-4 text-gold" />} label="Faturamento" value={formatBRL(revenue)} />
        <Card icon={<Users className="h-4 w-4 text-primary" />} label="Alunos" value={`${students.length}`} />
        <Card icon={<Activity className="h-4 w-4 text-primary" />} label="Treinos na semana" value={`${weekTotal}`} />
        <Card icon={<TrendingUp className="h-4 w-4 text-gold" />} label="Adesão média" value={`${avgAdherence}%`} />
        <Card
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="Em risco"
          value={`${atRisk.length}`}
        />
      </section>

      <p className="mt-3 text-xs text-muted-foreground">
        Evolução geral: {totalSessions} treinos registrados pela carteira · média de{" "}
        {students.length ? (totalSessions / students.length).toFixed(1) : "0"} por aluno.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <LiveCard
          title="TREINANDO AGORA"
          accent="primary"
          empty="Ninguém treinando neste momento."
          items={trainingNow.map((s) => ({
            id: s.student_id,
            name: nameOf(s.student_id),
            detail: `${s.workout_name} · desde ${new Date(s.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          }))}
        />
        <LiveCard
          title="TREINARAM HOJE"
          accent="gold"
          empty="Nenhum treino concluído hoje."
          items={trainedToday.map((s) => ({
            id: s.student_id,
            name: nameOf(s.student_id),
            detail: `${s.workout_name} · ${new Date(s.completed_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          }))}
        />
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Highlight
          title="ALUNO DA SEMANA"
          name={starWeek?.name ?? null}
          detail={starWeek ? `${starWeek.weekPoints} pts · ${starWeek.week} treinos` : null}
          id={starWeek?.id ?? null}
        />
        <Highlight
          title="ALUNO DO MÊS"
          name={starMonth?.name ?? null}
          detail={starMonth ? `${starMonth.monthPoints} pts · ${starMonth.month} treinos` : null}
          id={starMonth?.id ?? null}
        />
      </section>

      {hitTarget.length > 0 && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-gold/5 p-4">
          <p className="strng-title flex items-center gap-2 text-sm font-bold text-gold">
            <PartyPopper className="h-4 w-4" /> METAS BATIDAS NESTA SEMANA
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hitTarget.map((s) => (
              <li key={s.id}>
                <Link
                  to="/coach/students/$studentId"
                  params={{ studentId: s.id }}
                  className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold"
                >
                  {s.name} · {s.week}/{s.target}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <span className="ml-2 text-[10px] tracking-widest text-muted-foreground">
                {planLabel(s.plan)}
              </span>
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
      <ul className="space-y-2">
        {(data?.sessions ?? []).slice(0, 10).map((s) => (
          <li key={s.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <span className="font-semibold">
              {students.find((x) => x.id === s.student_id)?.name ?? "Aluno"}
            </span>{" "}
            <span className="text-muted-foreground">
              concluiu {s.workout_name} ·{" "}
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

function Highlight({
  title,
  name,
  detail,
  id,
}: {
  title: string;
  name: string | null;
  detail: string | null;
  id: string | null;
}) {
  return (
    <div className="rounded-xl border border-gold/40 bg-card p-5">
      <p className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gold">
        <Crown className="h-4 w-4" /> {title}
      </p>
      {name && id ? (
        <>
          <Link
            to="/coach/students/$studentId"
            params={{ studentId: id }}
            className="strng-title mt-2 block text-xl font-bold"
          >
            {name}
          </Link>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Sem pontuação registrada ainda.</p>
      )}
    </div>
  );
}
