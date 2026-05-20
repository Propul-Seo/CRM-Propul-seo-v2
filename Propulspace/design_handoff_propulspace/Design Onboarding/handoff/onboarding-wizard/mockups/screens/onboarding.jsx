/* Propul'Space — Onboarding wizard
   Format shells (side-sheet right + full-screen dialog) + Step 1 variants.
   Reuses tokens from ../../colors_and_type.css and primitives from primitives.jsx. */

const { useState: useStateOnb } = React;

/* =====================================================
   Demo client data — Eméline Rousseau / Précieuse Joaillerie
   ===================================================== */

const ONB_CLIENT = {
  firstName: "Eméline",
  lastName: "Rousseau",
  email: "emeline@precieuse-joaillerie.fr",
  phone: "06 72 14 89 03",
  company: "Précieuse Joaillerie",
  sector: "Joaillerie · Bijouterie",
  goal: "Refonte du site + SEO local",
  features: ["E-shop", "Blog SEO", "Prise de RDV", "Avis Google"],
  budget: "12 000 €",
  delay: "Lancement Q3 2026",
};

/* =====================================================
   Backdrop — blurred dashboard behind the wizard
   ===================================================== */

function OnbBackdropDashboard({ blur = 3, opacity = 0.6 }) {
  return (
    <div className="ps-portal" style={{
      position: "absolute", inset: 0,
      filter: `blur(${blur}px)`, opacity, pointerEvents: "none",
    }}>
      <PortalHeader
        clientName={`${ONB_CLIENT.firstName} ${ONB_CLIENT.lastName}`}
        projectName={`${ONB_CLIENT.company} · Onboarding`}
        activeTab="dashboard"
        onTabChange={() => {}}
        onLogout={() => {}}
      />
      <div style={{ padding: "28px 24px 60px", maxWidth: 1152, margin: "0 auto" }}>
        <Hero
          eyebrow="Tableau de bord"
          title="Bienvenue dans votre Propul'Space"
          subtitle="Votre espace projet est presque prêt. Quelques détails à confirmer avant de plonger."
          phasePill="Phase 1 sur 8 · Onboarding"
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18 }}>
          <KpiTile eyebrow="Votre profil" value="60 %" icon="user-circle" tint="violet" />
          <KpiTile eyebrow="Documents" value="0" icon="file-text" tint="blue" />
          <KpiTile eyebrow="Acompte" value="À régler" icon="receipt" tint="orange" />
          <KpiTile eyebrow="Kickoff" value="À planifier" icon="calendar" tint="green" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="ps-card" style={{ padding: 22, minHeight: 220 }}>
            <div className="ps-eyebrow ps-eyebrow-muted">Action requise</div>
            <h3 className="ps-h2" style={{ marginTop: 6 }}>Configurer votre projet</h3>
            <div style={{ height: 8, background: "var(--ps-bg-subtle)", borderRadius: 9999, marginTop: 18 }}>
              <div style={{ width: "20%", height: "100%", background: "linear-gradient(90deg, var(--ps-primary), var(--ps-primary-deep))", borderRadius: 9999 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ps-fg-muted)" }}>1 section sur 4 · 20 %</div>
          </div>
          <div className="ps-card" style={{ padding: 22, minHeight: 220 }}>
            <div className="ps-eyebrow ps-eyebrow-muted">Votre contact</div>
            <h3 className="ps-h2" style={{ marginTop: 6 }}>Lyes Triki</h3>
            <p style={{ fontSize: 13, color: "var(--ps-fg-secondary)", margin: "6px 0 0" }}>
              Directeur de projet · répond sous 1h ouvrée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   Progress indicator — top of wizard
   Style A: thin bar with step counter
   ===================================================== */

function OnbProgress({ step = 1, total = 5, dense = false }) {
  const pct = (step / total) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ps-eyebrow">Étape {step} sur {total}</span>
          <span style={{ width: 4, height: 4, borderRadius: 9999, background: "var(--ps-fg-muted)", opacity: 0.5 }} />
          <span style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", letterSpacing: "-0.005em" }}>
            2 min restantes
          </span>
        </div>
        <span className="ps-num" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ps-primary-deep)" }}>
          {Math.round(pct)} %
        </span>
      </div>
      <div className="ps-progress-track" style={{ height: dense ? 4 : 6 }}>
        <div className="ps-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* Stepped progress with dots (alt style) */
function OnbProgressDots({ step = 1, total = 5 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "active" : "todo";
        return (
          <div key={n} style={{
            flex: 1, height: 4, borderRadius: 9999,
            background: state === "done"
              ? "var(--ps-primary)"
              : state === "active"
              ? "linear-gradient(90deg, var(--ps-primary) 0%, var(--ps-primary-deep) 100%)"
              : "var(--ps-bg-subtle)",
            transition: "background 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }} />
        );
      })}
    </div>
  );
}

/* =====================================================
   FORMAT A — Side-sheet right (520px panel)
   ===================================================== */

function OnbSideSheet({ step = 1, total = 5, children, primaryLabel = "Commencer", secondaryLabel = "Terminer plus tard", onPrimary, onSecondary, showBack = false }) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "var(--ps-bg)" }}>
      <OnbBackdropDashboard blur={2} opacity={0.7} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(24,24,27,0) 0%, rgba(24,24,27,0.06) 40%, rgba(24,24,27,0.18) 100%)",
      }} />

      <aside style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 520,
        background: "#fff",
        borderLeft: "1px solid var(--ps-border-soft)",
        boxShadow: "-24px 0 60px -20px rgba(24,24,27,0.20), -4px 0 12px -2px rgba(24,24,27,0.06)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 28px 18px", borderBottom: "1px solid var(--ps-border-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span className="ps-brand-pill" style={{ height: 26, padding: "0 10px", fontSize: 11 }}>
              <Icon name="sparkles" size={12} stroke={2.4} />
              Onboarding
            </span>
            <button onClick={onSecondary} style={{
              border: "none", background: "transparent",
              color: "var(--ps-fg-muted)", fontSize: 12.5, fontWeight: 500,
              cursor: "pointer", letterSpacing: "-0.005em",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {secondaryLabel}
              <Icon name="x" size={14} stroke={2.2} />
            </button>
          </div>
          <OnbProgress step={step} total={total} />
        </div>

        {/* Content (scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px 12px" }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px 22px",
          borderTop: "1px solid var(--ps-border-soft)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          background: "#fff",
        }}>
          {showBack ? (
            <Button variant="ghost" icon="arrow-left" onClick={() => {}}>Précédent</Button>
          ) : <span />}
          <Button variant="primary" iconRight="arrow-right" onClick={onPrimary}>
            {primaryLabel}
          </Button>
        </div>
      </aside>
    </div>
  );
}

/* =====================================================
   FORMAT B — Full-screen dialog (centered 720px)
   ===================================================== */

/* Backdrop styles for OnbDialog
   - 'dark'   : original sombre #1a1822 (corporate modal)
   - 'light'  : off-white DS, dashboard à peine flouté ("on reste à la maison")
   - 'violet' : dégradé violet doux 92%, pas de dashboard (écrin/atelier)
   - 'dusk'   : sombre adouci vers violet profond #1f1830 (chaleureux)
*/
function OnbDialog({ step = 1, total = 5, children, primaryLabel = "Commencer", primaryHint, secondaryLabel = "Terminer plus tard", onPrimary, onSecondary, showBack = false, width = 720, heightHint, backdrop = "light" }) {
  const isLight = backdrop === "light";
  const isViolet = backdrop === "violet";
  const isDusk = backdrop === "dusk";
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden",
      background: isLight
        ? `radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124, 58, 237, 0.10), transparent 60%),
           radial-gradient(ellipse 60% 40% at 100% 0%, rgba(99, 102, 241, 0.06), transparent 50%),
           var(--ps-bg)`
        : isViolet
        ? `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(167, 139, 250, 0.55), rgba(124, 58, 237, 0.25) 50%, rgba(91, 33, 182, 0.85) 100%),
           linear-gradient(135deg, #2d1f5a 0%, #1f1538 100%)`
        : isDusk
        ? `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(167, 139, 250, 0.18), transparent 60%),
           radial-gradient(ellipse 50% 40% at 90% 90%, rgba(124, 58, 237, 0.14), transparent 60%),
           #1f1830`
        : `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(124, 58, 237, 0.10), transparent 60%),
           radial-gradient(ellipse 50% 40% at 90% 90%, rgba(99, 102, 241, 0.08), transparent 60%),
           #1a1822`,
    }}>
      {/* Dashboard hint underneath. Light = visible barely blurred; dark variants = very faded; violet = none */}
      {!isViolet && (
        <div style={{
          position: "absolute", inset: 0,
          opacity: isLight ? 1 : 0.10,
          filter: isLight ? "blur(3px)" : "blur(14px) saturate(0.6)",
        }}>
          <OnbBackdropDashboard blur={0} opacity={isLight ? 0.7 : 1} />
        </div>
      )}
      <div style={{
        position: "absolute", inset: 0,
        background: isLight
          ? "rgba(255, 255, 255, 0.55)"
          : isViolet
          ? "transparent"
          : isDusk
          ? "rgba(31, 24, 48, 0.55)"
          : "rgba(15, 14, 21, 0.55)",
        backdropFilter: isLight ? "blur(6px) saturate(140%)" : "blur(8px) saturate(140%)",
        WebkitBackdropFilter: isLight ? "blur(6px) saturate(140%)" : "blur(8px) saturate(140%)",
      }} />

      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width, maxWidth: "92%", maxHeight: "92%",
        background: "#fff",
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 50px 100px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 26px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--ps-border-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="ps-brand-pill" style={{ height: 28, padding: "0 11px" }}>
              <Icon name="sparkles" size={13} stroke={2.4} />
              Propul'SEO
            </span>
            <span style={{ width: 1, height: 18, background: "var(--ps-border)" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ps-fg-muted)", letterSpacing: "-0.005em" }}>
              Onboarding · {step}/{total}
            </span>
          </div>
          <button onClick={onSecondary} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: "1px solid var(--ps-border)", background: "#fff",
            color: "var(--ps-fg-secondary)", fontSize: 12, fontWeight: 500,
            height: 30, padding: "0 12px", borderRadius: 9999,
            cursor: "pointer", letterSpacing: "-0.005em",
          }}>
            {secondaryLabel}
            <Icon name="x" size={13} stroke={2.2} />
          </button>
        </div>

        {/* Progress bar (slim) */}
        <div style={{ padding: "0 26px", borderBottom: "1px solid var(--ps-border-soft)" }}>
          <div style={{ padding: "12px 0 14px" }}>
            <OnbProgressDots step={step} total={total} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px 22px", minHeight: heightHint }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 26px 22px",
          borderTop: "1px solid var(--ps-border-soft)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          background: "#fff",
        }}>
          {showBack ? (
            <Button variant="ghost" icon="arrow-left" onClick={() => {}}>Précédent</Button>
          ) : <span />}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {primaryHint && (
              <span style={{ fontSize: 12, color: "var(--ps-fg-muted)", letterSpacing: "-0.005em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="clock" size={12} stroke={2} />
                {primaryHint}
              </span>
            )}
            <Button variant="primary" size="lg" iconRight="arrow-right" onClick={onPrimary}>
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STEP 1 — Variation A : "Carte mémo dense"
   Layout vertical, hero illustration en haut, une seule grosse carte
   récap dense avec toutes les infos qualification.
   Ton : pratique, chaleureux mais sec.
   ===================================================== */

function OnbStep1_VarA({ compact = false }) {
  const lines = [
    { label: "Société",            value: ONB_CLIENT.company,  icon: "building-2" },
    { label: "Secteur",            value: ONB_CLIENT.sector,   icon: "gem" },
    { label: "Objectif principal", value: ONB_CLIENT.goal,     icon: "target" },
    { label: "Fonctionnalités",    value: ONB_CLIENT.features.join(" · "), icon: "shapes" },
    { label: "Budget",             value: ONB_CLIENT.budget,   icon: "wallet" },
    { label: "Délai souhaité",     value: ONB_CLIENT.delay,    icon: "calendar" },
  ];
  return (
    <div className="ps-fade-in">
      {/* Hero illustration placeholder */}
      <div style={{
        height: compact ? 100 : 130, borderRadius: 14,
        background: `
          radial-gradient(ellipse 60% 80% at 80% 50%, rgba(124, 58, 237, 0.28), transparent 60%),
          radial-gradient(ellipse 50% 60% at 20% 80%, rgba(167, 139, 250, 0.22), transparent 60%),
          linear-gradient(135deg, #f5f1ff 0%, #ede9fe 100%)`,
        marginBottom: 22,
        position: "relative", overflow: "hidden",
        border: "1px solid var(--ps-border-soft)",
      }}>
        {/* Abstract geometric placeholder */}
        <svg viewBox="0 0 520 130" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
          <defs>
            <linearGradient id="onb-g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C3AED" stopOpacity="0.45" />
              <stop offset="1" stopColor="#5B21B6" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="onb-g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#A78BFA" stopOpacity="0.35" />
              <stop offset="1" stopColor="#7C3AED" stopOpacity="0.10" />
            </linearGradient>
          </defs>
          <circle cx="430" cy="40" r="64" fill="url(#onb-g1)" />
          <circle cx="380" cy="100" r="36" fill="url(#onb-g2)" />
          <circle cx="84"  cy="90"  r="42" fill="url(#onb-g2)" />
          <rect x="180" y="20" width="60" height="60" rx="14" fill="#fff" opacity="0.55" />
          <rect x="260" y="50" width="40" height="40" rx="10" fill="#fff" opacity="0.40" />
        </svg>
        <div style={{
          position: "absolute", left: 22, bottom: 16,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 9999, background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ps-primary-deep)",
        }}>
          <Icon name="sparkles" size={11} stroke={2.4} />
          Votre espace est prêt
        </div>
      </div>

      {/* Title */}
      <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 28, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        Bienvenue, {ONB_CLIENT.firstName}.
      </h1>
      <p style={{ fontSize: 14.5, color: "var(--ps-fg-secondary)", lineHeight: 1.55, margin: "0 0 22px", maxWidth: 460 }}>
        Votre espace projet est prêt. Quelques minutes pour personnaliser, et on est partis.
      </p>

      {/* Recap card — dense */}
      <div className="ps-card" style={{ padding: "18px 20px 8px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span className="ps-eyebrow">Récap de votre demande</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ps-success)", fontWeight: 600 }}>
            <Icon name="check-circle-2" size={12} stroke={2.4} />
            Pré-rempli depuis votre questionnaire
          </span>
        </div>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr", rowGap: 0 }}>
          {lines.map((l, i) => (
            <div key={l.label} style={{
              display: "grid", gridTemplateColumns: "26px 130px 1fr", alignItems: "center",
              padding: "10px 0",
              borderBottom: i === lines.length - 1 ? "none" : "1px solid var(--ps-border-soft)",
            }}>
              <span style={{ color: "var(--ps-primary-deep)", display: "flex", alignItems: "center" }}>
                <Icon name={l.icon} size={14} stroke={2} />
              </span>
              <dt style={{ fontSize: 12.5, color: "var(--ps-fg-muted)", fontWeight: 500, letterSpacing: "-0.005em" }}>{l.label}</dt>
              <dd className="ps-num" style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>{l.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Reassuring message */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 14px", borderRadius: 10,
        background: "var(--ps-primary-subtle)",
        color: "var(--ps-primary-deep)",
      }}>
        <Icon name="info" size={15} stroke={2.2} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          On a bien tout en tête. Vérifions juste deux ou trois détails ensemble — 2 minutes top chrono.
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   STEP 1 — Variation B : "Split chaleureux"
   Layout 2 colonnes : gauche = salutation chaleureuse,
   droite = récap visuel en mini-cards.
   Ton : carte de bienvenue manuscrite, plus émotionnel.
   ===================================================== */

function OnbStep1_VarB() {
  const cards = [
    { eyebrow: "Société",      value: ONB_CLIENT.company, icon: "building-2",  tint: "violet" },
    { eyebrow: "Secteur",      value: ONB_CLIENT.sector,  icon: "gem",         tint: "violet" },
    { eyebrow: "Objectif",     value: ONB_CLIENT.goal,    icon: "target",      tint: "blue" },
    { eyebrow: "Budget",       value: ONB_CLIENT.budget,  icon: "wallet",      tint: "green" },
    { eyebrow: "Délai",        value: ONB_CLIENT.delay,   icon: "calendar",    tint: "orange" },
    { eyebrow: "À construire", value: ONB_CLIENT.features.length + " modules", icon: "shapes", tint: "violet" },
  ];
  const tints = {
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
    blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
    green:  { bg: "#D1FAE5", fg: "#047857" },
    orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
  };

  return (
    <div className="ps-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 28, alignItems: "stretch" }}>
      {/* LEFT — warm welcome */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px -8px rgba(124, 58, 237, 0.45)",
            marginBottom: 18,
          }}>
            <Icon name="sparkles" size={26} stroke={2.2} />
          </div>
          <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            Bienvenue,<br/>{ONB_CLIENT.firstName}.
          </h1>
          <p style={{ fontSize: 15, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
            On est ravis de démarrer <strong style={{ color: "var(--ps-fg)", fontWeight: 600 }}>{ONB_CLIENT.company}</strong> avec vous.
          </p>
          <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: 0 }}>
            Votre espace est prêt. Quelques minutes ensemble pour vérifier nos infos, caler nos préférences de contact, et vous présenter votre nouveau Propul'Space.
          </p>
        </div>

        <div style={{
          marginTop: 24, padding: "14px 16px", borderRadius: 12,
          border: "1px solid var(--ps-border-soft)", background: "var(--ps-bg-subtle)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9999,
            background: "linear-gradient(135deg, #f59e0b, #b45309)", color: "#fff",
            fontSize: 12, fontWeight: 700, letterSpacing: "-0.005em",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>LT</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>Votre AE — Lyes Triki</div>
            <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", lineHeight: 1.4 }}>« On a tout préparé. À tout de suite, Eméline. »</div>
          </div>
        </div>
      </div>

      {/* RIGHT — visual recap grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="ps-eyebrow">Ce qu'on sait déjà</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ps-success)", fontWeight: 600 }}>
            <Icon name="check-circle-2" size={12} stroke={2.4} />
            Pré-rempli
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {cards.map((c) => {
            const t = tints[c.tint];
            return (
              <div key={c.eyebrow} className="ps-card ps-card-hover" style={{ padding: "14px 14px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5 }}>{c.eyebrow}</span>
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, background: t.bg, color: t.fg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={c.icon} size={13} stroke={2.2} />
                  </span>
                </div>
                <div className="ps-num" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features chips */}
        <div style={{ marginTop: 14, padding: "12px 14px", border: "1px dashed var(--ps-border)", borderRadius: 12 }}>
          <div className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5, marginBottom: 8 }}>Modules à construire</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ONB_CLIENT.features.map((f) => (
              <span key={f} style={{
                fontSize: 11.5, fontWeight: 500, letterSpacing: "-0.005em",
                padding: "4px 10px", borderRadius: 9999,
                background: "#fff", border: "1px solid var(--ps-border)",
                color: "var(--ps-fg)",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--ps-primary)" }} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STEP 1 — Variation B v2 — "Split chaleureux" upgraded
   ─────────────────────────────────────────────────────
   Improvements applied:
   - Right col: 1 hero card (Société + Secteur with logo placeholder)
     + 4 mini cards in 2×2 grid below
   - Modules block: prop `moduleStyle` = 'inline' | 'card'
   - AE attribution line: sober factual, no fake quote
   ===================================================== */

function OnbStep1_VarB_v2({ moduleStyle = "card" }) {
  const minis = [
    { eyebrow: "Objectif",        value: ONB_CLIENT.goal,    icon: "target",   tint: "blue" },
    { eyebrow: "Budget",          value: ONB_CLIENT.budget,  icon: "wallet",   tint: "green" },
    { eyebrow: "Délai",           value: ONB_CLIENT.delay,   icon: "calendar", tint: "orange" },
    { eyebrow: "Modules",         value: ONB_CLIENT.features.length + " à construire", icon: "shapes", tint: "violet" },
  ];
  const tints = {
    violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
    blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
    green:  { bg: "#D1FAE5", fg: "#047857" },
    orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
  };

  return (
    <div className="ps-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 28, alignItems: "stretch" }}>
      {/* LEFT — warm welcome */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px -8px rgba(124, 58, 237, 0.45)",
            marginBottom: 18,
          }}>
            <Icon name="sparkles" size={26} stroke={2.2} />
          </div>
          <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
            Bienvenue,<br/>{ONB_CLIENT.firstName}.
          </h1>
          <p style={{ fontSize: 15, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>
            On est ravis de démarrer <strong style={{ color: "var(--ps-fg)", fontWeight: 600 }}>{ONB_CLIENT.company}</strong> avec vous.
          </p>
          <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: 0 }}>
            Votre espace est prêt. Quelques minutes ensemble pour vérifier nos infos, caler vos préférences, et vous présenter votre nouveau Propul'Space.
          </p>
        </div>

        {/* Sober AE attribution — no fake quote */}
        <div style={{
          marginTop: 24, padding: "12px 14px", borderRadius: 12,
          border: "1px solid var(--ps-border-soft)", background: "var(--ps-bg-subtle)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9999,
            background: "linear-gradient(135deg, #f59e0b, #b45309)", color: "#fff",
            fontSize: 11.5, fontWeight: 700, letterSpacing: "-0.005em",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>LT</div>
          <div style={{ minWidth: 0, lineHeight: 1.35 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>Lyes Triki · votre AE</div>
            <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>Suit votre dossier depuis le devis · répond sous 1 h ouvrée</div>
          </div>
        </div>
      </div>

      {/* RIGHT — hero card + 2×2 minis (+ optional module card) */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="ps-eyebrow">Récap de votre demande</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 9999,
            fontSize: 10.5, color: "var(--ps-success)", fontWeight: 600,
            background: "var(--ps-success-subtle)",
          }}>
            <Icon name="check-circle-2" size={11} stroke={2.6} />
            Pré-rempli
          </span>
        </div>

        {/* Hero card — Société + Secteur */}
        <div className="ps-card" style={{ padding: "16px 16px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
          <span className="ps-hero-blur" style={{ width: 160, height: 160, right: -40, top: -40 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            {/* Logo placeholder — abstract monogram */}
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
              color: "#92400e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em",
              border: "1px solid rgba(120, 90, 30, 0.12)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
            }}>P</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5, marginBottom: 4 }}>Votre projet</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ps-fg)", lineHeight: 1.2 }}>
                {ONB_CLIENT.company}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ps-fg-secondary)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="gem" size={12} stroke={2} />
                {ONB_CLIENT.sector}
              </div>
            </div>
          </div>
        </div>

        {/* 2×2 mini-cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {minis.map((c) => {
            const t = tints[c.tint];
            return (
              <div key={c.eyebrow} className="ps-card" style={{ padding: "12px 14px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5 }}>{c.eyebrow}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, background: t.bg, color: t.fg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={c.icon} size={12} stroke={2.2} />
                  </span>
                </div>
                <div className="ps-num" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modules block — two styles */}
        {moduleStyle === "card" ? (
          <div className="ps-card" style={{ padding: "12px 14px", marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5 }}>Modules à construire</span>
              <span style={{ fontSize: 11, color: "var(--ps-fg-muted)" }}>{ONB_CLIENT.features.length} modules</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ONB_CLIENT.features.map((f) => (
                <span key={f} style={{
                  fontSize: 11.5, fontWeight: 500, letterSpacing: "-0.005em",
                  padding: "4px 10px", borderRadius: 9999,
                  background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--ps-primary)" }} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Inline below objective row — no separate block */
          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", padding: "0 2px" }}>
            <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9.5, flexShrink: 0 }}>Modules :</span>
            {ONB_CLIENT.features.map((f, i) => (
              <React.Fragment key={f}>
                <span style={{ fontSize: 12.5, color: "var(--ps-fg)", fontWeight: 500, letterSpacing: "-0.005em" }}>{f}</span>
                {i < ONB_CLIENT.features.length - 1 && <span style={{ color: "var(--ps-fg-muted)" }}>·</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  ONB_CLIENT,
  OnbBackdropDashboard,
  OnbProgress, OnbProgressDots,
  OnbSideSheet, OnbDialog,
  OnbStep1_VarA, OnbStep1_VarB, OnbStep1_VarB_v2,
});
