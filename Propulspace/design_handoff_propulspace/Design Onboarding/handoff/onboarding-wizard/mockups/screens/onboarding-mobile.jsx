/* Propul'Space — Onboarding wizard MOBILE
   Same content as desktop, reflowed for ~375px iPhone width.
   Renders inside IOSDevice via OnbMobileStage. */

const { useState: useStateOnbM } = React;

/* =====================================================
   Mobile shell — full-screen wizard
   ───────────────────────────────────────────────────── */

function OnbMobileShell({ step = 1, total = 5, children, primaryLabel = "Configurer mon espace", showBack = false, dense = false }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#fff", color: "var(--ps-fg)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--ps-font-sans)",
    }}>
      {/* Top bar — sticky */}
      <div style={{
        flexShrink: 0,
        padding: "60px 18px 14px",  /* 60 = approx safe-area for status bar */
        borderBottom: "1px solid var(--ps-border-soft)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="ps-brand-pill" style={{ height: 24, padding: "0 9px", fontSize: 10.5 }}>
            <Icon name="sparkles" size={11} stroke={2.4} />
            Onboarding
          </span>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            border: "none", background: "transparent",
            color: "var(--ps-fg-muted)", fontSize: 11, fontWeight: 500,
            padding: 0, cursor: "pointer",
          }}>
            Plus tard
            <Icon name="x" size={12} stroke={2.2} />
          </button>
        </div>
        <OnbProgressDots step={step} total={total} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ps-primary-deep)" }}>
            Étape {step} / {total}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--ps-fg-muted)" }}>
            ~ {6 - step} min
          </span>
        </div>
      </div>

      {/* Content scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: dense ? "16px 18px 90px" : "20px 18px 90px" }}>
        {children}
      </div>

      {/* Footer sticky */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "12px 18px 28px",
        borderTop: "1px solid var(--ps-border-soft)",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px) saturate(140%)",
        WebkitBackdropFilter: "blur(8px) saturate(140%)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {showBack && (
          <Button variant="outline" size="sm" icon="arrow-left" onClick={() => {}} style={{ flexShrink: 0 }}>
            Préc.
          </Button>
        )}
        <Button variant="primary" block iconRight="arrow-right" onClick={() => {}}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}

/* =====================================================
   Mobile step content — Step 1 Bienvenue (Var B reflowed)
   ───────────────────────────────────────────────────── */

function OnbMobileStep1() {
  return (
    <div className="ps-fade-in">
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 10px 30px -8px rgba(124, 58, 237, 0.45)",
        marginBottom: 14,
      }}>
        <Icon name="sparkles" size={22} stroke={2.2} />
      </div>
      <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 8px" }}>
        Bienvenue,<br/>{ONB_CLIENT.firstName}.
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", lineHeight: 1.55, margin: "0 0 18px" }}>
        On est ravis de démarrer <strong style={{ color: "var(--ps-fg)" }}>{ONB_CLIENT.company}</strong> avec vous. Quelques minutes ensemble pour caler les derniers détails.
      </p>

      {/* Hero card */}
      <div className="ps-card" style={{ padding: 14, marginBottom: 10, position: "relative", overflow: "hidden" }}>
        <span className="ps-hero-blur" style={{ width: 120, height: 120, right: -30, top: -30 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
            color: "#92400e",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700,
            border: "1px solid rgba(120, 90, 30, 0.12)",
            fontFamily: "Georgia, serif", fontStyle: "italic",
          }}>P</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 9, marginBottom: 2 }}>Votre projet</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
              {ONB_CLIENT.company}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ps-fg-secondary)", marginTop: 1 }}>
              {ONB_CLIENT.sector}
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 minis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { e: "Objectif", v: ONB_CLIENT.goal,    i: "target",   t: "blue" },
          { e: "Budget",   v: ONB_CLIENT.budget,  i: "wallet",   t: "green" },
          { e: "Délai",    v: ONB_CLIENT.delay,   i: "calendar", t: "orange" },
          { e: "Modules",  v: ONB_CLIENT.features.length + " à construire", i: "shapes", t: "violet" },
        ].map((c) => {
          const tints = {
            violet: { bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
            blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
            green:  { bg: "#D1FAE5", fg: "#047857" },
            orange: { bg: "var(--ps-warning-subtle)", fg: "#9A3412" },
          };
          const t = tints[c.t];
          return (
            <div key={c.e} className="ps-card" style={{ padding: "10px 12px 9px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 8.5, letterSpacing: "0.12em" }}>{c.e}</span>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={c.i} size={10} stroke={2.2} />
                </span>
              </div>
              <div className="ps-num" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: "var(--ps-fg)" }}>
                {c.v}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modules card */}
      <div className="ps-card" style={{ padding: "10px 12px", marginTop: 8 }}>
        <span className="ps-eyebrow ps-eyebrow-muted" style={{ fontSize: 8.5, letterSpacing: "0.12em", marginBottom: 6, display: "block" }}>Modules à construire</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ONB_CLIENT.features.map((f) => (
            <span key={f} style={{
              fontSize: 10.5, fontWeight: 500,
              padding: "3px 8px", borderRadius: 9999,
              background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   Mobile Step 2 — Coordonnées (form stacked)
   ───────────────────────────────────────────────────── */

function OnbMobileStep2() {
  const fields = [
    { label: "Prénom",    value: ONB_CLIENT.firstName },
    { label: "Nom",       value: ONB_CLIENT.lastName  },
    { label: "Email",     value: ONB_CLIENT.email,    locked: true, hint: "Login · non modifiable" },
    { label: "Téléphone", value: ONB_CLIENT.phone     },
    { label: "Société",   value: ONB_CLIENT.company   },
  ];
  return (
    <div className="ps-fade-in">
      <OnbStepHead dense title="Vos coordonnées" subtitle="On a déjà ça. Vérifiez juste, ajustez si besoin." />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map((f) => (
          <div key={f.label} className="ps-field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="ps-label" style={{ fontSize: 12 }}>{f.label}</label>
              {!f.locked && <OnbPrefilledPill small />}
            </div>
            <div style={{ position: "relative" }}>
              <input className="ps-input" defaultValue={f.value} readOnly={f.locked} style={{
                ...(f.locked ? { background: "var(--ps-bg-subtle)", color: "var(--ps-fg-secondary)", paddingRight: 32 } : {}),
                fontSize: 13, height: 40,
              }} />
              {f.locked && (
                <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ps-fg-muted)" }}>
                  <Icon name="lock" size={12} stroke={2} />
                </span>
              )}
            </div>
            {f.hint && <span style={{ fontSize: 10.5, color: "var(--ps-fg-muted)" }}>{f.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================
   Mobile Step 3 — Préférences (vertical, larger touch)
   ───────────────────────────────────────────────────── */

function OnbMobileStep3() {
  const [channel, setChannel] = useStateOnbM("email");
  const [slots, setSlots]     = useStateOnbM({ morning: false, afternoon: true, evening: false });
  const [notif, setNotif]     = useStateOnbM(true);

  return (
    <div className="ps-fade-in">
      <OnbStepHead dense title="On reste en contact" subtitle="Trois questions rapides — modifiables après depuis Profil." />

      {/* Canal */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ps-primary-deep)" }}>1</span>
          <span className="ps-h2" style={{ fontSize: 13 }}>Canal préféré</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {CHANNELS.map((c) => {
            const active = channel === c.key;
            return (
              <button key={c.key} type="button" onClick={() => setChannel(c.key)} style={{
                padding: "10px 12px", borderRadius: 10,
                background: active ? "var(--ps-primary-subtle)" : "#fff",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: active ? "var(--ps-primary)" : "var(--ps-bg-subtle)",
                  color: active ? "#fff" : "var(--ps-fg-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={c.icon} size={14} stroke={2.2} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? "var(--ps-primary-deep)" : "var(--ps-fg)" }}>{c.label}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ps-fg-muted)" }}>{c.hint}</div>
                </div>
                <span style={{
                  width: 16, height: 16, borderRadius: 9999, flexShrink: 0,
                  border: `2px solid ${active ? "var(--ps-primary)" : "var(--ps-border-strong)"}`,
                  background: active ? "var(--ps-primary)" : "transparent",
                  position: "relative",
                }}>
                  {active && <span style={{ position: "absolute", inset: 3, borderRadius: 9999, background: "#fff" }} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ps-primary-deep)" }}>2</span>
          <span className="ps-h2" style={{ fontSize: 13 }}>Plages</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SLOTS.map((s) => {
            const active = slots[s.key];
            return (
              <button key={s.key} type="button" onClick={() => setSlots({ ...slots, [s.key]: !active })} style={{
                padding: "9px 12px", borderRadius: 10,
                background: active ? "var(--ps-primary-subtle)" : "#fff",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? "var(--ps-primary-deep)" : "var(--ps-fg)" }}>{s.label}</div>
                  <div className="ps-num" style={{ fontSize: 10.5, color: "var(--ps-fg-muted)" }}>{s.sub}</div>
                </div>
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `2px solid ${active ? "var(--ps-primary)" : "var(--ps-border-strong)"}`,
                  background: active ? "var(--ps-primary)" : "transparent",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <Icon name="check" size={9} stroke={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notif */}
      <div style={{
        padding: "11px 13px", borderRadius: 10,
        border: "1px solid var(--ps-border-soft)", background: "var(--ps-bg-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ps-fg)" }}>Notifications email</div>
          <div style={{ fontSize: 10.5, color: "var(--ps-fg-muted)", marginTop: 1, lineHeight: 1.4 }}>Livrables, factures, signatures.</div>
        </div>
        <OnbToggle value={notif} onChange={setNotif} size={20} />
      </div>
    </div>
  );
}

/* =====================================================
   Mobile Step 4 — Tour propriétaire (2-col grid scroll)
   ───────────────────────────────────────────────────── */

function OnbMobileStep4() {
  return (
    <div className="ps-fade-in">
      <OnbStepHead dense title="Votre espace" subtitle="Les 7 sections de Propul'Space." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PORTAL_TABS.map((t) => (
          <div key={t.key} className="ps-card" style={{ padding: "11px 11px 9px" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7,
            }}>
              <Icon name={t.icon} size={13} stroke={2.2} />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ps-fg)", lineHeight: 1.2 }}>{t.title}</div>
            <div style={{ fontSize: 10.5, color: "var(--ps-fg-secondary)", marginTop: 2, lineHeight: 1.35 }}>
              {t.desc.split(".")[0]}.
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, padding: "9px 11px", borderRadius: 9,
        background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
        fontSize: 11, lineHeight: 1.4,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Icon name="sparkles" size={12} stroke={2.2} />
        <span>Bouton bleu en bas à droite : votre raccourci contact n'importe où.</span>
      </div>
    </div>
  );
}

/* =====================================================
   Mobile Step 5 — Tout est prêt
   ───────────────────────────────────────────────────── */

function OnbMobileStep5() {
  return (
    <div className="ps-fade-in" style={{ position: "relative", textAlign: "center", padding: "16px 4px", minHeight: 380, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <OnbConfettiSubtle />
      <div style={{
        width: 56, height: 56, borderRadius: 9999, marginBottom: 18,
        background: "linear-gradient(135deg, var(--ps-primary) 0%, var(--ps-primary-deep) 100%)",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 14px 32px -10px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}>
        <Icon name="check" size={26} stroke={2.6} />
      </div>
      <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 25, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
        Tout est prêt,<br/>{ONB_CLIENT.firstName}.
      </h1>
      <p style={{ fontSize: 13, color: "var(--ps-fg-secondary)", lineHeight: 1.55, margin: "0 0 22px", padding: "0 8px" }}>
        Bienvenue à bord. Votre espace vous attend.
      </p>
      <div style={{
        padding: "10px 12px", borderRadius: 10,
        background: "var(--ps-bg-subtle)",
        fontSize: 11, lineHeight: 1.5, color: "var(--ps-fg-secondary)",
        display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left",
        margin: "0 4px",
      }}>
        <Icon name="info" size={12} stroke={2} style={{ marginTop: 1, flexShrink: 0, color: "var(--ps-primary-deep)" }} />
        <span>Pour démarrer la production, finir <strong style={{ color: "var(--ps-fg)" }}>« Configurez votre projet »</strong> dans le tableau de bord.</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  OnbMobileShell,
  OnbMobileStep1, OnbMobileStep2, OnbMobileStep3, OnbMobileStep4, OnbMobileStep5,
});
