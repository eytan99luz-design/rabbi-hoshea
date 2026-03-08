import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { EmailSubscribe } from "@/components/EmailSubscribe";
import { VideoCard } from "@/components/VideoCard";
import { SearchBar } from "@/components/SearchBar";
import { useVideos, useMasechtot } from "@/hooks/useVideos";
import { getMasechetEnglish } from "@/lib/masechet-list";
import { ArrowLeft, BookOpen, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [search, setSearch] = useState("");
  const { data: recentVideos, isLoading } = useVideos(undefined, search || undefined);
  const { data: masechtot } = useMasechtot();

  const topMasechtot = masechtot
    ? Object.entries(masechtot)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="container relative px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent mb-6">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-body font-medium">שיעורי גמרא יומיים</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight" dir="rtl">
            בית המדרש הדיגיטלי
          </h1>
          <p className="text-lg text-primary-foreground/70 font-body max-w-xl mx-auto mb-8" dir="rtl">
            שיעורי תורה מפי הרב הושע רבינוביץ׳ — לימוד גמרא מסודר לפי מסכת ודף
          </p>
          <div className="flex justify-center">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Quick Masechet Access */}
      {topMasechtot.length > 0 && (
        <section className="container px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-foreground" dir="rtl">מסכתות</h2>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-muted-foreground font-body">
                לכל המסכתות
                <ArrowLeft className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topMasechtot.map(([masechet, count]) => (
              <Link
                key={masechet}
                to={`/browse?masechet=${encodeURIComponent(masechet)}`}
                className="group border border-border rounded-lg p-4 bg-card hover:border-accent hover:shadow-md transition-all text-center"
              >
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors" dir="rtl">
                  {masechet}
                </h3>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {getMasechetEnglish(masechet)} • {count} שיעורים
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Lessons */}
      <section className="container px-4 py-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-6" dir="rtl">
          {search ? `תוצאות חיפוש` : "שיעורים אחרונים"}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-border bg-card">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentVideos && recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentVideos.slice(0, 12).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body" dir="rtl">
              {search ? "לא נמצאו שיעורים. נסה חיפוש אחר." : "אין שיעורים עדיין. סנכרן את הערוץ כדי להתחיל."}
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} שיעורי הרב הושע רבינוביץ׳
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
