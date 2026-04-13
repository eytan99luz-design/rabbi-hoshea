import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FlipbookViewerProps {
  pdfUrl: string;
  title?: string;
  articleId?: string;
}

export function FlipbookViewer({ pdfUrl, title }: FlipbookViewerProps) {
  const { dir, lang } = useLanguage();

  const labels = lang === "he"
    ? {
        open: "פתיחה בחלון חדש",
        download: "הורדה",
        fallback: "אם המסמך לא נטען מיד, אפשר לפתוח אותו בחלון חדש לקריאה מהירה.",
      }
    : {
        open: "Open in new tab",
        download: "Download",
        fallback: "If the document does not load immediately, open it in a new tab for faster reading.",
      };

  const viewerUrl = useMemo(() => {
    const separator = pdfUrl.includes("#") ? "&" : "#";
    return `${pdfUrl}${separator}toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  }, [pdfUrl]);

  return (
    <div className="flex h-full w-full flex-col gap-3" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <p className="text-sm font-body text-muted-foreground">{labels.fallback}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="font-body" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={labels.open}>
              <ExternalLink className="h-4 w-4" />
              {labels.open}
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="font-body" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download={title} aria-label={labels.download}>
              <Download className="h-4 w-4" />
              {labels.download}
            </a>
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        <iframe
          key={viewerUrl}
          src={viewerUrl}
          title={title || "PDF viewer"}
          className="h-full min-h-[420px] w-full border-0"
          loading="eager"
        />
      </div>
    </div>
  );
}
