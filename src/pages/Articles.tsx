import { useState } from "react";
import { Header } from "@/components/Header";
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Articles = () => {
  const { data: articles, isLoading } = useArticles();
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6" dir="rtl">
          מאמרים וספרים
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <div
                key={article.id}
                className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div dir="rtl">
                  <h3 className="font-display text-lg font-bold text-foreground">{article.title}</h3>
                  {article.description && (
                    <p className="text-sm text-muted-foreground font-body mt-1">{article.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-2">
                    {new Date(article.created_at).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {article.file_type === "pdf" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-body"
                      onClick={() => {
                        setViewingUrl(article.file_url);
                        setViewingTitle(article.title);
                      }}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      צפייה
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-body"
                    asChild
                  >
                    <a href={article.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 ml-1" />
                      הורדה
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body" dir="rtl">
              אין מאמרים עדיין
            </p>
          </div>
        )}
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewingUrl} onOpenChange={() => setViewingUrl(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display" dir="rtl">{viewingTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {viewingUrl && (
              <iframe
                src={viewingUrl}
                className="w-full h-full rounded-md border border-border"
                title={viewingTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Articles;
