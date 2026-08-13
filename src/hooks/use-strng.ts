import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_LEVELS, resolveRole, type LevelRow } from "@/lib/strng";

export type AppRole = "trainer" | "student";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useProfile() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: profile }, role] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        resolveRole(user!.id, user!.email),
      ]);
      return { profile, role: role as AppRole, userId: user!.id, email: user!.email ?? "" };
    },
  });
}

export function useLevels() {
  return useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("levels")
        .select("level,name,min_points")
        .order("min_points");
      return (data as LevelRow[] | null)?.length ? (data as LevelRow[]) : FALLBACK_LEVELS;
    },
    staleTime: 1000 * 60 * 60,
  });
}
