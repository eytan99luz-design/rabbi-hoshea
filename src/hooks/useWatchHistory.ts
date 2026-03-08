import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useWatchHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watch-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("*, videos(*)")
        .eq("user_id", user!.id)
        .order("watched_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTrackWatch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("watch_history")
        .upsert(
          { user_id: user.id, video_id: videoId, watched_at: new Date().toISOString() },
          { onConflict: "user_id,video_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history"] });
    },
  });
}
