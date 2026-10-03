import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Droplets, CreditCard, Target, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { planLabel, formatBRL } from "@/lib/plans";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Profile = {
  full_name: string;
  avatar_url: string | null;
  plan: string;
  plan_price: number;
  water_goal_ml: number;
  weekly_target: number;
  goal: string | null;
};

export function ProfileMenu({ profile }: { profile: Profile | null | undefined }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const name = profile?.full_name || "Aluno";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

  async function logout() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir perfil"
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-card text-sm font-bold text-primary"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials || <User className="h-5 w-5" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="strng-title tracking-widest">MEU PERFIL</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 px-4">
          <p className="text-xl font-bold">{name}</p>
          {profile?.goal && <p className="text-xs text-muted-foreground">Objetivo: {profile.goal}</p>}
          <Item icon={<CreditCard className="h-4 w-4 text-gold" />} label="Plano"
            value={`${planLabel(profile?.plan ?? "base")} · ${formatBRL(Number(profile?.plan_price ?? 0))}/mês`} />
          <Item icon={<Droplets className="h-4 w-4 text-primary" />} label="Meta de água"
            value={`${((profile?.water_goal_ml ?? 3000) / 1000).toFixed(1)} L por dia`} />
          <Item icon={<Target className="h-4 w-4 text-primary" />} label="Meta semanal"
            value={`${profile?.weekly_target ?? 4} treinos`} />
          <Button asChild variant="outline" className="w-full">
            <Link to="/app/profile">Editar perfil</Link>
          </Button>
          <Button variant="outline" className="w-full border-destructive/50 text-destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {icon}
      <div>
        <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
