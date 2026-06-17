import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  videoId: string;
  youtubeId: string;
  initialTranscript: string | null;
  fetchedAt: string | null;
}

export function LessonTranscript({ videoId, youtubeId, initialTranscript, fetchedAt }: Props) {
  const { dir, lang } = useLanguage();
  const [transcript, setTranscript] = useState<string | null>(initialTranscript);
  const [attempted, setAttempted] = useState<boolean>(!!fetchedAt);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTranscript(initialTranscript);
    setAttempted(!!fetchedAt);
  }, [initialTranscript, fetchedAt, videoId]);

  const fetchNow = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-transcript", {
        body: { youtube_id: youtubeId },
      });
      if (error) throw error;
      setAttempted(true);
      if (data?.transcript) setTranscript(data.transcript);
      else toast({ title: lang === "en" ? "No transcript available" : "אין תמלול זמין לסרטון זה" });
    } catch (err: any) {
      toast({ title: lang === "en" ? "Error" : "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-6 p-4 rounded-lg bg-card border border-border" dir={dir}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          {lang === "en" ? "Lesson Transcript" : "תמלול השיעור"}
        </h3>
        {transcript && (
          <Button size="sm" variant="ghost" onClick={copyAll} className="font-body">
            {copied ? <Check className="h-4 w-4 ml-1" /> : <Copy className="h-4 w-4 ml-1" />}
            {lang === "en" ? "Copy" : "העתק"}
          </Button>
        )}
      </div>

      {transcript ? (
        <div className="max-h-[420px] overflow-y-auto pr-2">
          <p className="text-sm font-body text-foreground/90 leading-loose whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      ) : attempted ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground font-body mb-3">
            {lang === "en"
              ? "No transcript available for this lesson."
              : "אין תמלול זמין לשיעור זה ב-YouTube."}
          </p>
          <Button size="sm" variant="outline" onClick={fetchNow} disabled={loading} className="font-body">
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {lang === "en" ? "Try again" : "נסה שוב"}
          </Button>
        </div>
      ) : (
        <div className="text-center py-6">
          <Button onClick={fetchNow} disabled={loading} className="font-body">
            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileText className="h-4 w-4 ml-2" />}
            {lang === "en" ? "Load transcript" : "טען תמלול"}
          </Button>
        </div>
      )}
    </div>
  );
}