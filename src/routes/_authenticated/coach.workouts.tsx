import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coach/workouts")({
  head: () => ({
    meta: [
      { title: "Treinos e prescrição — STAY STRNG" },
      { name: "description", content: "Crie, edite, duplique e atribua modelos de treino." },
      { property: "og:title", content: "Treinos e prescrição — STAY STRNG" },
      { property: "og:description", content: "Modelos de treino e prescrição." },
    ],
  }),
  component: WorkoutsPage,
});

export type PrescriptionPatch = {
  sets: number;
  rep_range: string | null;
  recommended_load: string | null;
  cadence: string | null;
  rest_seconds: number;
};

type TemplateExercise = {
  id: string;
  exercise_id: string;
  position: number;
  sets: number;
  rep_range: string | null;
  recommended_load: string | null;
  cadence: string | null;
  rest_seconds: number;
  technique: string | null;
  notes: string | null;
};

function WorkoutsPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", objective: "", description: "", minutes: "" });

  const { data } = useQuery({
    queryKey: ["coach-workouts", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const [templates, links, exercises] = await Promise.all([
        supabase
          .from("workout_templates")
          .select(
            "id,trainer_id,name,objective,description,estimated_minutes,template_exercises(id,exercise_id,position,sets,rep_range,recommended_load,cadence,rest_seconds,technique,notes)",
          )
          .eq("active", true)
          .order("name"),
        supabase
          .from("trainer_students")
          .select("student_id")
          .eq("trainer_id", me!.userId)
          .eq("active", true),
        supabase
          .from("exercises")
          .select("id,name,muscle_group,env_gym,env_home")
          .eq("active", true)
          .order("name"),
      ]);
      const ids = (links.data ?? []).map((l) => l.student_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string }[] };
      return {
        templates: templates.data ?? [],
        students: profiles ?? [],
        exercises: exercises.data ?? [],
      };
    },
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["coach-workouts"] });
  }

  async function createTemplate() {
    if (!newTpl.name.trim()) {
      toast.error("Dê um nome ao treino.");
      return;
    }
    const { data: created, error } = await supabase
      .from("workout_templates")
      .insert({
        trainer_id: me!.userId,
        name: newTpl.name.trim(),
        objective: newTpl.objective || null,
        description: newTpl.description || null,
        estimated_minutes: newTpl.minutes ? Number(newTpl.minutes) : null,
      })
      .select("id")
      .single();
    if (error || !created) {
      toast.error("Não foi possível criar o modelo.");
      return;
    }
    toast.success("Modelo criado. Adicione os exercícios.");
    setNewTpl({ name: "", objective: "", description: "", minutes: "" });
    setCreating(false);
    setEditing(created.id);
    refresh();
  }

  async function duplicate(templateId: string) {
    const tpl = data?.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const { data: created, error } = await supabase
      .from("workout_templates")
      .insert({
        trainer_id: me!.userId,
        name: `${tpl.name} (cópia)`,
        objective: tpl.objective,
        description: tpl.description,
        estimated_minutes: tpl.estimated_minutes,
      })
      .select("id")
      .single();
    if (error || !created) {
      toast.error("Não foi possível duplicar.");
      return;
    }
    const exs = (tpl.template_exercises ?? []) as TemplateExercise[];
    if (exs.length) {
      await supabase.from("template_exercises").insert(
        exs.map((e) => ({
          template_id: created.id,
          exercise_id: e.exercise_id,
          position: e.position,
          sets: e.sets,
          rep_range: e.rep_range,
          recommended_load: e.recommended_load,
          cadence: e.cadence,
          rest_seconds: e.rest_seconds,
          technique: e.technique,
          notes: e.notes,
        })),
      );
    }
    toast.success("Modelo duplicado.");
    setEditing(created.id);
    refresh();
  }

  async function removeTemplate(templateId: string) {
    const { error } = await supabase.from("workout_templates").delete().eq("id", templateId);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    toast.success("Modelo excluído.");
    refresh();
  }

  async function assign(templateId: string, studentId: string) {
    setAssigning(templateId + studentId);
    const tpl = data?.templates.find((t) => t.id === templateId);
    const { data: created, error } = await supabase
      .from("student_workouts")
      .insert({
        student_id: studentId,
        trainer_id: me!.userId,
        source_template_id: templateId,
        name: tpl?.name ?? "Treino",
        objective: tpl?.objective ?? null,
        description: tpl?.description ?? null,
        estimated_minutes: tpl?.estimated_minutes ?? null,
      })
      .select("id")
      .single();

    if (error || !created) {
      setAssigning(null);
      toast.error("Não foi possível atribuir o treino.");
      return;
    }

    const exs = (tpl?.template_exercises ?? []) as TemplateExercise[];
    if (exs.length) {
      await supabase.from("workout_exercises").insert(
        exs.map((e) => ({
          student_workout_id: created.id,
          exercise_id: e.exercise_id,
          position: e.position,
          sets: e.sets,
          rep_range: e.rep_range,
          recommended_load: e.recommended_load,
          cadence: e.cadence,
          rest_seconds: e.rest_seconds,
          technique: e.technique,
          notes: e.notes,
        })),
      );
    }

    setAssigning(null);
    toast.success("Treino atribuído ao aluno.");
    qc.invalidateQueries({ queryKey: ["coach-student"] });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Treinos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelos prontos para prescrever. O aluno escolhe o dia — sem dias fixos.
          </p>
        </div>
        <Button className="strng-title font-bold" onClick={() => setCreating((c) => !c)}>
          {creating ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {creating ? "Fechar" : "Novo"}
        </Button>
      </div>

      {creating && (
        <div className="mt-5 space-y-3 rounded-xl border border-primary/40 bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input value={newTpl.name} onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Objetivo</Label>
              <Input
                value={newTpl.objective}
                onChange={(e) => setNewTpl({ ...newTpl, objective: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duração estimada (min)</Label>
              <Input
                inputMode="numeric"
                value={newTpl.minutes}
                onChange={(e) => setNewTpl({ ...newTpl, minutes: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={newTpl.description}
              onChange={(e) => setNewTpl({ ...newTpl, description: e.target.value })}
            />
          </div>
          <Button className="strng-title w-full font-bold" onClick={createTemplate}>
            Criar modelo
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {(data?.templates ?? []).map((t) => {
          const mine = t.trainer_id === me?.userId;
          return (
            <li key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="strng-title text-lg font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.objective} · {t.template_exercises?.length ?? 0} exercícios
                    {t.estimated_minutes ? ` · ~${t.estimated_minutes} min` : ""}
                    {mine ? "" : " · modelo padrão"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {mine && (
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Editar modelo"
                      onClick={() => setEditing(editing === t.id ? null : t.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="outline" aria-label="Duplicar" onClick={() => duplicate(t.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {mine && (
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Excluir"
                      onClick={() => removeTemplate(t.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {editing === t.id && mine && (
                <TemplateEditor
                  templateId={t.id}
                  exercises={data?.exercises ?? []}
                  rows={(t.template_exercises ?? []) as TemplateExercise[]}
                  onChanged={refresh}
                />
              )}

              {(data?.students.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(data?.students ?? []).map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant="outline"
                      disabled={assigning === t.id + s.id}
                      onClick={() => assign(t.id, s.id)}
                    >
                      Atribuir a {(s.full_name || "Aluno").split(" ")[0]}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function TemplateEditor({
  templateId,
  exercises,
  rows,
  onChanged,
}: {
  templateId: string;
  exercises: { id: string; name: string; muscle_group: string | null }[];
  rows: TemplateExercise[];
  onChanged: () => void;
}) {
  const [exerciseId, setExerciseId] = useState("");

  async function addExercise() {
    if (!exerciseId) return;
    const { error } = await supabase.from("template_exercises").insert({
      template_id: templateId,
      exercise_id: exerciseId,
      position: rows.length + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setExerciseId("");
    onChanged();
  }

  async function update(id: string, patch: PrescriptionPatch) {
    const { error } = await supabase.from("template_exercises").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else onChanged();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("template_exercises").delete().eq("id", id);
    if (error) toast.error(error.message);
    else onChanged();
  }

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      {sorted.map((r) => (
        <PrescriptionRow
          key={r.id}
          row={r}
          name={exercises.find((e) => e.id === r.exercise_id)?.name ?? "Exercício"}
          onSave={(patch) => update(r.id, patch)}
          onRemove={() => remove(r.id)}
        />
      ))}
      <div className="flex gap-2">
        <select
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
        >
          <option value="">Adicionar exercício…</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.muscle_group ? ` · ${e.muscle_group}` : ""}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={addExercise}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PrescriptionRow({
  row,
  name,
  onSave,
  onRemove,
}: {
  row: {
    sets: number;
    rep_range: string | null;
    recommended_load: string | null;
    cadence: string | null;
    rest_seconds: number;
  };
  name: string;
  onSave: (patch: PrescriptionPatch) => void;
  onRemove: () => void;
}) {
  const [form, setForm] = useState({
    sets: String(row.sets ?? 3),
    rep_range: row.rep_range ?? "",
    recommended_load: row.recommended_load ?? "",
    cadence: row.cadence ?? "",
    rest_seconds: String(row.rest_seconds ?? 90),
  });

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{name}</p>
        <button aria-label="Remover exercício" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Mini label="Séries" value={form.sets} onChange={(v) => setForm({ ...form, sets: v })} />
        <Mini label="Reps" value={form.rep_range} onChange={(v) => setForm({ ...form, rep_range: v })} />
        <Mini
          label="Carga"
          value={form.recommended_load}
          onChange={(v) => setForm({ ...form, recommended_load: v })}
        />
        <Mini label="Cadência" value={form.cadence} onChange={(v) => setForm({ ...form, cadence: v })} />
        <Mini
          label="Descanso (s)"
          value={form.rest_seconds}
          onChange={(v) => setForm({ ...form, rest_seconds: v })}
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() =>
          onSave({
            sets: Number(form.sets) || 1,
            rep_range: form.rep_range || null,
            recommended_load: form.recommended_load || null,
            cadence: form.cadence || null,
            rest_seconds: Number(form.rest_seconds) || 60,
          })
        }
      >
        Salvar
      </Button>
    </div>
  );
}

function Mini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <Input className="h-9" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
