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
    mutationFn: async ({ videoId, progressSeconds }: { videoId: string; progressSeconds?: number }) => {
      if (!user) return;
      const upsertData: any = {
        user_id: user.id,
        video_id: videoId,
        watched_at: new Date().toISOString(),
      };
      if (progressSeconds !== undefined) {
        upsertData.progress_seconds = Math.floor(progressSeconds);
      }
      const { error } = await supabase
        .from("watch_history")
        .upsert(upsertData, { onConflict: "user_id,video_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history"] });
    },
  });
}

export function useVideoProgress(videoId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["video-progress", videoId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("progress_seconds")
        .eq("user_id", user!.id)
        .eq("video_id", videoId!)
        .maybeSingle();
      if (error) throw error;
      return data?.progress_seconds || 0;
    },
    enabled: !!user && !!videoId,
  });
}
