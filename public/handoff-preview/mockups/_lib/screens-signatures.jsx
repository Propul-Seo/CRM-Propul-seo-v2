/* SignaturesScreen — pending + signed documents. */

const SIGNATURES = [
  { name: "Contrat de prestation",  type: "Contrat", date: "1 mai 2026",  status: "signed" },
  { name: "Devis refonte site",     type: "Devis",   date: "28 avr 2026", status: "signed" },
  { name: "Avenant SEO mensuel",    type: "Avenant", date: "15 mai 2026", status: "pending" },
];

function SignaturesScreen({ device = "mobile" }) {
  const desktop = device === "desktop";
  const pending = SIGNATURES.filter(s => s.status === "pending");
  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section>
        <div className="ps-eyebrow ps-eyebrow-muted">Signatures</div>
        <h1 className="ps-h1" style={{ fontSize: desktop ? 32 : 24, marginTop: 4 }}>Mes signatures</h1>
        <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", margin: "4px 0 0" }}>
          Signez vos documents en quelques clics.
        </p>
      </section>

      {pending.length > 0 && (
        <div style={{
          display: "flex", gap: 10, alignItems: "center",
          padding: "10px 14px", background: "var(--ps-primary-subtle)",
          borderRadius: 10, color: "var(--ps-primary-deep)",
        }}>
          <Icon name="pen-line" size={16} stroke={2.2} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            <span style={{ fontWeight: 700 }}>{pending.length}</span> document{pending.length > 1 ? "s" : ""} en attente de votre signature.
          </span>
        </div>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SIGNATURES.map((sig, i) => (
          <SignatureCard key={i} sig={sig} />
        ))}
      </section>
    </div>
  );
}

function SignatureCard({ sig }) {
  const isPending = sig.status === "pending";
  const isSigned  = sig.status === "signed";
  return (
    <div className="ps-card" style={{
      padding: 16,
      ...(isPending ? {
        borderColor: "rgba(124,58,237,0.25)",
        boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 0 0 1px rgba(124,58,237,0.06), 0 4px 14px -4px rgba(124,58,237,0.18)",
      } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{
          width: 38, height: 38, borderRadius: 9999, flexShrink: 0,
          background: isPending ? "var(--ps-primary-subtle)" : "var(--ps-success-subtle)",
          color:      isPending ? "var(--ps-primary-deep)" : "var(--ps-success)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={isPending ? "pen-line" : "check-circle-2"} size={17} stroke={2.2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-fg)", letterSpacing: "-0.005em" }}>
            {sig.name}
          </div>
          <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 3, display: "flex", gap: 6 }}>
            <span>{sig.type}</span><span>·</span><span>Envoyé le {sig.date}</span>
          </div>
        </div>
        {isPending && <Badge tone="violet">En attente</Badge>}
        {isSigned && <Badge tone="success">Signé</Badge>}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {isPending && <Button variant="primary" size="lg" iconRight="arrow-up-right">Signer maintenant</Button>}
        {isSigned && <Button variant="outline" icon="download">Télécharger PDF signé</Button>}
      </div>
    </div>
  );
}

Object.assign(window, { SignaturesScreen });
