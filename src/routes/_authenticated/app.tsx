import { createFileRoute, Link, Outlet, useLocation, redirect } from "@tanstack/react-router";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";
import { resolveRole } from "@/lib/strng";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => {
    const user = (context as { user: { id: string; email?: string } }).user;
    const role = await resolveRole(user.id, user.email);
    if (role === "trainer") throw redirect({ to: "/coach" });
  },
  component: StudentLayout,
});

const NAV = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/workouts", label: "Treino", icon: Dumbbell },
  { to: "/app/diet", label: "Dieta", icon: UtensilsCrossed },
  { to: "/app/bldng", label: "BLDNG", icon: TrendingUp },
] as const;


function StudentLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-lg">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/app"
                ? pathname === "/app"
                : to === "/app/workouts"
                  ? pathname.startsWith("/app/workouts") || pathname.startsWith("/app/history")
                  : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold tracking-wide transition ${
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
