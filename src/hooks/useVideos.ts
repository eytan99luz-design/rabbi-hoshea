import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Video {
  id: string;
  youtube_id: string;
  title: string;
  masechet: string | null;
  daf: number | null;
  thumbnail_url: string | null;
  published_at: string | null;
}

export function useVideos(masechet?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ["videos", masechet, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("videos")
        .select("*")
        .order("published_at", { ascending: false });

      if (masechet) {
        query = query.eq("masechet", masechet);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Video[];
    },
  });
}

export function useVideo(youtubeId: string) {
  return useQuery({
    queryKey: ["video", youtubeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("youtube_id", youtubeId)
        .maybeSingle();
      if (error) throw error;
      return data as Video | null;
    },
    enabled: !!youtubeId,
  });
}

export function useAdjacentVideos(masechet: string | null, daf: number | null) {
  return useQuery({
    queryKey: ["adjacent-videos", masechet, daf],
    queryFn: async () => {
      if (!masechet || !daf) return { prev: null, next: null };

      const [prevRes, nextRes] = await Promise.all([
        supabase
          .from("videos")
          .select("*")
          .eq("masechet", masechet)
          .eq("daf", daf - 1)
          .maybeSingle(),
        supabase
          .from("videos")
          .select("*")
          .eq("masechet", masechet)
          .eq("daf", daf + 1)
          .maybeSingle(),
      ]);

      return {
        prev: prevRes.data as Video | null,
        next: nextRes.data as Video | null,
      };
    },
    enabled: !!masechet && !!daf,
  });
}

export function useMasechtot() {
  return useQuery({
    queryKey: ["masechtot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("masechet")
        .not("masechet", "is", null);
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.masechet) {
          counts[row.masechet] = (counts[row.masechet] || 0) + 1;
        }
      }
      return counts;
    },
  });
}
