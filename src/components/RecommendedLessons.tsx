import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { VideoCard } from "./VideoCard";
import { Sparkles } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

export function RecommendedLessons() {
  const { user } = useAuth();
  const { data: history } = useWatchHistory();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", user?.id, history?.length],
    queryFn: async () => {
      if (!history || history.length === 0) return [];

      // Get most-watched masechtot
      const masechetCounts: Record<string, number> = {};
      const watchedVideoIds = new Set<string>();
      for (const h of history) {
        watchedVideoIds.add(h.video_id);
        const m = (h as any).videos?.masechet;
        if (m) masechetCounts[m] = (masechetCounts[m] || 0) + 1;
      }

      const topMasechtot = Object.entries(masechetCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([m]) => m);

      if (topMasechtot.length === 0) return [];

      // Fetch unwatched videos from top masechtot
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .in("masechet", topMasechtot)
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter out already watched
      const unwatched = (data as Video[]).filter(
        (v) => !watchedVideoIds.has(v.id)
      );

      return unwatched.slice(0, 4);
    },
    enabled: !!user && !!history && history.length > 0,
  });

  if (!user || !recommendations || recommendations.length === 0) return null;

  return (
    <section className="container px-4 py-10">
      <h2
        className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2"
        dir="rtl"
      >
        <Sparkles className="h-5 w-5 text-accent" />
        מומלץ עבורך
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {recommendations.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
