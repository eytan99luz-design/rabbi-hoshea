import { useMemo } from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, Navigate } from "react-router-dom";
import { Play, Heart, Calendar, Library, Flame, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const Stats = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: history, isLoading: histLoading } = useWatchHistory();
  const { favorites, isLoading: favLoading } = useFavorites();

  const isLoading = histLoading || favLoading;
  const watchedCount = history?.length || 0;

  const masechtotWatched = new Set(
    history?.map((h: any) => h.videos?.masechet).filter(Boolean) || []
  ).size;

  const calculateStreak = () => {
    if (!history || history.length === 0) return 0;
    const dates = [...new Set(
      history.map((h: any) => new Date(h.watched_at).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toDateString()) streak++;
      else break;
    }
    return streak;
  };

  const totalMinutes = Math.round(
    (history?.reduce((sum: number, h: any) => sum + (h.progress_seconds || 0), 0) || 0) / 60
  );

  const streak = calculateStreak();

  // Weekly data (last 7 days)
  const weeklyData = useMemo(() => {
    if (!history) return [];
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("he-IL", { weekday: "short" });
      days[key] = 0;
    }
    for (const h of history) {
      const d = new Date(h.watched_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) {
        const key = d.toLocaleDateString("he-IL", { weekday: "short" });
        if (key in days) days[key]++;
      }
    }
    return Object.entries(days).map(([name, count]) => ({ name, שיעורים: count }));
  }, [history]);

  // Masechet distribution
  const masechetData = useMemo(() => {
    if (!history) return [];
    const counts: Record<string, number> = {};
    for (const h of history as any[]) {
      const m = h.videos?.masechet;
      if (m) counts[m] = (counts[m] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, שיעורים: count }));
  }, [history]);

  const stats = [
    { icon: Play, label: "שיעורים שנצפו", value: watchedCount, color: "text-blue-500" },
    { icon: Library, label: "מסכתות", value: masechtotWatched, color: "text-accent" },
    { icon: Heart, label: "מועדפים", value: favorites?.length || 0, color: "text-red-500" },
    { icon: Flame, label: "רצף ימים", value: streak, color: "text-orange-500" },
    { icon: Clock, label: "דקות צפייה", value: totalMinutes, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="הסטטיסטיקות שלי" path="/stats" />
      <Header />

      <div className="container px-4 py-8 max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6" dir="rtl">
          📊 הסטטיסטיקות שלי
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-body" dir="rtl">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Weekly Activity Chart */}
            {weeklyData.length > 0 && (
              <Card className="mt-8">
                <CardContent className="p-4">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4" dir="rtl">
                    📈 פעילות שבועית
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="שיעורים"
                        stroke="hsl(var(--accent))"
                        fill="url(#colorLessons)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Masechet Distribution */}
            {masechetData.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4" dir="rtl">
                    📚 התפלגות לפי מסכת
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={masechetData} layout="vertical">
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="שיעורים"
                        fill="hsl(var(--accent))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent watch history */}
            {history && history.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-bold text-foreground mb-4" dir="rtl">
                  נצפו לאחרונה
                </h2>
                <div className="space-y-2">
                  {history.slice(0, 10).map((item: any) => (
                    <Link
                      key={item.id}
                      to={`/lesson/${item.videos?.youtube_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent transition-colors"
                      dir="rtl"
                    >
                      <div className="w-16 h-10 rounded overflow-hidden shrink-0">
                        <img
                          src={item.videos?.thumbnail_url || `https://img.youtube.com/vi/${item.videos?.youtube_id}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-semibold text-foreground line-clamp-1">
                          {item.videos?.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {new Date(item.watched_at).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
