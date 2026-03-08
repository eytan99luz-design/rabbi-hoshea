import { useMasechetFollows } from "@/hooks/useMasechetFollows";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  masechet: string;
}

export function FollowMasechetButton({ masechet }: Props) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useMasechetFollows();

  if (!user) return null;

  const following = isFollowing(masechet);

  const handleClick = async () => {
    try {
      await toggleFollow.mutateAsync(masechet);
      toast({
        title: following ? "הפסקת מעקב" : "עוקב אחרי מסכת " + masechet,
      });
    } catch {
      toast({ title: "שגיאה", variant: "destructive" });
    }
  };

  return (
    <Button
      variant={following ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className="font-body gap-1"
    >
      {toggleFollow.isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : following ? (
        <Bell className="h-3 w-3" />
      ) : (
        <BellOff className="h-3 w-3" />
      )}
      {following ? "עוקב" : "עקוב"}
    </Button>
  );
}
