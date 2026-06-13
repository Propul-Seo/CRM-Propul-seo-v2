import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Types pour les métriques mensuelles
interface MonthlyMetrics {
  id?: string;
  month: string;
  total_revenue: number;
  total_expenses: number;
  net_result: number;
  created_at?: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Initialisation du client Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Déterminer le mois en cours (format YYYY-MM-01)
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Formater les dates pour la requête SQL
    const startDate = currentMonth.toISOString().split('T')[0];
    const endDate = nextMonth.toISOString().split('T')[0];
    
    // Récupérer les revenus du mois en cours
    const { data: revenueData, error: revenueError } = await supabase
      .from('accounting_entries')
      .select('amount')
      .eq('type', 'revenue')
      .gte('entry_date', startDate)
      .lt('entry_date', endDate);
    
    if (revenueError) {
      return new Response(
        JSON.stringify({ error: `Error fetching revenue: ${revenueError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Récupérer les dépenses du mois en cours
    const { data: expensesData, error: expensesError } = await supabase
      .from('accounting_entries')
      .select('amount')
      .eq('type', 'expense')
      .gte('entry_date', startDate)
      .lt('entry_date', endDate);
    
    if (expensesError) {
      return new Response(
        JSON.stringify({ error: `Error fetching expenses: ${expensesError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Calculer les totaux
    const totalRevenue = revenueData.reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = expensesData.reduce((sum, entry) => sum + entry.amount, 0);
    const netResult = totalRevenue - totalExpenses;
    
    // Créer l'objet de métriques
    const monthlyMetrics: MonthlyMetrics = {
      month: startDate,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_result: netResult,
    };
    
    // Vérifier si une entrée existe déjà pour ce mois
    const { data: existingMetrics, error: existingError } = await supabase
      .from('dashboard_metrics')
      .select('id')
      .eq('month', startDate)
      .maybeSingle();
    
    if (existingError) {
      return new Response(
        JSON.stringify({ error: `Error checking existing metrics: ${existingError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    let result;
    
    // Mettre à jour ou insérer les métriques
    if (existingMetrics?.id) {
      // Mettre à jour l'entrée existante
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .update(monthlyMetrics)
        .eq('id', existingMetrics.id)
        .select();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: `Error updating metrics: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      result = data[0];
    } else {
      // Insérer une nouvelle entrée
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .insert(monthlyMetrics)
        .select();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: `Error inserting metrics: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      result = data[0];
    }
    
    // Retourner les métriques calculées
    return new Response(
      JSON.stringify({
        success: true,
        message: "Monthly metrics calculated successfully",
        metrics: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in calculate_monthly_metrics function:", error);
    
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});