import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useVideo, useAdjacentVideos } from "@/hooks/useVideos";
import { getMasechetEnglish, numberToHebrewDaf } from "@/lib/masechet-list";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Lesson = () => {
  const { youtubeId } = useParams<{ youtubeId: string }>();
  const { data: video, isLoading } = useVideo(youtubeId || "");
  const { data: adjacent } = useAdjacentVideos(video?.masechet ?? null, video?.daf ?? null);

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

      <div className="container px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
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

        {/* YouTube Player */}
        <div className="aspect-video rounded-lg overflow-hidden bg-foreground/5 shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Title and Meta */}
        <div className="mt-6" dir="rtl">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
            {video.title}
          </h1>
          {video.masechet && (
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent font-body text-sm font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                {getMasechetEnglish(video.masechet)}
              </span>
              {video.daf && (
                <span className="text-sm text-muted-foreground font-body">
                  דף {numberToHebrewDaf(video.daf)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        {adjacent && (adjacent.prev || adjacent.next) && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
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
    </div>
  );
};

export default Lesson;
