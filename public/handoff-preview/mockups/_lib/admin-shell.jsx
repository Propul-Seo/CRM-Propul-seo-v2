/* AdminShell — dark CRM sidebar + content */

const ADMIN_NAV = [
  { key: "dashboard",  label: "Dashboard",        icon: "layout-dashboard" },
  { key: "leads",      label: "Leads qualifiés",  icon: "users",       active: true, badge: 3 },
  { key: "crm",        label: "CRM",              icon: "kanban-square" },
  { key: "projects",   label: "Projets",          icon: "folder-kanban" },
  { key: "portals",    label: "Portails clients", icon: "sparkles",    sub: true, badge: 2 },
  { key: "accounting", label: "Comptabilité",     icon: "calculator" },
  { key: "comm",       label: "Communication",    icon: "megaphone" },
  { key: "calendar",   label: "Calendrier",       icon: "calendar" },
];

function AdminShell({ activeKey = "leads", title, breadcrumb, headerActions, children }) {
  return (
    <div className="ps-admin" style={{ display: "flex", minHeight: 760, position: "relative" }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 232, background: "var(--a-bg-0)",
        borderRight: "1px solid var(--a-border)",
        padding: "16px 12px 24px",
        display: "flex", flexDirection: "column", gap: 4,
        position: "relative", zIndex: 1,
      }}>
        {/* Brand */}
        <div style={{ padding: "8px 8px 14px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, var(--a-neon), var(--a-neon-deep))",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px -2px rgba(139, 92, 246, 0.4)",
          }}>
            <Icon name="sparkles" size={15} stroke={2.4} />
          </span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--a-fg)", letterSpacing: "-0.01em" }}>Propul'SEO</div>
            <div style={{ fontSize: 10.5, color: "var(--a-fg-muted)" }}>CRM Admin</div>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--a-border)", margin: "2px 0 6px" }} />

        {ADMIN_NAV.map(n => {
          const active = n.key === activeKey || n.active;
          return (
            <button key={n.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: n.sub ? "8px 10px 8px 26px" : "8px 10px",
              borderRadius: 7, border: "none", cursor: "pointer",
              background: active ? "rgba(139, 92, 246, 0.15)" : "transparent",
              color: active ? "var(--a-neon-light)" : "var(--a-fg-2)",
              fontFamily: "var(--ps-font-sans)",
              fontSize: 12.5, fontWeight: active ? 600 : 500,
              letterSpacing: "-0.005em",
              transition: "all 150ms",
              boxShadow: active ? "inset 0 0 0 1px rgba(139, 92, 246, 0.20)" : "none",
            }}>
              <Icon name={n.icon} size={14} stroke={active ? 2.4 : 1.9} />
              <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
              {n.badge && <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999,
                background: "rgba(239, 68, 68, 0.18)", color: "#F87171",
                fontVariantNumeric: "tabular-nums",
              }}>{n.badge}</span>}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* User */}
        <div style={{
          padding: 10, borderRadius: 9, background: "var(--a-bg-2)",
          display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--a-border)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9999,
            background: "linear-gradient(135deg, #f59e0b, #b45309)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>LT</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-fg)" }}>Lyes Triki</div>
            <div style={{ fontSize: 10.5, color: "var(--a-fg-muted)" }}>Admin</div>
          </div>
          <Icon name="more-vertical" size={13} stroke={2} style={{ color: "var(--a-fg-muted)" }} />
        </div>
      </aside>

      {/* CONTENT */}
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div className="a-radial-bg" />
        <div style={{ position: "relative", zIndex: 1, padding: "20px 28px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
            <div>
              {breadcrumb && <div style={{ fontSize: 11.5, color: "var(--a-fg-muted)", marginBottom: 4 }}>{breadcrumb}</div>}
              <h1 className="a-h1">{title}</h1>
            </div>
            {headerActions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminWindow({ children }) {
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)",
      background: "#000",
    }}>
      <div style={{
        height: 32, background: "#1c1530",
        borderBottom: "1px solid rgba(139,92,246,0.18)",
        display: "flex", alignItems: "center", padding: "0 12px", gap: 7,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: "#FF5F57" }} />
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: "#FEBC2E" }} />
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: "#28C840" }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>app.propulseo-crm.fr</span>
        <span style={{ width: 36 }} />
      </div>
      {children}
    </div>
  );
}

/* KPI tile for admin (dark variant) */
function AdminKpi({ label, value, sub, tone = "violet", icon }) {
  const tones = {
    violet: "var(--a-neon-light)",
    green:  "#34D399",
    amber:  "#FCD34D",
    red:    "#F87171",
    blue:   "#60A5FA",
  };
  return (
    <div className="a-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="a-eyebrow" style={{ color: "var(--a-fg-muted)" }}>{label}</span>
        {icon && <Icon name={icon} size={14} stroke={2} style={{ color: tones[tone] }} />}
      </div>
      <div className="ps-num" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--a-fg)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--a-fg-muted)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { AdminShell, AdminWindow, AdminKpi });
