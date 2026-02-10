import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getMasechetEnglish } from "@/lib/masechet-list";
import { BookOpen } from "lucide-react";

interface MasechetFilterProps {
  masechtot: Record<string, number>;
  selected: string | null;
  onSelect: (masechet: string | null) => void;
}

export function MasechetFilter({ masechtot, selected, onSelect }: MasechetFilterProps) {
  const sorted = Object.entries(masechtot).sort((a, b) => a[0].localeCompare(b[0], 'he'));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          מסכתות
        </h3>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          <button
            onClick={() => onSelect(null)}
            className={cn(
              "w-full text-right px-3 py-2 rounded-md text-sm font-body transition-colors",
              !selected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            )}
            dir="rtl"
          >
            הכל
          </button>
          {sorted.map(([masechet, count]) => (
            <button
              key={masechet}
              onClick={() => onSelect(masechet)}
              className={cn(
                "w-full text-right px-3 py-2 rounded-md text-sm font-body transition-colors flex items-center justify-between",
                selected === masechet ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
              )}
              dir="rtl"
            >
              <span>{masechet}</span>
              <span className={cn(
                "text-xs",
                selected === masechet ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
