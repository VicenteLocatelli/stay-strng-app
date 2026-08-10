import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SLOGAN } from "@/lib/strng";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      throw redirect({ to: roles?.[0]?.role === "trainer" ? "/coach" : "/app" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <header className="relative">
        <span className="strng-title text-lg font-bold tracking-[0.35em] text-foreground">
          STAY <span className="text-primary">STRNG</span>
        </span>
      </header>

      <section className="relative mx-auto w-full max-w-2xl py-16">
        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
          CONSULTORIA DE TREINAMENTO FÍSICO
        </p>
        <h1 className="mt-6 text-5xl leading-[0.95] font-bold sm:text-7xl">
          Treinar.
          <br />
          Registrar.
          <br />
          <span className="text-primary">Evoluir.</span>
        </h1>
        <p className="mt-6 max-w-md text-base text-muted-foreground">
          Sua jornada completa de evolução em um só lugar: treino personalizado, registro de
          performance, acompanhamento do treinador e conquistas reais.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="strng-title inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground transition hover:opacity-90"
          >
            Entrar / Criar conta
          </Link>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["TREINAR", "Menu de treinos livres"],
            ["REGISTRAR", "Séries, cargas e RPE"],
            ["ACOMPANHAR", "Histórico completo"],
            ["CONQUISTAR", "Pontos, níveis e badges"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-border bg-card p-4">
              <dt className="strng-title text-sm font-bold text-primary">{title}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="relative text-xs font-semibold tracking-[0.2em] text-muted-foreground">
        {SLOGAN}
      </footer>
    </main>
  );
}
