// supabase/functions/generate-ai-summary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { project_id } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(project_id)) {
      return new Response(
        JSON.stringify({ error: 'project_id doit être un UUID valide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const v2 = supabase.schema('v2')

    // 1. Charger le projet
    const { data: project, error: projectError } = await v2
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Projet introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Charger les 7 dernières activités
    const { data: activities } = await v2
      .from('project_activities')
      .select('type, title, created_at')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(7)

    // 3. Charger les tâches checklist non terminées (max 10)
    const { data: checklist } = await v2
      .from('checklist_items')
      .select('title, phase, status, priority')
      .eq('project_id', project_id)
      .neq('status', 'done')
      .order('position')
      .limit(10)

    // 4. Construire le prompt
    const activitiesText = (activities ?? [])
      .map((a: { type: string; title: string; created_at: string }) =>
        `- [${a.type}] ${a.title}`)
      .join('\n') || 'Aucune activité enregistrée.'

    const checklistText = (checklist ?? [])
      .map((c: { title: string; phase: string; status: string }) =>
        `- [${c.phase}/${c.status}] ${c.title}`)
      .join('\n') || 'Aucune tâche en cours.'

    const prompt = `Tu es un assistant CRM pour une agence digitale française. Analyse ce projet et génère un résumé structuré en 3 blocs (2-3 phrases max chacun, ton professionnel et direct).

PROJET : ${project.name}
Client : ${project.client_name ?? 'Non renseigné'}
Statut : ${project.status} — Priorité : ${project.priority}
Budget : ${project.budget ? `${project.budget.toLocaleString('fr-FR')} €` : 'Non renseigné'}
Échéance : ${project.end_date ?? 'Non renseignée'}
Score complétude : ${project.completion_score}%
Avancement : ${project.progress}%
Description : ${project.description ?? 'Aucune description.'}
Prochaine action : ${project.next_action_label ?? 'Non définie'}${project.next_action_due ? ` (avant le ${project.next_action_due})` : ''}

JOURNAL RÉCENT :
${activitiesText}

CHECKLIST EN COURS :
${checklistText}

Réponds UNIQUEMENT en JSON strict, sans texte avant ni après :
{
  "situation": "Description factuelle de la situation actuelle du projet (où en est-on, quels jalons franchis).",
  "action": "Ce qui est en cours de traitement ou ce qui doit être fait en priorité.",
  "milestone": "Le prochain jalon clé à atteindre et sa date si disponible."
}`

    // 5. Appel Groq API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!groqRes.ok) {
      const errBody = await groqRes.text()
      console.error('[generate-ai-summary] Erreur Groq:', errBody)
      return new Response(
        JSON.stringify({ error: `Erreur API Groq ${groqRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqData = await groqRes.json()
    const rawText: string = groqData.choices?.[0]?.message?.content ?? ''

    let summary: { situation: string; action: string; milestone: string }
    try {
      summary = JSON.parse(rawText)
    } catch {
      console.error('[generate-ai-summary] JSON invalide:', rawText)
      return new Response(
        JSON.stringify({ error: 'Réponse Groq non parseable' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!summary.situation || !summary.action || !summary.milestone) {
      console.error('[generate-ai-summary] Structure JSON Groq incomplète:', summary)
      return new Response(
        JSON.stringify({ error: 'Structure JSON incomplète' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Persister le résumé
    const { error: updateError, count } = await v2
      .from('projects')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', project_id)
      .select('id', { count: 'exact', head: true })

    if (updateError) {
      console.error('[generate-ai-summary] Erreur update:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Erreur sauvegarde résumé', detail: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!count || count === 0) {
      return new Response(
        JSON.stringify({ error: 'Projet introuvable lors de la sauvegarde' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[generate-ai-summary] Résumé généré pour projet ${project_id}`)

    return new Response(
      JSON.stringify({ success: true, summary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erreur interne', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
