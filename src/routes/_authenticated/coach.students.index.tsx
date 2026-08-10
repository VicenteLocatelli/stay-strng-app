import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coach/students")({
  head: () => ({
    meta: [
      { title: "Alunos — STAY STRNG" },
      { name: "description", content: "Gerencie sua carteira de alunos da consultoria." },
      { property: "og:title", content: "Alunos — STAY STRNG" },
      { property: "og:description", content: "Gerencie sua carteira de alunos." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: students } = useQuery({
    queryKey: ["coach-students", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("trainer_students")
        .select("student_id")
        .eq("trainer_id", me!.userId)
        .eq("active", true);
      const ids = (links ?? []).map((l) => l.student_id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,goal,weekly_target")
        .in("id", ids);
      return data ?? [];
    },
  });

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

      <div className="mt-6 flex gap-2 rounded-xl border border-border bg-card p-4">
        <Input
          placeholder="E-mail do aluno cadastrado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button className="strng-title font-bold" onClick={addStudent}>
          Vincular
        </Button>
      </div>

      <ul className="mt-6 space-y-2">
        {(students ?? []).map((s) => (
          <li key={s.id}>
            <Link
              to="/coach/students/$studentId"
              params={{ studentId: s.id }}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:border-primary"
            >
              <div>
                <p className="font-semibold">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.goal || "Sem objetivo definido"} · meta {s.weekly_target}x/semana
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary" />
            </Link>
          </li>
        ))}
      </ul>

      {students?.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum aluno vinculado ainda.
        </p>
      )}
    </main>
  );
}
