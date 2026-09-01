import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { formatDuration, weekKey, computeStreak } from "@/lib/strng";
import { PLANS, FEEDBACK_INTERVALS, formatBRL, planLabel } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PrescriptionRow, type PrescriptionPatch } from "./coach.workouts";
import { EnvFilterChips, filterByEnv, type EnvFilter } from "@/lib/exercise-env";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "workouts", label: "Treinos" },
  { id: "history", label: "Histórico" },
  { id: "diet", label: "Dieta" },
  { id: "checkins", label: "Check-ins" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/_authenticated/coach/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Aluno — STAY STRNG" },
      { name: "description", content: "Evolução, medidas, prescrição e feedback do aluno." },
      { property: "og:title", content: "Aluno — STAY STRNG" },
      { property: "og:description", content: "Evolução, medidas e prescrição do aluno." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { studentId } = Route.useParams();
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [newWorkout, setNewWorkout] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [env, setEnv] = useState<EnvFilter>("all");
  const [measure, setMeasure] = useState({
    weight_kg: "",
    body_fat: "",
    waist_cm: "",
    hip_cm: "",
    arm_cm: "",
    thigh_cm: "",
    chest_cm: "",
  });

  const { data } = useQuery({
    queryKey: ["coach-student", studentId],
    queryFn: async () => {
      const [profile, sessions, workouts, points, measurements, feedbacks, exercises, checkins] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", studentId).maybeSingle(),
          supabase
            .from("workout_sessions")
            .select(
              "id,workout_name,completed_at,duration_seconds,total_sets,total_volume,followed_order,points_awarded,student_feedback",
            )
            .eq("student_id", studentId)
            .eq("status", "completed")
            .order("completed_at", { ascending: false }),
          supabase
            .from("student_workouts")
            .select(
              "id,name,objective,active,workout_exercises(id,exercise_id,position,sets,rep_range,recommended_load,cadence,rest_seconds,exercises(name))",
            )
            .eq("student_id", studentId)
            .eq("active", true),
          supabase.from("points_transactions").select("points").eq("student_id", studentId),
          supabase
            .from("body_measurements")
            .select("*")
            .eq("student_id", studentId)
            .order("measured_on"),
          supabase
            .from("student_feedbacks")
            .select("id,content,created_at,next_feedback_at")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false }),
          supabase
            .from("exercises")
            .select("id,name,muscle_group,env_gym,env_home")
            .eq("active", true)
            .order("name"),
          supabase
            .from("student_checkins")
            .select("id,sleep_quality,energy,soreness,diet_adherence,notes,created_at")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false }),
        ]);

      const photoRows =
        (
          await supabase
            .from("workout_completion_photos")
            .select("session_id,storage_path")
            .eq("student_id", studentId)
        ).data ?? [];
      const signed = photoRows.length
        ? (
            await supabase.storage
              .from("workout-photos")
              .createSignedUrls(photoRows.map((p) => p.storage_path), 3600)
          ).data ?? []
        : [];
      const photos: Record<string, string> = {};
      photoRows.forEach((p, i) => {
        const url = signed[i]?.signedUrl;
        if (url) photos[p.session_id] = url;
      });

      return {
        profile: profile.data,
        sessions: sessions.data ?? [],
        workouts: workouts.data ?? [],
        totalPoints: (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0),
        measurements: measurements.data ?? [],
        feedbacks: feedbacks.data ?? [],
        exercises: exercises.data ?? [],
        checkins: checkins.data ?? [],
        photos,
      };
    },
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["coach-student", studentId] });
    qc.invalidateQueries({ queryKey: ["coach-students"] });
  }

  const profile = data?.profile;
  const target = profile?.weekly_target ?? 4;
  const dates = (data?.sessions ?? []).map((s) => s.completed_at).filter(Boolean) as string[];
  const week = dates.filter((d) => weekKey(new Date(d)) === weekKey(new Date())).length;
  const streak = computeStreak(dates, target);

  const chartData = (data?.measurements ?? []).map((m) => ({
    date: new Date(m.measured_on).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    peso: m.weight_kg ? Number(m.weight_kg) : null,
    cintura: m.waist_cm ? Number(m.waist_cm) : null,
    braço: m.arm_cm ? Number(m.arm_cm) : null,
    coxa: m.thigh_cm ? Number(m.thigh_cm) : null,
  }));

  async function saveProfileConfig(patch: {
    plan?: string;
    plan_price?: number;
    feedback_interval_days?: number;
    weekly_target?: number;
  }) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", studentId);
    if (error) toast.error(error.message);
    else {
      toast.success("Configuração atualizada.");
      refresh();
    }
  }

  async function registerFeedback() {
    if (!feedback.trim()) {
      toast.error("Escreva o feedback.");
      return;
    }
    const days = profile?.feedback_interval_days ?? 30;
    const next = new Date(Date.now() + days * 86_400_000).toISOString();
    const { error } = await supabase.from("student_feedbacks").insert({
      student_id: studentId,
      trainer_id: me!.userId,
      content: feedback.trim(),
      next_feedback_at: next,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase
      .from("profiles")
      .update({ last_feedback_at: new Date().toISOString(), next_feedback_at: next })
      .eq("id", studentId);
    setFeedback("");
    toast.success("Feedback registrado.");
    refresh();
  }

  async function addMeasurement() {
    const payload = {
      student_id: studentId,
      created_by: me!.userId,
      weight_kg: measure.weight_kg ? Number(measure.weight_kg) : null,
      body_fat: measure.body_fat ? Number(measure.body_fat) : null,
      waist_cm: measure.waist_cm ? Number(measure.waist_cm) : null,
      hip_cm: measure.hip_cm ? Number(measure.hip_cm) : null,
      arm_cm: measure.arm_cm ? Number(measure.arm_cm) : null,
      thigh_cm: measure.thigh_cm ? Number(measure.thigh_cm) : null,
      chest_cm: measure.chest_cm ? Number(measure.chest_cm) : null,
    };
    const { error } = await supabase.from("body_measurements").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMeasure({
      weight_kg: "",
      body_fat: "",
      waist_cm: "",
      hip_cm: "",
      arm_cm: "",
      thigh_cm: "",
      chest_cm: "",
    });
    toast.success("Medidas registradas.");
    refresh();
  }

  async function createWorkout() {
    if (!newWorkout.trim()) return;
    const { error } = await supabase.from("student_workouts").insert({
      student_id: studentId,
      trainer_id: me!.userId,
      name: newWorkout.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewWorkout("");
    toast.success("Treino criado. Adicione os exercícios.");
    refresh();
  }

  async function addExercise(workoutId: string, exerciseId: string, position: number) {
    const { error } = await supabase
      .from("workout_exercises")
      .insert({ student_workout_id: workoutId, exercise_id: exerciseId, position });
    if (error) toast.error(error.message);
    else refresh();
  }

  async function updateExercise(id: string, patch: PrescriptionPatch) {
    const { error } = await supabase.from("workout_exercises").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Prescrição atualizada.");
      refresh();
    }
  }

  async function removeExercise(id: string) {
    const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-10">
      <Link to="/coach/students" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Alunos
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{profile?.full_name ?? "Aluno"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile?.goal || "Sem objetivo definido"} · plano {planLabel(profile?.plan)} ·{" "}
        {formatBRL(Number(profile?.plan_price ?? 0))}/mês
      </p>

      <section className="mt-6 grid grid-cols-4 gap-3 text-center">
        <Box label="Semana" value={`${week}/${target}`} />
        <Box label="Streak" value={`${streak.current}s`} />
        <Box label="Treinos" value={`${dates.length}`} />
        <Box label="Pontos" value={`${data?.totalPoints ?? 0}`} />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        PLANO E FEEDBACK
      </h2>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Plano</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={profile?.plan ?? "base"}
            onChange={(e) => {
              const plan = PLANS.find((p) => p.id === e.target.value);
              void saveProfileConfig({ plan: e.target.value, plan_price: plan?.price ?? 0 });
            }}
          >
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatBRL(p.price)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Intervalo de feedback</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={profile?.feedback_interval_days ?? 30}
            onChange={(e) => void saveProfileConfig({ feedback_interval_days: Number(e.target.value) })}
          >
            {FEEDBACK_INTERVALS.map((d) => (
              <option key={d} value={d}>
                A cada {d} dias
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meta semanal</Label>
          <Input
            className="h-10"
            inputMode="numeric"
            defaultValue={target}
            onBlur={(e) => void saveProfileConfig({ weekly_target: Number(e.target.value) || 3 })}
          />
        </div>
        <div className="sm:col-span-3">
          <Label className="text-xs">Novo feedback</Label>
          <Textarea
            className="mt-1"
            placeholder="Como foi o ciclo, ajustes e orientações…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {profile?.next_feedback_at
                ? `Próximo atendimento: ${new Date(profile.next_feedback_at).toLocaleDateString("pt-BR")}`
                : "Feedback pendente"}
            </p>
            <Button size="sm" className="strng-title font-bold" onClick={registerFeedback}>
              Registrar feedback
            </Button>
          </div>
        </div>
      </div>

      {(data?.feedbacks.length ?? 0) > 0 && (
        <ul className="mt-3 space-y-2">
          {(data?.feedbacks ?? []).slice(0, 5).map((f) => (
            <li key={f.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {new Date(f.created_at).toLocaleDateString("pt-BR")}
              </p>
              <p className="mt-1">{f.content}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        EVOLUÇÃO CORPORAL
      </h2>
      <div className="rounded-xl border border-border bg-card p-4">
        {chartData.length > 1 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="cintura" stroke="hsl(var(--gold))" strokeWidth={2} />
                <Line type="monotone" dataKey="braço" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                <Line type="monotone" dataKey="coxa" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Registre pelo menos duas medições para ver a evolução comparativa.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["weight_kg", "Peso (kg)"],
              ["body_fat", "% gordura"],
              ["waist_cm", "Cintura"],
              ["hip_cm", "Quadril"],
              ["arm_cm", "Braço"],
              ["thigh_cm", "Coxa"],
              ["chest_cm", "Peitoral"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
              <Input
                className="h-9"
                inputMode="decimal"
                value={measure[key]}
                onChange={(e) => setMeasure({ ...measure, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={addMeasurement}>
          <Plus className="mr-1 h-4 w-4" /> Registrar medidas
        </Button>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        TREINOS ATIVOS E PRESCRIÇÃO
      </h2>
      <div className="mb-3 flex gap-2">
        <Input
          placeholder="Nome do novo treino personalizado"
          value={newWorkout}
          onChange={(e) => setNewWorkout(e.target.value)}
        />
        <Button className="strng-title font-bold" onClick={createWorkout}>
          Criar
        </Button>
      </div>

      <ul className="space-y-3">
        {(data?.workouts ?? []).map((w) => {
          const rows = [...(w.workout_exercises ?? [])].sort((a, b) => a.position - b.position);
          return (
            <li key={w.id} className="rounded-xl border border-border bg-card p-4">
              <p className="strng-title font-bold">{w.name}</p>
              <p className="text-xs text-muted-foreground">{w.objective}</p>
              <div className="mt-3 space-y-3">
                {rows.map((r) => (
                  <PrescriptionRow
                    key={r.id}
                    row={r}
                    name={r.exercises?.name ?? "Exercício"}
                    onSave={(patch) => updateExercise(r.id, patch)}
                    onRemove={() => removeExercise(r.id)}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      void addExercise(w.id, e.target.value, rows.length + 1);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Adicionar exercício…</option>
                  {(data?.exercises ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.muscle_group ? ` · ${e.muscle_group}` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Desativar treino"
                  onClick={async () => {
                    await supabase.from("student_workouts").update({ active: false }).eq("id", w.id);
                    refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          );
        })}
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
            {s.student_feedback && (
              <p className="mt-2 rounded-md bg-muted p-2 text-xs">Aluno: {s.student_feedback}</p>
            )}
            {data?.photos?.[s.id] && (
              <img
                src={data.photos[s.id]}
                alt={`Foto pós-treino de ${s.workout_name}`}
                loading="lazy"
                className="mt-2 h-40 w-full rounded-md border border-border object-cover"
              />
            )}
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
