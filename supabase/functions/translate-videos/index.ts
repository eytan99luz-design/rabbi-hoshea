import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get videos without English translation
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, title, summary")
      .is("title_en", null)
      .limit(10);

    if (error) throw error;
    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ message: "No videos to translate", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let translated = 0;

    for (const video of videos) {
      const prompt = `Translate the following Hebrew text to English. Return ONLY valid JSON with "title" and "summary" keys. If summary is null, set summary to null.

Title: ${video.title}
Summary: ${video.summary || "null"}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a translator. Translate Hebrew Torah/Talmud lesson titles and summaries to natural English. Keep Jewish terminology (like masechet names, daf numbers) transliterated. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "set_translation",
              description: "Set the English translation",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "English title" },
                  summary: { type: ["string", "null"], description: "English summary or null" },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "set_translation" } },
        }),
      });

      if (!response.ok) {
        console.error(`AI error for video ${video.id}:`, response.status);
        if (response.status === 429) {
          // Rate limited - stop and return what we have
          break;
        }
        continue;
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const { error: updateError } = await supabase
            .from("videos")
            .update({
              title_en: args.title,
              summary_en: args.summary || null,
            })
            .eq("id", video.id);

          if (!updateError) translated++;
        } catch (parseErr) {
          console.error(`Parse error for video ${video.id}:`, parseErr);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(JSON.stringify({ message: `Translated ${translated} videos`, count: translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
