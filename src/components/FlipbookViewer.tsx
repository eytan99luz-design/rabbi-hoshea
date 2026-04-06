import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useArticleBookmarks } from "@/hooks/useArticleBookmarks";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookViewerProps {
  pdfUrl: string;
  title?: string;
  articleId?: string;
}

const BookPage = forwardRef<HTMLDivElement, { pageNumber: number; width: number; height: number }>(
  ({ pageNumber, width, height }, ref) => {
    return (
      <div ref={ref} className="bg-background flex items-center justify-center overflow-hidden" style={{ width, height }}>
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="flex items-center justify-center"
        />
      </div>
    );
  }
);
BookPage.displayName = "BookPage";

export function FlipbookViewer({ pdfUrl, title, articleId }: FlipbookViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pageAspectRatio, setPageAspectRatio] = useState(1.414);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<any>(null);

  const { user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark } = useArticleBookmarks(articleId);

  const currentRealPage = numPages > 0 ? numPages - currentPage : 1;
  const isBookmarked = bookmarks?.some(b => b.page_number === currentRealPage);
  const shouldUsePortrait = viewportSize.width < 700;
  const sortedBookmarks = useMemo(
    () => [...(bookmarks ?? [])].sort((a, b) => a.page_number - b.page_number),
    [bookmarks]
  );
  const pageDisplayCount = shouldUsePortrait ? 1 : 2;
  const containerSize = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) {
      return { width: 0, height: 0 };
    }

    const availableWidth = Math.max(viewportSize.width - 16, 220);
    const availableHeight = Math.max(viewportSize.height - 16, 220);

    let pageWidth = availableWidth / pageDisplayCount;
    let pageHeight = pageWidth * pageAspectRatio;

    if (pageHeight > availableHeight) {
      pageHeight = availableHeight;
      pageWidth = pageHeight / pageAspectRatio;
    }

    return {
      width: Math.max(Math.floor(pageWidth), 220),
      height: Math.max(Math.floor(pageHeight), 220),
    };
  }, [pageAspectRatio, pageDisplayCount, viewportSize.height, viewportSize.width]);

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
  }, [isFullscreen, numPages]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const onDocumentLoadSuccess = async ({ numPages: n, getPage }: { numPages: number; getPage: (pageNumber: number) => Promise<any> }) => {
    const firstPage = await getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });

    setPageAspectRatio(viewport.height / viewport.width);
    setNumPages(n);
    setCurrentPage(n - 1);
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
      await fullscreenRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleToggleBookmark = () => {
    if (!articleId || !user) return;
    if (isBookmarked) {
      const bm = bookmarks?.find(b => b.page_number === currentRealPage);
      if (bm) removeBookmark(bm.id);
    } else {
      addBookmark({ articleId, pageNumber: currentRealPage });
    }
  };

  return (
    <div ref={fullscreenRef} className={`w-full h-full flex flex-col items-center ${isFullscreen ? 'bg-background p-4' : ''}`}>
      <div className="w-full flex-1 flex flex-col items-center min-h-0">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full min-h-[320px]">
              <div className="animate-pulse text-muted-foreground font-body">טוען מסמך...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full min-h-[320px]">
              <p className="text-destructive font-body">שגיאה בטעינת המסמך</p>
            </div>
          }
        >
          <div ref={contentAreaRef} className="flex-1 min-h-0 flex items-center justify-center overflow-auto px-2 py-4 w-full" dir="rtl">
            {numPages > 0 && containerSize.width > 0 ? (
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease'
                }}
              >
                {/* @ts-ignore - react-pageflip types */}
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={containerSize.width}
                  height={containerSize.height}
                  size="fixed"
                  minWidth={220}
                  maxWidth={2200}
                  minHeight={220}
                  maxHeight={3200}
                  maxShadowOpacity={0.5}
                  showCover={true}
                  mobileScrollSupport={true}
                  onFlip={onFlip}
                  className="shadow-2xl"
                  style={{ direction: "rtl" }}
                  startPage={numPages - 1}
                  drawShadow={true}
                  flippingTime={600}
                  usePortrait={shouldUsePortrait}
                  startZIndex={0}
                  autoSize={false}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                  showPageCorners={true}
                  disableFlipByClick={false}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <BookPage
                      key={i}
                      pageNumber={numPages - i}
                      width={containerSize.width}
                      height={containerSize.height}
                    />
                  ))}
                </HTMLFlipBook>
              </div>
            ) : (
              <div className="animate-pulse text-muted-foreground font-body">טוען...</div>
            )}
          </div>

          {numPages > 0 && (
            <>
              <TooltipProvider>
                <div className="flex items-center gap-2 py-3 shrink-0 flex-wrap justify-center">
                  <Button variant="ghost" size="icon" onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()} disabled={currentPage <= 0}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-body text-muted-foreground min-w-[80px] text-center" dir="rtl">
                    {currentRealPage} / {numPages}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => flipBookRef.current?.pageFlip()?.flipNext()} disabled={currentPage >= numPages - 1}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>הקטן</TooltipContent>
                  </Tooltip>
                  <span className="text-xs font-body text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 2.5}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>הגדל</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-6 bg-border mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}</TooltipContent>
                  </Tooltip>

                  {user && articleId && (
                    <>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleToggleBookmark} className={isBookmarked ? "text-accent" : ""}>
                            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isBookmarked ? "הסר סימניה" : "הוסף סימניה"}</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TooltipProvider>

              {user && articleId && sortedBookmarks.length > 0 && (
                <div className="flex items-center gap-1.5 pb-2 flex-wrap justify-center">
                  <span className="text-xs text-muted-foreground font-body">סימניות:</span>
                  {sortedBookmarks.map(bm => (
                    <Button
                      key={bm.id}
                      variant={bm.page_number === currentRealPage ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-2 text-xs font-body"
                      onClick={() => {
                        const flipIndex = numPages - bm.page_number;
                        flipBookRef.current?.pageFlip()?.turnToPage(flipIndex);
                      }}
                    >
                      עמ׳ {bm.page_number}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </Document>
      </div>
    </div>
  );
}
