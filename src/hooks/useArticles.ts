import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useUploadArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, file }: { title: string; description: string; file: File }) => {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("articles")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("articles")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("articles")
        .insert({ title, description, file_url: publicUrl, file_type: ext });
      if (insertError) throw insertError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Article) => {
      // Extract path from URL
      const url = new URL(article.file_url);
      const parts = url.pathname.split("/articles/");
      if (parts[1]) {
        await supabase.storage.from("articles").remove([parts[1]]);
      }
      const { error } = await supabase.from("articles").delete().eq("id", article.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });
}
