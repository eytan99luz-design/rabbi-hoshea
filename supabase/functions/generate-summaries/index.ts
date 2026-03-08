import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchYouTubeCaptions(youtubeId: string, apiKey: string): Promise<string | null> {
  try {
    // Get caption tracks list
    const listUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${youtubeId}&key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listData.items || listData.items.length === 0) return null;

    // Prefer Hebrew auto-generated captions, then any Hebrew, then any
    const hebrewAuto = listData.items.find((c: any) => c.snippet.language === 'iw' && c.snippet.trackKind === 'ASR');
    const hebrew = listData.items.find((c: any) => c.snippet.language === 'iw' || c.snippet.language === 'he');
    const captionTrack = hebrewAuto || hebrew || listData.items[0];

    if (!captionTrack) return null;

    // YouTube Data API v3 captions.download requires OAuth, so use the timedtext endpoint instead
    const lang = captionTrack.snippet.language;
    const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${youtubeId}&lang=${lang}&fmt=srv3`;
    const ttRes = await fetch(timedTextUrl);
    
    if (!ttRes.ok) {
      // Try alternative approach with auto-generated
      const autoUrl = `https://www.youtube.com/api/timedtext?v=${youtubeId}&lang=${lang}&kind=asr&fmt=srv3`;
      const autoRes = await fetch(autoUrl);
      if (!autoRes.ok) return null;
      const autoText = await autoRes.text();
      return extractTextFromTimedText(autoText);
    }

    const ttText = await ttRes.text();
    return extractTextFromTimedText(ttText);
  } catch (e) {
    console.error("Error fetching captions for", youtubeId, e);
    return null;
  }
}

function extractTextFromTimedText(xml: string): string | null {
  // Extract text content from YouTube timedtext XML format
  const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gs);
  if (!textMatches || textMatches.length === 0) return null;

  const texts = textMatches.map(match => {
    const content = match.replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
    return content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
  });

  return texts.filter(t => t.length > 0).join(' ');
}

async function generateSummary(captionText: string, title: string, lovableApiKey: string): Promise<string | null> {
  try {
    // Truncate captions to avoid token limits (keep first ~4000 chars)
    const truncated = captionText.length > 4000 ? captionText.substring(0, 4000) + "..." : captionText;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `אתה עוזר ליצור סיכומים קצרים של שיעורי גמרא בעברית.
צור סיכום קצר (2-3 משפטים, עד 200 תווים) שמתאר את עיקרי השיעור.
הסיכום צריך להיות ברור, תמציתי, ובעברית.
אל תכלול את שם הרב או את מספר הדף בסיכום - רק את תוכן הלימוד.`
          },
          {
            role: "user",
            content: `כותרת השיעור: ${title}\n\nתמלול השיעור:\n${truncated}\n\nכתוב סיכום קצר של 2-3 משפטים:`
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by AI gateway");
        return null;
      }
      if (response.status === 402) {
        console.error("Payment required for AI gateway");
        return null;
      }
      console.error("AI gateway error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("Error generating summary:", e);
    return null;
  }
}

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

    // Parse request body for optional parameters
    let limit = 5;
    let videoId: string | null = null;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 10);
      if (body.video_id) videoId = body.video_id;
    } catch { /* no body, use defaults */ }

    // Get videos that need summaries
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
      // Fetch captions
      const captions = await fetchYouTubeCaptions(video.youtube_id, YOUTUBE_API_KEY);

      let summary: string | null = null;

      if (captions && captions.length > 50) {
        // Generate AI summary from captions
        summary = await generateSummary(captions, video.title, LOVABLE_API_KEY);
      }

      if (!summary) {
        // Fallback: generate a basic summary from the title using AI
        summary = await generateSummary(
          `שיעור בנושא: ${video.title}`,
          video.title,
          LOVABLE_API_KEY
        );
      }

      if (summary) {
        const { error: updateError } = await supabase
          .from("videos")
          .update({ summary })
          .eq("id", video.id);

        if (!updateError) {
          processed++;
        } else {
          console.error("Error updating video:", video.id, updateError);
        }
      } else {
        skipped++;
      }

      // Delay to avoid AI gateway rate limits
      await new Promise(resolve => setTimeout(resolve, 4000));
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
