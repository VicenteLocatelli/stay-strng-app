import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/coach/exercises")({
  head: () => ({
    meta: [
      { title: "Biblioteca de exercícios — STAY STRNG" },
      { name: "description", content: "Consulte a biblioteca de exercícios da consultoria." },
      { property: "og:title", content: "Biblioteca de exercícios — STAY STRNG" },
      { property: "og:description", content: "Biblioteca de exercícios da consultoria." },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("id,name,muscle_group,equipment,execution,common_mistakes")
        .eq("active", true)
        .order("muscle_group")
        .order("name");
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <h1 className="text-3xl font-bold">Exercícios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {exercises?.length ?? 0} exercícios na biblioteca.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(exercises ?? []).map((e) => (
          <li key={e.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs tracking-widest text-primary">
              {(e.muscle_group ?? "GERAL").toUpperCase()}
            </p>
            <p className="strng-title mt-1 text-lg font-bold">{e.name}</p>
            {e.equipment && <p className="text-xs text-muted-foreground">{e.equipment}</p>}
            {e.execution && <p className="mt-2 text-xs text-muted-foreground">{e.execution}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
