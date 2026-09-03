import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartMetric = {
  key: string;
  label: string;
  color: string;
  unit?: string;
};

type Props = {
  data: Record<string, string | number | null>[];
  xKey: string;
  metrics: ChartMetric[];
  height?: number;
  emptyMessage?: string;
  /** Começa com uma única métrica ativa em vez de todas. */
  singleDefault?: string;
};

/**
 * Gráfico de linha compartilhado aluno/coach: filtros de métrica em chips
 * (clique liga/desliga cada linha — funciona como legenda interativa).
 */
export function MetricLineChart({
  data,
  xKey,
  metrics,
  height = 176,
  emptyMessage = "Sem dados suficientes para o gráfico.",
  singleDefault,
}: Props) {
  const [active, setActive] = useState<Set<string>>(() =>
    singleDefault ? new Set([singleDefault]) : new Set(metrics.map((m) => m.key)),
  );

  function toggle(key: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const activeMetrics = metrics.filter((m) => active.has(m.key));
  const hasSeries = data.length > 1 && activeMetrics.length > 0;

  return (
    <div>
      {metrics.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {metrics.map((m) => {
            const on = active.has(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggle(m.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  on ? "border-transparent text-background" : "border-border text-muted-foreground"
                }`}
                style={on ? { background: m.color } : undefined}
                aria-pressed={on}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: on ? "currentColor" : m.color }}
                />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-3 w-full" style={{ height }}>
        {hasSeries ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xKey} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} width={36} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: unknown, name: unknown) => {
                  const metric = metrics.find((m) => m.key === name || m.label === name);
                  return [`${value}${metric?.unit ? ` ${metric.unit}` : ""}`, metric?.label ?? String(name)];
                }}
              />
              {activeMetrics.map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-full place-items-center text-center text-xs text-muted-foreground">
            {data.length > 1 ? "Selecione ao menos uma métrica." : emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
