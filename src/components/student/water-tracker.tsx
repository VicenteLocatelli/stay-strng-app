import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Droplets, Minus, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const STEP = 250;
export const ML_PER_KG = 50;

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WaterTracker({
  studentId,
  goalMl,
  weightKg,
}: {
  studentId?: string | undefined;
  goalMl: number;
  weightKg?: number | null | undefined;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String((goalMl / 1000).toFixed(1)));
  const date = todayKey();

  const { data: amount = 0 } = useQuery({
    queryKey: ["water", studentId, date],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("student_id", studentId!)
        .eq("log_date", date)
        .maybeSingle();
      return data?.amount_ml ?? 0;
    },
  });

  const setAmount = useMutation({
    mutationFn: async (next: number) => {
      const { error } = await supabase
        .from("water_logs")
        .upsert(
          { student_id: studentId!, log_date: date, amount_ml: Math.max(0, next) },
          { onConflict: "student_id,log_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water", studentId, date] }),
    onError: () => toast.error("Não foi possível registrar a água."),
  });

  const saveGoal = useMutation({
    mutationFn: async (liters: number) => {
      const ml = Math.round(Math.min(5, Math.max(2, liters)) * 1000);
      const { error } = await supabase.from("profiles").update({ water_goal_ml: ml }).eq("id", studentId!);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      toast.success("Meta de água atualizada.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Não foi possível salvar a meta."),
  });

  const recommended = weightKg ? Math.round((weightKg * ML_PER_KG) / 100) * 100 : null;
  const pct = Math.min(100, Math.round((amount / Math.max(1, goalMl)) * 100));

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Droplets className="h-4 w-4 shrink-0 text-primary" />
          <p className="truncate text-xs font-semibold tracking-[0.25em] text-muted-foreground">ÁGUA HOJE</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 text-[11px] font-semibold tracking-widest text-primary"
        >
          META
        </button>
      </div>

      <p className="strng-title mt-2 text-3xl font-bold">
        {(amount / 1000).toFixed(2).replace(".", ",")}
        <span className="text-base text-muted-foreground"> / {(goalMl / 1000).toFixed(1).replace(".", ",")} L</span>
      </p>
      <Progress value={pct} className="mt-3 h-2" />

      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Remover 250 ml"
          onClick={() => setAmount.mutate(amount - STEP)}
          disabled={amount <= 0 || setAmount.isPending}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <p className="flex-1 text-center text-xs text-muted-foreground">250 ml por toque</p>
        <Button
          size="icon"
          aria-label="Adicionar 250 ml"
          onClick={() => setAmount.mutate(amount + STEP)}
          disabled={setAmount.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {recommended && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Recomendado para {weightKg} kg: <span className="text-gold">{(recommended / 1000).toFixed(1).replace(".", ",")} L</span>
        </p>
      )}

      {editing && (
        <div className="mt-4 flex items-center gap-2">
          <Input
            type="number"
            step="0.5"
            min="2"
            max="5"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            aria-label="Meta diária em litros"
          />
          <Button size="icon" onClick={() => saveGoal.mutate(Number(goalDraft.replace(",", ".")))}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
