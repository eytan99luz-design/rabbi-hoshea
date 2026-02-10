import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { SearchBar } from "@/components/SearchBar";
import { MasechetFilter } from "@/components/MasechetFilter";
import { useVideos, useMasechtot } from "@/hooks/useVideos";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedMasechet, setSelectedMasechet] = useState<string | null>(
    searchParams.get("masechet")
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: videos, isLoading } = useVideos(selectedMasechet || undefined, search || undefined);
  const { data: masechtot } = useMasechtot();

  useEffect(() => {
    if (selectedMasechet) {
      setSearchParams({ masechet: selectedMasechet });
    } else {
      setSearchParams({});
    }
  }, [selectedMasechet, setSearchParams]);

  const handleSelectMasechet = (masechet: string | null) => {
    setSelectedMasechet(masechet);
    setMobileFilterOpen(false);
  };

  const FilterContent = () => (
    masechtot ? (
      <MasechetFilter
        masechtot={masechtot}
        selected={selectedMasechet}
        onSelect={handleSelectMasechet}
      />
    ) : null
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground" dir="rtl">
              עיון בשיעורים
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />
            {/* Mobile filter trigger */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-4">
                <h3 className="font-display text-lg font-bold mb-4" dir="rtl">סינון</h3>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {selectedMasechet && (
          <div className="flex items-center gap-2 mb-4" dir="rtl">
            <span className="text-sm text-muted-foreground font-body">מסכת:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-body">
              {selectedMasechet}
              <button onClick={() => setSelectedMasechet(null)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterContent />
          </aside>

          {/* Video grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border bg-card">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body" dir="rtl">
                  לא נמצאו שיעורים
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
