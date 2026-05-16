/* Desktop dashboard — wider, more breathing room, sidebar-style layout option.
   Two variations to compare:
   v1 — 2-column (hero + actions / KPI + activity)
   v2 — Sidebar focus card (left rail with project, right column with everything else)
*/

/* ============================== Desktop v1 — Spacious 2-col ============================== */
function DashboardDesktopV1() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero — full width */}
      <Hero
        eyebrow="Tableau de bord"
        title="Bon retour, Sophie"
        subtitle="Voici un aperçu de votre projet aujourd'hui. Tout va bien — une seule action requise."
        phasePill="Phase 3 sur 8 · Développement"
      />

      {/* 3-up KPI row */}
      <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>
        {/* Big project tile takes more space */}
        <div className="ps-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div className="ps-eyebrow ps-eyebrow-muted">Projet en cours</div>
              <div className="ps-h2" style={{ marginTop: 4 }}>Site Précieuse Joaillerie</div>
            </div>
            <Badge tone="violet">En cours</Badge>
          </div>
          <Progress value={65} valueLabel="65 %" label="Avancement global" />
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--ps-border-soft)",
            fontSize: 13,
          }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>Prochain jalon</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>Livraison maquettes · 22 juin</div>
            </div>
            <a href="#" style={{ color: "var(--ps-primary-text)", fontWeight: 600, textDecoration: "none", alignSelf: "center", display: "inline-flex", gap: 6, alignItems: "center" }}>
              Voir le projet <Icon name="arrow-up-right" size={13} stroke={2.4} />
            </a>
          </div>
        </div>

        <KpiTile eyebrow="Heures travaillées" value="42 h" delta="+6 cette semaine" icon="clock" tint="violet" />
        <KpiTile eyebrow="Payé en 2026"       value="8 000 €" delta="Sur 13 000 € engagés" icon="check-circle-2" tint="green" />
      </section>

      {/* 2-col split */}
      <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        {/* LEFT — Actions en attente + Activité */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action banner */}
          <div className="ps-card" style={{
            padding: 18,
            background: "linear-gradient(180deg, var(--ps-primary-subtle) 0%, #fff 60%)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 14px -4px rgba(124,58,237,0.45)",
              flexShrink: 0,
            }}>
              <Icon name="receipt" size={20} stroke={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ps-eyebrow" style={{ color: "var(--ps-primary-text)" }}>Action requise</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3, color: "var(--ps-fg)" }}>
                Facture <span className="ps-num">PS-1031</span> à régler <span className="ps-num" style={{ color: "var(--ps-primary-deep)" }}>· 5 000,00 €</span>
              </div>
              <div className="ps-num" style={{ fontSize: 12.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>
                Échéance 15 juin 2026 · paiement Stripe en 1 clic
              </div>
            </div>
            <Button variant="primary" size="lg" iconRight="arrow-up-right">Payer</Button>
          </div>

          {/* Activity card */}
          <section className="ps-card" style={{ overflow: "hidden" }}>
            <SectionHead title="Activité récente" action={
              <a href="#" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none" }}>Tout voir →</a>
            } />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <DT_Activity icon="receipt"        tint="blue"   title="Facture PS-1031 envoyée"          meta="Aujourd'hui · 14:22" />
              <DT_Activity icon="check-circle-2" tint="green"  title="Maquette page d'accueil validée"  meta="Hier · 17:08" />
              <DT_Activity icon="palette"        tint="violet" title="Charte graphique livrée"           meta="12 mai" />
              <DT_Activity icon="pen-line"       tint="green"  title="Contrat signé par Eméline Le Ray"  meta="10 mai" />
              <DT_Activity icon="sparkles"       tint="amber"  title="Projet activé dans Propul'Space"   meta="8 mai" last />
            </ul>
          </section>
        </div>

        {/* RIGHT — Derniers documents + Onboarding */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="ps-card" style={{ overflow: "hidden" }}>
            <SectionHead title="Derniers documents" action={
              <a href="#" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none" }}>Voir tout →</a>
            } />
            <DT_Doc icon="file-text" iconColor="#DC2626" iconBg="#FEE2E2" name="Rapport SEO Mai 2026.pdf" meta="15 mai · 1.2 MB" isNew />
            <DT_Doc icon="image"     iconColor="#1D4ED8" iconBg="#DBEAFE" name="Maquette accueil v2.png"   meta="14 mai · 3.4 MB" isNew />
            <DT_Doc icon="file-text" iconColor="var(--ps-primary-deep)" iconBg="var(--ps-primary-subtle)" name="Contrat de prestation.pdf" meta="1 mai · 450 KB" last />
          </section>

          <section className="ps-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="ps-h3">Onboarding</div>
              <span className="ps-num" style={{ fontSize: 12.5, color: "var(--ps-primary-deep)", fontWeight: 600 }}>3 / 5</span>
            </div>
            <Progress value={60} />
            <div style={{ fontSize: 12.5, color: "var(--ps-fg-secondary)", marginTop: 12, lineHeight: 1.5 }}>
              Il reste <strong style={{ color: "var(--ps-fg)" }}>2 éléments à compléter</strong> : codes d'accès Google Analytics et charte de communication.
            </div>
            <a href="#" style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
              fontSize: 13, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none",
            }}>
              Reprendre l'onboarding <Icon name="arrow-up-right" size={13} stroke={2.4} />
            </a>
          </section>
        </div>
      </section>
    </div>
  );
}

/* ============================== Desktop v2 — Sidebar focus ============================== */
function DashboardDesktopV2() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "flex-start" }}>
      {/* LEFT RAIL — sticky project context */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 8 }}>
        <section className="ps-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
          <span className="ps-hero-blur" style={{ right: -80, top: -80 }} />
          <div className="ps-eyebrow">Mon projet</div>
          <h1 className="ps-h2" style={{ fontSize: 20, marginTop: 6, marginBottom: 4 }}>Site Précieuse Joaillerie</h1>
          <div style={{ fontSize: 12.5, color: "var(--ps-fg-muted)", marginBottom: 18 }}>Refonte SEO · démarré le 1 mai</div>

          {/* Big number */}
          <div style={{ marginBottom: 8 }}>
            <span className="ps-num ps-gradient-text" style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1 }}>65</span>
            <span className="ps-num" style={{ fontSize: 20, fontWeight: 600, color: "var(--ps-primary-deep)", marginLeft: 4 }}>%</span>
          </div>
          <Progress value={65} />
          <div className="ps-num" style={{ fontSize: 12, color: "var(--ps-fg-muted)", marginTop: 8 }}>
            Étape 3 de 6 · Développement
          </div>
        </section>

        <section className="ps-card" style={{ padding: 18 }}>
          <div className="ps-eyebrow ps-eyebrow-muted" style={{ marginBottom: 10 }}>Prochain jalon</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>JUIN</span>
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>22</span>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ps-fg)" }}>Livraison maquettes</div>
              <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>Dans 5 semaines</div>
            </div>
          </div>
        </section>

        <section className="ps-card" style={{ padding: 18 }}>
          <div className="ps-eyebrow ps-eyebrow-muted" style={{ marginBottom: 6 }}>Votre contact</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9999,
              background: "linear-gradient(135deg, #f59e0b, #b45309)",
              color: "#fff", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>LT</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Lyes Triki</div>
              <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>Directeur de projet</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button variant="primary" size="sm" icon="message-square">WhatsApp</Button>
            <Button variant="outline" size="sm" icon="mail">Email</Button>
          </div>
        </section>
      </aside>

      {/* RIGHT — main content */}
      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Greeting */}
        <div>
          <div className="ps-eyebrow ps-eyebrow-muted">Vendredi 15 mai · 14:22</div>
          <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 32, marginTop: 4 }}>
            Bon retour, Sophie
          </h1>
        </div>

        {/* Action card — wide */}
        <section className="ps-card" style={{
          padding: 22, display: "flex", alignItems: "center", gap: 18,
          background: "linear-gradient(180deg, var(--ps-primary-subtle) 0%, #fff 70%)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 14px -4px rgba(124,58,237,0.45)",
            flexShrink: 0,
          }}>
            <Icon name="receipt" size={22} stroke={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="ps-eyebrow" style={{ color: "var(--ps-primary-text)" }}>1 action requise</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>
              Régler la facture <span className="ps-num">PS-1031</span> · <span className="ps-num" style={{ color: "var(--ps-primary-deep)" }}>5 000,00 €</span>
            </div>
            <div className="ps-num" style={{ fontSize: 13, color: "var(--ps-fg-secondary)", marginTop: 3 }}>
              Échéance 15 juin 2026. Paiement Stripe sécurisé en 1 clic.
            </div>
          </div>
          <Button variant="primary" size="lg" iconRight="arrow-up-right">Payer maintenant</Button>
        </section>

        {/* KPI strip */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <KpiTile eyebrow="Heures"      value="42 h"     delta="+6 cette sem." icon="clock"          tint="violet" />
          <KpiTile eyebrow="Docs livrés" value="8"        delta="2 nouveaux"    icon="file-text"      tint="blue" />
          <KpiTile eyebrow="Payé 2026"   value="8 000 €"  delta="2 factures"    icon="check-circle-2" tint="green" />
          <KpiTile eyebrow="Onboarding"  value="60 %"     delta="2 items restants" icon="folder-kanban" tint="orange" />
        </section>

        {/* Activity + Docs */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ps-card" style={{ overflow: "hidden" }}>
            <SectionHead title="Activité récente" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <DT_Activity icon="receipt"        tint="blue"   title="Facture PS-1031 envoyée"          meta="Auj. · 14:22" />
              <DT_Activity icon="check-circle-2" tint="green"  title="Maquette validée"                 meta="Hier · 17:08" />
              <DT_Activity icon="palette"        tint="violet" title="Charte graphique livrée"           meta="12 mai" />
              <DT_Activity icon="pen-line"       tint="green"  title="Contrat signé"                     meta="10 mai" last />
            </ul>
          </div>
          <div className="ps-card" style={{ overflow: "hidden" }}>
            <SectionHead title="Derniers documents" />
            <DT_Doc icon="file-text" iconColor="#DC2626" iconBg="#FEE2E2" name="Rapport SEO Mai 2026.pdf" meta="15 mai · 1.2 MB" isNew />
            <DT_Doc icon="image"     iconColor="#1D4ED8" iconBg="#DBEAFE" name="Maquette accueil v2.png"   meta="14 mai · 3.4 MB" isNew />
            <DT_Doc icon="file-text" iconColor="var(--ps-primary-deep)" iconBg="var(--ps-primary-subtle)" name="Brief créatif.pdf" meta="3 mai · 180 KB" last />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================== Shared row components ============================== */
function DT_Activity({ icon, tint, title, meta, last }) {
  const tints = {
    blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
    green:  { bg: "#D1FAE5", fg: "#047857" },
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
    amber:  { bg: "#FEF3C7", fg: "#92400E" },
  };
  const t = tints[tint] || tints.violet;
  return (
    <li style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px", borderBottom: last ? "none" : "1px solid var(--ps-border-soft)",
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 9999, background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={14} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>{title}</div>
        <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>{meta}</div>
      </div>
    </li>
  );
}

function DT_Doc({ icon, iconColor, iconBg, name, meta, isNew, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px", borderBottom: last ? "none" : "1px solid var(--ps-border-soft)",
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 9, background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={15} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>{meta}</div>
      </div>
      {isNew && <Badge tone="warning" dot={false}>Nouveau</Badge>}
    </div>
  );
}

Object.assign(window, { DashboardDesktopV1, DashboardDesktopV2 });
