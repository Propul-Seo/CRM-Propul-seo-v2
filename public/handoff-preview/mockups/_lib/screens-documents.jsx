/* DocumentsScreen — searchable, filterable doc list + upload zone. */

const { useState: useStateDocs } = React;

const DOCS = [
  { name: "Contrat de prestation.pdf",  type: "contract",   date: "1 mai",  size: "450 KB", isNew: false, ext: "pdf" },
  { name: "Devis Précieuse v2.pdf",     type: "quote",      date: "28 avr", size: "320 KB", isNew: false, ext: "pdf" },
  { name: "Rapport SEO Mai 2026.pdf",   type: "deliverable", date: "15 mai", size: "1.2 MB", isNew: true,  ext: "pdf" },
  { name: "Maquette accueil v2.png",    type: "deliverable", date: "14 mai", size: "3.4 MB", isNew: true,  ext: "img" },
  { name: "Logo Précieuse HD.svg",      type: "asset",      date: "2 mai",  size: "85 KB",  isNew: false, ext: "img" },
  { name: "Charte graphique.pdf",       type: "asset",      date: "2 mai",  size: "2.1 MB", isNew: false, ext: "pdf" },
  { name: "Brief créatif.pdf",          type: "deliverable", date: "3 mai",  size: "180 KB", isNew: false, ext: "pdf" },
  { name: "CGV Propul'SEO.pdf",         type: "legal",      date: "1 mai",  size: "95 KB",  isNew: false, ext: "pdf" },
  { name: "Facture PS-1031.pdf",        type: "invoice",    date: "15 mai", size: "120 KB", isNew: true,  ext: "pdf" },
  { name: "Photos produits lot 1.zip",  type: "asset",      date: "5 mai",  size: "18 MB",  isNew: false, ext: "zip" },
];

const DOC_FILTERS = [
  { key: "all",        label: "Tous" },
  { key: "quote",      label: "Devis" },
  { key: "contract",   label: "Contrats" },
  { key: "invoice",    label: "Factures" },
  { key: "deliverable", label: "Livrables" },
  { key: "asset",      label: "Assets" },
  { key: "legal",      label: "Légal" },
];

const DOC_TYPE_META = {
  contract:    { label: "Contrat",   tone: "violet" },
  quote:       { label: "Devis",     tone: "violet" },
  invoice:     { label: "Facture",   tone: "violet" },
  deliverable: { label: "Livrable",  tone: "success" },
  asset:       { label: "Asset",     tone: "gray" },
  legal:       { label: "Légal",     tone: "gray" },
};

function DocumentsScreen({ device = "mobile" }) {
  const desktop = device === "desktop";
  const [filter, setFilter] = useStateDocs("all");
  const [query, setQuery] = useStateDocs("");
  const filtered = DOCS.filter(d =>
    (filter === "all" || d.type === filter) &&
    (!query || d.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section>
        <div className="ps-eyebrow ps-eyebrow-muted">Documents</div>
        <h1 className="ps-h1" style={{ fontSize: desktop ? 32 : 24, marginTop: 4 }}>Mes documents</h1>
      </section>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ps-fg-muted)" }}>
          <Icon name="search" size={16} stroke={2} />
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un document..."
          className="ps-input"
          style={{ paddingLeft: 40, height: 44 }}
        />
      </div>

      {/* Filter chips */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2,
        scrollbarWidth: "none", msOverflowStyle: "none", margin: "0 -16px", padding: "0 16px",
      }}>
        {DOC_FILTERS.map(f => {
          const active = f.key === filter;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 9999,
              border: `1px solid ${active ? "transparent" : "var(--ps-border)"}`,
              background: active ? "var(--ps-primary-subtle)" : "#fff",
              color: active ? "var(--ps-primary-deep)" : "var(--ps-fg-secondary)",
              fontSize: 12.5, fontWeight: active ? 600 : 500,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 150ms",
            }}>{f.label}</button>
          );
        })}
      </div>

      {/* Doc list */}
      <section className="ps-card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ps-fg-muted)", fontSize: 13 }}>
            Aucun document ne correspond à votre recherche.
          </div>
        ) : (
          filtered.map((d, i) => (
            <DocFullRow key={i} doc={d} last={i === filtered.length - 1} />
          ))
        )}
      </section>

      {/* Upload zone */}
      <section className="ps-card" style={{
        padding: 18, borderStyle: "dashed", borderWidth: 1.5,
        borderColor: "var(--ps-border)", background: "transparent",
        textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 9999, background: "var(--ps-primary-subtle)",
          color: "var(--ps-primary-deep)", margin: "0 auto 10px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="upload" size={18} stroke={2.2} />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ps-fg)", marginBottom: 2 }}>
          Déposez vos fichiers ici
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ps-fg-muted)" }}>
          Logos, contenus, photos · 25 MB max par fichier
        </div>
      </section>
    </div>
  );
}

function DocFullRow({ doc, last }) {
  const ext = doc.ext;
  const icons = {
    pdf: { icon: "file-text", bg: "#FEE2E2", fg: "#DC2626" },
    img: { icon: "image",     bg: "#DBEAFE", fg: "#1D4ED8" },
    zip: { icon: "archive",   bg: "var(--ps-primary-subtle)", fg: "var(--ps-primary-deep)" },
  };
  const meta = icons[ext] || icons.pdf;
  const type = DOC_TYPE_META[doc.type] || { label: doc.type, tone: "gray" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 16px", borderBottom: last ? "none" : "1px solid var(--ps-border-soft)",
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 9,
        background: meta.bg, color: meta.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={meta.icon} size={16} stroke={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 13.5, fontWeight: 500, color: "var(--ps-fg)", letterSpacing: "-0.005em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
          }}>{doc.name}</span>
        </div>
        <div className="ps-num" style={{ fontSize: 11.5, color: "var(--ps-fg-muted)", display: "flex", gap: 6, alignItems: "center" }}>
          <span>{type.label}</span>
          <span>·</span>
          <span>{doc.date}</span>
          <span>·</span>
          <span>{doc.size}</span>
        </div>
      </div>
      {doc.isNew && <Badge tone="warning" dot={false}>Nouveau</Badge>}
      <button style={{ background: "transparent", border: "none", color: "var(--ps-fg-secondary)", cursor: "pointer", padding: 6, borderRadius: 8 }}>
        <Icon name="download" size={16} stroke={2} />
      </button>
    </div>
  );
}

Object.assign(window, { DocumentsScreen });
