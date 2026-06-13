/* Shared status-page primitive — used by vues 13/16/17/18/19/20/22 */
/* All share: centered card max-width 460-520px, icon bubble, gradient title, body, CTA(s) */

function StatusPage({
  shellUrl = "espace.propulseo-site.com",
  showPortalHeader = false,
  iconName,
  iconTone = "violet",
  title,
  subtitle,
  details,
  primaryCta,
  primaryHref = "#",
  secondaryCta,
  secondaryHref = "#",
  footnote,
  cardWidth = 480,
  cardTint,
  customBadge,
}) {
  const tones = {
    violet:  { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)", filled: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))" },
    green:   { bg: "#D1FAE5",                  fg: "#047857",                filled: "linear-gradient(135deg, #16A34A, #047857)" },
    orange:  { bg: "var(--ps-warning-subtle)", fg: "#9A3412",                filled: "linear-gradient(135deg, #EA580C, #9A3412)" },
    red:     { bg: "var(--ps-danger-subtle)",  fg: "#991B1B",                filled: "linear-gradient(135deg, #DC2626, #991B1B)" },
    gray:    { bg: "var(--ps-bg-subtle)",      fg: "var(--ps-fg-secondary)", filled: "linear-gradient(135deg, #52525B, #18181B)" },
  };
  const t = tones[iconTone] || tones.violet;

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", minHeight: showPortalHeader ? "auto" : 720 }}>
      <div className="ps-card" style={{ width: "100%", maxWidth: cardWidth, padding: "40px 36px 32px", textAlign: "center", position: "relative", overflow: "hidden", ...(cardTint ? { background: cardTint } : {}) }}>
        <span className="ps-hero-blur" style={{ width: 300, height: 300, right: "50%", top: -180, transform: "translateX(50%)", opacity: 0.6 }} />
        <div style={{ position: "relative" }}>
          {/* Icon */}
          <div style={{
            width: 72, height: 72, margin: "0 auto 18px", borderRadius: 9999,
            background: iconTone === "violet" || iconTone === "green" ? t.filled : t.bg,
            color: iconTone === "violet" || iconTone === "green" ? "#fff" : t.fg,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: iconTone === "violet" ? "0 12px 30px -8px rgba(124,58,237,0.5)"
                       : iconTone === "green" ? "0 12px 30px -8px rgba(16,163,74,0.45)"
                       : "none",
          }}>
            <Icon name={iconName} size={30} stroke={iconTone === "violet" || iconTone === "green" ? 2.4 : 2.2} />
          </div>

          {/* Optional badge */}
          {customBadge}

          {/* Title */}
          <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 28, margin: 0, lineHeight: 1.2 }}>{title}</h1>

          {/* Subtitle */}
          {subtitle && (
            <p style={{ fontSize: 14.5, color: "var(--ps-fg-secondary)", margin: "14px auto 0", maxWidth: 380, lineHeight: 1.55 }}>{subtitle}</p>
          )}

          {/* Details box */}
          {details && (
            <div style={{
              marginTop: 22, padding: "14px 16px",
              background: "var(--ps-bg-subtle)", borderRadius: 12,
              fontSize: 13, color: "var(--ps-fg-secondary)", lineHeight: 1.55,
              textAlign: "left",
            }}>{details}</div>
          )}

          {/* CTAs */}
          {(primaryCta || secondaryCta) && (
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {primaryCta && (
                <a href={primaryHref} style={{ textDecoration: "none", width: "100%" }}>
                  <button className="ps-btn ps-btn-primary ps-btn-lg ps-btn-block">{primaryCta}<Icon name="arrow-up-right" size={14} stroke={2.6} /></button>
                </a>
              )}
              {secondaryCta && (
                <a href={secondaryHref} style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ps-fg-muted)", textDecoration: "none", marginTop: 6 }}>
                  {secondaryCta}
                </a>
              )}
            </div>
          )}

          {/* Footnote */}
          {footnote && (
            <div style={{ marginTop: 20, fontSize: 11.5, color: "var(--ps-fg-muted)" }}>{footnote}</div>
          )}
        </div>
      </div>
    </div>
  );

  if (showPortalHeader) {
    return <DesktopWindow url={shellUrl} activeTab="dashboard" withFab={false} minHeight={720}>{inner}</DesktopWindow>;
  }

  return (
    <PublicWindow url={shellUrl} minHeight={720}>
      <div className="ps-portal" style={{ minHeight: 720 }}>{inner}</div>
    </PublicWindow>
  );
}

/* Shared AlertDialog primitive — used by vues 25-28 */
function AlertDialogPreview({
  iconName,
  iconTone = "red",
  title,
  description,
  fields,            // optional ReactNode (e.g. reason textarea)
  cancelLabel = "Annuler",
  confirmLabel,
  confirmTone = "danger",
  backgroundShellTab = "dashboard",  // tab to show grayed behind
  adminMode = false,
  backgroundShellRender = null,      // override the background entirely
}) {
  const tones = {
    red:    { bg: "var(--ps-danger-subtle)",  fg: "#991B1B" },
    orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
  };
  const t = tones[iconTone];

  const dialog = (
    <div style={{
      position: "relative", zIndex: 26,
      width: 440, background: "#fff",
      borderRadius: 16,
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.04)",
      padding: 24,
      animation: "ps-fade-up 200ms cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ display: "flex", gap: 14 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 9999, flexShrink: 0,
          background: t.bg, color: t.fg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={iconName} size={18} stroke={2.4} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ps-h3" style={{ fontSize: 16, marginBottom: 4 }}>{title}</div>
          <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", margin: 0, lineHeight: 1.55 }}>{description}</p>
        </div>
      </div>

      {fields && (
        <div style={{ marginTop: 18 }}>
          {fields}
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="ps-btn ps-btn-ghost">{cancelLabel}</button>
        <button className={`ps-btn ps-btn-${confirmTone}`}>{confirmLabel}</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>
      {/* Background — blurred */}
      <div style={{ filter: "blur(2px)", opacity: 0.55, pointerEvents: "none" }}>
        {backgroundShellRender || (adminMode
          ? <AdminWindow><AdminShell activeKey="leads" title="Background"><div style={{ height: 600 }} /></AdminShell></AdminWindow>
          : <DesktopWindow activeTab={backgroundShellTab} minHeight={600} withFab={false}><div style={{ height: 400 }} /></DesktopWindow>
        )}
      </div>

      {/* Backdrop + dialog */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 25,
        background: "rgba(24,24,27,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {dialog}
      </div>
    </div>
  );
}

Object.assign(window, { StatusPage, AlertDialogPreview });
