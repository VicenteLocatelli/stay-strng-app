export type EnvFilter = "all" | "gym" | "home";

export type CoachExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  env_gym?: boolean | null;
  env_home?: boolean | null;
};

export function filterByEnv<T extends CoachExercise>(list: T[], env: EnvFilter): T[] {
  if (env === "all") return list;
  return list.filter((e) => (env === "gym" ? e.env_gym !== false : !!e.env_home));
}

const OPTIONS: { id: EnvFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "gym", label: "Academia" },
  { id: "home", label: "Em casa" },
];

export function EnvFilterChips({
  value,
  onChange,
}: {
  value: EnvFilter;
  onChange: (v: EnvFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] tracking-widest text-muted-foreground">AMBIENTE</span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            value === o.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
