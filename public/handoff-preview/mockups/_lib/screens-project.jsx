/* ProjectScreen — timeline of steps + KPI + recent deliverables. */

function ProjectScreen({ device = "mobile" }) {
  const desktop = device === "desktop";
  const steps = [
    { label: "Cadrage & brief",         dates: "1\u201310 mai",      status: "done" },
    { label: "Design (maquettes)",      dates: "11\u201320 mai",     status: "done" },
    { label: "Développement des pages", dates: "21 mai\u201310 juin", status: "current",
      desc: "65 % réalisé · 18/29 tâches" },
    { label: "Intégration contenu",     dates: "11\u201318 juin",    status: "upcoming" },
    { label: "Tests & recette",         dates: "19\u201325 juin",    status: "upcoming" },
    { label: "Mise en ligne",           dates: "26 juin",            status: "upcoming" },
  ];

  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: desktop ? 20 : 14 }}>
      {/* Header */}
      <section style={{ paddingTop: 4 }}>
        <div className="ps-eyebrow ps-eyebrow-muted">Projet</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <h1 className="ps-h1" style={{ fontSize: desktop ? 32 : 24 }}>Site Précieuse Joaillerie</h1>
          <Badge tone="violet">En cours</Badge>
        </div>
        <div style={{ marginTop: 14 }}>
          <Progress value={65} label="Avancement global" valueLabel="65 %" />
        </div>
      </section>

      {/* KPI */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <KpiTile eyebrow="Heures travaillées" value="42 h" delta="Cette semaine : +6 h" icon="clock" tint="violet" />
        <KpiTile eyebrow="Prochain jalon" value="22 juin" delta="Livraison maquettes" icon="calendar" tint="blue" />
      </section>

      {/* Timeline */}
      <section className="ps-card" style={{ padding: "18px 18px 8px" }}>
        <h2 className="ps-h3" style={{ marginBottom: 18 }}>Étapes du projet</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
          {steps.map((s, i) => (
            <TimelineStep key={i} step={s} last={i === steps.length - 1} />
          ))}
        </ol>
      </section>

      {/* Deliverables */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        <SectionHead title="Derniers livrables" />
        <DeliverableRow name="Maquette page d'accueil v2.pdf" date="14 mai" />
        <DeliverableRow name="Rapport SEO initial.pdf"        date="8 mai" />
        <DeliverableRow name="Brief créatif validé.pdf"       date="3 mai" last />
      </section>
    </div>
  );
}

function TimelineStep({ step, last }) {
  const isDone = step.status === "done";
  const isCurrent = step.status === "current";
  return (
    <li style={{ display: "flex", gap: 14, paddingBottom: last ? 12 : 16, position: "relative" }}>
      {/* Connector line */}
      {!last && <span style={{
        position: "absolute", left: 14, top: 30, bottom: -2, width: 2,
        background: isDone ? "var(--ps-success)" : "var(--ps-border)",
        opacity: isDone ? 0.45 : 1,
      }} />}

      {/* Node */}
      <span style={{
        width: 30, height: 30, borderRadius: 9999, flexShrink: 0,
        background: isDone ? "var(--ps-success-subtle)"
                  : isCurrent ? "var(--ps-primary-subtle)"
                  : "var(--ps-bg-subtle)",
        color:      isDone ? "var(--ps-success)"
                  : isCurrent ? "var(--ps-primary)"
                  : "var(--ps-fg-muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isCurrent ? "0 0 0 4px rgba(124,58,237,0.10)" : "none",
        position: "relative", zIndex: 1,
      }}>
        {isDone
          ? <Icon name="check" size={15} stroke={2.6} />
          : isCurrent
          ? <span style={{ width: 8, height: 8, borderRadius: 9999, background: "var(--ps-primary)" }} />
          : <span style={{ width: 8, height: 8, borderRadius: 9999, background: "var(--ps-fg-muted)", opacity: 0.4 }} />
        }
      </span>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{
            fontSize: 14, fontWeight: isCurrent ? 600 : 500, letterSpacing: "-0.005em",
            color: isCurrent ? "var(--ps-fg)" : isDone ? "var(--ps-fg-secondary)" : "var(--ps-fg-secondary)",
          }}>{step.label}</div>
          {isCurrent && <Badge tone="violet">En cours</Badge>}
          {isDone && <span className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>Terminée</span>}
        </div>
        <div className="ps-num" style={{ fontSize: 12, color: "var(--ps-fg-muted)", marginTop: 2 }}>{step.dates}</div>
        {step.desc && (
          <div style={{
            marginTop: 8, padding: "8px 12px",
            background: "var(--ps-primary-subtle)",
            borderRadius: 8, fontSize: 12, color: "var(--ps-primary-deep)",
            fontWeight: 500,
          }}>{step.desc}</div>
        )}
      </div>
    </li>
  );
}

function DeliverableRow({ name, date, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px", borderBottom: last ? "none" : "1px solid var(--ps-border-soft)",
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: "#FEE2E2", color: "#DC2626",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name="file-text" size={14} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 1 }}>{date}</div>
      </div>
      <button style={{ background: "transparent", border: "none", color: "var(--ps-fg-secondary)", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 500 }}>
        <Icon name="download" size={14} stroke={2} />
        Télécharger
      </button>
    </div>
  );
}

Object.assign(window, { ProjectScreen });
