import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle } from "lucide-react";

export function YouTubeSync() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ totalProcessed: number } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-youtube");
      if (error) throw error;
      setResult(data);
      toast({ title: `סונכרנו ${data.totalProcessed} סרטונים בהצלחה` });
    } catch (err: any) {
      toast({ title: "שגיאה בסנכרון", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2" dir="rtl">
          <RefreshCw className="h-5 w-5 text-accent" />
          סנכרון יוטיוב
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground font-body" dir="rtl">
          סנכרון כל הסרטונים מערוץ היוטיוב לבסיס הנתונים
        </p>
        <Button onClick={handleSync} disabled={syncing} className="font-body">
          {syncing ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          {syncing ? "מסנכרן..." : "סנכרן עכשיו"}
        </Button>
        {result && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body" dir="rtl">
            <CheckCircle className="h-4 w-4 text-green-500" />
            עובדו {result.totalProcessed} סרטונים
          </div>
        )}
      </CardContent>
    </Card>
  );
}
