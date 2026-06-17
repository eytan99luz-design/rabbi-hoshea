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

function extractJsonArrayAfter(html: string, key: string): unknown[] | null {
  const keyIndex = html.indexOf(`"${key}":[`);
  if (keyIndex < 0) return null;

  const start = html.indexOf("[", keyIndex);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  return null;
}

async function fetchTranscript(youtubeId: string): Promise<string | null> {
  let tracks: Array<{ baseUrl: string; languageCode?: string; kind?: string; vssId?: string }> | null = null;

  const clients = [
    {
      clientName: "ANDROID",
      clientVersion: "19.09.37",
      userAgent: "com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip",
    },
    {
      clientName: "WEB",
      clientVersion: "2.20240101.00.00",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  ];

  for (const c of clients) {
    try {
      const res = await fetch(
        "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": c.userAgent,
            "Accept-Language": "he,en;q=0.9",
          },
          body: JSON.stringify({
            videoId: youtubeId,
            context: {
              client: {
                clientName: c.clientName,
                clientVersion: c.clientVersion,
                hl: "iw",
                gl: "IL",
              },
            },
          }),
        },
      );
      if (!res.ok) continue;
      const json = await res.json();
      const t = json?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(t) && t.length) {
        tracks = t;
        break;
      }
    } catch {
      // try next client
    }
  }

  // Fallback: some videos return UNPLAYABLE/FAILED_PRECONDITION from InnerTube
  // while the normal watch page still includes auto-generated Hebrew captions.
  if (!tracks || !tracks.length) {
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${youtubeId}&hl=he&persist_hl=1`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "he,en;q=0.9",
        },
      });
      const html = await watchRes.text();
      const parsedTracks = extractJsonArrayAfter(html, "captionTracks");
      if (Array.isArray(parsedTracks) && parsedTracks.length) {
        tracks = parsedTracks as Array<{ baseUrl: string; languageCode?: string; kind?: string; vssId?: string }>;
      } else {
        console.log(`no captionTracks in watch html for ${youtubeId}; status=${watchRes.status}; len=${html.length}`);
      }
    } catch (error) {
      console.warn(`watch fallback failed for ${youtubeId}:`, error);
    }
  }

  if (!tracks || !tracks.length) return null;

  // Prefer Hebrew (manual), then Hebrew (asr/auto), then anything
  const pick =
    tracks.find((t) => (t.languageCode === "iw" || t.languageCode === "he") && !t.kind) ||
    tracks.find((t) => t.languageCode === "iw" || t.languageCode === "he") ||
    tracks[0];

  // Force XML format (fmt is sometimes srv3/json3 by default).
  let url = pick.baseUrl;
  if (!/[?&]fmt=/.test(url)) url += `${url.includes("?") ? "&" : "?"}fmt=srv1`;
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