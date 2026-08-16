import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, X, Save } from "lucide-react";
import { MUSCLE_GROUPS } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/coach/exercises")({
  head: () => ({
    meta: [
      { title: "Biblioteca de exercícios — STAY STRNG" },
      { name: "description", content: "Busque, filtre e cadastre exercícios da consultoria." },
      { property: "og:title", content: "Biblioteca de exercícios — STAY STRNG" },
      { property: "og:description", content: "Busque, filtre e cadastre exercícios." },
    ],
  }),
  component: ExercisesPage,
});

const EMPTY = {
  name: "",
  muscle_group: "",
  equipment: "",
  execution: "",
  common_mistakes: "",
  image_url: "",
  video_url: "",
  is_cardio: false,
  env_gym: true,
  env_home: false,
};

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  execution: string | null;
  common_mistakes: string | null;
  image_url: string | null;
  video_url: string | null;
  is_cardio: boolean;
  env_gym: boolean;
  env_home: boolean;
};

function ExercisesPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("");
  const [env, setEnv] = useState<"all" | "gym" | "home">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select(
          "id,name,muscle_group,equipment,execution,common_mistakes,image_url,video_url,is_cardio,env_gym,env_home",
        )
        .eq("active", true)
        .order("muscle_group")
        .order("name");
      return (data ?? []) as ExerciseRow[];
    },
  });

  const groups = useMemo(() => {
    const set = new Set<string>(MUSCLE_GROUPS as readonly string[]);
    for (const e of exercises ?? []) if (e.muscle_group) set.add(e.muscle_group);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [exercises]);

  const filtered = (exercises ?? []).filter((e) => {
    const q = query.trim().toLowerCase();
    const okQuery = !q || e.name.toLowerCase().includes(q);
    const okGroup = !group || (e.muscle_group ?? "").toLowerCase() === group.toLowerCase();
    const okEnv = env === "all" || (env === "gym" ? e.env_gym : e.env_home);
    return okQuery && okGroup && okEnv;
  });

  async function save() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do exercício.");
      return;
    }
    if (!form.env_gym && !form.env_home) {
      toast.error("Selecione pelo menos um ambiente: academia ou em casa.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("exercises").insert({
      name: form.name.trim(),
      muscle_group: form.muscle_group || null,
      equipment: form.equipment || null,
      execution: form.execution || null,
      common_mistakes: form.common_mistakes || null,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      is_cardio: form.is_cardio,
      env_gym: form.env_gym,
      env_home: form.env_home,
      created_by: me!.userId,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Exercício cadastrado!");
    setForm({ ...EMPTY });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["exercises"] });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Exercícios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} de {exercises?.length ?? 0} exercícios.
          </p>
        </div>
        <Button className="strng-title font-bold" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {open ? "Fechar" : "Novo"}
        </Button>
      </div>

      {open && (
        <div className="mt-5 space-y-3 rounded-xl border border-primary/40 bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div className="space-y-1">
              <Label className="text-xs">Grupo muscular</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.muscle_group}
                onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}
              >
                <option value="">Selecione</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Equipamento"
              value={form.equipment}
              onChange={(v) => setForm({ ...form, equipment: v })}
            />
            <Field
              label="URL da imagem"
              value={form.image_url}
              onChange={(v) => setForm({ ...form, image_url: v })}
            />
            <Field
              label="URL do vídeo"
              value={form.video_url}
              onChange={(v) => setForm({ ...form, video_url: v })}
            />
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.is_cardio}
                onChange={(e) => setForm({ ...form, is_cardio: e.target.checked })}
              />
              Exercício de cardio (registra apenas tempo)
            </label>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] tracking-widest text-muted-foreground">
              AMBIENTE (OBRIGATÓRIO)
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.env_gym}
                  onChange={(e) => setForm({ ...form, env_gym: e.target.checked })}
                />
                Academia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.env_home}
                  onChange={(e) => setForm({ ...form, env_home: e.target.checked })}
                />
                Em casa
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Execução</Label>
            <Textarea
              value={form.execution}
              onChange={(e) => setForm({ ...form, execution: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Erros comuns</Label>
            <Textarea
              value={form.common_mistakes}
              onChange={(e) => setForm({ ...form, common_mistakes: e.target.value })}
            />
          </div>
          <Button className="strng-title w-full font-bold" disabled={saving} onClick={save}>
            Salvar exercício
          </Button>
        </div>
      )}

      <div className="relative mt-6">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          placeholder="Buscar exercício pelo nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={env === "all"} label="Todos os ambientes" onClick={() => setEnv("all")} />
        <Chip active={env === "gym"} label="Academia" onClick={() => setEnv("gym")} />
        <Chip active={env === "home"} label="Em casa" onClick={() => setEnv("home")} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={!group} label="Todos" onClick={() => setGroup("")} />
        {groups.map((g) => (
          <Chip key={g} active={group === g} label={g} onClick={() => setGroup(g)} />
        ))}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((e) => (
          <ExerciseCard
            key={e.id}
            exercise={e}
            onSaved={() => qc.invalidateQueries({ queryKey: ["exercises"] })}
          />
        ))}
      </ul>
    </main>
  );
}

function ExerciseCard({ exercise, onSaved }: { exercise: ExerciseRow; onSaved: () => void }) {
  const [video, setVideo] = useState(exercise.video_url ?? "");
  const [gym, setGym] = useState(exercise.env_gym);
  const [home, setHome] = useState(exercise.env_home);
  const [saving, setSaving] = useState(false);

  const dirty =
    video !== (exercise.video_url ?? "") || gym !== exercise.env_gym || home !== exercise.env_home;

  async function save() {
    if (!gym && !home) {
      toast.error("Selecione pelo menos um ambiente.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("exercises")
      .update({ video_url: video.trim() || null, env_gym: gym, env_home: home })
      .eq("id", exercise.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Exercício atualizado.");
    onSaved();
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      {exercise.image_url && (
        <img
          src={exercise.image_url}
          alt={`Demonstração do exercício ${exercise.name}`}
          loading="lazy"
          className="mb-3 h-32 w-full rounded-lg object-cover"
        />
      )}
      <p className="text-xs tracking-widest text-primary">
        {(exercise.muscle_group ?? "GERAL").toUpperCase()}
        {exercise.is_cardio ? " · CARDIO" : ""}
      </p>
      <p className="strng-title mt-1 text-lg font-bold">{exercise.name}</p>
      {exercise.equipment && <p className="text-xs text-muted-foreground">{exercise.equipment}</p>}
      {exercise.execution && <p className="mt-2 text-xs text-muted-foreground">{exercise.execution}</p>}

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={gym}
            onChange={(e) => setGym(e.target.checked)}
          />
          Academia
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={home}
            onChange={(e) => setHome(e.target.checked)}
          />
          Em casa
        </label>
      </div>

      <div className="mt-3 space-y-1">
        <Label className="text-[10px] tracking-widest text-muted-foreground">URL DO VÍDEO</Label>
        <div className="flex gap-2">
          <Input
            className="h-9"
            placeholder="https://…"
            value={video}
            onChange={(e) => setVideo(e.target.value)}
          />
          <Button size="icon" variant="outline" aria-label="Salvar" disabled={!dirty || saving} onClick={save}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {exercise.video_url && (
        <a
          href={exercise.video_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-primary underline"
        >
          Ver vídeo de demonstração
        </a>
      )}
    </li>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
