import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHANNEL_ID = "UC6JUZduip3HRgYDTacpqiQg";

const MASECHET_LIST = [
  "ברכות","שבת","עירובין","פסחים","שקלים","יומא","סוכה","ביצה",
  "ראש השנה","תענית","מגילה","מועד קטן","חגיגה","יבמות","כתובות",
  "נדרים","נזיר","סוטה","גיטין","קידושין","בבא קמא","בבא מציעא",
  "בבא בתרא","סנהדרין","מכות","שבועות","עבודה זרה","הוריות",
  "זבחים","מנחות","חולין","בכורות","ערכין","תמורה","כריתות","מעילה","תמיד","נידה",
];

function hebrewToNumber(str: string): number | null {
  const values: Record<string, number> = {
    'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,
    'י':10,'כ':20,'ל':30,'מ':40,'נ':50,'ס':60,'ע':70,'פ':80,'צ':90,
    'ק':100,'ר':200,'ש':300,'ת':400,
  };
  let total = 0;
  for (const ch of str) {
    if (values[ch]) total += values[ch];
    else return null;
  }
  return total > 0 ? total : null;
}

function parseTitleForMasechetDaf(title: string): { masechet: string | null; daf: number | null } {
  for (const m of MASECHET_LIST) {
    // Match patterns like: מנחות דף כב, מנחות מדף כב, מנחות כב
    const regex = new RegExp(`${m}\\s+(?:מ?דף\\s+)?([\\p{N}]+|[א-ת]{1,3})(?:\\s|$|\\.)`, 'u');
    const match = title.match(regex);
    if (match) {
      const dafStr = match[1];
      // Skip common Hebrew words that aren't daf numbers
      if (['עמ', 'של', 'על', 'את', 'לא'].includes(dafStr)) continue;
      const num = parseInt(dafStr, 10);
      if (!isNaN(num)) return { masechet: m, daf: num };
      const gematria = hebrewToNumber(dafStr);
      if (gematria) return { masechet: m, daf: gematria };
    }
  }
  return { masechet: null, daf: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing YouTube API key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get uploads playlist for the channel
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ error: "Could not find uploads playlist" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pageToken: string | undefined;
    let totalInserted = 0;
    let totalUpdated = 0;

    do {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("playlistId", uploadsPlaylistId);
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("key", YOUTUBE_API_KEY);
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!data.items) break;

      for (const item of data.items) {
        const snippet = item.snippet;
        const youtubeId = snippet.resourceId.videoId;
        const title = snippet.title;
        const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
        const publishedAt = snippet.publishedAt;

        const { masechet, daf } = parseTitleForMasechetDaf(title);

        const { error } = await supabase.from("videos").upsert(
          {
            youtube_id: youtubeId,
            title,
            masechet,
            daf,
            thumbnail_url: thumbnailUrl,
            published_at: publishedAt,
          },
          { onConflict: "youtube_id" }
        );

        if (!error) {
          totalInserted++;
        }
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return new Response(
      JSON.stringify({ success: true, totalProcessed: totalInserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
