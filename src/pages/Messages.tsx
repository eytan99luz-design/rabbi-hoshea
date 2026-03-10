import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useAllMyQuestions } from "@/hooks/useLessonQuestions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle, CheckCircle2, Clock, LogIn, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: questions, isLoading } = useAllMyQuestions();

  // Fetch video info for display
  const videoIds = [...new Set(questions?.map(q => q.video_id) || [])];
  const { data: videos } = useQuery({
    queryKey: ["message-videos", videoIds],
    queryFn: async () => {
      if (videoIds.length === 0) return [];
      const { data } = await supabase
        .from("videos")
        .select("id, title, youtube_id, masechet, daf")
        .in("id", videoIds);
      return data || [];
    },
    enabled: videoIds.length > 0,
  });

  const getVideo = (videoId: string) => videos?.find(v => v.id === videoId);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 max-w-2xl">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-16 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2" dir="rtl">הודעות</h2>
          <p className="text-muted-foreground font-body mb-6" dir="rtl">התחבר כדי לראות את ההודעות שלך</p>
          <Link to="/login">
            <Button className="font-body gap-1.5">
              <LogIn className="h-4 w-4" />
              התחבר
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SEOHead title="הודעות" description="השאלות והתשובות שלך" path="/messages" />
      <div className="container px-4 py-6 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6" dir="rtl">
          <MessageCircle className="h-6 w-6 inline-block ml-2 text-accent" />
          ההודעות שלי
        </h1>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !questions || questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-body" dir="rtl">עוד לא שאלת שאלות</p>
              <p className="text-sm text-muted-foreground/70 font-body mt-1" dir="rtl">
                אפשר לשאול שאלות מתוך דף השיעור
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              const video = getVideo(q.video_id);
              return (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2" dir="rtl">
                    {video && (
                      <Link
                        to={`/lesson/${video.youtube_id}`}
                        className="flex items-center gap-1.5 text-xs text-accent hover:underline font-body"
                      >
                        <Video className="h-3 w-3" />
                        {video.masechet && video.daf ? `${video.masechet} דף ${video.daf}` : video.title}
                      </Link>
                    )}
                    <p className="text-sm font-body text-foreground">{q.question}</p>
                    <p className="text-[10px] text-muted-foreground font-body">
                      {new Date(q.created_at).toLocaleDateString("he-IL")}
                    </p>

                    {q.answer ? (
                      <div className="p-2.5 rounded-md bg-accent/5 border border-accent/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <Badge variant="secondary" className="text-[10px] font-body">תשובת הרב</Badge>
                        </div>
                        <p className="text-sm font-body text-foreground">{q.answer}</p>
                        {q.answered_at && (
                          <p className="text-[10px] text-muted-foreground font-body mt-1">
                            {new Date(q.answered_at).toLocaleDateString("he-IL")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-body">ממתין לתשובה</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
