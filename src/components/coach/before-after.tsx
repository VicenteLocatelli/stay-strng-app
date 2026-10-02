import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Photo = { id: string; url: string; pose: string; taken_on: string };

export function BeforeAfter({ studentId }: { studentId: string }) {
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["before-after", studentId],
    queryFn: async (): Promise<Photo[]> => {
      const { data } = await supabase
        .from("progress_photos")
        .select("id,storage_path,pose,taken_on")
        .eq("student_id", studentId)
        .order("taken_on");
      const rows = data ?? [];
      if (!rows.length) return [];
      const { data: signed } = await supabase.storage
        .from("progress-photos")
        .createSignedUrls(rows.map((r) => r.storage_path), 3600);
      return rows
        .map((r, i) => ({ id: r.id, url: signed?.[i]?.signedUrl ?? "", pose: r.pose, taken_on: r.taken_on }))
        .filter((p) => p.url);
    },
  });

  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [mode, setMode] = useState<"side" | "slider">("side");
  const [pos, setPos] = useState(50);

  useEffect(() => {
    if (photos.length && !beforeId) {
      setBeforeId(photos[0]!.id);
      setAfterId(photos[photos.length - 1]!.id);
    }
  }, [photos, beforeId]);

  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Carregando fotos...</p>;
  if (photos.length < 2)
    return (
      <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        O aluno precisa ter pelo menos 2 fotos de evolução para comparar.
      </p>
    );

  const before = photos.find((p) => p.id === beforeId) ?? photos[0]!;
  const after = photos.find((p) => p.id === afterId) ?? photos[photos.length - 1]!;
  const label = (p: Photo) => `${new Date(p.taken_on + "T12:00").toLocaleDateString("pt-BR")} · ${p.pose}`;

  return (
    <section className="mt-6 space-y-4">
      <h2 className="strng-title text-sm font-bold tracking-widest text-muted-foreground">ANTES &amp; DEPOIS</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { v: beforeId, set: setBeforeId, t: "Antes" },
          { v: afterId, set: setAfterId, t: "Depois" },
        ].map((s) => (
          <label key={s.t} className="text-xs text-muted-foreground">
            {s.t}
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={s.v}
              onChange={(e) => s.set(e.target.value)}
            >
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {label(p)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-card p-1">
        {(["side", "slider"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md py-2 text-xs font-bold tracking-wide ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "side" ? "LADO A LADO" : "SLIDER"}
          </button>
        ))}
      </div>

      {mode === "side" ? (
        <div className="grid grid-cols-2 gap-2">
          {[before, after].map((p, i) => (
            <figure key={i} className="overflow-hidden rounded-lg border border-border bg-card">
              <img src={p.url} alt={`${i ? "Depois" : "Antes"} — ${label(p)}`} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="p-2 text-center text-[11px]">
                <span className={i ? "font-bold text-gold" : "font-bold text-primary"}>{i ? "DEPOIS" : "ANTES"}</span>
                <span className="block text-muted-foreground">{label(p)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-lg border border-border">
            <img src={after.url} alt={`Depois — ${label(after)}`} className="absolute inset-0 h-full w-full object-cover" />
            <img
              src={before.url}
              alt={`Antes — ${label(before)}`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-gold" style={{ left: `${pos}%` }} />
            <span className="absolute left-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold text-primary">ANTES</span>
            <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold text-gold">DEPOIS</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="mx-auto mt-3 block w-full max-w-md accent-[hsl(var(--primary))]"
            aria-label="Comparar antes e depois"
          />
        </div>
      )}
    </section>
  );
}
