/* DesktopShell — shared macOS-style window with PortalHeader for client vues. */

function DesktopWindow({ children, url = "espace.propulseo-site.com", showHeader = true, activeTab = "dashboard", withFab = true, minHeight = 760, contentPadding = "32px 28px 80px" }) {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",
      background: "#fff",
    }}>
      <div style={{
        height: 36, background: "#f7f4ef",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
      }}>
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#FF5F57" }} />
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#FEBC2E" }} />
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#28C840" }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#8a8478" }}>{url}</span>
        <span style={{ width: 40 }} />
      </div>
      <div className="ps-portal" style={{ minHeight, position: "relative" }}>
        {showHeader && (
          <PortalHeader
            clientName="Sophie Martin"
            projectName="Précieuse Joaillerie · Refonte SEO"
            activeTab={activeTab}
            onTabChange={() => {}}
            onLogout={() => {}}
          />
        )}
        <div style={{ padding: contentPadding }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {children}
          </div>
        </div>
        {withFab && <ContactFab style={{ position: "absolute", right: 28, bottom: 28, zIndex: 30 }} />}
      </div>
    </div>
  );
}

/* Standalone window — no portal header, for public pages (login, qualif, thank-you) */
function PublicWindow({ children, url = "propulseo-site.com/diagnostic", minHeight = 760 }) {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",
      background: "#fff",
    }}>
      <div style={{
        height: 36, background: "#f7f4ef",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
      }}>
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#FF5F57" }} />
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#FEBC2E" }} />
        <span style={{ width: 11, height: 11, borderRadius: 9999, background: "#28C840" }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#8a8478" }}>{url}</span>
        <span style={{ width: 40 }} />
      </div>
      <div className="ps-portal" style={{ minHeight, position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

/* Page-head — used by every vue-XX.html for the "Vue X / 12" header */
function PageHead({ num, title, subtitle }) {
  return (
    <div style={{ maxWidth: 1340, margin: "0 auto 28px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ps-primary-deep)" }}>
        Vue {num} / 12
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 6px", color: "#2a2418" }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: "#6b6357", margin: 0, maxWidth: 760, lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  );
}

Object.assign(window, { DesktopWindow, PublicWindow, PageHead });
