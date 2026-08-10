import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { POINTS, formatDuration } from "@/lib/strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Check, Camera, Timer, ListOrdered, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/train/$workoutId")({
  head: () => ({
    meta: [
      { title: "Executar treino — STAY STRNG" },
      { name: "description", content: "Modo foco: registre suas séries, cargas e descanso." },
      { property: "og:title", content: "Executar treino — STAY STRNG" },
      { property: "og:description", content: "Modo foco para registrar seu treino." },
    ],
  }),
  component: TrainPage,
});

type SetLog = { weight: string; reps: string; rpe: string; done: boolean };

function TrainPage() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const { data: me } = useProfile();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [current, setCurrent] = useState(0);
  const [executionOrder, setExecutionOrder] = useState<string[]>([]);
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({});
  const [rest, setRest] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<null | {
    points: number;
    perfectOrder: boolean;
    sets: number;
    volume: number;
    duration: number;
    sessionId: string;
  }>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const { data: workout } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_workouts")
        .select(
          "id,name,objective,notes,workout_exercises(id,position,sets,rep_range,recommended_load,cadence,rest_seconds,technique,notes,exercise_id,exercises(name,muscle_group,execution,common_mistakes))",
        )
        .eq("id", workoutId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const exercises = useMemo(
    () => [...(workout?.workout_exercises ?? [])].sort((a, b) => a.position - b.position),
    [workout],
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) {
      setRest(null);
      toast.success("Descanso finalizado. Bora!");
      return;
    }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  // Cria a sessão assim que o treino carrega.
  useEffect(() => {
    if (!me?.userId || !workout || sessionId) return;
    (async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          student_id: me.userId,
          student_workout_id: workout.id,
          workout_name: workout.name,
          status: "in_progress",
        })
        .select("id")
        .single();
      if (error) toast.error("Não foi possível iniciar a sessão.");
      else setSessionId(data.id);
    })();
  }, [me?.userId, workout, sessionId]);

  function ensureLogs(weId: string, sets: number) {
    setLogs((prev) =>
      prev[weId]
        ? prev
        : {
            ...prev,
            [weId]: Array.from({ length: sets }, () => ({
              weight: "",
              reps: "",
              rpe: "",
              done: false,
            })),
          },
    );
  }

  const active = exercises[current];
  useEffect(() => {
    if (active) ensureLogs(active.id, active.sets);
  }, [active?.id]);

  async function confirmSet(index: number) {
    if (!active || !sessionId || !me?.userId) return;
    const set = logs[active.id]?.[index];
    if (!set) return;
    const { error } = await supabase.from("exercise_logs").insert({
      session_id: sessionId,
      student_id: me.userId,
      exercise_id: active.exercise_id,
      workout_exercise_id: active.id,
      exercise_name: active.exercises?.name ?? "Exercício",
      execution_order: current + 1,
      set_number: index + 1,
      weight: set.weight ? Number(set.weight) : null,
      reps: set.reps ? Number(set.reps) : null,
      rpe: set.rpe ? Number(set.rpe) : null,
    });
    if (error) {
      toast.error("Erro ao registrar a série.");
      return;
    }
    setLogs((prev) => ({
      ...prev,
      [active.id]: prev[active.id]!.map((s, i) => (i === index ? { ...s, done: true } : s)),
    }));
    setExecutionOrder((prev) => (prev.includes(active.id) ? prev : [...prev, active.id]));
    setRest(active.rest_seconds || 60);
  }

  async function finishWorkout() {
    if (!sessionId || !me?.userId) return;
    setFinishing(true);
    const duration = Math.floor((Date.now() - startedAt) / 1000);
    const allSets = Object.entries(logs).flatMap(([, arr]) => arr.filter((s) => s.done));
    const totalSets = allSets.length;
    const volume = allSets.reduce(
      (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
      0,
    );
    const prescribed = exercises.map((e) => e.id);
    const performed = executionOrder;
    const perfectOrder =
      performed.length > 0 &&
      performed.length === prescribed.length &&
      performed.every((id, i) => id === prescribed[i]);

    let points = POINTS.WORKOUT + (perfectOrder ? POINTS.PERFECT_ORDER : 0);

    const { error } = await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        total_sets: totalSets,
        total_volume: volume,
        followed_order: perfectOrder,
        points_awarded: points,
      })
      .eq("id", sessionId);

    if (error) {
      setFinishing(false);
      toast.error("Não foi possível finalizar o treino.");
      return;
    }

    await supabase.from("points_transactions").insert([
      { student_id: me.userId, session_id: sessionId, reason: "workout_completed", points: POINTS.WORKOUT },
      ...(perfectOrder
        ? [
            {
              student_id: me.userId,
              session_id: sessionId,
              reason: "perfect_order",
              points: POINTS.PERFECT_ORDER,
            },
          ]
        : []),
    ]);

    setFinishing(false);
    setSummary({ points, perfectOrder, sets: totalSets, volume, duration, sessionId });
  }

  async function uploadPhoto(file: File) {
    if (!summary || !me?.userId) return;
    const path = `${me.userId}/${summary.sessionId}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("workout-photos").upload(path, file);
    if (error) {
      toast.error("Não foi possível enviar a foto.");
      return;
    }
    await supabase.from("workout_completion_photos").insert({
      session_id: summary.sessionId,
      student_id: me.userId,
      storage_path: path,
    });
    await supabase.from("points_transactions").insert({
      student_id: me.userId,
      session_id: summary.sessionId,
      reason: "completion_photo",
      points: POINTS.PHOTO,
    });
    await supabase
      .from("workout_sessions")
      .update({ points_awarded: summary.points + POINTS.PHOTO })
      .eq("id", summary.sessionId);
    setSummary({ ...summary, points: summary.points + POINTS.PHOTO });
    toast.success("Foto enviada! +50 STRNG points");
  }

  if (summary) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
        <p className="text-xs tracking-[0.3em] text-muted-foreground">TREINO CONCLUÍDO</p>
        <h1 className="mt-2 text-4xl font-bold">
          Mais um <span className="text-primary">win</span>.
        </h1>

        <div className="mt-6 rounded-xl border border-gold/40 bg-card p-6 text-center">
          <Trophy className="mx-auto h-8 w-8 text-gold" />
          <p className="strng-title mt-2 text-4xl font-bold text-gold">+{summary.points}</p>
          <p className="text-xs tracking-widest text-muted-foreground">STRNG POINTS</p>
          {summary.perfectOrder && (
            <p className="strng-title mt-3 inline-flex items-center gap-1 rounded-full border border-gold/50 px-3 py-1 text-xs font-bold text-gold">
              <ListOrdered className="h-3 w-3" /> ORDEM PERFEITA +{POINTS.PERFECT_ORDER}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Box label="Duração" value={formatDuration(summary.duration)} />
          <Box label="Séries" value={`${summary.sets}`} />
          <Box label="Volume" value={`${Math.round(summary.volume)} kg`} />
        </div>

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadPhoto(f);
          }}
        />
        <Button
          variant="outline"
          className="mt-6 h-12 w-full border-gold/50 text-gold"
          onClick={() => photoInput.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" /> Enviar foto pós-treino (+50)
        </Button>
        <Button
          className="strng-title mt-3 h-12 w-full font-bold"
          onClick={() => navigate({ to: "/app" })}
        >
          Voltar para o início
        </Button>
      </main>
    );
  }

  if (!workout || !active) {
    return <main className="p-6 text-sm text-muted-foreground">Carregando treino...</main>;
  }

  const sets = logs[active.id] ?? [];
  const doneCount = Object.values(logs).flat().filter((s) => s.done).length;
  const totalPrescribed = exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-6 pb-32">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Sair
        </button>
        <span className="strng-title inline-flex items-center gap-1 text-sm font-bold">
          <Timer className="h-4 w-4 text-primary" /> {formatDuration(elapsed)}
        </span>
      </div>

      <h1 className="mt-4 text-2xl font-bold">{workout.name}</h1>
      <Progress value={(doneCount / Math.max(1, totalPrescribed)) * 100} className="mt-3 h-2" />
      <p className="mt-2 text-xs text-muted-foreground">
        Exercício {current + 1} de {exercises.length} · {doneCount}/{totalPrescribed} séries
      </p>

      <section className="mt-5 rounded-xl border border-border bg-card p-5">
        <p className="text-xs tracking-widest text-primary">
          {active.exercises?.muscle_group?.toUpperCase() ?? "EXERCÍCIO"}
        </p>
        <h2 className="mt-1 text-2xl font-bold">{active.exercises?.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {active.sets} séries · {active.rep_range ?? "-"} reps
          {active.recommended_load ? ` · ${active.recommended_load}` : ""}
          {active.cadence ? ` · cadência ${active.cadence}` : ""}
        </p>
        {active.technique && (
          <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            Técnica: {active.technique}
          </p>
        )}
        {active.notes && <p className="mt-2 text-xs text-muted-foreground">{active.notes}</p>}

        <ul className="mt-5 space-y-2">
          {sets.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="strng-title w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
              <Input
                inputMode="decimal"
                placeholder="kg"
                className="h-11"
                value={s.weight}
                disabled={s.done}
                onChange={(e) =>
                  setLogs((p) => ({
                    ...p,
                    [active.id]: p[active.id]!.map((x, j) =>
                      j === i ? { ...x, weight: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Input
                inputMode="numeric"
                placeholder="reps"
                className="h-11"
                value={s.reps}
                disabled={s.done}
                onChange={(e) =>
                  setLogs((p) => ({
                    ...p,
                    [active.id]: p[active.id]!.map((x, j) =>
                      j === i ? { ...x, reps: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Input
                inputMode="numeric"
                placeholder="RPE"
                className="h-11 w-20"
                value={s.rpe}
                disabled={s.done}
                onChange={(e) =>
                  setLogs((p) => ({
                    ...p,
                    [active.id]: p[active.id]!.map((x, j) =>
                      j === i ? { ...x, rpe: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Button
                size="icon"
                variant={s.done ? "secondary" : "default"}
                className="h-11 w-12 shrink-0"
                disabled={s.done}
                onClick={() => confirmSet(i)}
                aria-label={`Confirmar série ${i + 1}`}
              >
                <Check className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {rest !== null && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
          <p className="text-xs tracking-widest text-primary">DESCANSO</p>
          <p className="strng-title text-3xl font-bold">{formatDuration(rest)}</p>
          <button className="mt-1 text-xs text-muted-foreground underline" onClick={() => setRest(null)}>
            pular
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            variant="outline"
            className="h-12 flex-1"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Anterior
          </Button>
          {current < exercises.length - 1 ? (
            <Button className="strng-title h-12 flex-1 font-bold" onClick={() => setCurrent((c) => c + 1)}>
              Próximo
            </Button>
          ) : (
            <Button
              className="strng-title h-12 flex-1 font-bold"
              disabled={finishing}
              onClick={finishWorkout}
            >
              Finalizar treino
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="strng-title font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
