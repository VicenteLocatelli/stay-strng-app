import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useLevels } from "@/hooks/use-strng";
import { resolveLevel } from "@/lib/strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — STAY STRNG" },
      { name: "description", content: "Seu nível, pontos, conquistas e dados de treino." },
      { property: "og:title", content: "Meu perfil — STAY STRNG" },
      { property: "og:description", content: "Nível, pontos e conquistas." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: me } = useProfile();
  const { data: levels } = useLevels();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["profile-stats", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const [points, achievements] = await Promise.all([
        supabase.from("points_transactions").select("points").eq("student_id", me!.userId),
        supabase
          .from("student_achievements")
          .select("id,earned_at,achievements(name,description)")
          .eq("student_id", me!.userId),
      ]);
      return {
        total: (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0),
        achievements: achievements.data ?? [],
      };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName ?? me?.profile?.full_name ?? "",
          goal: goal ?? me?.profile?.goal ?? null,
        })
        .eq("id", me!.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const level = resolveLevel(data?.total ?? 0, levels ?? []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">Meu perfil</h1>

      <section className="mt-6 rounded-xl border border-gold/30 bg-card p-5">
        <p className="text-xs tracking-widest text-muted-foreground">NÍVEL ATUAL</p>
        <p className="strng-title mt-1 text-3xl font-bold text-gold">{level.current?.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} STRNG points
          {level.next ? ` · faltam ${level.next.min_points - (data?.total ?? 0)} para ${level.next.name}` : ""}
        </p>
        <Progress value={level.progress} className="mt-4 h-2" />
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
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
        <p className="text-xs text-muted-foreground">
          Meta semanal definida pelo treinador: {me?.profile?.weekly_target ?? 4} treinos.
        </p>
        <Button className="strng-title w-full font-bold" onClick={() => save.mutate()}>
          Salvar
        </Button>
      </section>

      <h2 className="mt-8 mb-3 text-sm font-bold tracking-widest text-muted-foreground">
        CONQUISTAS
      </h2>
      {(data?.achievements.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Suas conquistas aparecem aqui conforme você treina.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {(data?.achievements ?? []).map((a) => (
            <li key={a.id} className="rounded-lg border border-gold/30 bg-card p-3">
              <p className="strng-title text-sm font-bold text-gold">{a.achievements?.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{a.achievements?.description}</p>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" className="mt-8 w-full" onClick={signOut}>
        Sair da conta
      </Button>
    </main>
  );
}
