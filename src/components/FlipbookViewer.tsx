import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookViewerProps {
  pdfUrl: string;
  title?: string;
  articleId?: string;
}

export function FlipbookViewer({ pdfUrl, title, articleId }: FlipbookViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pageRatio, setPageRatio] = useState(0.72);
  const [loadError, setLoadError] = useState<string | null>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const { dir, lang } = useLanguage();

  const labels = lang === "he"
    ? {
        loading: "טוען מסמך...",
        failed: "לא הצלחנו לפתוח את המאמר.",
        previous: "העמוד הקודם",
        next: "העמוד הבא",
        page: "עמוד",
      }
    : {
        loading: "Loading document...",
        failed: "We couldn't open this article.",
        previous: "Previous page",
        next: "Next page",
        page: "Page",
      };

  const pageWidth = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) {
      return 0;
    }

    const availableWidth = Math.max(viewportSize.width - 24, 180);
    const availableHeight = Math.max(viewportSize.height - 24, 180);
    const widthFromHeight = availableHeight * pageRatio;

    return Math.max(180, Math.floor(Math.min(availableWidth, widthFromHeight)));
  }, [pageRatio, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    const contentArea = contentAreaRef.current;
    if (!contentArea) return;

    const updateViewportSize = (width: number, height: number) => {
      const nextWidth = Math.floor(width);
      const nextHeight = Math.floor(height);

      if (nextWidth === 0 || nextHeight === 0) return;

      setViewportSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateViewportSize(contentArea.clientWidth, contentArea.clientHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateViewportSize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(contentArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setNumPages(0);
    setCurrentPage(1);
    setLoadError(null);
    setPageRatio(0.72);
  }, [articleId, pdfUrl]);

  const onDocumentLoadSuccess = async ({ numPages: loadedPages, getPage }: { numPages: number; getPage: (pageNumber: number) => Promise<any> }) => {
    setLoadError(null);
    setNumPages(loadedPages);
    setCurrentPage(1);

    try {
      const firstPage = await getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });

      if (viewport.width > 0 && viewport.height > 0) {
        setPageRatio(viewport.width / viewport.height);
      }
    } catch {
      setPageRatio(0.72);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  return (
    <div className="flex h-full w-full flex-col gap-3" dir={dir}>
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage <= 1 || numPages === 0}>
          <ChevronLeft className="h-4 w-4" />
          {labels.previous}
        </Button>
        <span className="min-w-[88px] text-center text-sm font-body text-muted-foreground">
          {labels.page} {currentPage} / {numPages || "-"}
        </span>
        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={numPages === 0 || currentPage >= numPages}>
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={() => setLoadError(labels.failed)}
          loading={
            <div className="flex h-full min-h-[320px] items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="font-body">{labels.loading}</div>
            </div>
          }
          error={
            <div className="flex h-full min-h-[320px] items-center justify-center px-4 text-center">
              <p className="font-body text-destructive">{loadError ?? labels.failed}</p>
            </div>
          }
        >
          <div ref={contentAreaRef} className="flex h-full min-h-[320px] w-full items-center justify-center overflow-auto p-3 sm:p-4">
            {numPages > 0 && pageWidth > 0 ? (
              <Page
                key={`${pdfUrl}-${currentPage}-${pageWidth}`}
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex min-h-[280px] items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-body">{labels.loading}</span>
                  </div>
                }
                className="mx-auto overflow-hidden rounded-md shadow-lg"
              />
            ) : (
              <div className="font-body text-muted-foreground">{labels.loading}</div>
            )}
          </div>
        </Document>
      </div>
    </div>
  );
}
