/* ═══════════ Trust bar ═══════════ */
function TrustBar() {
  return (
    <section className="trust">
      <div className="wrap trust-inner">
        <span className="trust-label">Certifié · Assuré · Fédéré</span>
        <div className="trust-logos">
          <div className="trust-logo"><div className="trust-logo-role">Certification</div><div className="trust-logo-name">LCC Qualixpert</div></div>
          <div className="trust-logo"><div className="trust-logo-role">Certification</div><div className="trust-logo-name">I.Cert</div></div>
          <div className="trust-logo"><div className="trust-logo-role">Assurance RCP</div><div className="trust-logo-name">Allianz</div></div>
          <div className="trust-logo"><div className="trust-logo-role">Fédération</div><div className="trust-logo-name">FNAIM Diagnostiqueurs</div></div>
          <div className="trust-logo"><div className="trust-logo-role">Partenaire</div><div className="trust-logo-name">Optimiz'e Construction</div></div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Audiences — A1 tabs éditoriales ═══════════ */
const AUDIENCES_DATA = [
  {
    key: 'particuliers',
    label: 'Particuliers',
    title: 'Vous vendez ou louez votre bien',
    desc: "On vous guide sur la liste exacte des diagnostics obligatoires pour votre maison, appartement ou local. Devis sous 2 h, RDV sous 48 h.",
    chips: ['Vente', 'Location', 'Travaux'],
    diags: [
      { name: 'DPE', note: 'obligatoire' },
      { name: 'Amiante', note: 'si < 1997' },
      { name: 'Plomb (CREP)', note: 'si < 1949' },
      { name: 'Gaz / Électricité', note: 'si > 15 ans' },
      { name: 'Termites · ERP · Loi Carrez', note: 'selon cas' },
    ],
  },
  {
    key: 'pros',
    label: 'Professionnels',
    title: 'Locaux professionnels, commerces, ERP',
    desc: "Cession de fonds de commerce, bail commercial, exploitation d'ERP — nous couvrons vos obligations de contrôle.",
    chips: ['Commerce', 'Bureau', 'ERP'],
    diags: [
      { name: 'DPE mention tertiaire', note: 'décret tertiaire' },
      { name: 'Amiante DTA', note: 'bâtiments < 1997' },
      { name: 'Électricité', note: 'si > 15 ans' },
      { name: 'Accessibilité', note: 'ERP' },
      { name: 'Loi Carrez · ERP', note: 'selon cas' },
    ],
  },
  {
    key: 'syndics',
    label: 'Syndics',
    title: 'Gestion du patrimoine en copropriété',
    desc: "Accompagnement des syndics sur leurs obligations : DPE collectif, DTA, plans pluriannuels de travaux (PPT).",
    chips: ['DPE collectif', 'DTA', 'PPT'],
    diags: [
      { name: 'DPE collectif', note: 'obligatoire' },
      { name: 'DTA', note: 'collectifs < 1997' },
      { name: 'PPT', note: 'plan pluriannuel' },
      { name: 'Audit énergétique', note: 'selon cas' },
    ],
  },
  {
    key: 'moa',
    label: 'MOA & architectes',
    title: "Chantiers de travaux et de démolition",
    desc: "Repérages amiante avant travaux / démolition, mesures d'empoussièrement, recherche plomb en zone préfectorale.",
    chips: ['Démolition', 'Rénovation', 'Chantier'],
    diags: [
      { name: 'Amiante av. travaux (RAAT)', note: 'chantier' },
      { name: 'Amiante av. démolition (RAAD)', note: 'démolition' },
      { name: 'Mesures empoussièrement', note: 'chantier' },
      { name: 'Plomb en zone', note: 'préfectoral' },
      { name: 'Constat visuel', note: 'après travaux' },
    ],
  },
];

function Audiences() {
  const [active, setActive] = React.useState(0);
  const a = AUDIENCES_DATA[active];
  return (
    <section className="sec" style={{background: 'var(--bg)'}}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">À qui nous nous adressons</div>
          <h2 className="section-title">Un interlocuteur unique, <em>quelque soit votre projet</em>.</h2>
          <p className="section-sub">Particuliers, professionnels, syndics de copropriété, maîtrises d'ouvrage — Servicimmo accompagne tous les acteurs de l'immobilier en Touraine.</p>
        </div>

        <div className="aud-tabs">
          <div className="aud-tabs-row">
            {AUDIENCES_DATA.map((it, i) => (
              <button key={it.key}
                      onClick={() => setActive(i)}
                      className={`aud-tab ${active === i ? 'active' : ''}`}>
                <span className="aud-tab-n">0{i+1}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>

          <div className="aud-panel">
            <div className="aud-panel-left">
              <h3 className="aud-panel-title">{a.title}</h3>
              <p className="aud-panel-desc">{a.desc}</p>
              <div className="aud-chips">
                {a.chips.map(c => <span key={c} className="aud-chip">{c}</span>)}
              </div>
              <a className="btn btn-ink" style={{marginTop: 28}}>Demander un devis →</a>
            </div>
            <div className="aud-panel-right">
              <div className="aud-diags-label">Diagnostics courants</div>
              <ul className="aud-diags">
                {a.diags.map(d => (
                  <li key={d.name}>
                    <span className="aud-diag-name">{d.name}</span>
                    <span className="aud-diag-note">{d.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Services — S4 par catégorie métier ═══════════ */
const SERVICES_BY_CAT = [
  {
    cat: 'Amiante',
    count: 3,
    items: [
      { name: 'DTA', sub: "Diagnostic technique amiante, bâtiments collectifs < 1997" },
      { name: 'Avant travaux / démolition', sub: "Repérage des matériaux amiantés avant chantier" },
      { name: 'Constat visuel', sub: "Vérification après travaux de retrait ou d'encapsulage" },
    ],
  },
  {
    cat: 'Performance énergétique',
    count: 1,
    items: [
      { name: 'DPE mention tertiaire', sub: "Locaux professionnels & décret tertiaire" },
    ],
  },
  {
    cat: 'Chantier & neuf',
    count: 2,
    items: [
      { name: 'Attestation RT 2012', sub: "Conformité jointe au permis de construire" },
      { name: 'Amiante & HAP enrobés', sub: "Carottages routiers — France Carottage Routier" },
    ],
  },
];

function ServicesByCategory() {
  const { Arrow } = Icons;
  return (
    <section className="sec" style={{background: 'var(--white)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div className="wrap">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr', gap: 80, alignItems:'start'}}>
          <div style={{position:'sticky', top: 100}}>
            <div className="eyebrow">Nos prestations</div>
            <h2 className="section-title" style={{fontSize: 44}}>Trois métiers, <em>six expertises</em>.</h2>
            <p className="section-sub">Nos interventions phares, organisées par domaine réglementaire — de la copropriété au carottage routier.</p>
            <a className="btn btn-ink" style={{marginTop: 28}}>Voir toutes les prestations <Arrow/></a>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap: 40}}>
            {SERVICES_BY_CAT.map((c, i) => (
              <div key={c.cat}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', paddingBottom: 12, borderBottom: '1px solid var(--saf-soft)', marginBottom: 14}}>
                  <div style={{fontFamily:'Geist Mono, monospace', fontSize: 11, color:'var(--saf-dark)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600}}>
                    {c.cat} · {c.count} intervention{c.count>1?'s':''}
                  </div>
                  <a style={{fontSize:12, color:'var(--muted-2)', fontFamily:'Geist Mono, monospace', letterSpacing:'0.04em'}}>→</a>
                </div>
                <div>
                  {c.items.map((s, j) => (
                    <div key={s.name} style={{display:'grid', gridTemplateColumns:'40px 220px 1fr auto', gap: 16, padding: '14px 0', borderTop: j===0?'none':'1px solid var(--line-soft)', alignItems:'baseline'}}>
                      <span className="mono" style={{fontSize: 11, color: 'var(--muted)'}}>0{i*3+j+1}</span>
                      <span style={{fontSize: 15, fontWeight: 500, letterSpacing:'-0.01em', color:'var(--ink)'}}>{s.name}</span>
                      <span style={{fontSize: 13, color:'var(--muted-2)'}}>{s.sub}</span>
                      <a style={{fontSize:12, color:'var(--saf-dark)', fontWeight:600, fontFamily:'Geist Mono, monospace', textTransform:'uppercase', letterSpacing:'0.04em'}}>→</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() { return <ServicesByCategory/>; }

/* ═══════════ Why — W5 big year + récit ═══════════ */
function Why() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="why-w5">
          <div className="why-w5-left">
            <div>
              <div className="why-w5-year">1998</div>
              <div className="why-w5-caption">Cabinet créé à Tours</div>
            </div>
            <div className="why-w5-stat">
              <span>Aujourd'hui</span>
              <b>10 000+ diagnostics délivrés</b>
            </div>
          </div>
          <div className="why-w5-right">
            <div className="eyebrow">Notre histoire</div>
            <h2 className="section-title" style={{fontSize: 36, marginTop: 14}}>Servicimmo, cabinet <em>indépendant</em> depuis bientôt trente ans.</h2>
            <p className="section-sub" style={{marginBottom: 20}}>
              Basés à Tours depuis 1998, nous intervenons en Indre-et-Loire et départements limitrophes. Certifiés Qualixpert et I.Cert, assurés Allianz, membres de la FNAIM Diagnostic.
            </p>
            <ul className="why-w5-list">
              <li>Un seul métier, fait sérieusement — ni gestion locative, ni transaction</li>
              <li>Veille réglementaire publique depuis 2017, 100+ articles de fond</li>
              <li>Équipe locale, pas de sous-traitance — le technicien signe son rapport</li>
              <li>Ancrage Indre-et-Loire : Tours, Chinon, Amboise, Loches, Azay-le-Rideau…</li>
            </ul>
            <div style={{marginTop: 32, display:'flex', gap:12, flexWrap:'wrap'}}>
              <a className="btn btn-primary">Demander un devis</a>
              <a className="btn btn-ink">Voir nos références</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.TrustBar = TrustBar;
window.Audiences = Audiences;
window.Services = Services;
window.Why = Why;
window.HowItWorks = Audiences;
window.Diagnostics = Services;
