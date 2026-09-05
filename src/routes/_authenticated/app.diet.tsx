import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UtensilsCrossed, Lock, Send, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { goalLabel, itemTotals, macroGrams, tmbMethodLabel } from "@/lib/diet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/diet")({
  head: () => ({
    meta: [
      { title: "Dieta — STAY STRNG" },
      { name: "description", content: "Seu plano alimentar STAY STRNG, liberado pelo seu coach." },
      { property: "og:title", content: "Dieta — STAY STRNG" },
      { property: "og:description", content: "Plano alimentar liberado pelo coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DietPage,
});

type MealItem = {
  id: string;
  quantity_g: number;
  custom_name: string | null;
  foods: {
    name: string;
    portion_g: number;
    kcal: number;
    protein_animal_g: number;
    protein_veg_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
  } | null;
};

type Meal = {
  id: string;
  name: string;
  time_hint: string | null;
  position: number;
  diet_meal_items: MealItem[];
};

type DietPlan = {
  id: string;
  goal: string | null;
  tmb_method: string;
  kcal_training: number | null;
  kcal_rest: number | null;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  notes: string | null;
  diet_meals?: Meal[];
};

function DietPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const studentId = me?.userId;
  const [feedback, setFeedback] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["student-diet", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [planRes, feedbacksRes] = await Promise.all([
        supabase
          .from("diet_plans")
          .select("*, diet_meals(*, diet_meal_items(*, foods(*)))")
          .eq("student_id", studentId!)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1),
        supabase
          .from("diet_feedbacks")
          .select("id,content,created_at")
          .eq("student_id", studentId!)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return {
        plan: (planRes.data?.[0] ?? null) as DietPlan | null,
        feedbacks: feedbacksRes.data ?? [],
      };
    },
  });

  const plan = data?.plan ?? null;

  const meals = useMemo(
    () => [...(plan?.diet_meals ?? [])].sort((a, b) => a.position - b.position),
    [plan],
  );

  const dayTotals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    for (const m of meals)
      for (const it of m.diet_meal_items) {
        if (!it.foods) continue;
        const x = itemTotals(it.foods, it.quantity_g);
        t.kcal += x.kcal;
        t.protein += x.protein_g;
        t.carbs += x.carbs_g;
        t.fat += x.fat_g;
        t.fiber += x.fiber_g;
      }
    return t;
  }, [meals]);

  const targets = useMemo(() => {
    if (!plan) return null;
    const kcal = plan.kcal_training ?? 0;
    if (!kcal) return null;
    return {
      kcal,
      kcalRest: plan.kcal_rest ?? 0,
      macros: macroGrams(kcal, plan.protein_pct, plan.carbs_pct, plan.fat_pct),
    };
  }, [plan]);

  const sendFeedback = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("diet_feedbacks").insert({
        student_id: studentId!,
        plan_id: plan?.id ?? null,
        content: feedback.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFeedback("");
      toast.success("Feedback enviado ao seu coach.");
      qc.invalidateQueries({ queryKey: ["student-diet", studentId] });
    },
    onError: () => toast.error("Não foi possível enviar o feedback."),
  });

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">Dieta</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nutrição é metade do resultado.</p>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>}

      {!isLoading && !plan && (
        <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-muted p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background/70">
            <Lock className="h-6 w-6 text-gold" />
          </span>
          <p className="strng-title mt-4 text-xl font-bold">Aguardando o Coach</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu plano alimentar será liberado pelo Coach. Assim que estiver pronto, ele aparece aqui.
          </p>
        </section>
      )}

      {plan && targets && (
        <>
          <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-muted p-5">
            <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">
              {goalLabel(plan.goal).toUpperCase()} · {tmbMethodLabel(plan.tmb_method)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-background/60 p-3">
                <p className="strng-title text-2xl font-bold text-primary">{targets.kcal}</p>
                <p className="text-[10px] tracking-widest text-muted-foreground">KCAL TREINO</p>
              </div>
              <div className="rounded-lg bg-background/60 p-3">
                <p className="strng-title text-2xl font-bold">{targets.kcalRest}</p>
                <p className="text-[10px] tracking-widest text-muted-foreground">KCAL DESCANSO</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Macro label="Proteína" grams={targets.macros.protein_g} planned={dayTotals.protein} />
              <Macro label="Carbo" grams={targets.macros.carbs_g} planned={dayTotals.carbs} />
              <Macro label="Gordura" grams={targets.macros.fat_g} planned={dayTotals.fat} />
            </div>
          </section>

          <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
            SUAS REFEIÇÕES · {Math.round(dayTotals.kcal)} KCAL NO CARDÁPIO
          </h2>
          <ul className="space-y-3">
            {meals.map((m) => {
              const kcal = m.diet_meal_items.reduce(
                (s, it) => s + (it.foods ? itemTotals(it.foods, it.quantity_g).kcal : 0),
                0,
              );
              return (
                <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="strng-title text-base font-bold">{m.name}</p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 text-primary" /> {Math.round(kcal)} kcal
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {m.diet_meal_items.map((it) => (
                      <li key={it.id} className="flex justify-between text-sm">
                        <span className="text-foreground/90">{it.foods?.name ?? it.custom_name}</span>
                        <span className="text-muted-foreground">{it.quantity_g}g</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            {meals.length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                O coach publicou as metas; as refeições serão montadas em seguida.
              </li>
            )}
          </ul>

          {plan.notes ? (
            <p className="mt-4 rounded-xl bg-muted p-4 text-xs text-muted-foreground">
              Orientações do coach: {plan.notes}
            </p>
          ) : null}

          <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
            COMO ESTÁ A DIETA?
          </h2>
          <section className="rounded-2xl border border-border bg-card p-4">
            <Textarea
              placeholder="Conte ao coach: fome, dificuldades, o que mudou na rotina…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <Button
              className="strng-title mt-3 w-full font-bold"
              disabled={!feedback.trim() || sendFeedback.isPending}
              onClick={() => sendFeedback.mutate()}
            >
              <Send className="mr-2 h-4 w-4" /> Enviar feedback da dieta
            </Button>
            {(data?.feedbacks.length ?? 0) > 0 && (
              <ul className="mt-3 space-y-2">
                {data!.feedbacks.map((f) => (
                  <li key={f.id} className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    <span className="text-foreground">
                      {new Date(f.created_at).toLocaleDateString("pt-BR")}
                    </span>{" "}
                    — {f.content}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {!plan && !isLoading && (
        <ul className="mt-5 space-y-3">
          <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-card p-4">
            <UtensilsCrossed className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="strng-title text-sm font-bold">Plano de refeições</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Café, almoço, pré e pós-treino, jantar — com quantidades calculadas para você.
              </p>
            </div>
          </li>
        </ul>
      )}
    </main>
  );
}

function Macro({ label, grams, planned }: { label: string; grams: number; planned: number }) {
  const pct = grams > 0 ? Math.min(100, (planned / grams) * 100) : 0;
  return (
    <div className="rounded-lg bg-background/60 p-2">
      <p className="strng-title text-sm font-bold">{Math.round(grams)}g</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <Progress value={pct} className="mt-1.5 h-1" />
      <p className="mt-1 text-[9px] text-muted-foreground">cardápio: {Math.round(planned)}g</p>
    </div>
  );
}
