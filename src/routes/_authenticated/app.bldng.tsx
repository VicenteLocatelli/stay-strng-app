import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useLevels } from "@/hooks/use-strng";
import { resolveLevel } from "@/lib/strng";
import { MetricLineChart, type ChartMetric } from "@/components/charts/metric-line-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MEASURE_METRICS: ChartMetric[] = [
  { key: "weight_kg", label: "Peso", color: "var(--primary)", unit: "kg" },
  { key: "body_fat", label: "% Gordura", color: "var(--destructive)", unit: "%" },
  { key: "waist_cm", label: "Cintura", color: "var(--gold)", unit: "cm" },
  { key: "hip_cm", label: "Quadril", color: "var(--muted-foreground)", unit: "cm" },
  { key: "arm_cm", label: "Braço", color: "#e8e8e8", unit: "cm" },
  { key: "thigh_cm", label: "Coxa", color: "#8a8f98", unit: "cm" },
  { key: "chest_cm", label: "Peito", color: "#c9803a", unit: "cm" },
];

export const Route = createFileRoute("/_authenticated/app/bldng")({
  head: () => ({
    meta: [
      { title: "BLDNG — Evolução — STAY STRNG" },
      { name: "description", content: "Peso, medidas, cargas, fotos de evolução e check-in com o seu coach." },
      { property: "og:title", content: "BLDNG — Evolução — STAY STRNG" },
      { property: "og:description", content: "Acompanhe sua evolução real: peso, cargas e fotos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BldngPage,
});

const MEASURE_FIELDS = [
  { key: "weight_kg", label: "Peso (kg)" },
  { key: "body_fat", label: "% gordura" },
  { key: "waist_cm", label: "Cintura (cm)" },
  { key: "hip_cm", label: "Quadril (cm)" },
  { key: "arm_cm", label: "Braço (cm)" },
  { key: "thigh_cm", label: "Coxa (cm)" },
  { key: "chest_cm", label: "Peito (cm)" },
] as const;

type MeasureKey = (typeof MEASURE_FIELDS)[number]["key"];

function BldngPage() {
  const { data: me } = useProfile();
  const { data: levels } = useLevels();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const studentId = me?.userId;

  const [measureDraft, setMeasureDraft] = useState<Record<string, string>>({});
  const [exerciseId, setExerciseId] = useState<string>("");
  const [checkin, setCheckin] = useState({ sleep_quality: "3", energy: "3", soreness: "2", diet_adherence: "3", notes: "" });
  const [fullName, setFullName] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["bldng", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [measures, points, logs, photos, checkins, allBadges, myBadges] = await Promise.all([
        supabase.from("body_measurements").select("*").eq("student_id", studentId!).order("measured_on"),
        supabase.from("points_transactions").select("points").eq("student_id", studentId!),
        supabase
          .from("exercise_logs")
          .select("exercise_id,exercise_name,weight,reps,created_at")
          .eq("student_id", studentId!)
          .not("weight", "is", null)
          .order("created_at"),
        supabase
          .from("progress_photos")
          .select("id,storage_path,pose,taken_on")
          .eq("student_id", studentId!)
          .order("taken_on", { ascending: false })
          .limit(12),
        supabase
          .from("student_checkins")
          .select("id,created_at,sleep_quality,energy,soreness,diet_adherence,notes")
          .eq("student_id", studentId!)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("achievements").select("id,code,name,description,threshold").order("threshold"),
        supabase.from("student_achievements").select("achievement_id,earned_at").eq("student_id", studentId!),
      ]);

      const signed = await Promise.all(
        (photos.data ?? []).map(async (p) => {
          const { data: url } = await supabase.storage.from("progress-photos").createSignedUrl(p.storage_path, 3600);
          return { ...p, url: url?.signedUrl ?? null };
        }),
      );

      return {
        measures: measures.data ?? [],
        total: (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0),
        logs: logs.data ?? [],
        photos: signed,
        checkins: checkins.data ?? [],
        badges: (allBadges.data ?? []).map((b) => ({
          ...b,
          earned_at: (myBadges.data ?? []).find((m) => m.achievement_id === b.id)?.earned_at ?? null,
        })),
      };
    },
  });

  const level = resolveLevel(data?.total ?? 0, levels ?? []);

  const measureSeries = useMemo(
    () =>
      (data?.measures ?? []).map((m) => ({
        date: new Date(m.measured_on).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        weight_kg: m.weight_kg != null ? Number(m.weight_kg) : null,
        body_fat: m.body_fat != null ? Number(m.body_fat) : null,
        waist_cm: m.waist_cm != null ? Number(m.waist_cm) : null,
        hip_cm: m.hip_cm != null ? Number(m.hip_cm) : null,
        arm_cm: m.arm_cm != null ? Number(m.arm_cm) : null,
        thigh_cm: m.thigh_cm != null ? Number(m.thigh_cm) : null,
        chest_cm: m.chest_cm != null ? Number(m.chest_cm) : null,
      })),
    [data?.measures],
  );

  const exercises = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of data?.logs ?? []) if (l.exercise_id) map.set(l.exercise_id, l.exercise_name);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [data?.logs]);

  const currentExercise = exerciseId || exercises[0]?.id || "";

  const loadSeries = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const l of data?.logs ?? []) {
      if (l.exercise_id !== currentExercise) continue;
      const day = new Date(l.created_at).toISOString().slice(0, 10);
      byDay.set(day, Math.max(byDay.get(day) ?? 0, Number(l.weight ?? 0)));
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, value]) => ({
        date: new Date(day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        value,
      }));
  }, [data?.logs, currentExercise]);

  const saveMeasure = useMutation({
    mutationFn: async () => {
      const payload: Record<string, number | string | null> = {
        student_id: studentId!,
        measured_on: new Date().toISOString().slice(0, 10),
        created_by: studentId!,
      };
      let has = false;
      for (const f of MEASURE_FIELDS) {
        const raw = (measureDraft[f.key] ?? "").replace(",", ".");
        if (raw.trim()) {
          payload[f.key] = Number(raw);
          has = true;
        }
      }
      if (!has) throw new Error("empty");
      const { error } = await supabase.from("body_measurements").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setMeasureDraft({});
      toast.success("Medidas registradas.");
      qc.invalidateQueries({ queryKey: ["bldng", studentId] });
    },
    onError: (e: Error) =>
      toast.error(e.message === "empty" ? "Preencha ao menos um campo." : "Não foi possível registrar."),
  });

  const saveCheckin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("student_checkins").insert({
        student_id: studentId!,
        sleep_quality: Number(checkin.sleep_quality),
        energy: Number(checkin.energy),
        soreness: Number(checkin.soreness),
        diet_adherence: Number(checkin.diet_adherence),
        notes: checkin.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCheckin((c) => ({ ...c, notes: "" }));
      toast.success("Check-in enviado ao seu coach.");
      qc.invalidateQueries({ queryKey: ["bldng", studentId] });
    },
    onError: () => toast.error("Não foi possível enviar o check-in."),
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName ?? me?.profile?.full_name ?? "",
          goal: goal ?? me?.profile?.goal ?? null,
        })
        .eq("id", studentId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  async function uploadPhoto(file: File) {
    if (!studentId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${studentId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("progress-photos").upload(path, file);
      if (error) throw error;
      const { error: dbError } = await supabase
        .from("progress_photos")
        .insert({ student_id: studentId, storage_path: path });
      if (dbError) throw dbError;
      toast.success("Foto enviada. Seu coach já pode ver.");
      qc.invalidateQueries({ queryKey: ["bldng", studentId] });
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">BLDNG</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sua evolução, registrada e visível para o coach.</p>

      <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-muted p-5">
        <p className="text-xs tracking-[0.25em] text-muted-foreground">NÍVEL ATUAL</p>
        <p className="strng-title mt-1 text-3xl font-bold text-gold">{level.current?.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} STRNG points
          {level.next ? ` · faltam ${level.next.min_points - (data?.total ?? 0)} para ${level.next.name}` : ""}
        </p>
        <Progress value={level.progress} className="mt-4 h-2" />
      </section>

      {/* Medidas */}
      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">PESO E MEDIDAS</h2>
      <section className="rounded-2xl border border-border bg-card p-5">
        <MetricLineChart
          data={measureSeries}
          xKey="date"
          metrics={MEASURE_METRICS}
          height={176}
          singleDefault="weight_kg"
          emptyMessage="Registre pelo menos duas medições para ver o gráfico."
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          {MEASURE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={f.key} className="text-[11px]">
                {f.label}
              </Label>
              <Input
                id={f.key}
                inputMode="decimal"
                value={measureDraft[f.key] ?? ""}
                onChange={(e) => setMeasureDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button className="strng-title mt-4 w-full font-bold" onClick={() => saveMeasure.mutate()} disabled={saveMeasure.isPending}>
          Registrar medidas de hoje
        </Button>
      </section>

      {/* Cargas */}
      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">EVOLUÇÃO DE CARGA</h2>
      <section className="rounded-2xl border border-border bg-card p-5">
        {exercises.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Registre séries nos treinos para acompanhar sua evolução de carga.
          </p>
        ) : (
          <>
            <Select value={currentExercise} onValueChange={setExerciseId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4">
              <MetricLineChart
                data={loadSeries}
                xKey="date"
                metrics={[{ key: "value", label: "Carga", color: "var(--gold)", unit: "kg" }]}
                height={176}
                emptyMessage="Faça este exercício em pelo menos dois dias para ver o gráfico."
              />
            </div>
          </>
        )}
      </section>

      {/* Fotos */}
      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">FOTOS DE EVOLUÇÃO</h2>
      <section className="rounded-2xl border border-border bg-card p-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadPhoto(f);
          }}
        />
        <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          Enviar foto de atualização
        </Button>
        {(data?.photos.length ?? 0) > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {(data?.photos ?? []).map((p) => (
              <li key={p.id} className="overflow-hidden rounded-lg border border-border">
                {p.url ? (
                  <img
                    src={p.url}
                    alt={`Foto de evolução de ${new Date(p.taken_on).toLocaleDateString("pt-BR")}`}
                    className="aspect-[3/4] w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <p className="p-1 text-center text-[10px] text-muted-foreground">
                  {new Date(p.taken_on).toLocaleDateString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Check-in */}
      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">CHECK-IN COM O COACH</h2>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        {[
          { key: "sleep_quality", label: "Qualidade do sono" },
          { key: "energy", label: "Energia" },
          { key: "soreness", label: "Dores / desconforto" },
          { key: "diet_adherence", label: "Adesão à dieta" },
        ].map((f) => (
          <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Label className="truncate text-xs">{f.label}</Label>
            <Select
              value={checkin[f.key as keyof typeof checkin] as string}
              onValueChange={(v) => setCheckin((c) => ({ ...c, [f.key]: v }))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Textarea
          placeholder="Observações para o coach (dores, rotina, dificuldades...)"
          value={checkin.notes}
          onChange={(e) => setCheckin((c) => ({ ...c, notes: e.target.value }))}
        />
        <Button className="strng-title w-full font-bold" onClick={() => saveCheckin.mutate()} disabled={saveCheckin.isPending}>
          Enviar check-in
        </Button>
        {(data?.checkins.length ?? 0) > 0 && (
          <ul className="space-y-2 pt-2">
            {(data?.checkins ?? []).map((c) => (
              <li key={c.id} className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <span className="text-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span> · sono{" "}
                {c.sleep_quality} · energia {c.energy} · dores {c.soreness} · dieta {c.diet_adherence}
                {c.notes ? ` — ${c.notes}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Conta */}
      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">MINHA CONTA</h2>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="fullname">Nome</Label>
          <Input
            id="fullname"
            value={fullName ?? me?.profile?.full_name ?? ""}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Objetivo</Label>
          <Input
            id="goal"
            placeholder="Ex: hipertrofia e consistência"
            value={goal ?? me?.profile?.goal ?? ""}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <Button className="strng-title w-full font-bold" onClick={() => saveProfile.mutate()}>
          Salvar
        </Button>
        <Button variant="outline" className="w-full" onClick={signOut}>
          Sair da conta
        </Button>
      </section>
    </main>
  );
}
