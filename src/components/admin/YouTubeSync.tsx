import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";

export function YouTubeSync() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ newVideos: number } | null>(null);

  const { data: logs, refetch } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-youtube");
      if (error) throw error;
      setResult(data);
      toast({ title: `סונכרנו ${data.newVideos} סרטונים חדשים בהצלחה` });
      refetch();
    } catch (err: any) {
      toast({ title: "שגיאה בסנכרון", description: err.message, variant: "destructive" });
      refetch();
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
          <RefreshCw className="h-5 w-5 text-accent" />
          סנכרון יוטיוב
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground font-body" dir="rtl">
          סנכרון אוטומטי כל שעתיים. ניתן גם לסנכרן ידנית.
        </p>
        <Button onClick={handleSync} disabled={syncing} className="font-body">
          {syncing ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          {syncing ? "מסנכרן..." : "סנכרן עכשיו"}
        </Button>
        {result && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body" dir="rtl">
            <CheckCircle className="h-4 w-4 text-green-500" />
            נוספו {result.newVideos} סרטונים חדשים
          </div>
        )}

        {logs && logs.length > 0 && (
          <div className="mt-4 space-y-2" dir="rtl">
            <h4 className="text-sm font-semibold font-body">היסטוריית סנכרונים</h4>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-2 px-3 text-right">זמן</th>
                    <th className="py-2 px-3 text-right">סטטוס</th>
                    <th className="py-2 px-3 text-right">שיעורים חדשים</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-t">
                      <td className="py-2 px-3 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(log.ran_at)}
                      </td>
                      <td className="py-2 px-3">
                        {log.status === "success" ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> הצלחה
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1" title={log.error_message || ""}>
                            <AlertCircle className="h-3.5 w-3.5" /> שגיאה
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">{log.new_videos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
