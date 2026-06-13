import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractLinkedInURN(url: string): string | null {
  const match = url.match(/urn:li:(share|ugcPost|activity):(\d+)/);
  return match ? `urn:li:${match[1]}:${match[2]}` : null;
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function fetchLinkedInMetrics(
  postUrn: string,
  orgId: string,
  accessToken: string
): Promise<Record<string, number>> {
  let shareUrn = postUrn;

  // If URN is an activity, resolve to underlying post
  if (postUrn.includes('activity')) {
    const postRes = await fetch(
      `https://api.linkedin.com/rest/posts/${encodeURIComponent(postUrn)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Linkedin-Version': '202602',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (postRes.ok) {
      const postData = await postRes.json();
      shareUrn = postData.id || postUrn;
    }
  }

  const isUgc = shareUrn.includes('ugcPost');
  const param = isUgc ? 'ugcPosts' : 'shares';
  const url = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${orgId}&${param}=List(${encodeURIComponent(shareUrn)})`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Linkedin-Version': '202602',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LinkedIn API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const stats = data.elements?.[0]?.totalShareStatistics;
  if (!stats) return {};

  return {
    impressions: stats.impressionCount || 0,
    reach: stats.uniqueImpressionsCount || 0,
    engagement: (stats.likeCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0),
    clicks: stats.clickCount || 0,
    shares: stats.shareCount || 0,
    comments_count: stats.commentCount || 0,
  };
}

async function fetchInstagramMetrics(
  shortcode: string,
  igUserId: string,
  accessToken: string
): Promise<Record<string, number>> {
  // Find media ID from shortcode
  const mediaListRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,shortcode&limit=100&access_token=${accessToken}`
  );
  const mediaList = await mediaListRes.json();
  const media = mediaList.data?.find((m: { shortcode: string }) => m.shortcode === shortcode);

  if (!media) {
    throw new Error(`Media Instagram introuvable pour le shortcode: ${shortcode}`);
  }

  // Fetch insights
  const insightsRes = await fetch(
    `https://graph.facebook.com/v19.0/${media.id}/insights?metric=impressions,reach,saved,shares,total_interactions&access_token=${accessToken}`
  );
  const insightsData = await insightsRes.json();

  if (insightsData.error) {
    throw new Error(insightsData.error.message);
  }

  const metrics: Record<string, number> = {};
  for (const item of insightsData.data || []) {
    const value = item.values?.[0]?.value || 0;
    switch (item.name) {
      case 'impressions': metrics.impressions = value; break;
      case 'reach': metrics.reach = value; break;
      case 'saved': metrics.saves = value; break;
      case 'shares': metrics.shares = value; break;
      case 'total_interactions': metrics.engagement = value; break;
    }
  }

  // Get comments + likes from media fields
  const mediaRes = await fetch(
    `https://graph.facebook.com/v19.0/${media.id}?fields=like_count,comments_count&access_token=${accessToken}`
  );
  const mediaData = await mediaRes.json();
  metrics.comments_count = mediaData.comments_count || 0;

  return metrics;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get active social connections
    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('sync_status', 'active');

    if (!connections?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucune connexion active', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token expiration and update status
    const now = new Date();
    for (const conn of connections) {
      if (new Date(conn.token_expires_at) <= now) {
        await supabase.from('social_connections')
          .update({ sync_status: 'expired', updated_at: now.toISOString() })
          .eq('id', conn.id);
      }
    }

    const activeConnections = connections.filter(c => new Date(c.token_expires_at) > now);

    // Get all published posts with external_url
    const { data: posts } = await supabase
      .from('posts')
      .select('id, platform, external_url, external_id')
      .eq('status', 'published')
      .not('external_url', 'is', null);

    if (!posts?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucun post avec URL externe', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const linkedinConn = activeConnections.find(c => c.platform === 'linkedin');
    const instagramConn = activeConnections.find(c => c.platform === 'instagram');

    let synced = 0;
    const errors: string[] = [];

    for (const post of posts) {
      try {
        let metrics: Record<string, number> = {};
        let source = 'manual';

        if (post.platform === 'linkedin' && linkedinConn) {
          const urn = extractLinkedInURN(post.external_url);
          if (!urn) continue;
          metrics = await fetchLinkedInMetrics(urn, linkedinConn.account_id, linkedinConn.access_token);
          source = 'linkedin_api';
        } else if (post.platform === 'instagram' && instagramConn) {
          const shortcode = extractInstagramShortcode(post.external_url);
          if (!shortcode) continue;
          metrics = await fetchInstagramMetrics(shortcode, instagramConn.account_id, instagramConn.access_token);
          source = 'meta_api';
        } else {
          continue;
        }

        // Upsert post_metrics
        await supabase.from('post_metrics').upsert(
          {
            post_id: post.id,
            impressions: metrics.impressions || 0,
            reach: metrics.reach || 0,
            engagement: metrics.engagement || 0,
            clicks: metrics.clicks || 0,
            shares: metrics.shares || 0,
            comments_count: metrics.comments_count || 0,
            saves: metrics.saves || 0,
            source,
            measured_at: new Date().toISOString(),
          },
          { onConflict: 'post_id' }
        );

        synced++;
      } catch (err) {
        errors.push(`Post ${post.id}: ${(err as Error).message}`);
      }
    }

    // Update last_sync_at on connections
    const syncTime = new Date().toISOString();
    if (linkedinConn) {
      await supabase.from('social_connections').update({ last_sync_at: syncTime }).eq('id', linkedinConn.id);
    }
    if (instagramConn) {
      await supabase.from('social_connections').update({ last_sync_at: syncTime }).eq('id', instagramConn.id);
    }

    // Refresh materialized views
    await supabase.rpc('refresh_kpi_views');

    return new Response(
      JSON.stringify({ success: true, synced, errors: errors.length ? errors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
