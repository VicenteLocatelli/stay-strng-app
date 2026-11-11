import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-strng";
import { planLabel } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — STAY STRNG" },
      { name: "description", content: "Edite seu nome, foto e objetivo na STAY STRNG." },
      { property: "og:title", content: "Meu perfil — STAY STRNG" },
      { property: "og:description", content: "Seu perfil de aluno STAY STRNG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

/** Redimensiona a imagem para 256px (JPEG) e devolve um data URL leve. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function ProfilePage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me?.profile) return;
    setName(me.profile.full_name ?? "");
    setGoal(me.profile.goal ?? "");
    setAvatar(me.profile.avatar_url ?? null);
  }, [me?.profile]);

  async function pick(file?: File) {
    if (!file) return;
    try {
      setAvatar(await toAvatarDataUrl(file));
    } catch {
      toast.error("Não foi possível ler essa imagem.");
    }
  }

  async function save() {
    if (!me?.userId || !name.trim()) return void toast.error("Informe seu nome.");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), goal: goal.trim() || null, avatar_url: avatar })
      .eq("id", me.userId);
    setSaving(false);
    if (error) return void toast.error("Erro ao salvar perfil.");
    toast.success("Perfil atualizado!");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const p = me?.profile;
  return (
    <main className="mx-auto w-full max-w-lg px-5 pt-6 pb-10">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Meu perfil</h1>

      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary bg-card"
          aria-label="Trocar foto de perfil"
        >
          {avatar ? (
            <img src={avatar} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span className="strng-title flex h-full w-full items-center justify-center text-3xl font-bold">
              {(name || "A").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="absolute bottom-0 inset-x-0 flex justify-center bg-background/70 py-1">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <p className="mt-2 text-xs text-muted-foreground">Toque para trocar a foto</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal">Objetivo principal</Label>
          <Input id="goal" value={goal} placeholder="Ex: hipertrofia, emagrecimento" onChange={(e) => setGoal(e.target.value)} />
        </div>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
        </Button>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-4 text-sm">
        <p className="text-xs font-bold tracking-widest text-muted-foreground">MEU PLANO</p>
        <p className="strng-title mt-1 text-xl font-bold text-gold">{planLabel(p?.plan ?? "base")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>Meta semanal: {p?.weekly_target ?? "-"} treinos</span>
          <span>Água: {((p?.water_goal_ml ?? 0) / 1000).toFixed(1)} L/dia</span>
          <span>Desde: {p?.started_at ? new Date(p.started_at).toLocaleDateString("pt-BR") : "-"}</span>
          <span>E-mail: {me?.email}</span>
        </div>
      </section>
    </main>
  );
}
