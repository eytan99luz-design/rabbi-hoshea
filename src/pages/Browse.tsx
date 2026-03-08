import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { SearchBar } from "@/components/SearchBar";
import { MasechetFilter } from "@/components/MasechetFilter";
import { DafFilter } from "@/components/DafFilter";
import { useVideos, useMasechtot, useDafimForMasechet } from "@/hooks/useVideos";
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
  const [selectedDaf, setSelectedDaf] = useState<number | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: videos, isLoading } = useVideos(selectedMasechet || undefined, search || undefined, selectedDaf || undefined);
  const { data: masechtot } = useMasechtot();
  const { data: dafim } = useDafimForMasechet(selectedMasechet);

  useEffect(() => {
    if (selectedMasechet) {
      setSearchParams({ masechet: selectedMasechet });
    } else {
      setSearchParams({});
    }
  }, [selectedMasechet, setSearchParams]);

  const handleSelectMasechet = (masechet: string | null) => {
    setSelectedMasechet(masechet);
    setSelectedDaf(null);
    setMobileFilterOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-4">
      {masechtot && (
        <MasechetFilter
          masechtot={masechtot}
          selected={selectedMasechet}
          onSelect={handleSelectMasechet}
        />
      )}
      {selectedMasechet && dafim && dafim.length > 0 && (
        <DafFilter
          dafim={dafim}
          selected={selectedDaf}
          onSelect={(daf) => { setSelectedDaf(daf); setMobileFilterOpen(false); }}
        />
      )}
    </div>
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

        {(selectedMasechet || selectedDaf) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap" dir="rtl">
            {selectedMasechet && (
              <>
                <span className="text-sm text-muted-foreground font-body">מסכת:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-body">
                  {selectedMasechet}
                  <button onClick={() => { setSelectedMasechet(null); setSelectedDaf(null); }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </>
            )}
            {selectedDaf && (
              <>
                <span className="text-sm text-muted-foreground font-body">דף:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-body">
                  {selectedDaf}
                  <button onClick={() => setSelectedDaf(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </>
            )}
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
