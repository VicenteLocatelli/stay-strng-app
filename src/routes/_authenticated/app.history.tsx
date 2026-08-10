import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { formatDuration } from "@/lib/strng";
import { CheckCircle2, Camera, ListOrdered } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/history")({
  head: () => ({
    meta: [
      { title: "Histórico — STAY STRNG" },
      { name: "description", content: "Todos os seus treinos concluídos e sua evolução." },
      { property: "og:title", content: "Histórico — STAY STRNG" },
      { property: "og:description", content: "Todos os seus treinos concluídos." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: me } = useProfile();
  const { data: sessions } = useQuery({
    queryKey: ["history", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select(
          "id,workout_name,completed_at,duration_seconds,total_volume,total_sets,followed_order,points_awarded,workout_completion_photos(id)",
        )
        .eq("student_id", me!.userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cada treino registrado é evolução.</p>

      <ul className="mt-6 space-y-3">
        {(sessions ?? []).map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="strng-title text-base font-bold">{s.workout_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.completed_at
                    ? new Date(s.completed_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
              <span className="strng-title text-sm font-bold text-gold">+{s.points_awarded}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Box label="Duração" value={formatDuration(s.duration_seconds ?? 0)} />
              <Box label="Séries" value={`${s.total_sets}`} />
              <Box label="Volume" value={`${Math.round(Number(s.total_volume ?? 0))} kg`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Tag ok icon={<CheckCircle2 className="h-3 w-3" />} text="Concluído" />
              {s.followed_order && (
                <Tag ok icon={<ListOrdered className="h-3 w-3" />} text="Ordem perfeita" />
              )}
              {s.workout_completion_photos?.length ? (
                <Tag ok icon={<Camera className="h-3 w-3" />} text="Foto enviada" />
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {sessions?.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum treino concluído ainda. Comece hoje.
        </p>
      )}
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="strng-title font-bold">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}

function Tag({ text, icon, ok }: { text: string; icon: React.ReactNode; ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${
        ok ? "border-gold/40 text-gold" : "border-border text-muted-foreground"
      }`}
    >
      {icon}
      {text}
    </span>
  );
}
