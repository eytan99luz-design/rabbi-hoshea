import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: videos, error } = await supabase
      .from("videos")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const siteUrl = "https://rabbi-hoshea.lovable.app";
    const now = new Date().toUTCString();

    const items = (videos || []).map((v: any) => `
    <item>
      <title>${escapeXml(v.title)}</title>
      <link>https://www.youtube.com/watch?v=${escapeXml(v.youtube_id)}</link>
      <guid isPermaLink="false">${escapeXml(v.youtube_id)}</guid>
      <pubDate>${v.published_at ? new Date(v.published_at).toUTCString() : now}</pubDate>
      <description>${escapeXml(v.title)}${v.masechet ? ` - מסכת ${escapeXml(v.masechet)}` : ''}${v.daf ? ` דף ${v.daf}` : ''}</description>
      ${v.thumbnail_url ? `<enclosure url="${escapeXml(v.thumbnail_url)}" type="image/jpeg" />` : ''}
    </item>`).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>שיעורי הרב הושע רבינוביץ׳</title>
    <link>${siteUrl}</link>
    <description>שיעורי גמרא מפי הרב הושע רבינוביץ׳</description>
    <language>he</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${supabaseUrl}/functions/v1/rss-feed" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
