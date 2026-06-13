/* Propul'Space — Mini-mocks for portal tabs
   Used inside Step 4 Var B (carousel spotlight) to show what each
   section actually looks like, not just a dashed placeholder.
   Compact, 1:1 visual identity, no real data — just shape hints. */

/* =====================================================
   1. Tableau de bord — hero + KPI tiles
   ===================================================== */
function OnbPreview_Dashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Hero band */}
      <div style={{
        height: 38, borderRadius: 8,
        background: "linear-gradient(135deg, #fff 0%, #fff 65%, rgba(124,58,237,0.10) 100%)",
        border: "1px solid var(--ps-border-soft)",
        padding: "6px 10px",
        position: "relative", overflow: "hidden",
      }}>
        <span style={{ position: "absolute", right: -8, top: -8, width: 40, height: 40, borderRadius: 9999, background: "radial-gradient(circle, rgba(124,58,237,0.20), transparent 70%)" }} />
        <div style={{ fontSize: 7, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Tableau de bord</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.015em", lineHeight: 1, marginTop: 2 }}>Bon retour, Eméline</div>
      </div>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {[
          { v: "42 h",   c: "var(--ps-primary-deep)" },
          { v: "8",      c: "#1D4ED8" },
          { v: "8 000 €", c: "#047857" },
        ].map((k, i) => (
          <div key={i} style={{
            padding: "5px 7px", borderRadius: 6, border: "1px solid var(--ps-border-soft)",
            background: "#fff",
          }}>
            <div style={{ height: 3, width: 16, background: "var(--ps-bg-subtle)", borderRadius: 2, marginBottom: 3 }} />
            <div className="ps-num" style={{ fontSize: 11, fontWeight: 700, color: k.c, letterSpacing: "-0.015em", lineHeight: 1 }}>{k.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================
   2. Mon projet — timeline of phases
   ===================================================== */
function OnbPreview_Project() {
  const phases = [
    { label: "Devis",      state: "done" },
    { label: "Onboarding", state: "active" },
    { label: "Production", state: "todo" },
    { label: "Livraison",  state: "todo" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Avancement</div>
        <div className="ps-num" style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-fg-muted)" }}>2 / 8 phases</div>
      </div>
      {/* Connector + dots */}
      <div style={{ position: "relative", padding: "8px 0 4px" }}>
        <div style={{ position: "absolute", left: 6, right: 6, top: "50%", height: 2, background: "var(--ps-bg-subtle)", borderRadius: 9999 }} />
        <div style={{ position: "absolute", left: 6, top: "50%", height: 2, width: "30%", background: "var(--ps-primary)", borderRadius: 9999 }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
          {phases.map((p, i) => (
            <div key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 9999,
                background: p.state === "done"
                  ? "var(--ps-primary)"
                  : p.state === "active"
                  ? "#fff"
                  : "var(--ps-bg-subtle)",
                border: p.state === "active" ? "2px solid var(--ps-primary)" : p.state === "todo" ? "1px solid var(--ps-border-strong)" : "none",
                boxShadow: p.state === "active" ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
              }} />
              <span style={{ fontSize: 7.5, fontWeight: p.state === "active" ? 700 : 500, color: p.state === "todo" ? "var(--ps-fg-muted)" : "var(--ps-fg)", marginTop: 4, letterSpacing: "-0.005em" }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   3. Documents — list of doc rows
   ===================================================== */
function OnbPreview_Documents() {
  const docs = [
    { name: "Brief créatif",        date: "Hier"     },
    { name: "Maquettes V1",         date: "12 mai"   },
    { name: "Devis SEO On-Page",    date: "8 mai"    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Documents · 8</div>
        <div style={{
          width: 28, height: 12, borderRadius: 9999,
          background: "var(--ps-bg-subtle)", border: "1px solid var(--ps-border-soft)",
          display: "flex", alignItems: "center", paddingLeft: 4,
        }}>
          <span style={{ width: 5, height: 5, background: "var(--ps-fg-muted)", borderRadius: 9999 }} />
        </div>
      </div>
      {docs.map((d, i) => (
        <div key={d.name} style={{
          padding: "6px 8px", borderRadius: 6, border: "1px solid var(--ps-border-soft)",
          background: "#fff",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="file-text" size={9} stroke={2.2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>{d.name}</div>
          </div>
          <span className="ps-num" style={{ fontSize: 8, color: "var(--ps-fg-muted)" }}>{d.date}</span>
          <Icon name="download" size={9} stroke={2} style={{ color: "var(--ps-fg-muted)" }} />
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   4. Factures — invoice cards with amount + status
   ===================================================== */
function OnbPreview_Invoices() {
  const invoices = [
    { id: "PS-1031", amount: "5 000,00 €", status: "À payer",    tone: "warning", date: "15 juin" },
    { id: "PS-1029", amount: "8 000,00 €", status: "Payée",      tone: "success", date: "12 mai"  },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>Factures</div>
      {invoices.map((inv) => (
        <div key={inv.id} style={{
          padding: "7px 9px", borderRadius: 7, border: "1px solid var(--ps-border-soft)",
          background: "#fff",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 8, color: "var(--ps-fg-muted)" }}>{inv.id}</div>
            <div className="ps-num" style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.015em", lineHeight: 1, marginTop: 1 }}>{inv.amount}</div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 6px", borderRadius: 9999, fontSize: 8, fontWeight: 600, letterSpacing: "-0.005em",
            background: inv.tone === "success" ? "var(--ps-success-subtle)" : "var(--ps-warning-subtle)",
            color: inv.tone === "success" ? "#166534" : "#9A3412",
          }}>
            <span style={{
              width: 4, height: 4, borderRadius: 9999,
              background: inv.tone === "success" ? "var(--ps-success)" : "var(--ps-warning)",
            }} />
            {inv.status}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   5. Signatures — pending docs to sign
   ===================================================== */
function OnbPreview_Signatures() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase" }}>À signer · 1</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 9999, fontSize: 7.5, fontWeight: 700, background: "var(--ps-warning-subtle)", color: "#9A3412" }}>
          <span style={{ width: 4, height: 4, borderRadius: 9999, background: "var(--ps-warning)" }} />
          Action requise
        </span>
      </div>
      <div style={{
        padding: "10px 11px", borderRadius: 8,
        border: "1px solid var(--ps-warning)", background: "#FFFBF5",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: 7,
          background: "var(--ps-warning-subtle)", color: "#9A3412",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name="pen-line" size={13} stroke={2.2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>Contrat de prestation</div>
          <div className="ps-num" style={{ fontSize: 8, color: "var(--ps-fg-muted)", marginTop: 1 }}>Échéance · 20 mai 2026</div>
        </div>
        <span style={{
          padding: "3px 8px", borderRadius: 9999, fontSize: 8.5, fontWeight: 700,
          background: "var(--ps-primary)", color: "#fff", letterSpacing: "-0.005em",
        }}>Signer</span>
      </div>
      <div style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--ps-border-soft)", background: "var(--ps-bg-subtle)", display: "flex", alignItems: "center", gap: 7, opacity: 0.7 }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: "#fff", color: "var(--ps-fg-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check-circle-2" size={9} stroke={2.2} />
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: "var(--ps-fg-muted)", letterSpacing: "-0.005em" }}>NDA signé · 4 mai</span>
      </div>
    </div>
  );
}

/* =====================================================
   6. Profil — avatar + setting rows
   ===================================================== */
function OnbPreview_Profile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>Profil</div>
      <div style={{
        padding: "8px 10px", borderRadius: 7, border: "1px solid var(--ps-border-soft)", background: "#fff",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9999, color: "#fff",
          background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
          fontSize: 9, fontWeight: 700, letterSpacing: "-0.005em",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>ER</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>Eméline Rousseau</div>
          <div style={{ fontSize: 8, color: "var(--ps-fg-muted)" }}>Précieuse Joaillerie</div>
        </div>
      </div>
      {[
        { l: "Coordonnées",    v: "À jour" },
        { l: "Préférences",    v: "Email · matin" },
      ].map((s) => (
        <div key={s.l} style={{
          padding: "5px 9px", borderRadius: 6, border: "1px solid var(--ps-border-soft)", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 9, fontWeight: 500, color: "var(--ps-fg)" }}>{s.l}</span>
          <span style={{ fontSize: 8, color: "var(--ps-fg-muted)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            {s.v}
            <Icon name="chevron-right" size={9} stroke={2.2} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   7. Aide — FAQ items
   ===================================================== */
function OnbPreview_Help() {
  const items = [
    { q: "Quand sera livré mon site ?",        open: true },
    { q: "Comment payer une facture ?",        open: false },
    { q: "Modifier mes coordonnées",           open: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "var(--ps-primary-deep)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Aide & FAQ</div>
        <div style={{
          padding: "1px 6px", borderRadius: 9999, fontSize: 7.5, fontWeight: 600,
          background: "var(--ps-primary)", color: "#fff",
        }}>Contact</div>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: "6px 8px", borderRadius: 6, border: "1px solid var(--ps-border-soft)", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7,
        }}>
          <span style={{ fontSize: 9, fontWeight: it.open ? 700 : 500, color: it.open ? "var(--ps-fg)" : "var(--ps-fg-secondary)" }}>
            {it.q}
          </span>
          <Icon name={it.open ? "chevron-down" : "chevron-right"} size={9} stroke={2.2} style={{ color: it.open ? "var(--ps-primary-deep)" : "var(--ps-fg-muted)" }} />
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   Switcher
   ===================================================== */
function OnbTabPreview({ tabKey }) {
  const map = {
    dashboard:  OnbPreview_Dashboard,
    project:    OnbPreview_Project,
    documents:  OnbPreview_Documents,
    invoices:   OnbPreview_Invoices,
    signatures: OnbPreview_Signatures,
    profile:    OnbPreview_Profile,
    help:       OnbPreview_Help,
  };
  const Comp = map[tabKey] || OnbPreview_Dashboard;
  return (
    <div style={{
      padding: "10px 11px", borderRadius: 9,
      background: "var(--ps-bg-subtle)",
      border: "1px solid var(--ps-border-soft)",
      minHeight: 96,
    }}>
      <Comp />
    </div>
  );
}

Object.assign(window, {
  OnbTabPreview,
  OnbPreview_Dashboard, OnbPreview_Project, OnbPreview_Documents,
  OnbPreview_Invoices, OnbPreview_Signatures, OnbPreview_Profile, OnbPreview_Help,
});
