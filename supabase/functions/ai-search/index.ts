import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all unique masechet names for context
    const { data: masechtot } = await supabase
      .from("videos")
      .select("masechet")
      .not("masechet", "is", null);

    const uniqueMasechtot = [...new Set((masechtot || []).map((v: any) => v.masechet))];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      // Fallback to simple text search
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .ilike("title", `%${query}%`)
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ results: data, interpretation: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Lovable AI Gateway to understand the query
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a search assistant for a Talmud (Gemara) study website with video lessons by Rabbi Hoshea Rabinovitch.
Given a user search query in Hebrew, extract structured search parameters.
Available tractates (masechtot): ${uniqueMasechtot.join(', ')}

Respond ONLY with valid JSON, no markdown:
{"masechet": "exact tractate name or null", "daf": number or null, "keywords": ["search terms for title"], "interpretation": "brief Hebrew description of what the user wants"}`
          },
          { role: "user", content: query }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_videos",
              description: "Search for video lessons based on parsed query parameters",
              parameters: {
                type: "object",
                properties: {
                  masechet: { type: "string", description: "Tractate name in Hebrew, must match available list exactly", nullable: true },
                  daf: { type: "number", description: "Page number (daf)", nullable: true },
                  keywords: { type: "array", items: { type: "string" }, description: "Keywords to search in title" },
                  interpretation: { type: "string", description: "Brief Hebrew description of what the user is looking for" }
                },
                required: ["keywords", "interpretation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "search_videos" } },
      }),
    });

    let searchMasechet: string | null = null;
    let searchDaf: number | null = null;
    let keywords: string[] = [query];
    let interpretation: string | null = null;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          searchMasechet = parsed.masechet || null;
          searchDaf = parsed.daf || null;
          keywords = parsed.keywords?.length > 0 ? parsed.keywords : [query];
          interpretation = parsed.interpretation || null;
        }
      } catch {
        // Fallback: try parsing content directly
        const content = aiData.choices?.[0]?.message?.content || "";
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            searchMasechet = parsed.masechet || null;
            searchDaf = parsed.daf || null;
            keywords = parsed.keywords?.length > 0 ? parsed.keywords : [query];
            interpretation = parsed.interpretation || null;
          }
        } catch { /* use defaults */ }
      }
    } else {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback to simple search on AI error
      console.error("AI gateway error:", status, await aiResponse.text());
    }

    // Build the search query
    let dbQuery = supabase
      .from("videos")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    if (searchMasechet) {
      dbQuery = dbQuery.eq("masechet", searchMasechet);
    }
    if (searchDaf) {
      dbQuery = dbQuery.eq("daf", searchDaf);
    }

    // If no masechet/daf found, search by title keywords
    if (!searchMasechet && !searchDaf && keywords.length > 0) {
      const searchTerm = keywords.join(" ");
      dbQuery = dbQuery.ilike("title", `%${searchTerm}%`);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return new Response(JSON.stringify({ results: data, interpretation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
