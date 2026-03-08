import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { useVideos, useDafimForMasechet } from "@/hooks/useVideos";
import { getMasechetEnglish, numberToHebrewDaf } from "@/lib/masechet-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Masechet = () => {
  const { name } = useParams<{ name: string }>();
  const masechet = decodeURIComponent(name || "");
  const { data: videos, isLoading } = useVideos(masechet);
  const { data: dafim } = useDafimForMasechet(masechet);

  // Group videos by daf
  const videosByDaf = videos?.reduce<Record<number, typeof videos>>((acc, video) => {
    const daf = video.daf ?? 0;
    if (!acc[daf]) acc[daf] = [];
    acc[daf].push(video);
    return acc;
  }, {}) ?? {};

  const sortedDafim = Object.keys(videosByDaf)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6" dir="rtl">
          <Link to="/browse">
            <Button variant="ghost" size="sm" className="text-muted-foreground font-body gap-1">
              <ArrowRight className="h-4 w-4" />
              עיון
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-body text-sm text-foreground">{masechet}</span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center" dir="rtl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent mb-4">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-body font-medium">{getMasechetEnglish(masechet)}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            מסכת {masechet}
          </h1>
          <p className="text-muted-foreground font-body">
            {videos?.length || 0} שיעורים • {dafim?.length || 0} דפים
          </p>
        </div>

        {/* Daf quick nav */}
        {dafim && dafim.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-sm font-bold text-muted-foreground mb-3" dir="rtl">קפיצה לדף</h2>
            <div className="flex flex-wrap gap-2" dir="rtl">
              {dafim.map((daf) => (
                <a
                  key={daf}
                  href={`#daf-${daf}`}
                  className="px-3 py-1.5 rounded-md text-sm font-body border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {numberToHebrewDaf(daf)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Videos grouped by daf */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-border bg-card">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedDafim.length > 0 ? (
          <div className="space-y-10">
            {sortedDafim.map((daf) => (
              <div key={daf} id={`daf-${daf}`} className="scroll-mt-20">
                <h2 className="font-display text-lg font-bold text-foreground mb-4 border-b border-border pb-2" dir="rtl">
                  {daf === 0 ? "ללא דף מוגדר" : `דף ${numberToHebrewDaf(daf)}`}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {videosByDaf[daf].map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body" dir="rtl">אין שיעורים במסכת זו</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Masechet;
