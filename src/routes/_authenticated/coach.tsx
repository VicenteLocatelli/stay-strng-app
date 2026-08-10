import { createFileRoute, Link, Outlet, useLocation, useNavigate, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, Dumbbell, ClipboardList, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/coach")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", (context as { user: { id: string } }).user.id);
    if (data?.[0]?.role !== "trainer") throw redirect({ to: "/app" });
  },
  component: CoachLayout,
});

const NAV = [
  { to: "/coach", label: "Painel", icon: LayoutDashboard },
  { to: "/coach/students", label: "Alunos", icon: Users },
  { to: "/coach/exercises", label: "Exercícios", icon: Dumbbell },
  { to: "/coach/workouts", label: "Treinos", icon: ClipboardList },
] as const;

function CoachLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:flex md:pb-0">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar p-5 md:block">
        <p className="strng-title text-sm font-bold tracking-[0.3em]">
          STAY <span className="text-primary">STRNG</span>
        </p>
        <p className="mt-1 text-[10px] tracking-widest text-muted-foreground">PAINEL DO TREINADOR</p>
        <nav className="mt-8 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/coach" ? pathname === "/coach" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="mt-8 flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      <div className="flex-1">
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <ul className="flex">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/coach" ? pathname === "/coach" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
