import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVITY_FACTORS,
  DIET_GOALS,
  MACRO_PRESETS,
  TMB_METHODS,
  computeCalories,
  computeTmb,
  goalLabel,
  itemTotals,
  macroGrams,
  tmbMethodLabel,
  type TmbMethod,
} from "@/lib/diet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AiDietPanel } from "@/components/ai/ai-panels";
import { Plus, Trash2, CheckCircle2, UtensilsCrossed } from "lucide-react";

type FoodRow = {
  id: string;
  name: string;
  portion_g: number;
  kcal: number;
  protein_animal_g: number;
  protein_veg_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  is_recipe: boolean;
  trainer_id: string | null;
};

type MealItemRow = {
  id: string;
  meal_id: string;
  food_id: string | null;
  custom_name: string | null;
  quantity_g: number;
  foods?: FoodRow | null;
};

type MealRow = {
  id: string;
  plan_id: string;
  name: string;
  time_hint: string | null;
  position: number;
  diet_meal_items: MealItemRow[];
};

type PlanRow = {
  id: string;
  status: string;
  published_at: string | null;
  goal: string | null;
  notes: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: string | null;
  body_fat: number | null;
  tmb_method: string;
  activity_factor: number;
  training_days: number;
  rest_days: number;
  deficit_pct: number;
  surplus_pct: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  fiber_g: number;
  diet_meals?: MealRow[];
};

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function DietTab({ studentId, trainerId }: { studentId: string; trainerId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    weight_kg: "",
    height_cm: "",
    age: "",
    sex: "male",
    body_fat: "",
    tmb_method: "mifflin" as TmbMethod,
    activity_factor: "1.5",
    training_days: "5",
    rest_days: "2",
    goal: "maintain",
    adjust_pct: "10",
    protein_pct: "30",
    carbs_pct: "40",
    fat_pct: "30",
    fiber_g: "30",
    notes: "",
  });
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [newMeal, setNewMeal] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [itemDraft, setItemDraft] = useState<Record<string, { foodId: string; qty: string }>>({});
  const [newFood, setNewFood] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["coach-diet", studentId],
    queryFn: async () => {
      const [plans, foods, feedbacks, lastMeasure] = await Promise.all([
        supabase
          .from("diet_plans")
          .select("*, diet_meals(*, diet_meal_items(*, foods(*)))")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("foods").select("*").eq("active", true).order("name").limit(800),
        supabase
          .from("diet_feedbacks")
          .select("id,content,created_at,student_id")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("body_measurements")
          .select("weight_kg,body_fat")
          .eq("student_id", studentId)
          .order("measured_on", { ascending: false })
          .limit(1),
      ]);
      return {
        plan: (plans.data?.[0] ?? null) as PlanRow | null,
        foods: (foods.data ?? []) as FoodRow[],
        feedbacks: (feedbacks.data ?? []).filter((f) => f.student_id === studentId),
        lastMeasure: lastMeasure.data?.[0] ?? null,
      };
    },
  });

  const plan = data?.plan ?? null;

  // Preenche o formulário com o plano existente (uma vez por plano carregado).
  useEffect(() => {
    if (!plan || plan.id === loadedPlanId) return;
    setLoadedPlanId(plan.id as string);
    setForm((f) => ({
      ...f,
      weight_kg: plan.weight_kg != null ? String(plan.weight_kg) : f.weight_kg,
      height_cm: plan.height_cm != null ? String(plan.height_cm) : f.height_cm,
      age: plan.age != null ? String(plan.age) : f.age,
      sex: (plan.sex as string) ?? "male",
      body_fat: plan.body_fat != null ? String(plan.body_fat) : f.body_fat,
      tmb_method: (plan.tmb_method as TmbMethod) ?? "mifflin",
      activity_factor: String(plan.activity_factor ?? 1.5),
      training_days: String(plan.training_days ?? 5),
      rest_days: String(plan.rest_days ?? 2),
      goal: (plan.goal as string) ?? "maintain",
      adjust_pct: String(plan.goal === "cut" ? plan.deficit_pct ?? 10 : plan.surplus_pct ?? 10),
      protein_pct: String(plan.protein_pct ?? 30),
      carbs_pct: String(plan.carbs_pct ?? 40),
      fat_pct: String(plan.fat_pct ?? 30),
      fiber_g: String(plan.fiber_g ?? 30),
      notes: (plan.notes as string) ?? "",
    }));
  }, [plan, loadedPlanId]);

  // Sugere peso e % gordura da última medição quando o plano ainda não existe.
  useEffect(() => {
    if (plan || !data?.lastMeasure) return;
    setForm((f) => ({
      ...f,
      weight_kg: f.weight_kg || (data.lastMeasure!.weight_kg ? String(data.lastMeasure!.weight_kg) : ""),
      body_fat: f.body_fat || (data.lastMeasure!.body_fat ? String(data.lastMeasure!.body_fat) : ""),
    }));
  }, [plan, data?.lastMeasure]);

  const calc = useMemo(() => {
    const tmb = computeTmb(form.tmb_method, {
      sex: form.sex,
      weightKg: Number(form.weight_kg) || null,
      heightCm: Number(form.height_cm) || null,
      age: Number(form.age) || null,
      bodyFat: form.body_fat ? Number(form.body_fat) : null,
    });
    if (!tmb) return null;
    const planKcal = computeCalories({
      tmb,
      activityFactor: Number(form.activity_factor),
      goal: form.goal,
      adjustPct: Number(form.adjust_pct) || 0,
    });
    return {
      ...planKcal,
      macrosTraining: macroGrams(
        planKcal.kcalTraining,
        Number(form.protein_pct) || 0,
        Number(form.carbs_pct) || 0,
        Number(form.fat_pct) || 0,
      ),
    };
  }, [form]);

  const filteredFoods = useMemo(() => {
    const q = foodQuery.trim().toLowerCase();
    const list = data?.foods ?? [];
    if (!q) return list.slice(0, 30);
    return list.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 30);
  }, [data?.foods, foodQuery]);

  const meals = useMemo(
    () => [...(plan?.diet_meals ?? [])].sort((a, b) => a.position - b.position),
    [plan],
  );

  const dayTotals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    for (const m of meals) {
      for (const it of m.diet_meal_items) {
        if (!it.foods) continue;
        const x = itemTotals(it.foods, it.quantity_g);
        t.kcal += x.kcal;
        t.protein += x.protein_g;
        t.carbs += x.carbs_g;
        t.fat += x.fat_g;
      }
    }
    return t;
  }, [meals]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["coach-diet", studentId] });
  }

  async function savePlan(publish = false) {
    if (!calc) {
      toast.error("Preencha peso, altura e idade para calcular.");
      return;
    }
    setSaving(true);
    const payload = {
      student_id: studentId,
      trainer_id: trainerId,
      weight_kg: Number(form.weight_kg) || null,
      height_cm: Number(form.height_cm) || null,
      age: Number(form.age) || null,
      sex: form.sex,
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      tmb_method: form.tmb_method,
      activity_factor: Number(form.activity_factor),
      training_days: Number(form.training_days) || 0,
      rest_days: Number(form.rest_days) || 0,
      goal: form.goal,
      deficit_pct: form.goal === "cut" ? Number(form.adjust_pct) || 0 : 0,
      surplus_pct: form.goal === "bulk" ? Number(form.adjust_pct) || 0 : 0,
      protein_pct: Number(form.protein_pct) || 0,
      carbs_pct: Number(form.carbs_pct) || 0,
      fat_pct: Number(form.fat_pct) || 0,
      fiber_g: Number(form.fiber_g) || 30,
      tmb_kcal: Math.round(calc.tmb),
      tdee_kcal: Math.round(calc.tdee),
      kcal_training: Math.round(calc.kcalTraining),
      kcal_rest: Math.round(calc.kcalRest),
      notes: form.notes || null,
      status: publish ? "published" : ((plan?.status as string) ?? "draft"),
      published_at: publish ? new Date().toISOString() : ((plan?.published_at as string) ?? null),
    };
    const { error } = plan
      ? await supabase.from("diet_plans").update(payload).eq("id", plan.id as string)
      : await supabase.from("diet_plans").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(publish ? "Dieta publicada para o aluno!" : "Plano salvo como rascunho.");
    refresh();
  }

  async function addMeal() {
    if (!plan) {
      toast.error("Salve o plano antes de montar as refeições.");
      return;
    }
    if (!newMeal.trim()) return;
    const { error } = await supabase.from("diet_meals").insert({
      plan_id: plan.id as string,
      name: newMeal.trim(),
      position: meals.length + 1,
    });
    if (error) toast.error(error.message);
    else {
      setNewMeal("");
      refresh();
    }
  }

  async function removeMeal(id: string) {
    const { error } = await supabase.from("diet_meals").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function addItem(mealId: string) {
    const draft = itemDraft[mealId];
    if (!draft?.foodId || !draft.qty) {
      toast.error("Escolha o alimento e a quantidade.");
      return;
    }
    const { error } = await supabase.from("diet_meal_items").insert({
      meal_id: mealId,
      food_id: draft.foodId,
      quantity_g: Number(draft.qty),
      position: 0,
    });
    if (error) toast.error(error.message);
    else {
      setItemDraft((d) => ({ ...d, [mealId]: { foodId: "", qty: "" } }));
      refresh();
    }
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("diet_meal_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function addFood() {
    if (!newFood.name.trim() || !newFood.kcal) {
      toast.error("Informe nome e calorias do alimento.");
      return;
    }
    const kcal = Number(newFood.kcal);
    const protein = Number(newFood.protein) || 0;
    const carbs = Number(newFood.carbs) || 0;
    const fat = Number(newFood.fat) || 0;
    const { error } = await supabase.from("foods").insert({
      trainer_id: trainerId,
      name: newFood.name.trim(),
      portion_g: 100,
      kcal,
      protein_veg_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Alimento cadastrado na sua base.");
      setNewFood({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Calculadora */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground">
          CALCULADORA (PLAN-DIET)
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Num label="Peso (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
          <Num label="Altura (cm)" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
          <Num label="Idade" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
          <Num label="% Gordura" value={form.body_fat} onChange={(v) => setForm({ ...form, body_fat: v })} />
          <div className="space-y-1">
            <Label className="text-xs">Sexo</Label>
            <select className={inputCls} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Método TMB</Label>
            <select
              className={inputCls}
              value={form.tmb_method}
              onChange={(e) => setForm({ ...form, tmb_method: e.target.value as TmbMethod })}
            >
              {TMB_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fator de atividade</Label>
            <select
              className={inputCls}
              value={form.activity_factor}
              onChange={(e) => setForm({ ...form, activity_factor: e.target.value })}
            >
              {ACTIVITY_FACTORS.map((f) => (
                <option key={f.value} value={String(f.value)}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Objetivo</Label>
            <select className={inputCls} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              {DIET_GOALS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <Num
            label={form.goal === "cut" ? "Déficit (%)" : form.goal === "bulk" ? "Superávit (%)" : "Ajuste (%)"}
            value={form.adjust_pct}
            onChange={(v) => setForm({ ...form, adjust_pct: v })}
          />
          <Num label="Dias de treino" value={form.training_days} onChange={(v) => setForm({ ...form, training_days: v })} />
          <Num label="Dias de descanso" value={form.rest_days} onChange={(v) => setForm({ ...form, rest_days: v })} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label className="text-xs">Padrão de macros</Label>
            <select
              className={inputCls}
              value=""
              onChange={(e) => {
                const p = MACRO_PRESETS.find((x) => x.id === e.target.value);
                if (p)
                  setForm({
                    ...form,
                    protein_pct: String(p.protein_pct),
                    carbs_pct: String(p.carbs_pct),
                    fat_pct: String(p.fat_pct),
                  });
              }}
            >
              <option value="">Aplicar padrão…</option>
              {MACRO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <Num label="Proteína (%)" value={form.protein_pct} onChange={(v) => setForm({ ...form, protein_pct: v })} />
          <Num label="Carboidrato (%)" value={form.carbs_pct} onChange={(v) => setForm({ ...form, carbs_pct: v })} />
          <Num label="Gordura (%)" value={form.fat_pct} onChange={(v) => setForm({ ...form, fat_pct: v })} />
        </div>

        <div className="mt-3 space-y-1">
          <Label className="text-xs">Observações do plano</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        {/* Resultados */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Result label={`TMB · ${tmbMethodLabel(form.tmb_method)}`} value={calc ? `${Math.round(calc.tmb)} kcal` : "—"} />
          <Result label="GED (TDEE)" value={calc ? `${Math.round(calc.tdee)} kcal` : "—"} />
          <Result
            label="Dia de treino"
            value={calc ? `${Math.round(calc.kcalTraining)} kcal` : "—"}
            highlight
          />
          <Result label="Dia de descanso" value={calc ? `${Math.round(calc.kcalRest)} kcal` : "—"} />
        </div>
        {calc && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Macros (dia de treino): {Math.round(calc.macrosTraining.protein_g)}g proteína ·{" "}
            {Math.round(calc.macrosTraining.carbs_g)}g carboidrato · {Math.round(calc.macrosTraining.fat_g)}g gordura
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="strng-title font-bold" disabled={saving} onClick={() => savePlan(false)}>
            {plan ? "Salvar alterações" : "Salvar rascunho"}
          </Button>
          <Button
            variant="outline"
            className="border-gold text-gold"
            disabled={saving}
            onClick={() => savePlan(true)}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {plan?.status === "published" ? "Republicar dieta" : "Publicar para o aluno"}
          </Button>
        </div>
        {plan?.status === "published" && (
          <p className="mt-2 text-xs text-gold">
            Publicada {plan.published_at ? `em ${new Date(plan.published_at as string).toLocaleDateString("pt-BR")}` : ""} ·{" "}
            {goalLabel(plan.goal as string)}
          </p>
        )}
      </section>

      <AiDietPanel studentId={studentId} onDone={refresh} />

      {/* Refeições */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground">
          REFEIÇÕES {plan ? `· TOTAL DO DIA: ${Math.round(dayTotals.kcal)} kcal (P ${Math.round(dayTotals.protein)}g · C ${Math.round(dayTotals.carbs)}g · G ${Math.round(dayTotals.fat)}g)` : ""}
        </h2>

        {!plan ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Salve o plano acima para liberar a montagem das refeições.
          </p>
        ) : (
          <>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Nova refeição (ex: Café da manhã)"
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
              />
              <Button variant="outline" onClick={addMeal}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {calc && (
              <div className="mt-4 rounded-lg border border-gold/40 bg-background p-3">
                <p className="text-[10px] font-bold tracking-widest text-gold">ALVO VS. PRESCRITO (DIA DE TREINO)</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Compare label="Calorias" unit="kcal" target={calc.kcalTraining} actual={dayTotals.kcal} tolerance={50} />
                  <Compare label="Proteína" unit="g" target={calc.macrosTraining.protein_g} actual={dayTotals.protein} tolerance={5} />
                  <Compare label="Carbo" unit="g" target={calc.macrosTraining.carbs_g} actual={dayTotals.carbs} tolerance={5} />
                  <Compare label="Gordura" unit="g" target={calc.macrosTraining.fat_g} actual={dayTotals.fat} tolerance={5} />
                </div>
              </div>
            )}

            <ul className="mt-4 space-y-3">
              {meals.map((m) => {
                const totals = m.diet_meal_items.reduce(
                  (acc, it) => {
                    if (!it.foods) return acc;
                    const x = itemTotals(it.foods, it.quantity_g);
                    return { kcal: acc.kcal + x.kcal, protein: acc.protein + x.protein_g };
                  },
                  { kcal: 0, protein: 0 },
                );
                return (
                  <li key={m.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <p className="strng-title text-sm font-bold">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {Math.round(totals.kcal)} kcal · P {Math.round(totals.protein)}g
                        </span>
                        <button type="button" aria-label="Remover refeição" onClick={() => removeMeal(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>

                    <ul className="mt-2 space-y-1">
                      {m.diet_meal_items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between rounded bg-muted px-2 py-1 text-xs"
                        >
                          <span>
                            {it.foods?.name ?? it.custom_name ?? "Item"} — {it.quantity_g}g ·{" "}
                            {it.foods ? Math.round(itemTotals(it.foods, it.quantity_g).kcal) : 0} kcal
                          </span>
                          <button type="button" aria-label="Remover item" onClick={() => removeItem(it.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 flex gap-2">
                      <select
                        className={`${inputCls} flex-1`}
                        value={itemDraft[m.id]?.foodId ?? ""}
                        onChange={(e) =>
                          setItemDraft((d) => ({
                            ...d,
                            [m.id]: { foodId: e.target.value, qty: d[m.id]?.qty ?? "" },
                          }))
                        }
                      >
                        <option value="">Alimento…</option>
                        {filteredFoods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({Math.round(f.kcal)} kcal/{f.portion_g}g)
                          </option>
                        ))}
                      </select>
                      <Input
                        className="h-10 w-20"
                        inputMode="numeric"
                        placeholder="g"
                        value={itemDraft[m.id]?.qty ?? ""}
                        onChange={(e) =>
                          setItemDraft((d) => ({
                            ...d,
                            [m.id]: { foodId: d[m.id]?.foodId ?? "", qty: e.target.value },
                          }))
                        }
                      />
                      <Button size="icon" variant="outline" aria-label="Adicionar item" onClick={() => addItem(m.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Base de alimentos */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground">
          BASE DE ALIMENTOS ({data?.foods.length ?? 0})
        </h2>
        <Input
          className="mt-3"
          placeholder="Buscar alimento na base Plan-Diet…"
          value={foodQuery}
          onChange={(e) => setFoodQuery(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {filteredFoods.length} resultado(s) usados no seletor de cada refeição.
        </p>
        <div className="mt-4 rounded-lg border border-border p-3">
          <p className="text-[10px] tracking-widest text-muted-foreground">
            CADASTRAR ALIMENTO/RECEITA (POR 100G)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Input
              className="col-span-2 sm:col-span-1"
              placeholder="Nome"
              value={newFood.name}
              onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
            />
            <Input
              inputMode="decimal"
              placeholder="kcal"
              value={newFood.kcal}
              onChange={(e) => setNewFood({ ...newFood, kcal: e.target.value })}
            />
            <Input
              inputMode="decimal"
              placeholder="Prot (g)"
              value={newFood.protein}
              onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
            />
            <Input
              inputMode="decimal"
              placeholder="Carb (g)"
              value={newFood.carbs}
              onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
            />
            <Input
              inputMode="decimal"
              placeholder="Gord (g)"
              value={newFood.fat}
              onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
            />
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={addFood}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar à base
          </Button>
        </div>
      </section>

      {/* Feedbacks do aluno sobre a dieta */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4 text-gold" /> FEEDBACKS DO ALUNO SOBRE A DIETA
        </h2>
        {(data?.feedbacks.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum feedback de dieta enviado ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data!.feedbacks.map((f) => (
              <li key={f.id} className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </p>
                <p className="mt-1">{f.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input className="h-10" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? "border-gold/50 bg-gold/5" : "border-border bg-background"
      }`}
    >
      <p className="strng-title text-lg font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}

function Compare({ label, unit, target, actual, tolerance }: { label: string; unit: string; target: number; actual: number; tolerance: number }) {
  const diff = Math.round(actual - target);
  const ok = Math.abs(diff) <= tolerance;
  return (
    <div className="rounded-md border border-border p-2 text-center">
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <p className="strng-title text-sm font-bold">
        {Math.round(actual)} / {Math.round(target)} {unit}
      </p>
      <p className={`text-xs font-bold ${ok ? "text-gold" : diff < 0 ? "text-destructive" : "text-primary"}`}>
        {ok ? "No alvo" : `${diff > 0 ? "+" : ""}${diff} ${unit}`}
      </p>
    </div>
  );
}
