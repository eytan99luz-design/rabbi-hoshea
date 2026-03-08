import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useFavorites() {
  const { user } = useAuth();

  const { data: favorites = [], ...rest } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, videos(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { favorites, ...rest };
}

export function useFavoriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("video_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map(f => f.video_id));
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, isFavorited }: { videoId: string; isFavorited: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", videoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, video_id: videoId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
  });
}
