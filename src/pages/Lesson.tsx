import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { ShareButtons } from "@/components/ShareButtons";
import { FavoriteButton } from "@/components/FavoriteButton";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { useVideo, useAdjacentVideos } from "@/hooks/useVideos";
import { useAuth } from "@/hooks/useAuth";
import { useTrackWatch, useVideoProgress } from "@/hooks/useWatchHistory";
import { getMasechetEnglish, numberToHebrewDaf } from "@/lib/masechet-list";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonNotes } from "@/components/LessonNotes";
import { FollowMasechetButton } from "@/components/FollowMasechetButton";
import { TalmudTextPanel } from "@/components/TalmudTextPanel";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const Lesson = () => {
  const { youtubeId } = useParams<{ youtubeId: string }>();
  const { data: video, isLoading } = useVideo(youtubeId || "");
  const { data: adjacent } = useAdjacentVideos(video?.masechet ?? null, video?.daf ?? null);
  const { user } = useAuth();
  const trackWatch = useTrackWatch();
  const { data: savedProgress } = useVideoProgress(video?.id);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasResumedRef = useRef(false);

  // Track watch history
  useEffect(() => {
    if (video?.id && user) {
      trackWatch.mutate({ videoId: video.id });
    }
  }, [video?.id, user]);

  // Reset resume flag when video changes
  useEffect(() => {
    hasResumedRef.current = false;
  }, [youtubeId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  // Initialize player when video is ready
  useEffect(() => {
    if (!video?.youtube_id) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new (window as any).YT.Player(`yt-player-${video.youtube_id}`, {
        videoId: video.youtube_id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            // Resume from saved position
            if (savedProgress && savedProgress > 10 && !hasResumedRef.current) {
              hasResumedRef.current = true;
              event.target.seekTo(savedProgress, true);
            }
          },
          onStateChange: (event: any) => {
            // When playing, save progress every 15 seconds
            if (event.data === 1) { // PLAYING
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = setInterval(() => {
                if (playerRef.current && video?.id && user) {
                  const currentTime = playerRef.current.getCurrentTime?.();
                  if (currentTime) {
                    trackWatch.mutate({ videoId: video.id, progressSeconds: currentTime });
                  }
                }
              }, 15000);
            } else {
              // Paused or ended - save immediately
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              if (playerRef.current && video?.id && user) {
                const currentTime = playerRef.current.getCurrentTime?.();
                if (currentTime) {
                  trackWatch.mutate({ videoId: video.id, progressSeconds: currentTime });
                }
              }
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [video?.youtube_id, savedProgress, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 max-w-4xl">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-2/3 mt-6" />
          <Skeleton className="h-4 w-1/3 mt-3" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-16 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">שיעור לא נמצא</h2>
          <p className="text-muted-foreground font-body mb-6">הדף המבוקש לא קיים</p>
          <Link to="/browse">
            <Button variant="outline">חזרה לכל השיעורים</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumbs */}
      <div className="container px-4 pt-6 max-w-7xl">
        {video.masechet && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-4" dir="rtl">
            <Link to="/browse" className="hover:text-foreground transition-colors">שיעורים</Link>
            <ChevronLeft className="h-3 w-3" />
            <Link
              to={`/browse?masechet=${encodeURIComponent(video.masechet)}`}
              className="hover:text-foreground transition-colors"
            >
              מסכת {video.masechet}
            </Link>
            {video.daf && (
              <>
                <ChevronLeft className="h-3 w-3" />
                <span>דף {numberToHebrewDaf(video.daf)}</span>
              </>
            )}
          </div>
        )}
      </div>

      <SEOHead
        title={video.title}
        description={`שיעור ${video.masechet ? `במסכת ${video.masechet}` : ""} ${video.daf ? `דף ${video.daf}` : ""} מפי הרב הושע רבינוביץ׳`}
        path={`/lesson/${video.youtube_id}`}
      />

      {/* Split View: Video + Text */}
      <div className="container px-4 pb-8 max-w-7xl">
        <div className={`flex flex-col ${video.masechet && video.daf ? 'lg:flex-row-reverse' : ''} gap-6`}>
          {/* Right side (RTL): Video + Meta */}
          <div className={`${video.masechet && video.daf ? 'lg:w-[58%]' : 'w-full max-w-4xl mx-auto'} flex-shrink-0`}>
            {/* YouTube Player */}
            <div className="aspect-video rounded-lg overflow-hidden bg-foreground/5 shadow-lg sticky top-4">
              <div id={`yt-player-${video.youtube_id}`} className="w-full h-full" />
            </div>

            {/* Summary */}
            {video.summary && (
              <div className="mt-5 p-4 rounded-lg bg-accent/5 border border-accent/20" dir="rtl">
                <p className="text-sm font-body text-foreground leading-relaxed">
                  <span className="font-display font-bold text-accent">תקציר: </span>
                  {video.summary}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 font-body">
                  {(video as any).summary_edited
                    ? "✏️ תקציר זה נערך על ידי המנהל"
                    : "🤖 תקציר זה נוצר באמצעות בינה מלאכותית"}
                </p>
              </div>
            )}

            {/* Title and Meta */}
            <div className="mt-5" dir="rtl">
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                {video.title}
              </h1>
              <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-3">
                  {video.masechet && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent font-body text-sm font-medium">
                      <BookOpen className="h-3.5 w-3.5" />
                      {getMasechetEnglish(video.masechet)}
                    </span>
                  )}
                  {video.daf && (
                    <span className="text-sm text-muted-foreground font-body">
                      דף {numberToHebrewDaf(video.daf)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {video.masechet && <FollowMasechetButton masechet={video.masechet} />}
                  <FavoriteButton videoId={video.id} />
                  <AddToPlaylistButton videoId={video.id} />
                  <ShareButtons
                    url={`https://rabbi-hoshea.lovable.app/lesson/${video.youtube_id}`}
                    title={video.title}
                    summary={video.summary || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Personal Notes */}
            {video.id && <LessonNotes videoId={video.id} />}

            {/* Navigation */}
            {adjacent && (adjacent.prev || adjacent.next) && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                {adjacent.prev ? (
                  <Link to={`/lesson/${adjacent.prev.youtube_id}`}>
                    <Button variant="outline" className="font-body">
                      <ChevronRight className="h-4 w-4 ml-1" />
                      דף {numberToHebrewDaf(adjacent.prev.daf!)}
                    </Button>
                  </Link>
                ) : <div />}
                {adjacent.next ? (
                  <Link to={`/lesson/${adjacent.next.youtube_id}`}>
                    <Button variant="outline" className="font-body">
                      דף {numberToHebrewDaf(adjacent.next.daf!)}
                      <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </Link>
                ) : <div />}
              </div>
            )}
          </div>

          {/* Left side (RTL): Talmud Text */}
          {video.masechet && video.daf && (
            <div className="lg:w-[42%] flex-shrink-0">
              <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-hidden">
                <TalmudTextPanel masechet={video.masechet} daf={video.daf} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lesson;
