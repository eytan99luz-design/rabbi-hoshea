import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function TranscriptFetcher() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, ok: 0, fail: 0 });

  const { data: counts, refetch } = useQuery({
    queryKey: ["transcript-counts"],
    queryFn: async () => {
      const [total, withT, attempted] = await Promise.all([
        supabase.from("videos").select("id", { count: "exact", head: true }),
        supabase.from("videos").select("id", { count: "exact", head: true }).not("transcript", "is", null),
        supabase.from("videos").select("id", { count: "exact", head: true }).not("transcript_fetched_at", "is", null),
      ]);
      return {
        total: total.count || 0,
        withTranscript: withT.count || 0,
        attempted: attempted.count || 0,
      };
    },
  });

  const remaining = (counts?.total || 0) - (counts?.withTranscript || 0);

  const runBatch = async () => {
    setRunning(true);
    setProgress({ done: 0, ok: 0, fail: 0 });
    try {
      let totalDone = 0, totalOk = 0, totalFail = 0;
      while (true) {
        const { data, error } = await supabase.functions.invoke("fetch-transcript", {
          body: { batch: true, limit: 20 },
        });
        if (error) throw error;
        if (!data?.processed) break;
        totalDone += data.processed;
        totalOk += data.withTranscript || 0;
        totalFail += data.withoutTranscript || 0;
        setProgress({ done: totalDone, ok: totalOk, fail: totalFail });
        await refetch();
        if (data.processed < 20) break;
      }
      toast({ title: "סיום משיכת תמלולים", description: `נמשכו ${totalOk}, ללא תמלול ${totalFail}` });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
      refetch();
    }
  };

  const pct = counts && counts.total > 0 ? Math.round((counts.withTranscript / counts.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
          <FileText className="h-5 w-5 text-accent" />
          תמלולי YouTube
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-2xl font-display font-bold">{counts?.total ?? "—"}</p>
            <p className="text-xs text-muted-foreground font-body">סה״כ שיעורים</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10">
            <p className="text-2xl font-display font-bold text-accent">{counts?.withTranscript ?? "—"}</p>
            <p className="text-xs text-muted-foreground font-body">עם תמלול</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-2xl font-display font-bold">{remaining}</p>
            <p className="text-xs text-muted-foreground font-body">נותרו למשיכה</p>
          </div>
        </div>

        <Progress value={pct} />
        <p className="text-xs text-muted-foreground font-body text-center">
          {counts?.withTranscript ?? 0} / {counts?.total ?? 0} עם תמלול ({pct}%)
        </p>

        {running && (
          <p className="text-sm font-body text-center text-muted-foreground">
            בעיבוד… נמשכו {progress.ok}, ללא תמלול {progress.fail}
          </p>
        )}

        <Button onClick={runBatch} disabled={running || remaining === 0} className="w-full font-body">
          {running ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Play className="h-4 w-4 ml-2" />}
          {running ? "מושך תמלולים…" : remaining === 0 ? "לכל הסרטונים יש תמלול" : `משוך תמלולים לכל הסרטונים (${remaining})`}
        </Button>
        <p className="text-xs text-muted-foreground font-body">
          המערכת מושכת אוטומטית כתוביות בעברית, כולל כתוביות אוטומטיות, ותנסה שוב גם שיעורים שנכשלו קודם.
        </p>
      </CardContent>
    </Card>
  );
}