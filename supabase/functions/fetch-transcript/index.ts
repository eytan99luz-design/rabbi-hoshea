import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

async function fetchTranscript(youtubeId: string): Promise<string | null> {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${youtubeId}&hl=iw`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "he,en;q=0.9",
    },
  });
  if (!watchRes.ok) return null;
  const html = await watchRes.text();

  const m = html.match(/"captionTracks":(\[.*?\])/);
  if (!m) return null;
  let tracks: Array<{ baseUrl: string; languageCode?: string; kind?: string; vssId?: string }>;
  try {
    tracks = JSON.parse(m[1].replace(/\\u0026/g, "&"));
  } catch {
    return null;
  }
  if (!tracks.length) return null;

  // Prefer Hebrew (manual), then Hebrew (asr/auto), then anything
  const pick =
    tracks.find((t) => (t.languageCode === "iw" || t.languageCode === "he") && !t.kind) ||
    tracks.find((t) => t.languageCode === "iw" || t.languageCode === "he") ||
    tracks[0];

  const url = pick.baseUrl;
  const xmlRes = await fetch(url);
  if (!xmlRes.ok) return null;
  const xml = await xmlRes.text();

  const parts: string[] = [];
  const re = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let mm;
  while ((mm = re.exec(xml))) {
    const txt = decodeHtml(mm[1].replace(/<[^>]+>/g, "")).trim();
    if (txt) parts.push(txt);
  }
  const transcript = parts.join(" ").replace(/\s+/g, " ").trim();
  return transcript || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const youtubeId: string | undefined = body.youtube_id;
    const batch: boolean = !!body.batch;
    const limit: number = Math.min(body.limit ?? 25, 50);

    if (youtubeId) {
      const transcript = await fetchTranscript(youtubeId);
      if (!transcript) {
        await supabase
          .from("videos")
          .update({ transcript_fetched_at: new Date().toISOString() })
          .eq("youtube_id", youtubeId);
        return new Response(JSON.stringify({ success: false, transcript: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("videos")
        .update({ transcript, transcript_fetched_at: new Date().toISOString() })
        .eq("youtube_id", youtubeId);
      return new Response(JSON.stringify({ success: true, transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (batch) {
      const { data: videos } = await supabase
        .from("videos")
        .select("youtube_id")
        .is("transcript", null)
        .is("transcript_fetched_at", null)
        .limit(limit);

      let ok = 0;
      let fail = 0;
      for (const v of videos || []) {
        try {
          const t = await fetchTranscript(v.youtube_id);
          await supabase
            .from("videos")
            .update({ transcript: t, transcript_fetched_at: new Date().toISOString() })
            .eq("youtube_id", v.youtube_id);
          if (t) ok++;
          else fail++;
        } catch {
          fail++;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      return new Response(
        JSON.stringify({ success: true, processed: (videos || []).length, withTranscript: ok, withoutTranscript: fail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Missing youtube_id or batch flag" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});