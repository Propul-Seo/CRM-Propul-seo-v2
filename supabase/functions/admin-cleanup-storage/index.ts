// Edge Function : suppression de fichiers Storage via service_role.
//
// Appelée par le front APRÈS un admin_delete_project ou admin_delete_qualif_lead
// pour nettoyer les fichiers orphelins dans les buckets propulspace-*.
//
// Input :
//   {
//     documents_bucket_paths?: string[],  // paths dans propulspace-documents
//     uploads_bucket_paths?:   string[]   // paths dans propulspace-uploads
//   }
//
// Output :
//   { deleted: number, errors: { bucket: string, path: string, error: string }[] }
//
// Sécurité :
// - verify_jwt=true (default) → un JWT authentifié est requis.
// - On vérifie côté edge que l'appelant est admin/manager (via propulspace.is_admin
//   sur sa session) AVANT d'utiliser le service_role pour supprimer.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const DOCS_BUCKET = 'propulspace-documents';
const UPLOADS_BUCKET = 'propulspace-uploads';

interface CleanupInput {
  documents_bucket_paths?: string[];
  uploads_bucket_paths?: string[];
}

interface CleanupError {
  bucket: string;
  path: string;
  error: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });

  try {
    // 1. Vérifier l'identité du caller via son JWT (admin/manager only)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin, error: adminErr } = await userClient
      .schema('propulspace')
      .rpc('is_admin');

    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin/manager required' }), {
        status: 403, headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    // 2. Parse input
    const body = await req.json() as CleanupInput;
    const docPaths = (body.documents_bucket_paths ?? []).filter(p => typeof p === 'string' && p.length > 0);
    const upPaths  = (body.uploads_bucket_paths   ?? []).filter(p => typeof p === 'string' && p.length > 0);

    if (docPaths.length === 0 && upPaths.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, errors: [] }), {
        status: 200, headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    // 3. Service_role client — bypass RLS pour DELETE Storage
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let deleted = 0;
    const errors: CleanupError[] = [];

    if (docPaths.length > 0) {
      const { data, error } = await admin.storage.from(DOCS_BUCKET).remove(docPaths);
      if (error) {
        for (const path of docPaths) errors.push({ bucket: DOCS_BUCKET, path, error: error.message });
      } else {
        deleted += (data?.length ?? 0);
      }
    }

    if (upPaths.length > 0) {
      const { data, error } = await admin.storage.from(UPLOADS_BUCKET).remove(upPaths);
      if (error) {
        for (const path of upPaths) errors.push({ bucket: UPLOADS_BUCKET, path, error: error.message });
      } else {
        deleted += (data?.length ?? 0);
      }
    }

    return new Response(JSON.stringify({ deleted, errors }), {
      status: 200, headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }
});
