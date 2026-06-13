import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

async function exchangeCodeAndStore(code: string) {
  // Exchange code for short-lived token
  const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
    client_id: Deno.env.get('META_APP_ID')!,
    client_secret: Deno.env.get('META_APP_SECRET')!,
    redirect_uri: Deno.env.get('INSTAGRAM_REDIRECT_URI')!,
    code,
  }));
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(tokenData.error.message || 'Token exchange failed');
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
    throw new Error('Aucune Page Facebook trouvée');
  }

  // Get Instagram Business Account linked to the page
  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longTokenData.access_token}`
  );
  const igData = await igRes.json();
  const igAccountId = igData.instagram_business_account?.id;

  if (!igAccountId) {
    throw new Error('Aucun compte Instagram Business/Creator lié à la Page');
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
  );

  if (error) throw error;

  return { account_name: igInfo.username || igInfo.name, account_id: igAccountId };
}

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

  // Step 2: Handle callback — GET (redirect from Meta) or POST (frontend)
  if (action === 'callback') {
    try {
      let code = url.searchParams.get('code');

      if (!code && req.method === 'POST') {
        const body = await req.json();
        code = body.code;
      }

      if (!code) {
        const error = url.searchParams.get('error');
        const errorDesc = url.searchParams.get('error_description');
        if (error) {
          return Response.redirect(`${APP_URL}?oauth=error&platform=instagram&message=${encodeURIComponent(errorDesc || error)}`, 302);
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Code d\'autorisation manquant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await exchangeCodeAndStore(code);

      if (req.method === 'GET') {
        return Response.redirect(`${APP_URL}?oauth=success&platform=instagram&account=${encodeURIComponent(result.account_name || '')}`, 302);
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const message = (error as Error).message;

      if (req.method === 'GET') {
        return Response.redirect(`${APP_URL}?oauth=error&platform=instagram&message=${encodeURIComponent(message)}`, 302);
      }

      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Action invalide' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
