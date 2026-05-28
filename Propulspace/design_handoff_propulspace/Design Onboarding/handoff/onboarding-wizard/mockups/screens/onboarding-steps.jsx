/* Propul'Space — Onboarding wizard steps 2 → 5
   Each step has Var A / Var B + a mobile-friendly compact rendering toggle.
   Depends on primitives.jsx + onboarding.jsx (Icon, Button, OnbDialog, ONB_CLIENT). */

const { useState: useStateStep } = React;

/* =====================================================
   PORTAL TABS — 7 sections to introduce in Step 4
   ===================================================== */

const PORTAL_TABS = [
  { key: "dashboard",   icon: "layout-dashboard", title: "Tableau de bord", desc: "Vue d'ensemble · KPI, actions, dernière activité." },
  { key: "project",     icon: "folder-kanban",    title: "Mon projet",      desc: "Timeline des 8 phases et avancement détaillé." },
  { key: "documents",   icon: "file-text",        title: "Documents",       desc: "Livrables, briefs, ressources partagées." },
  { key: "invoices",    icon: "receipt",          title: "Factures",        desc: "Suivi des paiements et acomptes." },
  { key: "signatures",  icon: "pen-line",         title: "Signatures",      desc: "Documents à signer électroniquement." },
  { key: "profile",     icon: "user-circle",      title: "Profil",          desc: "Vos infos, préférences et accès." },
  { key: "help",        icon: "help-circle",      title: "Aide",            desc: "Questions fréquentes et contact direct." },
];

/* =====================================================
   Shared bits — eyebrow + title for steps
   ===================================================== */

function OnbStepHead({ eyebrow = "Étape", title, subtitle, dense = false }) {
  return (
    <div style={{ marginBottom: dense ? 18 : 22 }}>
      {eyebrow && <div className="ps-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
      <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: dense ? 22 : 26, letterSpacing: "-0.025em", margin: "0 0 6px" }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", lineHeight: 1.55, margin: 0, maxWidth: 540 }}>{subtitle}</p>}
    </div>
  );
}

/* "Pré-rempli" pill */
function OnbPrefilledPill({ small = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 7px" : "3px 9px", borderRadius: 9999,
      fontSize: small ? 10 : 10.5, fontWeight: 600, letterSpacing: "-0.005em",
      background: "var(--ps-success-subtle)", color: "var(--ps-success)",
    }}>
      <Icon name="check-circle-2" size={small ? 10 : 11} stroke={2.6} />
      Pré-rempli
    </span>
  );
}

/* =====================================================
   STEP 2 — Vos coordonnées
   ───────────────────────────────────────────────────── */

/* Variation A — Formulaire classique, champs stackés vertical, pills "Pré-rempli" */
function OnbStep2_VarA() {
  const fields = [
    { label: "Prénom",   value: ONB_CLIENT.firstName, prefilled: true,  readOnly: false },
    { label: "Nom",      value: ONB_CLIENT.lastName,  prefilled: true,  readOnly: false },
    { label: "Email",    value: ONB_CLIENT.email,     prefilled: true,  readOnly: true, hint: "Votre email de connexion · non modifiable" },
    { label: "Téléphone",value: ONB_CLIENT.phone,     prefilled: true,  readOnly: false },
    { label: "Société",  value: ONB_CLIENT.company,   prefilled: true,  readOnly: false },
  ];
  return (
    <div className="ps-fade-in">
      <OnbStepHead title="Vos coordonnées" subtitle="On a déjà ça depuis votre demande. Vérifiez juste si tout est bon — un coup d'œil suffit." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {fields.map((f, i) => (
          <div key={f.label} className="ps-field" style={{ gridColumn: f.label === "Email" || f.label === "Société" ? "1 / -1" : "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <label className="ps-label">{f.label}</label>
              {f.prefilled && <OnbPrefilledPill small />}
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="ps-input"
                defaultValue={f.value}
                readOnly={f.readOnly}
                style={f.readOnly ? {
                  background: "var(--ps-bg-subtle)", color: "var(--ps-fg-secondary)",
                  paddingRight: 36, cursor: "not-allowed",
                } : {}}
              />
              {f.readOnly && (
                <span style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--ps-fg-muted)",
                  display: "inline-flex", alignItems: "center",
                }}>
                  <Icon name="lock" size={14} stroke={2} />
                </span>
              )}
            </div>
            {f.hint && <span style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>{f.hint}</span>}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px", borderRadius: 10,
        background: "var(--ps-bg-subtle)", color: "var(--ps-fg-secondary)",
        fontSize: 12.5, lineHeight: 1.5,
      }}>
        <Icon name="shield-check" size={14} stroke={2} style={{ marginTop: 2, flexShrink: 0, color: "var(--ps-fg-muted)" }} />
        <span>Vos coordonnées restent privées. On les utilise uniquement pour vous joindre dans le cadre du projet.</span>
      </div>
    </div>
  );
}

/* Variation B — Carte d'identité visuelle, tout en un, clic = édition inline */
function OnbStep2_VarB() {
  const lines = [
    { label: "Prénom",    value: ONB_CLIENT.firstName, icon: "user",     editable: true },
    { label: "Nom",       value: ONB_CLIENT.lastName,  icon: "user",     editable: true },
    { label: "Email",     value: ONB_CLIENT.email,     icon: "mail",     editable: false, hint: "Login" },
    { label: "Téléphone", value: ONB_CLIENT.phone,     icon: "phone",    editable: true },
    { label: "Société",   value: ONB_CLIENT.company,   icon: "building", editable: true },
  ];
  return (
    <div className="ps-fade-in">
      <OnbStepHead title="Vos coordonnées" subtitle="Voici votre carte. Un clic sur une ligne pour modifier." />

      <div className="ps-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Card header */}
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, var(--ps-primary-subtle) 0%, #fff 70%)",
          borderBottom: "1px solid var(--ps-border-soft)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 9999, color: "#fff",
            background: "linear-gradient(135deg, var(--ps-primary), var(--ps-primary-deep))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
            boxShadow: "0 4px 12px -2px rgba(124,58,237,0.35)",
            flexShrink: 0,
          }}>ER</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ps-fg)" }}>
              {ONB_CLIENT.firstName} {ONB_CLIENT.lastName}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ps-fg-secondary)", marginTop: 2 }}>
              {ONB_CLIENT.company} · client depuis le 12 mai 2026
            </div>
          </div>
          <OnbPrefilledPill />
        </div>
        {/* Field rows */}
        <div>
          {lines.map((l, i) => (
            <div key={l.label} style={{
              display: "grid", gridTemplateColumns: "26px 110px 1fr 24px", alignItems: "center",
              padding: "13px 20px", gap: 12,
              borderBottom: i === lines.length - 1 ? "none" : "1px solid var(--ps-border-soft)",
              cursor: l.editable ? "pointer" : "default",
              transition: "background 150ms",
            }}>
              <span style={{ color: "var(--ps-fg-muted)", display: "flex", alignItems: "center" }}>
                <Icon name={l.icon} size={14} stroke={2} />
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ps-fg-muted)", fontWeight: 500 }}>{l.label}</span>
              <span className="ps-num" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>
                {l.value}
                {l.hint && (
                  <span style={{ fontSize: 11, color: "var(--ps-fg-muted)", marginLeft: 8, fontWeight: 500 }}>
                    · {l.hint}
                  </span>
                )}
              </span>
              <span style={{ color: l.editable ? "var(--ps-fg-muted)" : "var(--ps-fg-muted)", opacity: l.editable ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <Icon name={l.editable ? "pencil" : "lock"} size={12} stroke={2} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "var(--ps-fg-muted)", margin: "12px 2px 0", lineHeight: 1.5 }}>
        Email non modifiable — c'est votre identifiant de connexion. Pour le changer, contactez votre AE.
      </p>
    </div>
  );
}

/* =====================================================
   STEP 3 — Préférences de communication
   ───────────────────────────────────────────────────── */

const CHANNELS = [
  { key: "email",    label: "Email",        icon: "mail",          hint: "Pratique · trace écrite" },
  { key: "phone",    label: "Téléphone",    icon: "phone",         hint: "Direct · pour les sujets sensibles" },
  { key: "whatsapp", label: "WhatsApp",     icon: "message-square",hint: "Rapide · pour le quotidien" },
];

const SLOTS = [
  { key: "morning",   label: "Matin",       sub: "8 h – 12 h" },
  { key: "afternoon", label: "Après-midi",  sub: "14 h – 18 h" },
  { key: "evening",   label: "Soir",        sub: "18 h – 20 h" },
];

/* Variation A — Spacious, 1 question par section, large radio cards */
function OnbStep3_VarA() {
  const [channel, setChannel]   = useStateStep("email");
  const [slots, setSlots]       = useStateStep({ morning: false, afternoon: true, evening: false });
  const [notif, setNotif]       = useStateStep(true);

  return (
    <div className="ps-fade-in">
      <OnbStepHead title="Comment on reste en contact ?" subtitle="Histoire de vous joindre au bon moment, par le bon canal." />

      {/* Q1 — Canal préféré */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-primary-deep)" }}>1</span>
          <span className="ps-h2" style={{ fontSize: 14.5 }}>Canal préféré</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {CHANNELS.map((c) => {
            const active = channel === c.key;
            return (
              <button key={c.key} type="button" onClick={() => setChannel(c.key)} style={{
                padding: "14px 14px 12px", borderRadius: 12,
                background: active ? "var(--ps-primary-subtle)" : "#fff",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                boxShadow: active ? "0 0 0 3px rgba(124, 58, 237, 0.12)" : "var(--ps-shadow-card)",
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: active ? "var(--ps-primary)" : "var(--ps-bg-subtle)",
                    color: active ? "#fff" : "var(--ps-fg-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 180ms",
                  }}>
                    <Icon name={c.icon} size={15} stroke={2.2} />
                  </span>
                  <span style={{
                    width: 16, height: 16, borderRadius: 9999,
                    border: `2px solid ${active ? "var(--ps-primary)" : "var(--ps-border-strong)"}`,
                    background: active ? "var(--ps-primary)" : "transparent",
                    position: "relative",
                  }}>
                    {active && <span style={{
                      position: "absolute", inset: 3, borderRadius: 9999, background: "#fff",
                    }} />}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? "var(--ps-primary-deep)" : "var(--ps-fg)", letterSpacing: "-0.005em" }}>{c.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", lineHeight: 1.4, marginTop: 2 }}>{c.hint}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Q2 — Plages horaires */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-primary-deep)" }}>2</span>
          <span className="ps-h2" style={{ fontSize: 14.5 }}>Plages où vous joindre</span>
          <span style={{ fontSize: 11, color: "var(--ps-fg-muted)" }}>plusieurs possibles</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {SLOTS.map((s) => {
            const active = slots[s.key];
            return (
              <button key={s.key} type="button" onClick={() => setSlots({ ...slots, [s.key]: !active })} style={{
                padding: "12px 14px", borderRadius: 12,
                background: active ? "var(--ps-primary-subtle)" : "#fff",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                transition: "all 180ms",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--ps-primary-deep)" : "var(--ps-fg)" }}>{s.label}</div>
                  <div className="ps-num" style={{ fontSize: 11, color: "var(--ps-fg-muted)" }}>{s.sub}</div>
                </div>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `2px solid ${active ? "var(--ps-primary)" : "var(--ps-border-strong)"}`,
                  background: active ? "var(--ps-primary)" : "transparent",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {active && <Icon name="check" size={11} stroke={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Q3 — Notifications toggle */}
      <section>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "14px 16px", borderRadius: 12,
          border: "1px solid var(--ps-border-soft)", background: "var(--ps-bg-subtle)",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>
              Notifications par email
            </div>
            <div style={{ fontSize: 12, color: "var(--ps-fg-secondary)", marginTop: 2, lineHeight: 1.4 }}>
              Avancement projet, nouveaux livrables, factures à payer. Rien d'autre.
            </div>
          </div>
          <OnbToggle value={notif} onChange={setNotif} />
        </div>
      </section>
    </div>
  );
}

/* Variation B — Dense 2-col, all questions visible together */
function OnbStep3_VarB() {
  const [channel, setChannel] = useStateStep("email");
  const [slots, setSlots]     = useStateStep({ morning: false, afternoon: true, evening: false });
  const [notif, setNotif]     = useStateStep(true);

  return (
    <div className="ps-fade-in">
      <OnbStepHead dense title="Comment on reste en contact ?" subtitle="Trois réglages rapides. Vous pourrez les changer à tout moment depuis Profil." />

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 14, columnGap: 22, alignItems: "start" }}>
        {/* Row 1 — Channel */}
        <div style={{ paddingTop: 6 }}>
          <div className="ps-h2" style={{ fontSize: 13.5 }}>Canal préféré</div>
          <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>Comment vous prévenir en priorité.</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CHANNELS.map((c) => {
            const active = channel === c.key;
            return (
              <button key={c.key} type="button" onClick={() => setChannel(c.key)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 9999,
                background: active ? "var(--ps-primary)" : "#fff",
                color: active ? "#fff" : "var(--ps-fg)",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.005em",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 180ms",
              }}>
                <Icon name={c.icon} size={13} stroke={2.2} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ gridColumn: "1 / -1", height: 1, background: "var(--ps-border-soft)" }} />

        {/* Row 2 — Slots */}
        <div style={{ paddingTop: 6 }}>
          <div className="ps-h2" style={{ fontSize: 13.5 }}>Plages</div>
          <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>Quand vous joindre.</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SLOTS.map((s) => {
            const active = slots[s.key];
            return (
              <button key={s.key} type="button" onClick={() => setSlots({ ...slots, [s.key]: !active })} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 9999,
                background: active ? "var(--ps-primary-subtle)" : "#fff",
                color: active ? "var(--ps-primary-deep)" : "var(--ps-fg)",
                border: `1px solid ${active ? "var(--ps-primary)" : "var(--ps-border)"}`,
                fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.005em",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 180ms",
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 4,
                  border: `2px solid ${active ? "var(--ps-primary)" : "var(--ps-border-strong)"}`,
                  background: active ? "var(--ps-primary)" : "transparent",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <Icon name="check" size={9} stroke={3} />}
                </span>
                {s.label}
                <span className="ps-num" style={{ color: active ? "var(--ps-primary-deep)" : "var(--ps-fg-muted)", fontWeight: 500, fontSize: 11 }}>{s.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ gridColumn: "1 / -1", height: 1, background: "var(--ps-border-soft)" }} />

        {/* Row 3 — Notifications */}
        <div style={{ paddingTop: 4 }}>
          <div className="ps-h2" style={{ fontSize: 13.5 }}>Notifications</div>
          <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 2 }}>Par email, événements clés uniquement.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <OnbToggle value={notif} onChange={setNotif} />
          <span style={{ fontSize: 12.5, color: "var(--ps-fg-secondary)" }}>
            {notif ? "Activé · vous recevrez livrables, factures, signatures à effectuer" : "Désactivé · uniquement notifications dans l'app"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Toggle primitive */
function OnbToggle({ value, onChange, size = 22 }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      width: size * 1.85, height: size, borderRadius: 9999, padding: 2,
      background: value ? "var(--ps-primary)" : "var(--ps-border-strong)",
      border: "none", cursor: "pointer", position: "relative",
      transition: "background 180ms",
      flexShrink: 0,
    }}>
      <span style={{
        width: size - 4, height: size - 4, borderRadius: 9999, background: "#fff",
        display: "block",
        transform: `translateX(${value ? size * 0.85 : 0}px)`,
        transition: "transform 180ms cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

/* =====================================================
   STEP 4 — Petit tour du propriétaire
   ───────────────────────────────────────────────────── */

/* Variation A — Grille 7 cartes (4 + 3) */
function OnbStep4_VarA() {
  return (
    <div className="ps-fade-in">
      <OnbStepHead title="Votre espace en un coup d'œil" subtitle="Voici les 7 sections de votre Propul'Space. Vous pourrez tout explorer juste après." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {PORTAL_TABS.slice(0, 4).map((t) => <OnbTourCard key={t.key} tab={t} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
        {PORTAL_TABS.slice(4).map((t) => <OnbTourCard key={t.key} tab={t} />)}
      </div>

      <div style={{
        marginTop: 18, padding: "10px 14px", borderRadius: 10,
        background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
        fontSize: 12.5, lineHeight: 1.5,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <Icon name="sparkles" size={14} stroke={2.2} />
        <span><strong>Bouton bleu en bas à droite</strong> de chaque page : votre raccourci pour nous contacter, n'importe quand.</span>
      </div>
    </div>
  );
}

function OnbTourCard({ tab, featured }) {
  return (
    <div className="ps-card" style={{
      padding: "14px 14px 12px",
      transform: featured ? "scale(1.02)" : "none",
      borderColor: featured ? "var(--ps-primary)" : undefined,
      boxShadow: featured ? "0 8px 24px -8px rgba(124,58,237,0.25), var(--ps-shadow-card)" : undefined,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10,
      }}>
        <Icon name={tab.icon} size={16} stroke={2.2} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em", marginBottom: 2 }}>
        {tab.title}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ps-fg-secondary)", lineHeight: 1.4 }}>
        {tab.desc}
      </div>
    </div>
  );
}

/* Variation B — Spotlight carousel : carte centrale large + peeking sides */
function OnbStep4_VarB() {
  const [idx, setIdx] = useStateStep(0);
  const total = PORTAL_TABS.length;
  const t = PORTAL_TABS[idx];
  const prev = PORTAL_TABS[(idx - 1 + total) % total];
  const next = PORTAL_TABS[(idx + 1) % total];

  return (
    <div className="ps-fade-in">
      <OnbStepHead title="Votre espace en un coup d'œil" subtitle="Faites défiler — les 7 sections de votre Propul'Space, une par une." />

      <div style={{ position: "relative", padding: "8px 0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 16, alignItems: "stretch", minHeight: 220 }}>
          {/* Prev peek */}
          <button onClick={() => setIdx((idx - 1 + total) % total)} style={{
            border: "none", background: "transparent", cursor: "pointer", padding: 0,
            opacity: 0.55, transform: "scale(0.92)", transformOrigin: "right center",
          }}>
            <OnbTourSpotlightCard tab={prev} preview />
          </button>

          {/* Featured */}
          <OnbTourSpotlightCard tab={t} featured idx={idx + 1} total={total} />

          {/* Next peek */}
          <button onClick={() => setIdx((idx + 1) % total)} style={{
            border: "none", background: "transparent", cursor: "pointer", padding: 0,
            opacity: 0.55, transform: "scale(0.92)", transformOrigin: "left center",
          }}>
            <OnbTourSpotlightCard tab={next} preview />
          </button>
        </div>

        {/* Indicator dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {PORTAL_TABS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 9999,
              background: i === idx ? "var(--ps-primary)" : "var(--ps-border-strong)",
              border: "none", cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OnbTourSpotlightCard({ tab, featured = false, preview = false, idx, total }) {
  return (
    <div className="ps-card" style={{
      padding: featured ? "18px 18px 16px" : "12px 12px 10px",
      height: "100%",
      borderColor: featured ? "var(--ps-primary)" : "var(--ps-border-soft)",
      boxShadow: featured ? "0 12px 30px -10px rgba(124,58,237,0.28), var(--ps-shadow-card)" : "var(--ps-shadow-card)",
      position: "relative", overflow: "hidden",
      textAlign: "left",
    }}>
      {featured && (
        <span className="ps-hero-blur" style={{ width: 200, height: 200, right: -60, top: -60 }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: featured ? 14 : 8, position: "relative" }}>
        <div style={{
          width: featured ? 44 : 28, height: featured ? 44 : 28, borderRadius: featured ? 12 : 7,
          background: "var(--ps-primary-subtle)", color: "var(--ps-primary-deep)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={tab.icon} size={featured ? 20 : 13} stroke={2.2} />
        </div>
        {featured && idx != null && (
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ps-fg-muted)" }} className="ps-num">
            {String(idx).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        )}
      </div>
      <div style={{ fontSize: featured ? 17 : 12.5, fontWeight: 700, color: "var(--ps-fg)", letterSpacing: "-0.015em", marginBottom: featured ? 6 : 0, lineHeight: 1.25 }}>
        {tab.title}
      </div>
      {featured && (
        <p style={{ fontSize: 13, color: "var(--ps-fg-secondary)", lineHeight: 1.55, margin: "0 0 14px" }}>
          {tab.desc}
        </p>
      )}
      {featured && (
        /* Mini-mock du portail tab — défini dans onboarding-tab-previews.jsx */
        typeof OnbTabPreview === "function"
          ? <OnbTabPreview tabKey={tab.key} />
          : (
            <div style={{
              height: 80, borderRadius: 10,
              background: "linear-gradient(135deg, #f5f1ff 0%, #ede9fe 100%)",
              border: "1px dashed var(--ps-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ps-primary-deep)", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
              fontFamily: "ui-monospace, SFMono-Regular, 'Menlo', monospace",
            }}>
              {tab.title} · aperçu
            </div>
          )
      )}
    </div>
  );
}

/* =====================================================
   STEP 5 — Tout est prêt
   ───────────────────────────────────────────────────── */

/* Variation A — Confetti subtils violet/doré + titre central */
function OnbStep5_VarA() {
  return (
    <div className="ps-fade-in" style={{ position: "relative", textAlign: "center", padding: "24px 8px 12px", minHeight: 360 }}>
      <OnbConfettiSubtle />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999, margin: "0 auto 22px",
          background: "linear-gradient(135deg, var(--ps-primary) 0%, var(--ps-primary-deep) 100%)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 16px 40px -10px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
          <Icon name="check" size={28} stroke={2.6} />
        </div>
        <h1 className="ps-h1 ps-gradient-text" style={{ fontSize: 32, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
          Tout est prêt, {ONB_CLIENT.firstName}.
        </h1>
        <p style={{ fontSize: 15, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 460 }}>
          Bienvenue à bord. Votre espace vous attend.
        </p>

        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: "var(--ps-bg-subtle)",
          maxWidth: 520, margin: "0 auto",
          fontSize: 12.5, lineHeight: 1.55, color: "var(--ps-fg-secondary)",
          display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
        }}>
          <Icon name="info" size={14} stroke={2} style={{ marginTop: 2, flexShrink: 0, color: "var(--ps-primary-deep)" }} />
          <span>
            Pour démarrer la production, on aura encore besoin de quelques infos — la marche à suivre vous attend dans la carte <strong style={{ color: "var(--ps-fg)" }}>« Configurez votre projet »</strong> du tableau de bord.
          </span>
        </div>
      </div>
    </div>
  );
}

/* Subtle confetti — small SVG dots scattered, animated drift */
function OnbConfettiSubtle() {
  const dots = [
    { x: 8, y: 12, c: "#7C3AED", s: 4, d: 0 },
    { x: 22, y: 6, c: "#F59E0B", s: 3, d: 0.4 },
    { x: 88, y: 18, c: "#7C3AED", s: 5, d: 0.2 },
    { x: 72, y: 8, c: "#A78BFA", s: 3, d: 0.7 },
    { x: 14, y: 78, c: "#F59E0B", s: 4, d: 0.5 },
    { x: 94, y: 72, c: "#7C3AED", s: 3, d: 0.9 },
    { x: 52, y: 88, c: "#A78BFA", s: 4, d: 0.3 },
    { x: 35, y: 22, c: "#F59E0B", s: 3, d: 1.1 },
    { x: 65, y: 75, c: "#7C3AED", s: 4, d: 0.6 },
    { x: 80, y: 42, c: "#A78BFA", s: 3, d: 1.4 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <style>{`
        @keyframes ps-confetti-drift {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(0,-30px) rotate(180deg); opacity: 0; }
        }
      `}</style>
      {dots.map((d, i) => (
        <span key={i} style={{
          position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: d.c === "#F59E0B" ? 1 : 9999,
          background: d.c,
          opacity: 0.65,
          animation: `ps-confetti-drift 3.4s cubic-bezier(0.16, 1, 0.3, 1) ${d.d}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* Variation B — Halo lumineux pulsant + typographique impactant */
function OnbStep5_VarB() {
  return (
    <div className="ps-fade-in" style={{ position: "relative", textAlign: "center", padding: "28px 8px 16px", minHeight: 360 }}>
      {/* Pulsing radial halo */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 360, height: 360, borderRadius: 9999,
        background: "radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, rgba(124, 58, 237, 0.04) 50%, transparent 70%)",
        animation: "ps-halo-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        pointerEvents: "none",
      }} />
      <style>{`
        @keyframes ps-halo-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.65; }
          50%      { transform: translateX(-50%) scale(1.18); opacity: 1; }
        }
        @keyframes ps-spark-rise {
          0%   { transform: translateY(20px) scale(0.6); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
      `}</style>

      {/* Floating sparks */}
      {[
        { x: 22, d: 0.0, s: 4 },
        { x: 30, d: 0.6, s: 3 },
        { x: 70, d: 0.3, s: 4 },
        { x: 78, d: 1.0, s: 3 },
        { x: 50, d: 1.4, s: 5 },
      ].map((sp, i) => (
        <span key={i} style={{
          position: "absolute", top: "55%", left: `${sp.x}%`,
          width: sp.s, height: sp.s, borderRadius: 9999, background: "var(--ps-primary)",
          opacity: 0,
          boxShadow: "0 0 8px rgba(124,58,237,0.6)",
          animation: `ps-spark-rise 2.6s cubic-bezier(0.16, 1, 0.3, 1) ${sp.d}s infinite`,
        }} />
      ))}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 36 }}>
        {/* Display type */}
        <div className="ps-eyebrow" style={{ marginBottom: 10 }}>C'est parti</div>
        <h1 style={{
          fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.0,
          margin: "0 0 6px",
          background: "linear-gradient(135deg, var(--ps-fg) 0%, var(--ps-primary-deep) 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent", color: "transparent",
        }}>
          Bienvenue à bord,
        </h1>
        <h1 style={{
          fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.0,
          margin: "0 0 22px",
          background: "linear-gradient(135deg, var(--ps-primary) 0%, var(--ps-primary-deep) 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent", color: "transparent",
          fontStyle: "italic",
        }}>
          {ONB_CLIENT.firstName}.
        </h1>
        <p style={{ fontSize: 14, color: "var(--ps-fg-secondary)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 380 }}>
          Votre espace vous attend. Une dernière étape avant de démarrer la production : remplir la configuration projet — depuis le tableau de bord.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, {
  PORTAL_TABS,
  OnbStepHead, OnbPrefilledPill, OnbToggle,
  OnbStep2_VarA, OnbStep2_VarB,
  OnbStep3_VarA, OnbStep3_VarB,
  OnbStep4_VarA, OnbStep4_VarB, OnbTourCard, OnbTourSpotlightCard,
  OnbStep5_VarA, OnbStep5_VarB,
  OnbConfettiSubtle,
});
