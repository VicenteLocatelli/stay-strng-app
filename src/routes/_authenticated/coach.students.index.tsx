import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight, Search, CheckCircle2, Clock } from "lucide-react";
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

function StudentsPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.students ?? [];
    if (!q) return list;
    return list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (data?.emails[s.id] ?? "").toLowerCase().includes(q),
    );
  }, [query, data]);

  const now = Date.now();
  const pending = filtered.filter(
    (s) => !s.next_feedback_at || new Date(s.next_feedback_at).getTime() <= now,
  );
  const scheduled = filtered.filter(
    (s) => s.next_feedback_at && new Date(s.next_feedback_at).getTime() > now,
  );

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
        Novos alunos são vinculados automaticamente à sua carteira ao criar a conta.
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

      <Section
        title="FEEDBACK PENDENTE"
        icon={<Clock className="h-4 w-4 text-primary" />}
        students={pending}
        emails={data?.emails ?? {}}
        empty="Nenhum feedback pendente agora."
      />

      <Section
        title="FEEDBACK FUTURO"
        icon={<CheckCircle2 className="h-4 w-4 text-gold" />}
        students={scheduled}
        emails={data?.emails ?? {}}
        empty="Nenhum atendimento agendado."
        done
      />

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

function Section({
  title,
  icon,
  students,
  emails,
  empty,
  done,
}: {
  title: string;
  icon: React.ReactNode;
  students: StudentRow[];
  emails: Record<string, string>;
  empty: string;
  done?: boolean;
}) {
  return (
    <>
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-bold tracking-widest text-muted-foreground">
        {icon} {title} ({students.length})
      </h2>
      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                to="/coach/students/$studentId"
                params={{ studentId: s.id }}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:border-primary"
              >
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {done && <CheckCircle2 className="h-4 w-4 text-gold" />}
                    {s.full_name || "Aluno"}
                    <span className="text-[10px] tracking-widest text-muted-foreground">
                      {planLabel(s.plan)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emails[s.id] || s.goal || "Sem objetivo definido"} · meta {s.weekly_target}x/semana
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.next_feedback_at
                      ? `Próximo feedback em ${new Date(s.next_feedback_at).toLocaleDateString("pt-BR")}`
                      : `Feedback a cada ${s.feedback_interval_days} dias · nunca registrado`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
