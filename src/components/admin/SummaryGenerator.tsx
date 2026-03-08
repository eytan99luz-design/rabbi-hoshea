import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SummaryGenerator() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ processed: number; skipped: number; total: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["summary-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true });
      const { count: withSummary } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .not("summary", "is", null);
      return { total: total || 0, withSummary: withSummary || 0 };
    },
  });

  const handleGenerate = async (limit: number) => {
    setGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-summaries", {
        body: { limit },
      });
      if (error) throw error;
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["summary-stats"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: `סוכמו ${data.processed} שיעורים בהצלחה` });
    } catch (err: any) {
      toast({ title: "שגיאה ביצירת סיכומים", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const missing = stats ? stats.total - stats.withSummary : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
          <FileText className="h-5 w-5 text-accent" />
          סיכומי שיעורים (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats && (
          <div className="text-sm text-muted-foreground font-body" dir="rtl">
            <p>{stats.withSummary} מתוך {stats.total} שיעורים מסוכמים</p>
            {missing > 0 && (
              <p className="text-accent font-medium">{missing} שיעורים ממתינים לסיכום</p>
            )}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleGenerate(10)} disabled={generating || missing === 0} className="font-body" size="sm">
            {generating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileText className="h-4 w-4 ml-2" />}
            סכם 10 שיעורים
          </Button>
          <Button onClick={() => handleGenerate(50)} disabled={generating || missing === 0} variant="outline" className="font-body" size="sm">
            סכם 50 שיעורים
          </Button>
        </div>
        {result && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body" dir="rtl">
            <CheckCircle className="h-4 w-4 text-green-500" />
            סוכמו {result.processed} שיעורים, דולגו {result.skipped}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
