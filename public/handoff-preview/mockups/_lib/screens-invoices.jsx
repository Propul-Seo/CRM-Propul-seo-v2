/* InvoicesScreen — KPI summary + invoice list with payment CTAs. */

const INVOICES = [
  { num: "PS-1031", date: "15 mai 2026", amount: "5 000,00", status: "due",       dueDate: "15 juin 2026" },
  { num: "PS-1032", date: "1 avr 2026",  amount: "3 000,00", status: "paid",      paidDate: "5 avr 2026" },
  { num: "PS-1033", date: "1 mars 2026", amount: "2 500,00", status: "overdue",   dueDate: "1 avr 2026" },
  { num: "PS-1029", date: "15 fév 2026", amount: "5 000,00", status: "paid",      paidDate: "18 fév 2026" },
];

function InvoicesScreen({ device = "mobile" }) {
  const desktop = device === "desktop";
  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section>
        <div className="ps-eyebrow ps-eyebrow-muted">Facturation</div>
        <h1 className="ps-h1" style={{ fontSize: desktop ? 32 : 24, marginTop: 4 }}>Mes factures</h1>
        <p style={{ fontSize: 13.5, color: "var(--ps-fg-secondary)", margin: "4px 0 0" }}>
          Retrouvez et payez vos factures en un clic.
        </p>
      </section>

      {/* KPI */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <KpiTile eyebrow="À payer" value="7 500,00 €" delta="2 factures · 1 en retard" icon="alert-triangle" tint="orange" />
        <KpiTile eyebrow="Payé en 2026" value="8 000,00 €" delta="2 factures réglées" icon="check-circle-2" tint="green" />
      </section>

      {/* List */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        <SectionHead title="Historique" action={
          <span className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>{INVOICES.length} factures</span>
        } />
        {INVOICES.map((inv, i) => (
          <InvoiceCard key={inv.num} invoice={inv} last={i === INVOICES.length - 1} />
        ))}
      </section>

      {/* Legal */}
      <div style={{
        fontSize: 11.5, color: "var(--ps-fg-muted)",
        padding: "10px 14px", background: "var(--ps-bg-subtle)",
        borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start",
      }}>
        <Icon name="info" size={13} stroke={2} style={{ marginTop: 2, flexShrink: 0 }} />
        <span>TVA non applicable, art. 293 B du CGI. Émis par Propul'SEO (Etienne Guimbard), SIRET 981 086 093 000 11.</span>
      </div>
    </div>
  );
}

function InvoiceCard({ invoice, last }) {
  const isOverdue = invoice.status === "overdue";
  const isPaid    = invoice.status === "paid";
  const isDue     = invoice.status === "due";
  return (
    <div style={{
      padding: "14px 16px",
      borderBottom: last ? "none" : "1px solid var(--ps-border-soft)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row — number + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{
            fontFamily: "var(--ps-font-mono)",
            fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)",
            letterSpacing: "-0.005em",
          }}>{invoice.num}</span>
          <span style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }} className="ps-num">· {invoice.date}</span>
        </div>
        {isPaid && <Badge tone="success">Payée</Badge>}
        {isDue && <Badge tone="violet">À payer</Badge>}
        {isOverdue && <Badge tone="danger">En retard</Badge>}
      </div>

      {/* Middle — amount + due */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ps-num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ps-fg)", lineHeight: 1.1 }}>
            {invoice.amount} €
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", marginTop: 4 }} className="ps-num">
            {isPaid ? `Réglée le ${invoice.paidDate}` : `Échéance ${invoice.dueDate}`}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isDue && <Button variant="primary">Payer</Button>}
          {isOverdue && <Button variant="danger" icon="alert-triangle">Payer maintenant</Button>}
          {isPaid && <Button variant="outline" icon="download">PDF</Button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InvoicesScreen });
