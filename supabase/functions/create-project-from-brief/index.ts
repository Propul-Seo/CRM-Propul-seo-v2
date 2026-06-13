// supabase/functions/create-project-from-brief/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIELD_LABELS: Record<string, string> = {
  objective: "Objectif du projet",
  target_audience: "Cible / utilisateurs",
  pages: "Pages / Fonctionnalités attendues",
  techno: "Technologie / stack",
  design_references: "Références design",
  notes: "Notes complémentaires",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!)
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, short_code, companyName, fields } = await req.json() as {
      token?: string;
      short_code?: string;
      companyName: string;
      fields: Record<string, string | null>;
    };

    if (!token && !short_code) {
      return new Response(
        JSON.stringify({ ok: false, error: "token ou short_code requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!companyName?.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "companyName requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const v2 = supabase.schema("v2");

    // 1. Valider le token ou short_code
    const invQuery = v2
      .from("brief_invitations")
      .select("id, status, company_name");

    const { data: invitation, error: invErr } = await (
      short_code
        ? invQuery.eq("short_code", short_code)
        : invQuery.eq("token", token!)
    ).single();

    if (invErr || !invitation) {
      return new Response(
        JSON.stringify({ ok: false, error: "Lien invalide" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status === "submitted") {
      return new Response(
        JSON.stringify({ ok: false, error: "already_submitted" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Créer le projet
    const { data: project, error: projErr } = await v2
      .from("projects")
      .insert({
        name: companyName.trim(),
        status: "brief_received",
        priority: "medium",
        presta_type: [],
        client_name: "",
        is_archived: false,
        progress: 0,
        completion_score: 0,
      })
      .select("id")
      .single();

    if (projErr || !project) {
      throw new Error(`Erreur création projet: ${projErr?.message}`);
    }

    // 3. Créer le brief
    const { error: briefErr } = await v2
      .from("project_briefs")
      .insert({
        project_id: project.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        objective: fields.objective ?? null,
        target_audience: fields.target_audience ?? null,
        pages: fields.pages ?? null,
        techno: fields.techno ?? null,
        design_references: fields.design_references ?? null,
        notes: fields.notes ?? null,
      });

    if (briefErr) {
      throw new Error(`Erreur création brief: ${briefErr.message}`);
    }

    // 4. Marquer l'invitation comme soumise
    await v2
      .from("brief_invitations")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        project_id: project.id,
      })
      .eq("id", invitation.id);

    // 5. Email de notification (best-effort)
    if (resendKey) {
      const { data: extraEmails } = await supabase
        .from("notification_emails")
        .select("email")
        .eq("active", true);

      const to = [
        "lyestriki@gmail.com",
        ...(extraEmails ?? [])
          .map((r: { email: string }) => r.email.trim())
          .filter(isValidEmail),
      ];

      const fieldsHtml = Object.entries(fields)
        .filter(([, val]) => val && val.trim().length > 0)
        .map(([key, val]) => `
          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #2d2654;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:1.5px;">
              ${FIELD_LABELS[key] ?? key}
            </p>
            <p style="margin:0;font-size:14px;color:#ede9fe;line-height:1.7;white-space:pre-wrap;">${escapeHtml(val ?? "")}</p>
          </div>
        `).join("");

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0e0b1e;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6366f1,#9333ea);padding:32px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Nouveau projet via brief client</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(companyName.trim())}</h1>
          </div>
          <div style="padding:28px;background:#16122e;border-top:1px solid #2d2654;">
            ${fieldsHtml}
          </div>
          <div style="padding:16px 28px;background:#0e0b1e;text-align:center;font-size:11px;color:#6b5fa0;border-top:1px solid #2d2654;letter-spacing:2px;text-transform:uppercase;">
            Propulseo Studio · Notification automatique
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Propul'SEO <onboarding@resend.dev>",
          to,
          subject: `[Nouveau projet] ${companyName.trim()} — brief reçu`,
          html,
        }),
      }).catch(() => {/* silencieux */});
    }

    console.log(`[create-project-from-brief] projet créé: ${project.id} pour "${companyName}"`);

    return new Response(JSON.stringify({ ok: true, projectId: project.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[create-project-from-brief] error:", (err as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
