import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useLessonNote(videoId: string | undefined) {
  const { user } = useAuth();

  const { data: note, isLoading } = useQuery({
    queryKey: ["lesson-note", videoId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("video_id", videoId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!videoId,
  });

  const queryClient = useQueryClient();

  const saveNote = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !videoId) throw new Error("Missing data");
      const { error } = await supabase
        .from("lesson_notes")
        .upsert(
          {
            user_id: user.id,
            video_id: videoId,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,video_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-note", videoId] });
    },
  });

  return { note, isLoading, saveNote };
}
