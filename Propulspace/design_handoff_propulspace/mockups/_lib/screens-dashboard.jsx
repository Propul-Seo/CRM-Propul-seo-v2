/* DashboardScreen — the "money shot". Hero + Pending actions + KPI + recent docs + activity. */

function DashboardScreen({ device = "mobile" }) {
  const desktop = device === "desktop";
  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: desktop ? 20 : 14 }}>
      {/* HERO */}
      <Hero
        eyebrow="Tableau de bord"
        title={desktop ? "Bon retour, Sophie" : "Bonjour Sophie"}
        subtitle="Voici un aperçu de votre projet aujourd'hui."
        phasePill="Phase 3 · Développement"
      />

      {/* BLOC 1 — Mon projet */}
      <section className="ps-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div className="ps-eyebrow ps-eyebrow-muted">Mon projet</div>
            <div className="ps-h3" style={{ marginTop: 4, fontSize: desktop ? 17 : 15 }}>Site Précieuse Joaillerie</div>
          </div>
          <Badge tone="violet">En cours</Badge>
        </div>
        <Progress value={65} label="Développement des pages" valueLabel="65 %" />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--ps-border-soft)",
        }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>Prochain jalon</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>Livraison maquettes · 22 juin</div>
          </div>
          <a href="#" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Voir le détail <Icon name="arrow-up-right" size={13} stroke={2.4} />
          </a>
        </div>
      </section>

      {/* BLOC 2 — Actions en attente */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        <SectionHead title="Actions en attente" action={
          <span className="ps-badge ps-badge-warning"><span className="ps-badge-dot" />1</span>
        } />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <ActionRow icon="receipt" tint="orange" title="1 facture à payer" sub="PS-1031 · 5 000,00 € · échéance 15 juin" actionLabel="Payer" />
          <ActionRow icon="pen-line" tint="gray" title="Aucune signature en attente" sub="Vos contrats sont signés." disabled />
          <ActionRow icon="folder-kanban" tint="violet" title="2 éléments d'onboarding à compléter" sub="Codes d'accès & charte graphique" actionLabel="Continuer" />
        </div>
      </section>

      {/* KPI tiles */}
      <section style={{ display: "grid", gridTemplateColumns: desktop ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
        <KpiTile eyebrow="Heures travaillées" value="42 h" delta="+6 cette semaine" icon="clock" tint="violet" />
        <KpiTile eyebrow="Docs livrés" value="8" delta="2 nouveaux" icon="file-text" tint="blue" />
        {desktop && <KpiTile eyebrow="Payé en 2026" value="3 000,00 €" delta="Sur 8 000,00 € engagés" icon="check-circle-2" tint="green" />}
      </section>

      {/* BLOC 3 — Derniers documents */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        <SectionHead title="Derniers documents" action={
          <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none" }}>Voir tout →</a>
        } />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <DocRow icon="file-text" iconColor="#DC2626" iconBg="#FEE2E2" name="Rapport SEO Mai 2026.pdf" date="15 mai · 1.2 MB" isNew />
          <DocRow icon="image" iconColor="#1D4ED8" iconBg="#DBEAFE" name="Maquette accueil v2.png" date="14 mai · 3.4 MB" isNew />
          <DocRow icon="file-text" iconColor="var(--ps-primary-deep)" iconBg="var(--ps-primary-subtle)" name="Contrat de prestation.pdf" date="1 mai · 450 KB" />
        </div>
      </section>

      {/* BLOC 4 — Activité */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        <SectionHead title="Activité récente" action={
          <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-primary-text)", textDecoration: "none" }}>Tout voir</a>
        } />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <ActivityItem icon="receipt" tint="blue"   title="Facture PS-1031 envoyée"        meta="Aujourd'hui · 14:22" />
          <ActivityItem icon="check-circle-2" tint="green" title="Maquette page d'accueil validée" meta="Hier · 17:08" />
          <ActivityItem icon="palette" tint="violet" title="Charte graphique livrée"          meta="12 mai" />
          <ActivityItem icon="pen-line" tint="green" title="Contrat signé par Eméline Le Ray" meta="10 mai" />
          <ActivityItem icon="sparkles" tint="amber" title="Projet activé dans Propul'Space"  meta="8 mai" last />
        </ul>
      </section>
    </div>
  );
}

function ActionRow({ icon, tint, title, sub, actionLabel, disabled }) {
  const tints = {
    orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
    gray:   { bg: "var(--ps-bg-subtle)", fg: "var(--ps-fg-muted)" },
  };
  const t = tints[tint] || tints.gray;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 18px", borderBottom: "1px solid var(--ps-border-soft)",
      opacity: disabled ? 0.7 : 1,
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 9999,
        background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={15} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>{sub}</div>
      </div>
      {actionLabel && (
        <button style={{
          fontSize: 12.5, fontWeight: 600, color: "var(--ps-primary-text)",
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px 8px",
        }}>{actionLabel} →</button>
      )}
    </div>
  );
}

function DocRow({ icon, iconColor, iconBg, name, date, isNew }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px", borderBottom: "1px solid var(--ps-border-soft)",
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 9, background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={15} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>{date}</div>
      </div>
      {isNew && <Badge tone="warning" dot={false}>Nouveau</Badge>}
      <button style={{ background: "transparent", border: "none", color: "var(--ps-fg-muted)", cursor: "pointer", padding: 4 }}>
        <Icon name="download" size={16} stroke={2} />
      </button>
    </div>
  );
}

function ActivityItem({ icon, tint, title, meta, last }) {
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
        width: 30, height: 30, borderRadius: 9999, background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={14} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>{title}</div>
        <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 1 }}>{meta}</div>
      </div>
    </li>
  );
}

Object.assign(window, { DashboardScreen });
