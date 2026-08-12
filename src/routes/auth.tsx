import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
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

function PasswordInput({
  id,
  value,
  onChange,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        className="pr-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function routeByRole(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    navigate({ to: data?.[0]?.role === "trainer" ? "/coach" : "/app" });
  }

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user) await routeByRole(data.user.id);
  }

  async function handleSignup(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role: "student" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session && data.user) {
      toast.success("Conta criada. Bem-vindo à STAY STRNG!");
      await routeByRole(data.user.id);
    } else {
      toast.success("Confira seu e-mail para confirmar a conta.");
    }
  }

  async function handleReset(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
    setForgot(false);
  }

  async function handleGoogle(): Promise<void> {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
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

        {forgot ? (
          <form
            onSubmit={handleReset}
            className="mt-8 space-y-4 rounded-lg border border-border bg-card p-5"
          >
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail da conta</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
              Enviar link de recuperação
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground underline"
              onClick={() => setForgot(false)}
            >
              Voltar para o login
            </button>
          </form>
        ) : (
          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form
                onSubmit={handleLogin}
                className="space-y-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <PasswordInput id="login-password" value={password} onChange={setPassword} />
                </div>
                <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
                  Entrar
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground underline"
                  onClick={() => {
                    setResetEmail(email);
                    setForgot(true);
                  }}
                >
                  Esqueci minha senha
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form
                onSubmit={handleSignup}
                className="space-y-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <PasswordInput
                    id="signup-password"
                    value={password}
                    onChange={setPassword}
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao criar sua conta você entra como aluno e é vinculado automaticamente ao seu
                  treinador.
                </p>
                <Button type="submit" className="strng-title h-12 w-full font-bold" disabled={loading}>
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

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
