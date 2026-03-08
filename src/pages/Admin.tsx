import { useState } from "react";
import { Header } from "@/components/Header";
import { useIsAdmin } from "@/hooks/useAuth";
import { useArticles, useUploadArticle, useDeleteArticle, Article } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { LogIn, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { SubscribersList } from "@/components/admin/SubscribersList";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Try signup if first time
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signupError) {
        toast({ title: "שגיאה", description: signupError.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl" dir="rtl">כניסת מנהל</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body" dir="rtl">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-foreground"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-body" dir="rtl">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-foreground"
                required
              />
            </div>
            <Button type="submit" className="w-full font-body" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 ml-2" />}
              כניסה
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ArticleUploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadArticle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ title, description, file });
      setTitle("");
      setDescription("");
      setFile(null);
      toast({ title: "המאמר הועלה בהצלחה" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg" dir="rtl">העלאת מאמר חדש</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body" dir="rtl">כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-foreground"
              dir="rtl"
              required
            />
          </div>
          <div>
            <Label className="font-body" dir="rtl">תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-foreground"
              dir="rtl"
            />
          </div>
          <div>
            <Label className="font-body" dir="rtl">קובץ (PDF)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-foreground"
            />
          </div>
          <Button type="submit" disabled={uploadMutation.isPending || !file} className="font-body">
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
            העלאה
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ArticlesList() {
  const { data: articles, isLoading } = useArticles();
  const deleteMutation = useDeleteArticle();

  const handleDelete = async (article: Article) => {
    try {
      await deleteMutation.mutateAsync(article);
      toast({ title: "המאמר נמחק" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg" dir="rtl">מאמרים קיימים</CardTitle>
      </CardHeader>
      <CardContent>
        {!articles || articles.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm" dir="rtl">אין מאמרים</p>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3" dir="rtl">
                  <FileText className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="font-body font-medium text-foreground text-sm">{article.title}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {new Date(article.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(article)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Admin = () => {
  const { user, isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2" dir="rtl">אין הרשאה</h2>
          <p className="text-muted-foreground font-body" dir="rtl">אין לך הרשאת מנהל לדף זה</p>
          <Button
            variant="outline"
            className="mt-4 font-body"
            onClick={() => supabase.auth.signOut()}
          >
            התנתק
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground" dir="rtl">ניהול</h1>
          <Button variant="ghost" size="sm" className="font-body" onClick={() => supabase.auth.signOut()}>
            התנתק
          </Button>
        </div>
        <div className="space-y-6">
          <ArticleUploadForm />
          <ArticlesList />
        </div>
      </div>
    </div>
  );
};

export default Admin;
