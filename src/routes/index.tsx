import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SLOGAN } from "@/lib/strng";
import { PLANS, formatBRL } from "@/lib/plans";

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
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
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

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <section id="planos" className="relative mx-auto w-full max-w-5xl pb-16">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">OFERTA DE LANÇAMENTO</p>
        <h2 className="mt-3 text-4xl leading-tight font-bold">Escolha seu plano</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Todos os planos incluem acesso ao aplicativo STAY STRNG e acompanhamento do treinador.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                plan.highlight ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border"
              }`}
            >
              {plan.highlight && (
                <span className="strng-title absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground">
                  {plan.highlight}
                </span>
              )}
              <p className="strng-title text-sm font-bold tracking-widest">{plan.name}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="strng-title text-4xl font-bold text-primary">
                  {formatBRL(plan.price)}
                </span>
                <span className="pb-1 text-xs text-muted-foreground">/mês</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                De <span className="line-through">{formatBRL(plan.originalPrice)}</span>
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#pix"
                className={`strng-title mt-6 inline-flex h-12 items-center justify-center rounded-md text-sm font-bold transition ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:border-primary"
                }`}
              >
                Começar agora
              </Link>
            </li>
          ))}
        </ul>

        <div id="pix" className="mt-10 rounded-2xl border border-gold/40 bg-card p-6">
          <p className="strng-title text-sm font-bold tracking-widest text-gold">CONTRATAÇÃO VIA PIX</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Escolha seu plano e faça o PIX no valor mensal.</li>
            <li>
              Chave PIX (e-mail):{" "}
              <span className="font-semibold text-foreground">{PIX_KEY}</span>
            </li>
            <li>Envie o comprovante ao coach para confirmação.</li>
            <li>Crie sua conta — o plano é liberado manualmente após a confirmação.</li>
          </ol>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              void navigator.clipboard.writeText(PIX_KEY);
              toast.success("Chave PIX copiada.");
            }}
          >
            Copiar chave PIX
          </Button>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="strng-title inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground transition hover:opacity-90"
          >
            Entrar / Criar conta
          </Link>
        </div>
      </section>

      <footer className="relative text-xs font-semibold tracking-[0.2em] text-muted-foreground">
        {SLOGAN}
      </footer>
    </main>
  );
}
