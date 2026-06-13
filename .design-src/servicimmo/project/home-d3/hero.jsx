/* ═══════════ Map Touraine (hero visual) ═══════════ */
function MapCard({ density = 'medium' }) {
  const cities = [
    { name: 'Château-Renault', top: '22%', left: '18%' },
    { name: 'Amboise', top: '38%', right: '16%' },
    { name: 'Saint-Cyr-sur-Loire', top: '46%', right: '30%' },
    { name: 'Azay-le-Rideau', bottom: '34%', left: '16%' },
    { name: 'Chinon', bottom: '14%', left: '34%' },
    { name: 'Loches', bottom: '20%', right: '20%' },
    { name: 'Joué-lès-Tours', top: '62%', left: '48%' },
    { name: 'Fondettes', top: '42%', left: '26%' },
    { name: 'Chambray-lès-Tours', top: '58%', left: '58%' },
    { name: 'Bléré', bottom: '36%', right: '28%' },
  ];
  const count = density === 'dense' ? 10 : density === 'sparse' ? 4 : 7;
  const shown = cities.slice(0, count);

  return (
    <div className="map-card">
      <div className="map">
        <div className="map-grid"/>
        <svg className="map-svg" viewBox="0 0 400 280" preserveAspectRatio="none">
          <path d="M-10 110 Q 80 95, 160 115 T 280 120 Q 340 122, 410 108" stroke="rgba(232,163,61,0.38)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M-10 115 Q 80 100, 160 120 T 280 125 Q 340 127, 410 113" stroke="rgba(232,163,61,0.15)" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M-10 168 Q 80 160, 150 180 T 280 182 Q 340 184, 410 172" stroke="rgba(255,255,255,0.14)" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M-10 210 Q 80 200, 150 215 T 290 218" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 30 52 Q 90 36, 180 46 T 340 56 Q 380 82, 370 152 T 322 240 Q 232 256, 132 240 T 30 180 Q 12 130, 30 52 Z"
                stroke="rgba(255,255,255,0.16)" strokeWidth="1" fill="rgba(255,255,255,0.02)" strokeDasharray="2 3"/>
        </svg>

        <div className="map-overlay">
          <span>Indre-et-Loire · 37</span>
          <span>Tours &amp; Fondettes · toute la Touraine</span>
        </div>

        <div className="map-ring" style={{width: 120, height: 120}}/>
        <div className="map-ring" style={{width: 220, height: 220, opacity: 0.7}}/>
        <div className="map-ring" style={{width: 320, height: 320, opacity: 0.4}}/>

        <div className="map-pin">
          <div className="map-pin-label">Tours · Fondettes</div>
          <div className="map-pin-dot"/>
        </div>

        {shown.map((c, i) => (
          <div key={i} className="map-city" style={c}><span className="map-city-dot"/>{c.name}</div>
        ))}
      </div>

      <div className="map-info">
        <div className="map-row">
          <span className="map-row-label">Cabinet basé à</span>
          <span className="map-row-value">Tours &amp; Fondettes <span className="mono" style={{fontSize:13,color:'#7a8691'}}>(37100)</span></span>
        </div>
        <div className="map-row">
          <span className="map-row-label">Zone d'intervention</span>
          <span className="map-row-value">Toute l'Indre-et-Loire</span>
        </div>
        <div className="map-row">
          <span className="map-row-label">Certification</span>
          <span className="map-row-value">LCC Qualixpert</span>
        </div>
        <div className="map-row">
          <span className="map-row-label">Disponibilité</span>
          <span className="map-row-value"><span className="dot"/>Lundi au vendredi</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Header ═══════════ */
function Header() {
  const { Phone, Arrow } = Icons;
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="logo">
          <div className="logo-mark">S</div>
          <div>
            <div className="logo-text">Servicimmo</div>
            <div className="logo-sub">Diagnostics immobiliers · Carottages routiers</div>
          </div>
        </div>
        <nav className="nav">
          <a>Accueil</a>
          <a>Références</a>
          <a>Particuliers</a>
          <a>Professionnels</a>
          <a>Amiante</a>
          <a>Devis</a>
          <a>Actualités</a>
          <a>Contact</a>
        </nav>
        <div className="header-right">
          <span className="header-phone"><Phone/> 02 47 47 0123</span>
          <a className="btn btn-primary">Demander un devis <Arrow/></a>
        </div>
      </div>
    </header>
  );
}

/* ═══════════ Hero ═══════════ */
function Hero({ density, tone }) {
  const { Arrow, Phone } = Icons;
  const h1 = tone === 'warm'
    ? <>Votre partenaire diagnostic immobilier <em>en Indre-et-Loire</em>.</>
    : tone === 'direct'
    ? <>Diagnostics immobiliers &amp; carottages routiers. <em>Vos projets</em>, sécurisés.</>
    : <>Le cabinet au service de tous vos projets immobiliers <em>en Indre-et-Loire</em>.</>;
  const sub = tone === 'warm'
    ? "Construction, location, vente, travaux, gestion de copropriété — la plupart des biens immobiliers doivent faire l'objet de diagnostics et de contrôles. Servicimmo vous accompagne au quotidien pour respecter une réglementation de plus en plus étoffée."
    : tone === 'direct'
    ? "Cabinet certifié LCC Qualixpert, basé à Tours et Fondettes. Diagnostics habitations et locaux professionnels, repérages amiante avant travaux, carottages routiers. Assurance RCP Allianz."
    : "Cabinet certifié Qualixpert, nous intervenons sur l'ensemble des diagnostics immobiliers — habitations, locaux professionnels, copropriétés — ainsi que sur les repérages amiante et HAP avant travaux et les carottages routiers.";

  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div>
          <div className="eyebrow on-dark">Indre-et-Loire · Tours &amp; Fondettes</div>
          <h1 className="hero-h1">{h1}</h1>
          <p className="hero-sub">{sub}</p>
          <div className="hero-ctas">
            <a className="btn btn-primary">Demander un devis gratuit <Arrow/></a>
            <a className="btn btn-ghost"><Phone/> 02 47 47 0123</a>
          </div>
          <div className="hero-strip">
            <div className="hero-strip-item">
              <div className="hero-strip-value"><em>LCC</em> Qualixpert</div>
              <div className="hero-strip-label">Cabinet certifié</div>
            </div>
            <div className="hero-strip-item">
              <div className="hero-strip-value"><em>Allianz</em></div>
              <div className="hero-strip-label">Assurance RCP</div>
            </div>
            <div className="hero-strip-item">
              <div className="hero-strip-value"><em>Tours</em> + Fondettes</div>
              <div className="hero-strip-label">Équipes locales</div>
            </div>
            <div className="hero-strip-item">
              <div className="hero-strip-value"><em>Tout le 37</em></div>
              <div className="hero-strip-label">Indre-et-Loire</div>
            </div>
          </div>
        </div>
        <MapCard density={density}/>
      </div>
    </section>
  );
}

window.Header = Header;
window.Hero = Hero;
window.MapCard = MapCard;
