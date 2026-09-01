import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { planLabel } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/coach/students/")({
  head: () => ({
    meta: [
      { title: "Alunos — STAY STRNG" },
      { name: "description", content: "Gerencie sua carteira de alunos e o ciclo de feedback." },
      { property: "og:title", content: "Alunos — STAY STRNG" },
      { property: "og:description", content: "Carteira de alunos e ciclo de feedback." },
    ],
  }),
  component: StudentsPage,
});

type StudentRow = {
  id: string;
  full_name: string;
  goal: string | null;
  weekly_target: number;
  plan: string;
  feedback_interval_days: number;
  next_feedback_at: string | null;
  last_feedback_at: string | null;
};

type Filter = "all" | "pending" | "scheduled";

function StudentsPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data } = useQuery({
    queryKey: ["coach-students", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const [{ data: links }, { data: emails }] = await Promise.all([
        supabase
          .from("trainer_students")
          .select("student_id")
          .eq("trainer_id", me!.userId)
          .eq("active", true),
        supabase.rpc("my_student_emails"),
      ]);
      const ids = (links ?? []).map((l) => l.student_id);
      if (!ids.length) return { students: [] as StudentRow[], emails: {} as Record<string, string> };
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,goal,weekly_target,plan,feedback_interval_days,next_feedback_at,last_feedback_at")
        .in("id", ids);
      const emailMap: Record<string, string> = {};
      for (const row of emails ?? []) emailMap[row.student_id] = row.email ?? "";
      return { students: (profiles ?? []) as StudentRow[], emails: emailMap };
    },
  });

  const now = Date.now();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data?.students ?? [];
    if (q) {
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (data?.emails[s.id] ?? "").toLowerCase().includes(q),
      );
    }
    if (filter === "pending") {
      list = list.filter((s) => !s.next_feedback_at || new Date(s.next_feedback_at).getTime() <= now);
    }
    if (filter === "scheduled") {
      list = list.filter((s) => s.next_feedback_at && new Date(s.next_feedback_at).getTime() > now);
    }
    return list;
  }, [query, data, filter, now]);

  const pendingCount = (data?.students ?? []).filter(
    (s) => !s.next_feedback_at || new Date(s.next_feedback_at).getTime() <= now,
  ).length;

  async function addStudent() {
    const { error } = await supabase.rpc("link_student_by_email", { _email: email });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Aluno vinculado!");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["coach-students"] });
    qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-10">
      <h1 className="text-3xl font-bold">Alunos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data?.students.length ?? 0} alunos na carteira · {pendingCount} com feedback pendente.
      </p>

      <div className="relative mt-6">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          placeholder="Buscar por nome ou e-mail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={filter === "all"} label="Todos" onClick={() => setFilter("all")} />
        <Chip active={filter === "pending"} label="Feedback pendente" onClick={() => setFilter("pending")} />
        <Chip active={filter === "scheduled"} label="Feedback futuro" onClick={() => setFilter("scheduled")} />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum aluno nesse filtro.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const pending = !s.next_feedback_at || new Date(s.next_feedback_at).getTime() <= now;
            const initials = (s.full_name || "Aluno")
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase();
            return (
              <li key={s.id}>
                <Link
                  to="/coach/students/$studentId"
                  params={{ studentId: s.id }}
                  className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="strng-title flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-bold text-primary">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.full_name || "Aluno"}</p>
                      <p className="text-[10px] tracking-widest text-muted-foreground">
                        {planLabel(s.plan)} · META {s.weekly_target}x
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  </div>

                  <p className="mt-3 line-clamp-1 text-xs text-muted-foreground">
                    {s.goal || "Sem objetivo definido"}
                  </p>

                  <span
                    className={`mt-3 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      pending
                        ? "border-primary/40 text-primary"
                        : "border-gold/40 text-gold"
                    }`}
                  >
                    {pending ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {pending
                      ? "Feedback pendente"
                      : `Próximo ${new Date(s.next_feedback_at!).toLocaleDateString("pt-BR")}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 rounded-xl border border-border bg-card p-4">
        <p className="text-xs tracking-widest text-muted-foreground">VINCULAR MANUALMENTE</p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="E-mail do aluno cadastrado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button className="strng-title font-bold" onClick={addStudent}>
            Vincular
          </Button>
        </div>
      </div>
    </main>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
