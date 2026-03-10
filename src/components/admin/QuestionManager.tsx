import { useState } from "react";
import { useAllQuestions, useAnswerQuestion, useDeleteQuestion, LessonQuestion } from "@/hooks/useLessonQuestions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Send, Loader2, Trash2, CheckCircle2, Clock, Video } from "lucide-react";

export function QuestionManager() {
  const { data: questions, isLoading } = useAllQuestions();
  const answerMutation = useAnswerQuestion();
  const deleteMutation = useDeleteQuestion();
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  // Fetch video titles for context
  const videoIds = [...new Set(questions?.map(q => q.video_id) || [])];
  const { data: videos } = useQuery({
    queryKey: ["admin-question-videos", videoIds],
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

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    try {
      await answerMutation.mutateAsync({ questionId, answer: answerText.trim() });
      setAnsweringId(null);
      setAnswerText("");
      toast({ title: "התשובה נשלחה" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      await deleteMutation.mutateAsync(questionId);
      toast({ title: "השאלה נמחקה" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const unanswered = questions?.filter(q => !q.answer) || [];
  const answered = questions?.filter(q => q.answer) || [];

  return (
    <div className="space-y-6">
      {/* Unanswered */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
            <Clock className="h-5 w-5 text-orange-500" />
            שאלות ממתינות ({unanswered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unanswered.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body" dir="rtl">אין שאלות ממתינות 🎉</p>
          ) : (
            <div className="space-y-3">
              {unanswered.map((q) => {
                const video = getVideo(q.video_id);
                return (
                  <div key={q.id} className="p-3 rounded-lg border border-border space-y-2" dir="rtl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        {video && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                            <Video className="h-3 w-3" />
                            <span>{video.masechet && video.daf ? `${video.masechet} דף ${video.daf}` : video.title}</span>
                          </div>
                        )}
                        <p className="text-sm font-body text-foreground">{q.question}</p>
                        <p className="text-[10px] text-muted-foreground font-body">
                          {new Date(q.created_at).toLocaleDateString("he-IL")} • {q.user_id.slice(0, 8)}...
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {answeringId === q.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="כתוב תשובה..."
                          className="text-foreground text-sm min-h-[60px]"
                          dir="rtl"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="font-body gap-1" onClick={() => handleAnswer(q.id)} disabled={answerMutation.isPending}>
                            {answerMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            שלח תשובה
                          </Button>
                          <Button size="sm" variant="ghost" className="font-body" onClick={() => { setAnsweringId(null); setAnswerText(""); }}>
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="font-body gap-1" onClick={() => { setAnsweringId(q.id); setAnswerText(q.answer || ""); }}>
                        <MessageCircle className="h-3 w-3" />
                        השב
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answered */}
      {answered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              שאלות שנענו ({answered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {answered.map((q) => {
                const video = getVideo(q.video_id);
                return (
                  <div key={q.id} className="p-3 rounded-lg border border-border space-y-2" dir="rtl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        {video && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                            <Video className="h-3 w-3" />
                            <span>{video.masechet && video.daf ? `${video.masechet} דף ${video.daf}` : video.title}</span>
                          </div>
                        )}
                        <p className="text-sm font-body text-foreground">{q.question}</p>
                        <div className="flex items-start gap-1.5 text-xs mt-1">
                          <Badge variant="secondary" className="text-[10px] font-body">תשובה</Badge>
                          <p className="text-muted-foreground font-body">{q.answer}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
