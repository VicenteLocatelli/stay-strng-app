import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NO_KEY =
  "Chave do Gemini ainda não configurada. Adicione GEMINI_API_KEY nas configurações do projeto para ativar a IA.";

type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GEMINI_MODELS = ["gemini-flash-latest", "gemini-3.8-flash"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini<T>(system: string, prompt: string): Promise<AiResult<T>> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return { ok: false, error: NO_KEY };
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  let res: Response | null = null;
  let lastStatus = 0;
  outer: for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body },
      );
      if (res.ok) break outer;
      lastStatus = res.status;
      console.error("Gemini error", model, res.status, (await res.text()).slice(0, 300));
      if (res.status === 400 || res.status === 403) {
        return { ok: false, error: "Chave do Gemini inválida ou sem permissão." };
      }
      if (res.status === 404) break; // tenta o próximo modelo
      if (res.status === 429 || res.status >= 500) {
        await sleep(1500 * (attempt + 1) + Math.random() * 500);
        continue;
      }
      break;
    }
  }
  if (!res || !res.ok) {
    if (lastStatus === 429) return { ok: false, error: "Limite gratuito do Gemini atingido. Tente em alguns minutos." };
    return { ok: false, error: "O Google Gemini está sobrecarregado agora. Tente novamente em alguns minutos." };
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "A IA retornou uma resposta inválida. Tente novamente." };
  }
}

// ---------------- Dieta (coach) ----------------
export const aiGenerateDiet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ studentId: z.string().uuid(), meals: z.number().min(2).max(8), instructions: z.string().max(1000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: plans }, { data: foods }, { data: measure }, { data: profile }] = await Promise.all([
      supabase.from("diet_plans").select("*").eq("student_id", data.studentId).order("created_at", { ascending: false }).limit(1),
      supabase.from("foods").select("id,name,portion_g,kcal,protein_animal_g,protein_veg_g,carbs_g,fat_g").eq("active", true).order("name"),
      supabase.from("body_measurements").select("weight_kg,body_fat").eq("student_id", data.studentId).order("measured_on", { ascending: false }).limit(1),
      supabase.from("profiles").select("full_name,goal").eq("id", data.studentId).maybeSingle(),
    ]);
    let plan = plans?.[0];
    if (!plan) {
      const { data: created, error } = await supabase
        .from("diet_plans")
        .insert({
          student_id: data.studentId,
          trainer_id: userId,
          status: "draft",
          tmb_method: "mifflin",
          activity_factor: 1.5,
          training_days: 5,
          rest_days: 2,
          surplus_pct: 0,
          deficit_pct: 0,
          protein_pct: 30,
          fat_pct: 30,
          carbs_pct: 40,
          fiber_g: 30,
          weight_kg: measure?.[0]?.weight_kg ?? null,
        })
        .select("*")
        .single();
      if (error || !created) return { ok: false as const, error: error?.message ?? "Erro ao criar plano." };
      plan = created;
    }
    const list = (foods ?? []);
    const foodText = list
      .map((f, i) => `${i}|${f.name}|${f.portion_g}g|${f.kcal}kcal|P${Number(f.protein_animal_g) + Number(f.protein_veg_g)}|C${f.carbs_g}|G${f.fat_g}`)
      .join("\n");
    const ctx = {
      aluno: profile?.full_name,
      objetivo: plan.goal ?? profile?.goal,
      peso_kg: plan.weight_kg ?? measure?.[0]?.weight_kg,
      altura_cm: plan.height_cm,
      idade: plan.age,
      sexo: plan.sex,
      gordura_pct: plan.body_fat ?? measure?.[0]?.body_fat,
      kcal_alvo_treino: plan.kcal_training,
      macros_pct: { proteina: plan.protein_pct, carbo: plan.carbs_pct, gordura: plan.fat_pct },
    };
    const system = `Você é nutricionista esportivo da consultoria STAY STRNG. Monte cardápios usando SOMENTE alimentos da lista fornecida (formato: indice|nome|porção|kcal|proteína|carbo|gordura por porção). Se kcal alvo estiver vazio, estime pelo peso/objetivo (Mifflin-St Jeor, FA 1.5). Responda JSON: {"meals":[{"name":string,"time":"HH:MM","items":[{"food":indice,"grams":number,"substitutes":string}]}],"kcal_total":number,"notes":string}. Use alimentos comuns brasileiros e quantidades realistas.`;
    const prompt = `Dados do aluno: ${JSON.stringify(ctx)}\nNúmero de refeições: ${data.meals}\nInstruções do coach: ${data.instructions || "nenhuma"}\n\nALIMENTOS:\n${foodText}`;
    const ai = await callGemini<{ meals: { name: string; time?: string; items: { food: number; grams: number; substitutes?: string }[] }[]; kcal_total?: number; notes?: string }>(system, prompt);
    if (!ai.ok) return ai;

    const { count } = await supabase.from("diet_meals").select("id", { count: "exact", head: true }).eq("plan_id", plan.id);
    let pos = count ?? 0;
    for (const m of ai.data.meals ?? []) {
      const { data: meal, error } = await supabase
        .from("diet_meals")
        .insert({ plan_id: plan.id, name: m.name, meal_time: m.time ?? null, position: ++pos })
        .select("id")
        .single();
      if (error || !meal) continue;
      const items = (m.items ?? [])
        .filter((it) => list[it.food])
        .map((it, i) => ({
          meal_id: meal.id,
          food_id: list[it.food]!.id,
          quantity_g: Math.round(Number(it.grams) || 100),
          substitutes: it.substitutes || null,
          position: i + 1,
        }));
      if (items.length) await supabase.from("diet_meal_items").insert(items);
    }
    return { ok: true as const, data: { kcal: ai.data.kcal_total ?? null, notes: ai.data.notes ?? "" } };
  });

// ---------------- Treino (coach) ----------------
export const aiGenerateWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      studentId: z.string().uuid(),
      env: z.enum(["gym", "home", "any"]),
      instructions: z.string().min(3).max(1000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("exercises").select("id,name,muscle_group,equipment,is_cardio").eq("active", true);
    if (data.env === "gym") q = q.eq("env_gym", true);
    if (data.env === "home") q = q.eq("env_home", true);
    const { data: exs } = await q.order("name");
    const list = exs ?? [];
    if (list.length === 0) return { ok: false as const, error: "Nenhum exercício cadastrado para esse ambiente ainda." };
    const exText = list.map((e, i) => `${i}|${e.name}|${e.muscle_group ?? ""}|${e.equipment ?? "sem equipamento"}${e.is_cardio ? "|cardio" : ""}`).join("\n");
    const system = `Você é treinador de musculação da STAY STRNG. Monte UM treino usando SOMENTE exercícios da lista (indice|nome|grupo|equipamento). Respeite limitações (obesidade, iniciante, lesões). Se faltar algum exercício importante na lista, cite em "missing" (não use no treino). Responda JSON: {"name":string,"objective":string,"exercises":[{"index":number,"sets":number,"reps":string,"rest_seconds":number,"notes":string}],"missing":[string]}.`;
    const ai = await callGemini<{ name: string; objective?: string; exercises: { index: number; sets: number; reps: string; rest_seconds: number; notes?: string }[]; missing?: string[] }>(
      system,
      `Pedido do coach: ${data.instructions}\n\nEXERCÍCIOS:\n${exText}`,
    );
    if (!ai.ok) return ai;
    const valid = (ai.data.exercises ?? []).filter((e) => list[e.index]);
    if (!valid.length) return { ok: false as const, error: "A IA não encontrou exercícios adequados na biblioteca." };
    const { data: w, error } = await supabase
      .from("student_workouts")
      .insert({
        student_id: data.studentId,
        trainer_id: userId,
        name: ai.data.name || "Treino IA",
        objective: ai.data.objective ?? null,
        update_notice_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !w) return { ok: false as const, error: error?.message ?? "Erro ao criar treino." };
    await supabase.from("workout_exercises").insert(
      valid.map((e, i) => ({
        student_workout_id: w.id,
        exercise_id: list[e.index]!.id,
        position: i + 1,
        sets: Math.max(1, Math.round(Number(e.sets) || 3)),
        rep_range: String(e.reps ?? "10-12"),
        rest_seconds: Math.round(Number(e.rest_seconds) || 60),
        notes: e.notes || null,
      })),
    );
    return { ok: true as const, data: { name: ai.data.name, missing: ai.data.missing ?? [] } };
  });

// ---------------- Substituições (aluno) ----------------
export const aiAskSubstitution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ question: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: plans } = await supabase
      .from("diet_plans")
      .select("goal,kcal_training,diet_meals(name,diet_meal_items(quantity_g,custom_name,foods(name,portion_g,kcal,protein_animal_g,protein_veg_g,carbs_g,fat_g)))")
      .eq("student_id", userId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1);
    const plan = plans?.[0];
    const system = `Você é o assistente de dieta da consultoria STAY STRNG, falando com um aluno. Ajude com substituições equivalentes (calorias e macros) entre alimentos saudáveis do dia a dia, dando gramaturas. REGRA INEGOCIÁVEL: se a pergunta envolver junk food, doces, fast food, frituras, pizza, hambúrguer, salgadinhos, refrigerante com açúcar, bebida alcoólica ou refeição livre, NÃO autorize nem calcule; diga com tom motivador que isso precisa da aprovação do Coach Vicente e que ele já foi avisado. Nunca prescreva fora do contexto de dieta. Respostas curtas, em português. Responda JSON: {"answer":string,"flagged":boolean} (flagged=true para os casos da regra inegociável).`;
    const ai = await callGemini<{ answer: string; flagged: boolean }>(
      system,
      `Plano atual do aluno: ${plan ? JSON.stringify(plan) : "sem plano publicado"}\n\nPergunta: ${data.question}`,
    );
    if (!ai.ok) return ai;
    await supabase.from("diet_questions").insert({
      student_id: userId,
      question: data.question,
      answer: ai.data.answer,
      flagged: !!ai.data.flagged,
    });
    return { ok: true as const, data: { answer: ai.data.answer, flagged: !!ai.data.flagged } };
  });
