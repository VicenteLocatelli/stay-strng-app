import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SLOGAN } from "@/lib/strng";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — STAY STRNG" },
      { name: "description", content: "Acesse sua conta STAY STRNG para treinar e evoluir." },
      { property: "og:title", content: "Entrar — STAY STRNG" },
      { property: "og:description", content: "Acesse sua conta STAY STRNG." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "trainer">("student");

  async function routeByRole(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    navigate({ to: data?.[0]?.role === "trainer" ? "/coach" : "/app" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.user) await routeByRole(data.user.id);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Informe seu nome completo.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session && data.user) {
      toast.success("Conta criada. Bem-vindo à STAY STRNG!");
      await routeByRole(data.user.id);
    } else {
      toast.success("Confira seu e-mail para confirmar a conta.");
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Não foi possível entrar com o Google.");
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) await routeByRole(data.user.id);
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="strng-title text-lg font-bold tracking-[0.35em]">
          STAY <span className="text-primary">STRNG</span>
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Acesse sua consultoria</h1>
        <p className="mt-2 text-sm text-muted-foreground">{SLOGAN}</p>

        <Tabs defaultValue="login" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "trainer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`strng-title rounded-md border px-3 py-3 text-sm font-bold transition ${
                        role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {r === "student" ? "Aluno" : "Treinador"}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
                Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> OU <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="h-12 w-full" onClick={handleGoogle}>
          Continuar com Google
        </Button>
      </div>
    </main>
  );
}
