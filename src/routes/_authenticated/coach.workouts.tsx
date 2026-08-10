import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/workouts")({
  head: () => ({
    meta: [
      { title: "Treinos e prescrição — STAY STRNG" },
      { name: "description", content: "Modelos de treino e atribuição para seus alunos." },
      { property: "og:title", content: "Treinos e prescrição — STAY STRNG" },
      { property: "og:description", content: "Modelos de treino e prescrição." },
    ],
  }),
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [assigning, setAssigning] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["coach-workouts", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const [templates, links] = await Promise.all([
        supabase
          .from("workout_templates")
          .select("id,name,objective,description,estimated_minutes,template_exercises(id)")
          .eq("active", true)
          .order("name"),
        supabase
          .from("trainer_students")
          .select("student_id")
          .eq("trainer_id", me!.userId)
          .eq("active", true),
      ]);
      const ids = (links.data ?? []).map((l) => l.student_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string }[] };
      return { templates: templates.data ?? [], students: profiles ?? [] };
    },
  });

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

    const { data: tplExercises } = await supabase
      .from("template_exercises")
      .select("exercise_id,position,sets,rep_range,recommended_load,cadence,rest_seconds,technique,notes")
      .eq("template_id", templateId);

    if (tplExercises?.length) {
      await supabase.from("workout_exercises").insert(
        tplExercises.map((e) => ({ ...e, student_workout_id: created.id })),
      );
    }

    setAssigning(null);
    toast.success("Treino atribuído ao aluno.");
    qc.invalidateQueries({ queryKey: ["coach-student"] });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <h1 className="text-3xl font-bold">Treinos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Modelos prontos para prescrever. O aluno escolhe o dia — sem dias fixos.
      </p>

      <ul className="mt-6 space-y-3">
        {(data?.templates ?? []).map((t) => (
          <li key={t.id} className="rounded-xl border border-border bg-card p-4">
            <p className="strng-title text-lg font-bold">{t.name}</p>
            <p className="text-xs text-muted-foreground">
              {t.objective} · {t.template_exercises?.length ?? 0} exercícios
              {t.estimated_minutes ? ` · ~${t.estimated_minutes} min` : ""}
            </p>
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
                    Atribuir a {s.full_name.split(" ")[0]}
                  </Button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
