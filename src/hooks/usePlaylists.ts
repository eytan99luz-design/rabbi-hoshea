import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("*, playlist_items(count)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePlaylistItems(playlistId: string | null) {
  return useQuery({
    queryKey: ["playlist-items", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlist_items")
        .select("*, videos(*)")
        .eq("playlist_id", playlistId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });
}

export function useCreatePlaylist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("playlists")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useAddToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      // Get max position
      const { data: existing } = await supabase
        .from("playlist_items")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      const nextPos = (existing?.[0]?.position ?? -1) + 1;

      const { error } = await supabase
        .from("playlist_items")
        .insert({ playlist_id: playlistId, video_id: videoId, position: nextPos });
      if (error) throw error;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["playlist-items", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useRemoveFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      const { error } = await supabase
        .from("playlist_items")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId);
      if (error) throw error;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["playlist-items", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}
