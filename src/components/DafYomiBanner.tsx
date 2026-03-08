import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getTodaysDafYomi } from "@/lib/daf-yomi";
import { useVideos } from "@/hooks/useVideos";
import { getMasechetEnglish, numberToHebrewDaf } from "@/lib/masechet-list";
import { CalendarDays, Play, BookOpen } from "lucide-react";

export function DafYomiBanner() {
  const dafYomi = getTodaysDafYomi();
  const { data: videos } = useVideos(dafYomi.masechet, undefined, dafYomi.actualDaf);
  const video = videos?.[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="container px-4 py-6"
    >
      <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-5 md:p-6" dir="rtl">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">📖 דף היומי</h2>
          <span className="text-xs text-muted-foreground font-body">
            {new Date().toLocaleDateString("he-IL")}
          </span>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span className="font-display text-base font-bold text-foreground">
              מסכת {dafYomi.masechet}
            </span>
            <span className="text-sm text-muted-foreground font-body">
              ({getMasechetEnglish(dafYomi.masechet)})
            </span>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/20 text-accent-foreground font-display font-bold text-sm">
            דף {numberToHebrewDaf(dafYomi.actualDaf)}
          </span>
        </div>

        {video ? (
          <Link
            to={`/lesson/${video.youtube_id}`}
            className="group mt-4 flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-accent hover:shadow-md transition-all"
          >
            <div className="w-24 h-14 rounded overflow-hidden shrink-0 relative">
              <img
                src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 text-accent fill-current" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-foreground line-clamp-1">{video.title}</p>
              <p className="text-xs text-accent font-body mt-0.5">▶ צפה בשיעור</p>
            </div>
          </Link>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground font-body">
            אין עדיין שיעור לדף זה באתר
          </p>
        )}
      </div>
    </motion.section>
  );
}
