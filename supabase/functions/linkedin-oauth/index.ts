import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

const REDIRECT_URI = 'https://tbuqctfgjjxnevmsvucl.supabase.co/functions/v1/linkedin-oauth';

async function exchangeCodeAndStore(code: string) {
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: Deno.env.get('LINKEDIN_CLIENT_ID')!,
      client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET')!,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || 'Token exchange failed');
  }

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const { error } = await supabase.from('social_connections').upsert(
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
  );

  if (error) throw error;

  return { account_name: orgName, account_id: orgId };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Detect callback: LinkedIn redirects here with ?code=xxx (GET)
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (code || error) {
    // This is the OAuth callback from LinkedIn
    if (error) {
      const errorDesc = url.searchParams.get('error_description');
      return Response.redirect(
        `${APP_URL}?oauth=error&platform=linkedin&message=${encodeURIComponent(errorDesc || error)}`,
        302
      );
    }

    try {
      const result = await exchangeCodeAndStore(code!);
      return Response.redirect(
        `${APP_URL}?oauth=success&platform=linkedin&account=${encodeURIComponent(result.account_name)}`,
        302
      );
    } catch (err) {
      return Response.redirect(
        `${APP_URL}?oauth=error&platform=linkedin&message=${encodeURIComponent((err as Error).message)}`,
        302
      );
    }
  }

  // Frontend calls: ?action=authorize (POST/GET from app)
  const action = url.searchParams.get('action');

  if (action === 'authorize') {
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', Deno.env.get('LINKEDIN_CLIENT_ID')!);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'rw_organization_admin');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return new Response(
      JSON.stringify({ success: true, data: { url: authUrl.toString() } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Action invalide' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
