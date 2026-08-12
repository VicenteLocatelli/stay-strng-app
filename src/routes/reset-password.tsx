import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — STAY STRNG" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta STAY STRNG." },
      { property: "og:title", content: "Nova senha — STAY STRNG" },
      { property: "og:description", content: "Defina uma nova senha da sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada!");
    navigate({ to: "/app" });
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="strng-title text-lg font-bold tracking-[0.35em]">
          STAY <span className="text-primary">STRNG</span>
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Defina sua nova senha</h1>

        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Abra esta página pelo link enviado no seu e-mail de recuperação.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  className="pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
              Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
