/* Propul'Space — shared primitives.
   Exports to window for cross-script sharing. */

const { useState, useEffect, useRef } = React;

/* ============================== Icon ============================== */
function Icon({ name, size = 18, stroke = 1.9, className = "", style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({ attrs: { width: size, height: size, "stroke-width": stroke } });
    }
  }, [name, size, stroke]);
  return <span ref={ref} className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }} />;
}

/* ============================== Badge ============================== */
function Badge({ tone = "violet", dot = true, children }) {
  return (
    <span className={`ps-badge ps-badge-${tone}`}>
      {dot && <span className="ps-badge-dot" />}
      {children}
    </span>
  );
}

/* ============================== Button ============================== */
function Button({ variant = "primary", size, block, icon, iconRight, children, onClick, type = "button", className = "", style = {} }) {
  const classes = [
    "ps-btn",
    `ps-btn-${variant}`,
    size === "lg" && "ps-btn-lg",
    size === "sm" && "ps-btn-sm",
    block && "ps-btn-block",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button type={type} onClick={onClick} className={classes} style={style}>
      {icon && <Icon name={icon} size={16} stroke={2.2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} stroke={2.4} />}
    </button>
  );
}

/* ============================== KPI Tile ============================== */
function KpiTile({ eyebrow, value, delta, icon, tint = "violet" }) {
  const tints = {
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
    blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
    green:  { bg: "#D1FAE5", fg: "#047857" },
    orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
    red:    { bg: "var(--ps-danger-subtle)", fg: "#991B1B" },
  };
  const t = tints[tint] || tints.violet;
  return (
    <div className="ps-card" style={{ padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span className="ps-eyebrow ps-eyebrow-muted">{eyebrow}</span>
        {icon && (
          <span style={{
            width: 32, height: 32, borderRadius: 8, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: t.bg, color: t.fg,
          }}>
            <Icon name={icon} size={16} stroke={2.2} />
          </span>
        )}
      </div>
      <div className="ps-num" style={{
        fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em",
        lineHeight: 1.05, marginTop: 10, color: "var(--ps-fg)",
      }}>{value}</div>
      {delta && <div style={{ fontSize: 12, color: "var(--ps-fg-muted)", marginTop: 4 }}>{delta}</div>}
    </div>
  );
}

/* ============================== Hero ============================== */
function Hero({ eyebrow, title, subtitle, phasePill }) {
  return (
    <section className="ps-card" style={{ padding: "22px 22px 20px", position: "relative", overflow: "hidden" }}>
      <span className="ps-hero-blur" />
      {eyebrow && <div className="ps-eyebrow">{eyebrow}</div>}
      <h1 className="ps-h1 ps-gradient-text" style={{ marginTop: 4, marginBottom: 6 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: "var(--ps-fg-secondary)", lineHeight: 1.5, margin: "0 0 14px", maxWidth: 460 }}>{subtitle}</p>}
      {phasePill && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 9999,
          background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
          fontSize: 11.5, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--ps-primary)" }} />
          {phasePill}
          <Icon name="arrow-up-right" size={12} stroke={2.6} />
        </span>
      )}
    </section>
  );
}

/* ============================== Progress ============================== */
function Progress({ value, label, valueLabel, success }) {
  return (
    <div>
      {(label || valueLabel != null) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
          {label && <span style={{ color: "var(--ps-fg)", fontWeight: 600 }}>{label}</span>}
          {valueLabel != null && <span className="ps-num" style={{ color: "var(--ps-primary-deep)", fontWeight: 600 }}>{valueLabel}</span>}
        </div>
      )}
      <div className="ps-progress-track">
        <div className="ps-progress-fill" style={{ width: `${value}%`, ...(success ? { background: "var(--ps-success)" } : {}) }} />
      </div>
    </div>
  );
}

/* ============================== Empty state ============================== */
function EmptyState({ icon, title, body, action }) {
  return (
    <div className="ps-card" style={{ padding: 28, textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, margin: "0 auto 12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 9999, background: "var(--ps-bg-subtle)", color: "var(--ps-fg-muted)",
      }}>
        <Icon name={icon} size={24} stroke={1.6} />
      </div>
      <h3 className="ps-h3" style={{ marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ps-fg-secondary)", lineHeight: 1.5, margin: 0, maxWidth: 280, marginInline: "auto" }}>{body}</p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

/* ============================== Skeleton ============================== */
function Skeleton({ w = "100%", h = 12, r = 8, style = {} }) {
  return <div className="ps-skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/* ============================== Section header ============================== */
function SectionHead({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: "1px solid var(--ps-border-soft)" }}>
      <h2 className="ps-h3">{title}</h2>
      {action}
    </div>
  );
}

Object.assign(window, { Icon, Badge, Button, KpiTile, Hero, Progress, EmptyState, Skeleton, SectionHead });
