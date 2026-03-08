import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    const uniqueMasechtot = [...new Set((masechtot || []).map(v => v.masechet))];

    // Use Lovable AI to understand the query
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

    const aiResponse = await fetch("https://api.lovable.dev/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a search assistant for a Talmud study website. Given a user search query in Hebrew, extract:
1. masechet (tractate name) if mentioned - must match one of: ${uniqueMasechtot.join(', ')}
2. daf (page number) if mentioned
3. keywords for title search
4. A brief interpretation of what the user is looking for (in Hebrew)

Respond ONLY with valid JSON: {"masechet": "string or null", "daf": number or null, "keywords": ["array"], "interpretation": "string"}`
          },
          { role: "user", content: query }
        ],
        max_tokens: 200,
      }),
    });

    let searchMasechet: string | null = null;
    let searchDaf: number | null = null;
    let keywords: string[] = [query];
    let interpretation: string | null = null;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          searchMasechet = parsed.masechet;
          searchDaf = parsed.daf;
          keywords = parsed.keywords || [query];
          interpretation = parsed.interpretation;
        }
      } catch { /* use defaults */ }
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
