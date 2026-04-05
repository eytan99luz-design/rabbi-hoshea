import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ArticleBookmark {
  id: string;
  user_id: string;
  article_id: string;
  page_number: number;
  label: string | null;
  created_at: string;
}

export function useArticleBookmarks(articleId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks } = useQuery({
    queryKey: ["article-bookmarks", articleId, user?.id],
    queryFn: async () => {
      if (!articleId || !user) return [];
      const { data, error } = await supabase
        .from("article_bookmarks")
        .select("*")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .order("page_number");
      if (error) throw error;
      return data as ArticleBookmark[];
    },
    enabled: !!articleId && !!user,
  });

  const addMutation = useMutation({
    mutationFn: async ({ articleId, pageNumber, label }: { articleId: string; pageNumber: number; label?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("article_bookmarks")
        .insert({ article_id: articleId, user_id: user.id, page_number: pageNumber, label: label || null });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["article-bookmarks"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase.from("article_bookmarks").delete().eq("id", bookmarkId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["article-bookmarks"] }),
  });

  return {
    bookmarks: bookmarks || [],
    addBookmark: addMutation.mutate,
    removeBookmark: removeMutation.mutate,
  };
}
