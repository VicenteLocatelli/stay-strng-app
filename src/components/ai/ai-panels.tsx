import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { aiAskSubstitution, aiGenerateDiet, aiGenerateWorkout } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AiDietPanel({ studentId, onDone }: { studentId: string; onDone: () => void }) {
  const gen = useServerFn(aiGenerateDiet);
  const [open, setOpen] = useState(false);
  const [meals, setMeals] = useState("5");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await gen({ data: { studentId, meals: Number(meals) || 5, instructions: text } });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Cardápio gerado${r.data.kcal ? ` (~${Math.round(r.data.kcal)} kcal)` : ""}. Revise antes de publicar.`);
      setOpen(false);
      onDone();
    } catch {
      toast.error("Não foi possível gerar a dieta agora.");
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return (
      <Button variant="outline" className="w-full border-gold/50 text-gold" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> Gerar cardápio com IA
      </Button>
    );
  return (
    <section className="rounded-xl border border-gold/40 bg-card p-4 space-y-3">
      <h3 className="strng-title text-sm font-bold tracking-widest text-gold">GERAR CARDÁPIO COM IA</h3>
      <p className="text-xs text-muted-foreground">
        Usa os dados do aluno e só alimentos da sua biblioteca. As refeições entram como rascunho para você revisar.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Refeições</span>
        <Input className="w-20" type="number" min={2} max={8} value={meals} onChange={(e) => setMeals(e.target.value)} />
      </div>
      <Textarea
        placeholder="Instruções (ex: intolerante à lactose, prefere ovos no café, jantar leve)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={run} disabled={busy} className="flex-1">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {busy ? "Gerando..." : "Gerar"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Fechar</Button>
      </div>
    </section>
  );
}

export function AiWorkoutPanel({ studentId, onDone }: { studentId: string; onDone: () => void }) {
  const gen = useServerFn(aiGenerateWorkout);
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState<"gym" | "home" | "any">("gym");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  async function run() {
    if (text.trim().length < 3) return void toast.error("Descreva o treino que deseja.");
    setBusy(true);
    try {
      const r = await gen({ data: { studentId, env, instructions: text } });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Treino "${r.data.name}" criado. Revise a prescrição.`);
      setMissing(r.data.missing);
      onDone();
    } catch {
      toast.error("Não foi possível gerar o treino agora.");
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return (
      <Button variant="outline" className="mb-3 w-full border-gold/50 text-gold" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> Montar treino com IA
      </Button>
    );
  return (
    <section className="mb-3 rounded-xl border border-gold/40 bg-card p-4 space-y-3">
      <h3 className="strng-title text-sm font-bold tracking-widest text-gold">MONTAR TREINO COM IA</h3>
      <div className="flex gap-2">
        {([["gym", "Academia"], ["home", "Em casa"], ["any", "Todos"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={env === k ? "default" : "outline"} onClick={() => setEnv(k)}>
            {l}
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="Ex: Treino A inferiores, iniciante obeso, em casa sem equipamento, 40 min"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {missing.length > 0 && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
          <p className="font-bold text-primary">Exercícios sugeridos que ainda não estão na biblioteca:</p>
          <p className="mt-1 text-muted-foreground">{missing.join(", ")}</p>
          <Link to="/coach/exercises" className="mt-1 inline-block font-semibold text-primary underline">
            Cadastrar exercícios
          </Link>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={run} disabled={busy} className="flex-1">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {busy ? "Montando..." : "Gerar treino"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Fechar</Button>
      </div>
    </section>
  );
}

export function StudentDietAssistant() {
  const ask = useServerFn(aiAskSubstitution);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<{ q: string; a: string; flagged: boolean }[]>([]);

  async function send() {
    const question = q.trim();
    if (question.length < 3) return;
    setBusy(true);
    try {
      const r = await ask({ data: { question } });
      if (!r.ok) return void toast.error(r.error);
      setChat((c) => [...c, { q: question, a: r.data.answer, flagged: r.data.flagged }]);
      setQ("");
    } catch {
      toast.error("Assistente indisponível agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gold/40 bg-card p-4">
      <h2 className="strng-title flex items-center gap-2 text-sm font-bold tracking-widest text-gold">
        <Sparkles className="h-4 w-4" /> DÚVIDA OU SUBSTITUIÇÃO?
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pergunte como trocar um alimento do seu plano. Itens fora da dieta vão para o coach aprovar.
      </p>
      <ul className="mt-3 space-y-3">
        {chat.map((m, i) => (
          <li key={i} className="space-y-1 text-sm">
            <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-muted px-3 py-2">{m.q}</p>
            <p className={`max-w-[90%] rounded-lg border px-3 py-2 ${m.flagged ? "border-primary/50 bg-primary/10" : "border-border"}`}>
              {m.flagged && <AlertTriangle className="mr-1 inline h-4 w-4 text-primary" />}
              {m.a}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Ex: Posso trocar o arroz por batata?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && send()}
        />
        <Button onClick={send} disabled={busy || q.trim().length < 3}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </section>
  );
}

export function CoachFoodApprovalAlerts() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["coach-diet-questions"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("diet_questions")
        .select("id, student_id, question, created_at")
        .eq("flagged", true)
        .is("coach_seen_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      const ids = [...new Set((rows ?? []).map((r) => r.student_id))];
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string }[] };
      const names = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      return (rows ?? []).map((r) => ({ ...r, name: names.get(r.student_id) || "Aluno" }));
    },
  });
  if (!data?.length) return null;

  async function seen(id: string) {
    await supabase.from("diet_questions").update({ coach_seen_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-diet-questions"] });
  }

  return (
    <section className="mt-6 rounded-xl border border-primary/50 bg-card p-4">
      <h2 className="strng-title flex items-center gap-2 text-sm font-bold tracking-widest text-primary">
        <AlertTriangle className="h-4 w-4" /> PEDIDOS DE LIBERAÇÃO DE ALIMENTO
      </h2>
      <ul className="mt-3 space-y-2">
        {data.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-semibold">{r.name}</p>
            <p className="text-muted-foreground">"{r.question}"</p>
            <div className="mt-2 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/coach/students/$studentId" params={{ studentId: r.student_id }}>Ver aluno</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => seen(r.id)}>Marcar como visto</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
