import { Link } from "react-router-dom";
import type { Video } from "@/hooks/useVideos";
import { getMasechetEnglish, numberToHebrewDaf } from "@/lib/masechet-list";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const thumbnail = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`;

  return (
    <Link
      to={`/lesson/${video.youtube_id}`}
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {video.masechet && video.daf && (
          <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-body font-semibold px-2 py-1 rounded">
            דף {numberToHebrewDaf(video.daf)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 leading-relaxed" dir="rtl">
          {video.title}
        </h3>
        {video.masechet && (
          <p className="mt-2 text-xs text-muted-foreground font-body">
            {getMasechetEnglish(video.masechet)} • מסכת {video.masechet}
          </p>
        )}
      </div>
    </Link>
  );
}
