import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed, Lock, Apple, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/diet")({
  head: () => ({
    meta: [
      { title: "Dieta — STAY STRNG" },
      { name: "description", content: "Seu plano alimentar STAY STRNG, liberado pelo seu coach." },
      { property: "og:title", content: "Dieta — STAY STRNG" },
      { property: "og:description", content: "Plano alimentar liberado pelo coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DietPage,
});

function DietPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-8">
      <h1 className="text-3xl font-bold">Dieta</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nutrição é metade do resultado.</p>

      <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-card to-muted p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background/70">
          <UtensilsCrossed className="h-6 w-6 text-gold" />
        </span>
        <p className="strng-title mt-4 text-xl font-bold">Em breve</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu plano alimentar será liberado pelo Coach. Assim que estiver pronto, ele aparece aqui.
        </p>
      </section>

      <ul className="mt-5 space-y-3">
        <Item icon={<Apple className="h-4 w-4 text-primary" />} title="Plano de refeições" text="Café, almoço, pré e pós-treino, jantar." />
        <Item icon={<Clock className="h-4 w-4 text-primary" />} title="Horários e porções" text="Quantidades ajustadas ao seu objetivo." />
        <Item icon={<Lock className="h-4 w-4 text-muted-foreground" />} title="Liberação" text="Disponível conforme o seu plano de consultoria." />
      </ul>
    </main>
  );
}

function Item({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-card p-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="strng-title text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}
