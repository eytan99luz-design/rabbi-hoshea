import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractTextFromTimedText(xml: string): string | null {
  const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gs);
  if (!textMatches || textMatches.length === 0) return null;

  const texts = textMatches.map(match => {
    const content = match.replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
    return content
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, ' ').trim();
  });

  return texts.filter(t => t.length > 0).join(' ');
}

async function fetchYouTubeCaptions(youtubeId: string, apiKey: string): Promise<string | null> {
  try {
    const listUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${youtubeId}&key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listData.items || listData.items.length === 0) return null;

    const hebrewAuto = listData.items.find((c: any) => c.snippet.language === 'iw' && c.snippet.trackKind === 'ASR');
    const hebrew = listData.items.find((c: any) => c.snippet.language === 'iw' || c.snippet.language === 'he');
    const captionTrack = hebrewAuto || hebrew || listData.items[0];
    if (!captionTrack) return null;

    const lang = captionTrack.snippet.language;

    // Try both regular and auto-generated captions
    for (const kind of ['', 'asr']) {
      const url = `https://www.youtube.com/api/timedtext?v=${youtubeId}&lang=${lang}${kind ? `&kind=${kind}` : ''}&fmt=srv3`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const extracted = extractTextFromTimedText(text);
        if (extracted && extracted.length > 50) return extracted;
      }
    }
    return null;
  } catch (e) {
    console.error("Error fetching captions for", youtubeId, e);
    return null;
  }
}

async function callAI(prompt: string, systemPrompt: string, apiKey: string, maxRetries = 2): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
        }),
      });

      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = (attempt + 1) * 3000; // 3s, 6s
          console.log(`Rate limited, waiting ${waitTime/1000}s (retry ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        console.error("Rate limited, all retries exhausted");
        return null;
      }

      if (response.status === 402) {
        console.error("Payment required for AI gateway");
        return null;
      }

      if (!response.ok) {
        console.error("AI gateway error:", response.status);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
      console.error("AI call error:", e);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  return null;
}

const SYSTEM_PROMPT = `אתה עוזר ליצור סיכומים קצרים של שיעורי גמרא בעברית.
צור סיכום קצר (2-3 משפטים, עד 200 תווים) שמתאר את עיקרי השיעור.
הסיכום צריך להיות ברור, תמציתי, ובעברית.
אל תכלול את שם הרב או את מספר הדף בסיכום - רק את תוכן הלימוד.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!YOUTUBE_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API keys" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let limit = 3;
    let videoId: string | null = null;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 5);
      if (body.video_id) videoId = body.video_id;
    } catch { /* no body */ }

    let query = supabase
      .from("videos")
      .select("id, youtube_id, title")
      .is("summary", null)
      .order("published_at", { ascending: false });

    if (videoId) {
      query = query.eq("id", videoId);
    } else {
      query = query.limit(limit);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No videos need summaries" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let skipped = 0;

    for (const video of videos) {
      const captions = await fetchYouTubeCaptions(video.youtube_id, YOUTUBE_API_KEY);

      const promptText = captions && captions.length > 50
        ? `כותרת השיעור: ${video.title}\n\nתמלול השיעור:\n${captions.substring(0, 4000)}\n\nכתוב סיכום קצר של 2-3 משפטים:`
        : `כותרת השיעור: ${video.title}\n\nאין תמלול זמין. כתוב סיכום קצר בהתבסס על הכותרת בלבד:`;

      const summary = await callAI(promptText, SYSTEM_PROMPT, LOVABLE_API_KEY);

      if (summary) {
        const { error: updateError } = await supabase
          .from("videos")
          .update({ summary })
          .eq("id", video.id);

        if (!updateError) processed++;
        else console.error("Update error:", video.id, updateError);
      } else {
        skipped++;
      }

      // Wait between videos to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return new Response(JSON.stringify({ processed, skipped, total: videos.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-summaries error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
