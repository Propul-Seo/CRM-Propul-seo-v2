# Social Metrics Sync — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically fetch LinkedIn & Instagram post metrics via OAuth APIs, eliminating manual entry in MetricsSection.

**Architecture:** OAuth connections stored in `social_connections` table. Posts linked via `external_url` field. Edge Function `sync-social-metrics` fetches metrics from LinkedIn Marketing API + Instagram Graph API, upserts into `post_metrics`. Triggered daily via pg_cron + manually via UI button.

**Tech Stack:** Supabase Edge Functions (Deno), LinkedIn Marketing API (REST), Instagram Graph API (Meta), pg_cron + pg_net, React frontend.

---

## Task 1: Database Migration — `social_connections` table + `posts` columns

**Files:**
- Create: `supabase/migrations/20260314_social_connections.sql`

**Step 1: Apply migration via Supabase MCP**

```sql
-- Table for storing OAuth tokens
CREATE TABLE social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  account_type text NOT NULL CHECK (account_type IN ('company', 'creator')),
  account_name text NOT NULL,
  account_id text, -- LinkedIn org ID or Instagram user ID
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz NOT NULL,
  connected_by uuid REFERENCES users(id),
  last_sync_at timestamptz,
  sync_status text NOT NULL DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage social connections" ON social_connections FOR ALL USING (true) WITH CHECK (true);

-- Add external_url and external_id to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS external_id text;

-- Index for fast lookup during sync
CREATE INDEX idx_posts_external_id ON posts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
```

**Step 2: Verify migration applied**

Run SQL: `SELECT column_name FROM information_schema.columns WHERE table_name = 'social_connections';`
Run SQL: `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('external_url', 'external_id');`

**Step 3: Commit**
```bash
git add supabase/migrations/20260314_social_connections.sql
git commit -m "feat: add social_connections table and external_url to posts"
```

---

## Task 2: TypeScript Types Update

**Files:**
- Modify: `src/types/supabase-types.ts`
- Modify: `src/modules/Communication/types.ts`

**Step 1: Add SocialConnection type and update PostRow**

In `src/types/supabase-types.ts`, add after PostMetricsUpdate interface (~line 297):

```typescript
// ============================================
// Social Connections (OAuth tokens)
// ============================================
export interface SocialConnectionRow {
  id: string;
  platform: 'linkedin' | 'instagram';
  account_type: 'company' | 'creator';
  account_name: string;
  account_id: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  connected_by: string | null;
  last_sync_at: string | null;
  sync_status: 'active' | 'error' | 'expired';
  created_at: string;
  updated_at: string;
}
```

Add to PostRow interface (~line 178):
```typescript
external_url: string | null;
external_id: string | null;
```

Add to PostInsert and PostUpdate interfaces:
```typescript
external_url?: string | null;
external_id?: string | null;
```

**Step 2: Update Communication types**

In `src/modules/Communication/types.ts`, add to PostFormData:
```typescript
external_url: string;
```

**Step 3: Commit**
```bash
git add src/types/supabase-types.ts src/modules/Communication/types.ts
git commit -m "feat: add SocialConnection type and external_url to post types"
```

---

## Task 3: Edge Function — `linkedin-oauth`

**Files:**
- Create: `supabase/functions/linkedin-oauth/index.ts`

**Step 1: Create the edge function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Step 1: Initiate OAuth — returns URL to redirect user to
  if (action === 'authorize') {
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', Deno.env.get('LINKEDIN_CLIENT_ID')!);
    authUrl.searchParams.set('redirect_uri', Deno.env.get('LINKEDIN_REDIRECT_URI')!);
    authUrl.searchParams.set('scope', 'rw_organization_admin');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return new Response(
      JSON.stringify({ success: true, data: { url: authUrl.toString() } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Step 2: Handle callback — exchange code for token
  if (action === 'callback') {
    try {
      const { code } = await req.json();
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for access token
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: Deno.env.get('LINKEDIN_CLIENT_ID')!,
          client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET')!,
          redirect_uri: Deno.env.get('LINKEDIN_REDIRECT_URI')!,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return new Response(
          JSON.stringify({ success: false, error: tokenData.error_description || 'Token exchange failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get organization info
      const orgRes = await fetch(
        'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName)))',
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Linkedin-Version': '202602',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
      const orgData = await orgRes.json();
      const org = orgData.elements?.[0];
      const orgUrn = org?.organization;
      const orgName = org?.['organization~']?.localizedName || 'LinkedIn Company';
      const orgId = orgUrn?.split(':').pop();

      // Store in social_connections
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      const { data, error } = await supabase.from('social_connections').upsert(
        {
          platform: 'linkedin',
          account_type: 'company',
          account_name: orgName,
          account_id: orgId || null,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          sync_status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'platform' }
      ).select().single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: { account_name: orgName, account_id: orgId } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: (error as Error).message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Invalid action' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

**Step 2: Set secrets**
```bash
supabase secrets set LINKEDIN_CLIENT_ID=xxx LINKEDIN_CLIENT_SECRET=xxx LINKEDIN_REDIRECT_URI=https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/linkedin-oauth?action=callback
```

**Step 3: Deploy**
```bash
supabase functions deploy linkedin-oauth
```

**Step 4: Commit**
```bash
git add supabase/functions/linkedin-oauth/
git commit -m "feat: add linkedin-oauth edge function"
```

---

## Task 4: Edge Function — `instagram-oauth`

**Files:**
- Create: `supabase/functions/instagram-oauth/index.ts`

**Step 1: Create the edge function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Step 1: Return authorize URL
  if (action === 'authorize') {
    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID')!);
    authUrl.searchParams.set('redirect_uri', Deno.env.get('INSTAGRAM_REDIRECT_URI')!);
    authUrl.searchParams.set('scope', 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return new Response(
      JSON.stringify({ success: true, data: { url: authUrl.toString() } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Step 2: Handle callback
  if (action === 'callback') {
    try {
      const { code } = await req.json();
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for short-lived token
      const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
        client_id: Deno.env.get('META_APP_ID')!,
        client_secret: Deno.env.get('META_APP_SECRET')!,
        redirect_uri: Deno.env.get('INSTAGRAM_REDIRECT_URI')!,
        code,
      }));
      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return new Response(
          JSON.stringify({ success: false, error: tokenData.error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange for long-lived token (60 days)
      const longTokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: Deno.env.get('META_APP_ID')!,
        client_secret: Deno.env.get('META_APP_SECRET')!,
        fb_exchange_token: tokenData.access_token,
      }));
      const longTokenData = await longTokenRes.json();

      // Get Facebook Pages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longTokenData.access_token}`
      );
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];

      if (!page) {
        return new Response(
          JSON.stringify({ success: false, error: 'Aucune Page Facebook trouvée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get Instagram Business Account linked to the page
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longTokenData.access_token}`
      );
      const igData = await igRes.json();
      const igAccountId = igData.instagram_business_account?.id;

      if (!igAccountId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Aucun compte Instagram Business/Creator lié à la Page' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get IG account name
      const igInfoRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}?fields=username,name&access_token=${longTokenData.access_token}`
      );
      const igInfo = await igInfoRes.json();

      // Store in social_connections
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const expiresAt = new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000).toISOString();

      const { error } = await supabase.from('social_connections').upsert(
        {
          platform: 'instagram',
          account_type: 'creator',
          account_name: igInfo.username || igInfo.name || 'Instagram',
          account_id: igAccountId,
          access_token: longTokenData.access_token,
          token_expires_at: expiresAt,
          sync_status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'platform' }
      ).select().single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: { account_name: igInfo.username, account_id: igAccountId } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: (error as Error).message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Invalid action' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

**Step 2: Set secrets**
```bash
supabase secrets set META_APP_ID=xxx META_APP_SECRET=xxx INSTAGRAM_REDIRECT_URI=https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/instagram-oauth?action=callback
```

**Step 3: Deploy**
```bash
supabase functions deploy instagram-oauth
```

**Step 4: Commit**
```bash
git add supabase/functions/instagram-oauth/
git commit -m "feat: add instagram-oauth edge function"
```

---

## Task 5: Edge Function — `sync-social-metrics`

**Files:**
- Create: `supabase/functions/sync-social-metrics/index.ts`

**Step 1: Create the edge function**

```typescript
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
  // If URN is an activity, resolve to underlying post first
  let shareUrn = postUrn;
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
  const param = isUgc ? `ugcPosts` : `shares`;
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
    throw new Error(`LinkedIn API error ${res.status}: ${errText}`);
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
    throw new Error(`Instagram media not found for shortcode: ${shortcode}`);
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

    const linkedinConn = connections.find(c => c.platform === 'linkedin');
    const instagramConn = connections.find(c => c.platform === 'instagram');

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
    const now = new Date().toISOString();
    if (linkedinConn) {
      await supabase.from('social_connections').update({ last_sync_at: now }).eq('id', linkedinConn.id);
    }
    if (instagramConn) {
      await supabase.from('social_connections').update({ last_sync_at: now }).eq('id', instagramConn.id);
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
```

**Step 2: Deploy**
```bash
supabase functions deploy sync-social-metrics
```

**Step 3: Commit**
```bash
git add supabase/functions/sync-social-metrics/
git commit -m "feat: add sync-social-metrics edge function"
```

---

## Task 6: Supabase Hooks — Social Connections

**Files:**
- Create: `src/hooks/supabase/useSocialConnectionsQuery.ts`
- Create: `src/hooks/supabase/useSocialConnectionsCRUD.ts`
- Modify: `src/hooks/supabase/index.ts`

**Step 1: Create query hook**

```typescript
// src/hooks/supabase/useSocialConnectionsQuery.ts
import { useSupabaseData } from './useSupabaseQuery';
import type { SocialConnectionRow } from '@/types/supabase-types';

export function useSupabaseSocialConnections() {
  return useSupabaseData<SocialConnectionRow>({
    table: 'social_connections',
    select: '*',
    orderBy: { column: 'platform', ascending: true },
  });
}
```

**Step 2: Create CRUD hook**

```typescript
// src/hooks/supabase/useSocialConnectionsCRUD.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useSocialConnectionsCRUD() {
  const [loading, setLoading] = useState(false);

  const disconnectPlatform = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('social_connections').delete().eq('id', id);
      if (error) throw error;
      toast.success('Connexion supprimée');
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const syncMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-social-metrics');
      if (error) throw error;
      const synced = data?.synced || 0;
      toast.success(`${synced} post(s) synchronisé(s)`);
      return { success: true, data };
    } catch (error) {
      toast.error('Erreur de synchronisation');
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = async (platform: 'linkedin' | 'instagram') => {
    setLoading(true);
    try {
      const functionName = platform === 'linkedin' ? 'linkedin-oauth' : 'instagram-oauth';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {},
        headers: {},
      });
      // The function returns { url } for the OAuth authorize page
      if (error) throw error;
      if (data?.data?.url) {
        window.open(data.data.url, '_blank', 'width=600,height=700');
      }
      return { success: true, data };
    } catch (error) {
      toast.error(`Erreur de connexion ${platform}`);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  return { disconnectPlatform, syncMetrics, initiateOAuth, loading };
}
```

**Step 3: Export from barrel**

Add to `src/hooks/supabase/index.ts`:
```typescript
export { useSupabaseSocialConnections } from './useSocialConnectionsQuery';
export { useSocialConnectionsCRUD } from './useSocialConnectionsCRUD';
```

**Step 4: Commit**
```bash
git add src/hooks/supabase/useSocialConnectionsQuery.ts src/hooks/supabase/useSocialConnectionsCRUD.ts src/hooks/supabase/index.ts
git commit -m "feat: add social connections hooks"
```

---

## Task 7: Frontend — SocialConnectionsCard in Settings

**Files:**
- Create: `src/modules/Settings/components/SocialConnectionsCard.tsx`
- Modify: `src/modules/Settings/index.tsx`

**Step 1: Create the SocialConnectionsCard component**

A card with:
- LinkedIn row: status badge (connected/disconnected), account name, "Connecter"/"Déconnecter" button
- Instagram row: same pattern
- Last sync date display
- "Synchroniser maintenant" button

Pattern follows SecurityCard.tsx style (Card + icon + title + action buttons).

**Step 2: Add to Settings page**

Import and render `SocialConnectionsCard` after `SecurityCard` in the settings layout.

**Step 3: Commit**
```bash
git add src/modules/Settings/components/SocialConnectionsCard.tsx src/modules/Settings/index.tsx
git commit -m "feat: add social connections settings card"
```

---

## Task 8: Frontend — Add `external_url` to PostForm + PostDetail

**Files:**
- Modify: `src/modules/Communication/components/PostForm.tsx`
- Modify: `src/modules/Communication/components/PostDetail.tsx`

**Step 1: Add external_url input to PostForm**

Add after the `objective` textarea field (~line 119):
```tsx
<div className="space-y-1.5">
  <Label htmlFor="external_url" className="text-xs text-muted-foreground">Lien du post (LinkedIn/Instagram)</Label>
  <Input
    id="external_url"
    type="url"
    placeholder="https://www.linkedin.com/feed/update/..."
    value={formData.external_url || ''}
    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
  />
</div>
```

**Step 2: Show external_url + source badge in PostDetail**

In PostDetail, add after the status badge:
- Source badge (linkedin_api / meta_api / manual)
- Link to external post if external_url exists

**Step 3: Commit**
```bash
git add src/modules/Communication/components/PostForm.tsx src/modules/Communication/components/PostDetail.tsx
git commit -m "feat: add external_url field to post form and detail"
```

---

## Task 9: Frontend — Sync Button on KPI Page

**Files:**
- Modify: `src/modules/CommunicationKPI/CommunicationKPIPage.tsx`

**Step 1: Add sync button to header**

Import `useSocialConnectionsCRUD` and add a "Synchroniser" button with RefreshCw icon next to the page title. Shows loading state during sync, calls `syncMetrics()`, then triggers data refetch.

**Step 2: Commit**
```bash
git add src/modules/CommunicationKPI/CommunicationKPIPage.tsx
git commit -m "feat: add sync button to KPI page header"
```

---

## Task 10: Database — pg_cron for Daily Sync

**Files:**
- Create: `supabase/migrations/20260314_social_metrics_cron.sql`

**Step 1: Apply migration**

```sql
-- Enable pg_net for HTTP calls from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily metrics sync at 6:00 AM UTC
SELECT cron.schedule(
  'daily-sync-social-metrics',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/sync-social-metrics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{"source": "cron"}'::jsonb
  );
  $$
);
```

**Step 2: Add unique constraint on social_connections.platform**

```sql
ALTER TABLE social_connections ADD CONSTRAINT social_connections_platform_unique UNIQUE (platform);
```

**Step 3: Commit**
```bash
git add supabase/migrations/20260314_social_metrics_cron.sql
git commit -m "feat: add daily cron job for social metrics sync"
```

---

## Task Order & Dependencies

```
Task 1 (DB migration) ──→ Task 2 (Types) ──→ Task 6 (Hooks)
                                                  │
Task 3 (LinkedIn OAuth) ──→ Task 5 (Sync) ───────┤
Task 4 (Instagram OAuth) ─┘                      │
                                                  ▼
                                    Task 7 (Settings UI)
                                    Task 8 (PostForm/Detail)
                                    Task 9 (KPI Sync button)
                                    Task 10 (pg_cron)
```

## Prerequisites (User Action Required)

Before implementation:
1. **Create a LinkedIn App** at https://www.linkedin.com/developers/ with `rw_organization_admin` scope (requires Marketing Developer Platform access)
2. **Create a Meta/Facebook App** at https://developers.facebook.com/ with Instagram Basic Display + Instagram Graph API
3. **Provide credentials**: LinkedIn Client ID/Secret + Meta App ID/Secret
4. **Store service_role_key** in Supabase Vault for pg_cron
