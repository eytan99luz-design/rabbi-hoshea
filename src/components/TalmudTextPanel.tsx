import { useState } from "react";
import { useSefariaText, getSefariaLink } from "@/hooks/useSefariaText";
import { numberToHebrewDaf } from "@/lib/masechet-list";
import { BookOpen, ChevronRight, ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TalmudTextPanelProps {
  masechet: string;
  daf: number;
}

export function TalmudTextPanel({ masechet, daf }: TalmudTextPanelProps) {
  const [currentDaf, setCurrentDaf] = useState(daf);
  const { data, isLoading } = useSefariaText(masechet, currentDaf);
  const hebrewDaf = numberToHebrewDaf(currentDaf);
  const sefariaLink = getSefariaLink(masechet, currentDaf);

  // Reset to lesson daf when lesson changes
  const [prevDaf, setPrevDaf] = useState(daf);
  if (daf !== prevDaf) {
    setPrevDaf(daf);
    setCurrentDaf(daf);
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-card shadow-sm" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-accent/5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">
            {masechet} דף {hebrewDaf}
          </h3>
          {currentDaf !== daf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDaf(daf)}
              className="text-xs text-accent font-body h-7 px-2"
            >
              חזרה לדף השיעור ({numberToHebrewDaf(daf)})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Daf navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDaf((d) => Math.max(2, d - 1))}
            disabled={currentDaf <= 2}
            className="h-8 w-8"
            title="דף קודם"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-body text-muted-foreground min-w-[2rem] text-center">
            {hebrewDaf}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDaf((d) => d + 1)}
            className="h-8 w-8"
            title="דף הבא"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <a
            href={sefariaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-accent transition-colors p-2"
            title="פתח בספריא"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="mr-2 text-sm text-muted-foreground font-body">טוען טקסט...</span>
        </div>
      ) : !data?.amudA && !data?.amudB ? (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">הדף לא נמצא בספריא</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="amud-a" className="w-full">
          <TabsList className="mx-4 mt-3 grid grid-cols-2 w-auto">
            <TabsTrigger value="amud-a" className="font-body" disabled={!data?.amudA}>
              עמוד א׳
            </TabsTrigger>
            <TabsTrigger value="amud-b" className="font-body" disabled={!data?.amudB}>
              עמוד ב׳
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amud-a">
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {data?.amudA?.he.map((segment, i) => (
                <p
                  key={i}
                  className="text-foreground font-body text-sm leading-[2] sefaria-text"
                  dangerouslySetInnerHTML={{ __html: segment }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="amud-b">
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {data?.amudB?.he.map((segment, i) => (
                <p
                  key={i}
                  className="text-foreground font-body text-sm leading-[2] sefaria-text"
                  dangerouslySetInnerHTML={{ __html: segment }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center rounded-b-xl">
        <p className="text-[10px] text-muted-foreground font-body">
          מקור: <a href="https://www.sefaria.org.il" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">ספריא</a> — טקסט מהדורת ויליאם דוידסון
        </p>
      </div>
    </div>
  );
}
