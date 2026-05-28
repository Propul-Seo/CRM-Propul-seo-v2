/**
 * Pappers lead enrichment — placeholder.
 *
 * PHASE 3: replace with a real Pappers API call (GET /v2/entreprise?siren=...).
 * Returns null in Phase 2 — qualification_leads.pappers_enrichment stays
 * NULL until the real call is wired in.
 */
export async function enrichLeadFromSiret(
  siret: string,
): Promise<Record<string, unknown> | null> {
  console.log(`[PLACEHOLDER-PAPPERS] Would enrich SIRET: ${siret}`);
  return null;
}
