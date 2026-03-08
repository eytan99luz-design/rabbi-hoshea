import { useQuery } from "@tanstack/react-query";
import { numberToHebrewDaf } from "@/lib/masechet-list";

function buildWikisourceUrl(masechet: string, daf: number, amud: "א" | "ב"): string {
  const hebrewDaf = numberToHebrewDaf(daf);
  const page = `תלמוד_בבלי/מסכת_${masechet}/דף_${hebrewDaf}/${amud}`;
  return `https://he.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&origin=*`;
}

async function fetchWikisourcePage(masechet: string, daf: number, amud: "א" | "ב"): Promise<string | null> {
  const url = buildWikisourceUrl(masechet, daf, amud);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  return data.parse?.text?.["*"] ?? null;
}

export function useWikisourceText(masechet: string | null, daf: number | null) {
  return useQuery({
    queryKey: ["wikisource", masechet, daf],
    queryFn: async () => {
      if (!masechet || !daf) return null;
      const [amudA, amudB] = await Promise.all([
        fetchWikisourcePage(masechet, daf, "א"),
        fetchWikisourcePage(masechet, daf, "ב"),
      ]);
      return { amudA, amudB };
    },
    enabled: !!masechet && !!daf,
    staleTime: 1000 * 60 * 60, // cache for 1 hour
  });
}
