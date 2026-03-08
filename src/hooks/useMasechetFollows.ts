import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useMasechetFollows() {
  const { user } = useAuth();

  const { data: follows, isLoading } = useQuery({
    queryKey: ["masechet-follows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masechet_follows")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const toggleFollow = useMutation({
    mutationFn: async (masechet: string) => {
      if (!user) throw new Error("Not authenticated");
      const existing = follows?.find((f) => f.masechet === masechet);
      if (existing) {
        const { error } = await supabase
          .from("masechet_follows")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("masechet_follows")
          .insert({ user_id: user.id, masechet });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masechet-follows"] });
    },
  });

  const isFollowing = (masechet: string) =>
    follows?.some((f) => f.masechet === masechet) ?? false;

  return { follows, isLoading, toggleFollow, isFollowing };
}
