/* LoginScreen — Vue 1 du brief.
   Magic-link only. 3 états : initial, loading, success.
   - Pas de PortalLayout (page autonome)
   - Centré vertical + horizontal
   - Logo violet placeholder, titre, sous-titre, email, bouton ≥ 44px
   - Footer "© 2026 Propul'SEO — Hébergé en France 🇫🇷"
*/

const { useState: useStateLogin } = React;

function LoginScreen({ state = "initial", initialEmail = "", forceState }) {
  // forceState ("initial" | "loading" | "success") locks the demo state
  const [localState, setLocalState] = useStateLogin(forceState || state);
  const [email, setEmail] = useStateLogin(initialEmail);
  const active = forceState || localState;

  function submit(e) {
    e.preventDefault();
    if (!email) return;
    if (forceState) return;       // demo locked
    setLocalState("loading");
    setTimeout(() => setLocalState("success"), 1200);
  }

  return (
    <div className="ps-portal" style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative",
    }}>
      <div className="ps-card" style={{ width: "100%", maxWidth: 380, padding: "32px 28px 28px", position: "relative", overflow: "hidden" }}>
        {/* Subtle blur in top-right */}
        <span className="ps-hero-blur" style={{ right: -100, top: -100, width: 240, height: 240, opacity: 0.6 }} />

        {/* LOGO — violet rectangle placeholder per brief */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            height: 44, padding: "0 16px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--ps-primary) 0%, var(--ps-primary-deep) 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
            boxShadow: "0 6px 16px -4px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}>
            <Icon name="sparkles" size={17} stroke={2.4} />
            Propul'SEO
          </div>
        </div>

        {/* Heading */}
        <h1 className="ps-h1 ps-gradient-text" style={{ textAlign: "center", fontSize: 24, marginBottom: 6, position: "relative" }}>
          Votre espace Propul'SEO
        </h1>
        <p style={{
          textAlign: "center", fontSize: 14, color: "var(--ps-fg-secondary)",
          lineHeight: 1.5, margin: "0 0 24px", position: "relative",
        }}>
          {active === "success"
            ? "Vérifiez votre boîte de réception."
            : "Connectez-vous pour suivre votre projet."}
        </p>

        {/* FORM / LOADING / SUCCESS */}
        <div style={{ position: "relative" }}>
          {active !== "success" ? (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="ps-field">
                <label className="ps-label" htmlFor="login-email">Email professionnel</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="ps-input"
                  placeholder="votre@email.com"
                  required
                  disabled={active === "loading"}
                  autoComplete="email"
                  style={{ height: 46, fontSize: 15 }}
                />
              </div>
              <button
                type="submit"
                disabled={active === "loading"}
                className="ps-btn ps-btn-primary ps-btn-lg ps-btn-block"
                style={{ marginTop: 4 }}
              >
                {active === "loading" ? (
                  <>
                    <SpinnerIcon />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Recevoir mon lien de connexion
                    <Icon name="arrow-up-right" size={14} stroke={2.6} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{
              background: "var(--ps-primary-subtle)",
              borderRadius: 12, padding: 16,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 9999, flexShrink: 0,
                background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, lineHeight: 1,
              }}>✉️</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ps-primary-deep)", marginBottom: 4 }}>
                  Un lien de connexion vous a été envoyé.
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ps-fg-secondary)", lineHeight: 1.5, wordBreak: "break-word" }}>
                  Cliquez sur le lien dans l'email envoyé à <span style={{ color: "var(--ps-fg)", fontWeight: 500 }}>{email || "votre adresse"}</span>. Il reste valide 15 minutes.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HELPER */}
        <p style={{
          fontSize: 12, color: "var(--ps-fg-muted)",
          textAlign: "center", margin: "20px 0 0", position: "relative",
        }}>
          Vous n'avez pas reçu de lien ?{" "}
          <a href="#" style={{ color: "var(--ps-primary-text)", textDecoration: "none", fontWeight: 500 }}>
            Contactez-nous
          </a>
        </p>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: 22, fontSize: 11.5, color: "var(--ps-fg-muted)",
        textAlign: "center", letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
      }}>
        © 2026 Propul'SEO &middot; Hébergé en France 🇫🇷
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <span style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff",
      borderRadius: 9999,
      animation: "ps-spin 800ms linear infinite",
      display: "inline-block",
    }} />
  );
}

Object.assign(window, { LoginScreen });
