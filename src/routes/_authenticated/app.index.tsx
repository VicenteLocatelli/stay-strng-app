import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Trophy, Zap, ChevronRight, HeartPulse, UtensilsCrossed, TrendingUp, Play, MessageSquare, Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useLevels } from "@/hooks/use-strng";
import { computeStreak, resolveLevel, weekKey } from "@/lib/strng";
import { Progress } from "@/components/ui/progress";
import { WaterTracker } from "@/components/student/water-tracker";
import { toast } from "sonner";

const NOTICE_KEY = "strng-workout-notice-dismissed";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Home — STAY STRNG" },
      { name: "description", content: "Seu painel diário: meta semanal, treinos, cardio, dieta e água." },
      { property: "og:title", content: "Home — STAY STRNG" },
      { property: "og:description", content: "Meta semanal, treinos, cardio e hidratação em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const { data: me } = useProfile();
  const { data: levels } = useLevels();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const studentId = me?.userId;
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(NOTICE_KEY),
  );

  const { data, isLoading } = useQuery({
    queryKey: ["student-home", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [workouts, sessions, points, measures, unreadFeedback] = await Promise.all([
        supabase
          .from("student_workouts")
          .select("id,name,objective,estimated_minutes,update_notice_at,workout_exercises(id,exercises(is_cardio))")
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
        supabase
          .from("body_measurements")
          .select("weight_kg,measured_on")
          .eq("student_id", studentId!)
          .not("weight_kg", "is", null)
          .order("measured_on", { ascending: false })
          .limit(1),
        supabase
          .from("student_feedbacks")
          .select("id,content,created_at")
          .eq("student_id", studentId!)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      return {
        workouts: workouts.data ?? [],
        sessions: sessions.data ?? [],
        totalPoints: (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0),
        weightKg: measures.data?.[0]?.weight_kg ? Number(measures.data[0].weight_kg) : null,
        unreadFeedback: unreadFeedback.data?.[0] ?? null,
      };
    },
  });

  const target = me?.profile?.weekly_target ?? 4;
  const completedDates = (data?.sessions ?? []).map((s) => s.completed_at).filter(Boolean) as string[];
  const thisWeek = completedDates.filter((d) => weekKey(new Date(d)) === weekKey(new Date())).length;
  const streak = computeStreak(completedDates, target);
  const level = resolveLevel(data?.totalPoints ?? 0, levels ?? []);
  const firstName = (me?.profile?.full_name ?? "").split(" ")[0] || "Atleta";

  const workouts = data?.workouts ?? [];
  const doneThisWeekIds = new Set(
    (data?.sessions ?? [])
      .filter((s) => s.completed_at && weekKey(new Date(s.completed_at)) === weekKey(new Date()))
      .map((s) => s.student_workout_id),
  );
  const nextWorkout = workouts.find((w) => !doneThisWeekIds.has(w.id)) ?? workouts[0] ?? null;
  const cardioWorkout = workouts.find((w) =>
    (w.workout_exercises ?? []).some((we) => we.exercises?.is_cardio),
  );

  const latestNotice = workouts
    .map((w) => w.update_notice_at)
    .filter(Boolean)
    .sort()
    .pop() as string | undefined;
  const showNotice = !!latestNotice && latestNotice !== dismissedNotice;

  function dismissNotice() {
    if (!latestNotice) return;
    window.localStorage.setItem(NOTICE_KEY, latestNotice);
    setDismissedNotice(latestNotice);
  }

  async function markFeedbackRead(id: string) {
    await supabase.from("student_feedbacks").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["student-home", studentId] });
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">OLÁ, {firstName.toUpperCase()}</p>
      <h1 className="mt-2 text-3xl leading-tight font-bold">
        What&apos;s your <span className="text-primary">next win?</span>
      </h1>

      {/* Meta semanal — bloco premium */}
      <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-muted p-5 shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--gold)_60%,transparent)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">META SEMANAL</p>
            <p className="strng-title mt-1 text-5xl leading-none font-bold">
              {thisWeek}
              <span className="text-2xl text-muted-foreground">/{target}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="strng-title text-base font-bold text-gold">{level.current?.name}</p>
            <p className="text-xs text-muted-foreground">{data?.totalPoints ?? 0} pts</p>
          </div>
        </div>
        <Progress value={Math.min(100, (thisWeek / Math.max(1, target)) * 100)} className="mt-4 h-2" />
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Flame className="h-4 w-4 text-primary" />} label="Streak" value={`${streak.current}s`} />
          <Stat icon={<Trophy className="h-4 w-4 text-gold" />} label="Treinos" value={`${completedDates.length}`} />
          <Stat icon={<Zap className="h-4 w-4 text-primary" />} label="Nível" value={`${level.current?.level ?? 1}`} />
        </div>
      </section>

      {/* Acesso rápido */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {nextWorkout ? (
          <Link
            to="/train/$workoutId"
            params={{ workoutId: nextWorkout.id }}
            className="col-span-2 flex items-center justify-between rounded-2xl border border-primary/50 bg-card p-5 transition hover:border-primary"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.25em] text-primary">PRÓXIMO TREINO</p>
              <p className="strng-title mt-1 truncate text-xl font-bold">{nextWorkout.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {nextWorkout.workout_exercises?.length ?? 0} exercícios
                {nextWorkout.estimated_minutes ? ` · ~${nextWorkout.estimated_minutes} min` : ""}
              </p>
            </div>
            <span className="ml-3 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Play className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <div className="col-span-2 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Nenhum treino ativo ainda. Seu treinador vai prescrever em breve.
          </div>
        )}

        <QuickCard
          icon={<UtensilsCrossed className="h-5 w-5 text-gold" />}
          title="Dieta"
          subtitle="Em breve · liberado pelo Coach"
          to="/app/diet"
        />

        {cardioWorkout ? (
          <QuickCard
            icon={<HeartPulse className="h-5 w-5 text-primary" />}
            title="Cardio"
            subtitle={cardioWorkout.name}
            to="/train/$workoutId"
            params={{ workoutId: cardioWorkout.id }}
          />
        ) : (
          <button
            type="button"
            onClick={() => toast.info("Seu coach ainda não prescreveu um treino de cardio.")}
            className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary"
          >
            <HeartPulse className="h-5 w-5 text-primary" />
            <p className="strng-title mt-3 text-base font-bold">Cardio</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Aguardando prescrição</p>
          </button>
        )}
      </div>

      <div className="mt-5">
        <WaterTracker
          studentId={studentId}
          goalMl={me?.profile?.water_goal_ml ?? 3000}
          weightKg={data?.weightKg}
        />
      </div>

      <div className="mt-5">
        <QuickCard
          icon={<TrendingUp className="h-5 w-5 text-gold" />}
          title="BLDNG"
          subtitle="Sua evolução: peso, cargas, fotos e check-in"
          to="/app/bldng"
          wide
        />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">TREINOS ATIVOS</h2>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      <ul className="grid grid-cols-2 gap-3">
        {workouts.map((w) => {
          const done = (data?.sessions ?? []).filter(
            (s) => s.student_workout_id === w.id && weekKey(new Date(s.completed_at!)) === weekKey(new Date()),
          ).length;
          return (
            <li key={w.id}>
              <Link
                to="/train/$workoutId"
                params={{ workoutId: w.id }}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary"
              >
                <div className="min-w-0">
                  <p className="strng-title truncate text-base font-bold">{w.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {w.objective || "Treino prescrito"}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {w.workout_exercises?.length ?? 0} ex.
                    {done > 0 ? ` · ${done}x` : ""}
                  </span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => navigate({ to: "/app/workouts" })}
        className="mt-4 w-full rounded-xl border border-border py-3 text-xs font-semibold tracking-widest text-muted-foreground"
      >
        VER TODOS OS TREINOS
      </button>
    </main>
  );
}

function QuickCard({
  icon,
  title,
  subtitle,
  to,
  params,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  to: string;
  params?: Record<string, string> | undefined;
  wide?: boolean | undefined;
}) {
  return (
    <Link
      to={to as never}
      params={params as never}
      className={`block rounded-2xl border border-border bg-card p-4 transition hover:border-primary ${wide ? "w-full" : ""}`}
    >
      {icon}
      <p className="strng-title mt-3 text-base font-bold">{title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{subtitle}</p>
    </Link>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className="flex items-center justify-center gap-1">{icon}</div>
      <p className="strng-title mt-1 text-lg font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
