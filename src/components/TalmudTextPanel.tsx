import { useState } from "react";
import { useSefariaText, getSefariaLink } from "@/hooks/useSefariaText";
import { numberToHebrewDaf } from "@/lib/masechet-list";
import { BookOpen, ChevronRight, ChevronLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TalmudTextPanelProps {
  masechet: string;
  daf: number;
}

export function TalmudTextPanel({ masechet, daf }: TalmudTextPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useSefariaText(masechet, daf);
  const hebrewDaf = numberToHebrewDaf(daf);
  const sefariaLink = getSefariaLink(masechet, daf);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 font-body shadow-lg bg-card border-accent/30 hover:border-accent"
        dir="rtl"
      >
        <BookOpen className="h-4 w-4 ml-1 text-accent" />
        <span className="hidden md:inline">טקסט הדף</span>
        <ChevronLeft className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-full md:w-[420px] lg:w-[480px] z-50 bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-accent/5" dir="rtl">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">
            {masechet} דף {hebrewDaf}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={sefariaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-accent transition-colors"
            title="פתח בספריא"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="mr-2 text-sm text-muted-foreground font-body">טוען טקסט...</span>
        </div>
      ) : !data?.amudA && !data?.amudB ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">
              הדף לא נמצא בספריא
            </p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="amud-a" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 grid grid-cols-2" dir="rtl">
            <TabsTrigger value="amud-a" className="font-body" disabled={!data?.amudA}>
              עמוד א׳
            </TabsTrigger>
            <TabsTrigger value="amud-b" className="font-body" disabled={!data?.amudB}>
              עמוד ב׳
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amud-a" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3" dir="rtl">
                {data?.amudA?.he.map((segment, i) => (
                  <p
                    key={i}
                    className="text-foreground font-body text-sm leading-[2] sefaria-text"
                    dangerouslySetInnerHTML={{ __html: segment }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="amud-b" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3" dir="rtl">
                {data?.amudB?.he.map((segment, i) => (
                  <p
                    key={i}
                    className="text-foreground font-body text-sm leading-[2] sefaria-text"
                    dangerouslySetInnerHTML={{ __html: segment }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground font-body">
          מקור: <a href="https://www.sefaria.org.il" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">ספריא</a> — טקסט מהדורת ויליאם דוידסון
        </p>
      </div>
    </div>
  );
}
