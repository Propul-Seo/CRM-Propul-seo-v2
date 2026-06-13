import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncProjectBudgetRequest {
  project_id: string;
  budget_amount: number;
  project_name: string;
  client_id: string;
  client_name: string;
  user_id: string;
}

interface RevenueEntry {
  id: string;
  project_id: string;
  amount: number;
  revenue_date: string;
  type: string;
  client_id: string;
  client_name: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AccountingTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  date: string;
  reference_id: string;
  reference_type: string;
  description: string;
  category: string;
  client_id: string;
  client_name: string;
  project_name: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { project_id, budget_amount, project_name, client_id, client_name, user_id }: SyncProjectBudgetRequest = await req.json()

    if (!project_id || !budget_amount || !project_name || !client_id || !client_name || !user_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['project_id', 'budget_amount', 'project_name', 'client_id', 'client_name', 'user_id']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Mettre à jour le budget du projet
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ 
        budget: budget_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .eq('user_id', user_id)

    if (projectUpdateError) {
      console.error('Erreur mise à jour projet:', projectUpdateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du projet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Vérifier si une entrée revenue existe déjà pour ce projet
    const { data: existingRevenue, error: revenueQueryError } = await supabase
      .from('revenue_entries')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'project_budget')
      .eq('user_id', user_id)
      .single()

    let revenueEntry: RevenueEntry | null = null

    if (revenueQueryError && revenueQueryError.code !== 'PGRST116') {
      console.error('Erreur requête revenue:', revenueQueryError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification des revenus' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingRevenue) {
      // Mettre à jour l'entrée revenue existante
      const { data: updatedRevenue, error: revenueUpdateError } = await supabase
        .from('revenue_entries')
        .update({
          amount: budget_amount,
          description: `Budget projet mis à jour: ${budget_amount}€`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRevenue.id)
        .select()
        .single()

      if (revenueUpdateError) {
        console.error('Erreur mise à jour revenue:', revenueUpdateError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la mise à jour du revenu' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revenueEntry = updatedRevenue
    } else {
      // Créer nouvelle entrée revenue
      const newRevenueEntry = {
        project_id,
        amount: budget_amount,
        revenue_date: new Date().toISOString(),
        type: 'project_budget',
        client_id,
        client_name,
        description: `Budget projet: ${budget_amount}€`,
        category: 'services',
        status: 'projected',
        user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdRevenue, error: revenueCreateError } = await supabase
        .from('revenue_entries')
        .insert(newRevenueEntry)
        .select()
        .single()

      if (revenueCreateError) {
        console.error('Erreur création revenue:', revenueCreateError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création du revenu' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      revenueEntry = createdRevenue
    }

    // 3. Vérifier si une entrée comptabilité existe déjà pour ce projet
    const { data: existingAccounting, error: accountingQueryError } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('reference_id', project_id)
      .eq('category', 'projected_revenue')
      .eq('user_id', user_id)
      .single()

    let accountingEntry: AccountingTransaction | null = null

    if (accountingQueryError && accountingQueryError.code !== 'PGRST116') {
      console.error('Erreur requête comptabilité:', accountingQueryError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification de la comptabilité' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingAccounting) {
      // Mettre à jour l'entrée comptabilité existante
      const { data: updatedAccounting, error: accountingUpdateError } = await supabase
        .from('accounting_entries')
        .update({
          amount: budget_amount,
          description: `Budget projet mis à jour: ${budget_amount}€`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccounting.id)
        .select()
        .single()

      if (accountingUpdateError) {
        console.error('Erreur mise à jour comptabilité:', accountingUpdateError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la mise à jour de la comptabilité' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      accountingEntry = updatedAccounting
    } else {
      // Créer nouvelle entrée comptabilité
      const newAccountingEntry = {
        transaction_type: 'revenue',
        amount: budget_amount,
        date: new Date().toISOString(),
        reference_id: project_id,
        reference_type: 'project',
        description: `Budget projet: ${budget_amount}€`,
        category: 'projected_revenue',
        client_id,
        client_name,
        project_name,
        user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdAccounting, error: accountingCreateError } = await supabase
        .from('accounting_entries')
        .insert(newAccountingEntry)
        .select()
        .single()

      if (accountingCreateError) {
        console.error('Erreur création comptabilité:', accountingCreateError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création de l\'entrée comptable' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      accountingEntry = createdAccounting
    }

    // 4. Créer un log de synchronisation
    const syncLog = {
      project_id,
      project_name,
      old_budget: 0, // TODO: récupérer l'ancien budget
      new_budget: budget_amount,
      sync_status: 'completed',
      revenue_entry_id: revenueEntry?.id,
      accounting_entry_id: accountingEntry?.id,
      user_id,
      created_at: new Date().toISOString()
    }

    const { error: logError } = await supabase
      .from('budget_sync_logs')
      .insert(syncLog)

    if (logError) {
      console.error('Erreur création log:', logError)
      // Ne pas échouer si le log échoue
    }

    // 5. Retourner le résultat
    return new Response(
      JSON.stringify({
        success: true,
        message: `Budget de ${budget_amount}€ synchronisé avec succès`,
        data: {
          project_id,
          budget_amount,
          revenue_entry: revenueEntry,
          accounting_entry: accountingEntry,
          sync_timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erreur serveur:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 