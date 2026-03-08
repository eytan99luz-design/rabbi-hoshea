import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Check, Rss } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss-feed`;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "כתובת מייל לא תקינה", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("email_subscribers")
        .insert({ email: email.trim() });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "כבר נרשמת לעדכונים" });
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast({ title: "נרשמת בהצלחה לעדכונים!" });
      }
    } catch {
      toast({ title: "שגיאה בהרשמה, נסה שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto text-center" dir="rtl">
      <Mail className="h-8 w-8 text-accent mx-auto mb-3" />
      <h3 className="font-display text-lg font-bold text-foreground mb-1">
        קבלו עדכונים על שיעורים חדשים
      </h3>
      <p className="text-sm text-muted-foreground font-body mb-4">
        הירשמו וקבלו התראה כשעולה שיעור חדש
      </p>

      {subscribed ? (
        <div className="flex items-center justify-center gap-2 text-accent font-body">
          <Check className="h-5 w-5" />
          <span>נרשמת בהצלחה!</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? "..." : "הרשמה"}
          </Button>
          <Input
            type="email"
            placeholder="הכנס כתובת מייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-body text-sm"
            dir="ltr"
          />
        </form>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <a
          href={rssUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors font-body"
        >
          <Rss className="h-3.5 w-3.5" />
          הרשמו דרך RSS
        </a>
      </div>
    </div>
  );
}
