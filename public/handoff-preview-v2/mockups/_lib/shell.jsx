/* PortalShell — header + tabs (desktop) / bottom nav (mobile) + FAB.
   Mirrors PortalLayout.tsx upstream. */

const { useState: useStateShell } = React;

const SHELL_TABS = [
  { key: "dashboard",  label: "Accueil",    icon: "layout-dashboard", primary: true },
  { key: "project",    label: "Projet",     icon: "folder-kanban",    primary: true },
  { key: "documents",  label: "Documents",  icon: "file-text",        primary: true },
  { key: "invoices",   label: "Factures",   icon: "receipt",          primary: true },
  { key: "signatures", label: "Signatures", icon: "pen-line",         primary: false },
  { key: "help",       label: "Aide",       icon: "help-circle",      primary: false },
];

function getInitials(name) {
  return (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(p => (p[0] || "").toUpperCase()).join("") || "?";
}

/* ============================== Desktop header + tabs ============================== */
function PortalHeader({ clientName, projectName, activeTab, onTabChange, onLogout, compact = false }) {
  return (
    <header className="ps-frosted" style={{
      position: "sticky", top: 0, zIndex: 20,
      borderBottom: "1px solid var(--ps-border-soft)",
    }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="ps-brand-pill">
            <Icon name="sparkles" size={13} stroke={2.4} />
            Propul'SEO
          </span>
          <span style={{ width: 1, height: 20, background: "var(--ps-border)" }} />
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ps-fg-muted)" }}>
            Espace client
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.005em" }}>{clientName}</div>
            {projectName && <div style={{ fontSize: 11, color: "var(--ps-fg-muted)", lineHeight: 1.1 }}>{projectName}</div>}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 9999, color: "#fff",
            background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
            boxShadow: "0 0 0 2px var(--ps-primary-subtle), 0 0 0 4px #fff",
          }}>{getInitials(clientName)}</div>
          <Button variant="ghost" className="ps-btn-icon" onClick={onLogout}>
            <Icon name="log-out" size={15} stroke={2} />
          </Button>
        </div>
      </div>
      {!compact && (
        <nav style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", gap: 2 }}>
          {SHELL_TABS.map(tab => {
            const active = tab.key === activeTab;
            return (
              <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px", marginBottom: 8, marginTop: 2,
                borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "var(--ps-font-sans)",
                fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: "-0.005em",
                background: active ? "var(--ps-primary-subtle)" : "transparent",
                color: active ? "var(--ps-primary-deep)" : "var(--ps-fg-secondary)",
                boxShadow: active ? "inset 0 0 0 1px rgba(124,58,237,0.12)" : "none",
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}>
                <Icon name={tab.icon} size={15} stroke={active ? 2.4 : 1.9} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}

/* ============================== Mobile bottom nav ============================== */
function MobileBottomNav({ activeTab, onTabChange }) {
  const primary = SHELL_TABS.filter(t => t.primary);
  return (
    <nav className="ps-frosted" style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      borderTop: "1px solid var(--ps-border-soft)",
      display: "flex", padding: "6px 4px 8px",
      paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
    }}>
      {primary.map(tab => {
        const active = tab.key === activeTab;
        return (
          <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "6px 0", border: "none", background: "transparent", cursor: "pointer",
            color: active ? "var(--ps-primary-deep)" : "var(--ps-fg-muted)",
            transition: "color 200ms",
          }}>
            <span style={{
              width: 44, height: 26, borderRadius: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "var(--ps-primary-subtle)" : "transparent",
              transition: "background 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <Icon name={tab.icon} size={18} stroke={active ? 2.4 : 1.9} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, letterSpacing: "-0.005em" }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ============================== Mobile top bar (compact) ============================== */
function MobileTopBar({ clientName, projectName }) {
  return (
    <header className="ps-frosted" style={{
      position: "sticky", top: 0, zIndex: 5,
      borderBottom: "1px solid var(--ps-border-soft)",
      padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span className="ps-brand-pill" style={{ height: 28, padding: "0 10px", fontSize: 11 }}>
        <Icon name="sparkles" size={12} stroke={2.4} />
        Propul'SEO
      </span>
      <div style={{
        width: 30, height: 30, borderRadius: 9999, color: "#fff",
        background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
        boxShadow: "0 0 0 2px var(--ps-primary-subtle)",
      }}>{getInitials(clientName)}</div>
    </header>
  );
}

/* ============================== Contact FAB ============================== */
function ContactFab({ onClick, style = {} }) {
  return (
    <button className="ps-fab" onClick={onClick} aria-label="Contacter Propul'SEO" style={style}>
      <Icon name="message-circle" size={22} stroke={2.1} />
    </button>
  );
}

Object.assign(window, { PortalHeader, MobileBottomNav, MobileTopBar, ContactFab, SHELL_TABS });
