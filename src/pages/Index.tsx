import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { EmailSubscribe } from "@/components/EmailSubscribe";
import { VideoCard } from "@/components/VideoCard";
import { SearchBar } from "@/components/SearchBar";
import { useVideos, useMasechtot } from "@/hooks/useVideos";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getMasechetEnglish } from "@/lib/masechet-list";
import { ArrowLeft, BookOpen, Search as SearchIcon, Play, BarChart3, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.06, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const [search, setSearch] = useState("");
  const { data: recentVideos, isLoading } = useVideos(undefined, search || undefined);
  const { data: masechtot } = useMasechtot();

  const topMasechtot = masechtot
    ? Object.entries(masechtot)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  const totalVideos = masechtot ? Object.values(masechtot).reduce((a, b) => a + b, 0) : 0;
  const totalMasechtot = masechtot ? Object.keys(masechtot).length : 0;
  const latestVideo = recentVideos?.[0];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="בית המדרש הדיגיטלי" path="/" />
      <Header />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="container relative px-4 py-16 md:py-24 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent mb-6"
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-body font-medium">שיעורי גמרא יומיים</span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight"
            dir="rtl"
          >
            בית המדרש הדיגיטלי
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg text-primary-foreground/70 font-body max-w-xl mx-auto mb-8"
            dir="rtl"
          >
            שיעורי תורה מפי הרב הושע רבינוביץ׳ — לימוד גמרא מסודר לפי מסכת ודף
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex justify-center"
          >
            <SearchBar value={search} onChange={setSearch} />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      {totalVideos > 0 && (
        <section className="border-b border-border bg-card">
          <div className="container px-4 py-5">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-3 gap-4 text-center"
            >
              {[
                { icon: Play, value: totalVideos, label: "שיעורים" },
                { icon: Library, value: totalMasechtot, label: "מסכתות" },
                { icon: BarChart3, value: topMasechtot[0]?.[1] || 0, label: `שיעורים ב${topMasechtot[0]?.[0] || "—"}` },
              ].map((stat, i) => (
                <motion.div key={i} variants={scaleIn} custom={i} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-accent">
                    <stat.icon className="h-5 w-5" />
                    <span className="font-display text-2xl font-bold text-foreground">{stat.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-body" dir="rtl">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Latest Video */}
      {latestVideo && !search && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0}
          className="container px-4 py-10"
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-5" dir="rtl">השיעור האחרון</h2>
          <Link
            to={`/lesson/${latestVideo.youtube_id}`}
            className="group block rounded-xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all duration-300"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={latestVideo.thumbnail_url || `https://img.youtube.com/vi/${latestVideo.youtube_id}/maxresdefault.jpg`}
                  alt={latestVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                    <Play className="h-7 w-7 text-accent-foreground fill-current" />
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center" dir="rtl">
                <span className="inline-block text-xs font-body font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full w-fit mb-3">
                  חדש
                </span>
                <h3 className="font-display text-lg md:text-xl font-bold text-foreground leading-relaxed mb-2">
                  {latestVideo.title}
                </h3>
                {latestVideo.masechet && (
                  <p className="text-sm text-muted-foreground font-body">
                    {getMasechetEnglish(latestVideo.masechet)} • מסכת {latestVideo.masechet}
                    {latestVideo.daf && ` • דף ${latestVideo.daf}`}
                  </p>
                )}
                {latestVideo.published_at && (
                  <p className="text-xs text-muted-foreground font-body mt-2">
                    {new Date(latestVideo.published_at).toLocaleDateString("he-IL")}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Quick Masechet Access */}
      {topMasechtot.length > 0 && (
        <section className="container px-4 py-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="flex items-center justify-between mb-6"
          >
            <h2 className="font-display text-xl font-bold text-foreground" dir="rtl">מסכתות פופולריות</h2>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="text-muted-foreground font-body">
                לכל המסכתות
                <ArrowLeft className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {topMasechtot.map(([masechet, count], i) => (
              <motion.div key={masechet} variants={scaleIn} custom={i}>
                <Link
                  to={`/masechet/${encodeURIComponent(masechet)}`}
                  className="group block border border-border rounded-lg p-4 bg-card hover:border-accent hover:shadow-md transition-all text-center"
                >
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors" dir="rtl">
                    {masechet}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    {getMasechetEnglish(masechet)} • {count} שיעורים
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Recent Lessons */}
      <section className="container px-4 py-10">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="font-display text-xl font-bold text-foreground mb-6"
          dir="rtl"
        >
          {search ? `תוצאות חיפוש` : "שיעורים אחרונים"}
        </motion.h2>
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {recentVideos.slice(search ? 0 : 1, search ? 12 : 13).map((video, i) => (
              <motion.div key={video.id} variants={scaleIn} custom={i}>
                <VideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body" dir="rtl">
              {search ? "לא נמצאו שיעורים. נסה חיפוש אחר." : "אין שיעורים עדיין. סנכרן את הערוץ כדי להתחיל."}
            </p>
          </div>
        )}
      </section>

      {/* Subscribe */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="container px-4 py-12"
      >
        <EmailSubscribe />
      </motion.section>

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
