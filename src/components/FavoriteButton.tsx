import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  videoId: string;
  size?: "sm" | "default";
}

export function FavoriteButton({ videoId, size = "default" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  if (!user) return null;

  const isFavorited = favoriteIds?.has(videoId) ?? false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(
      { videoId, isFavorited },
      {
        onSuccess: () => {
          toast({
            title: isFavorited ? "הוסר מהמועדפים" : "נוסף למועדפים ❤️",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      onClick={handleToggle}
      className={`${size === "sm" ? "h-8 w-8" : ""} ${isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
      disabled={toggleFavorite.isPending}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      {size !== "sm" && <span className="mr-1 font-body text-sm">{isFavorited ? "במועדפים" : "הוסף למועדפים"}</span>}
    </Button>
  );
}
