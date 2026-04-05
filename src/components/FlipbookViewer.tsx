import React, { useState, useEffect, useRef, forwardRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookViewerProps {
  pdfUrl: string;
  title?: string;
}

const BookPage = forwardRef<HTMLDivElement, { pageNumber: number; width: number; height: number }>(
  ({ pageNumber, width, height }, ref) => {
    return (
      <div ref={ref} className="bg-background flex items-center justify-center overflow-hidden" style={{ width, height }}>
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="flex items-center justify-center"
        />
      </div>
    );
  }
);
BookPage.displayName = "BookPage";

export function FlipbookViewer({ pdfUrl, title }: FlipbookViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<any>(null);

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const maxH = rect.height - 60; // leave room for controls
      const maxW = rect.width;
      // Each page is roughly A4 ratio (1:1.414)
      const pageRatio = 1.414;
      let pageW = Math.min(maxW / 2, 400);
      let pageH = pageW * pageRatio;
      if (pageH > maxH) {
        pageH = maxH;
        pageW = pageH / pageRatio;
      }
      setContainerSize({ width: Math.floor(pageW), height: Math.floor(pageH) });
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    updateSize();
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  if (containerSize.width === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-body">טוען...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground font-body">טוען מסמך...</div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive font-body">שגיאה בטעינת המסמך</p>
          </div>
        }
      >
        {numPages > 0 && containerSize.width > 0 && (
          <>
            <div className="flex-1 flex items-center justify-center" dir="rtl">
              {/* @ts-ignore - react-pageflip types */}
              <HTMLFlipBook
                ref={flipBookRef}
                width={containerSize.width}
                height={containerSize.height}
                size="fixed"
                minWidth={200}
                maxWidth={600}
                minHeight={280}
                maxHeight={850}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={onFlip}
                className="shadow-2xl"
                style={{ direction: "rtl" }}
                startPage={0}
                drawShadow={true}
                flippingTime={600}
                usePortrait={containerSize.width < 300}
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
                    pageNumber={i + 1}
                    width={containerSize.width}
                    height={containerSize.height}
                  />
                ))}
              </HTMLFlipBook>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 py-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                disabled={currentPage >= numPages - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="text-sm font-body text-muted-foreground min-w-[80px] text-center" dir="rtl">
                {currentPage + 1} / {numPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                disabled={currentPage <= 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </Document>
    </div>
  );
}
