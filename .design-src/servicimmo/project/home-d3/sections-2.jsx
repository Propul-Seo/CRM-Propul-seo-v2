/* ═══════════ Specialties (Carottages + Amiante chantier) ═══════════ */
function Specialties() {
  const { Ruler, Layers, Arrow } = Icons;
  return (
    <section className="sec" style={{background: 'var(--bg)'}}>
      <div className="wrap">
        <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: 32}}>
          {/* Carottages routiers */}
          <div style={{background:'var(--slate)', color:'var(--white)', borderRadius: 20, padding: 48, position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:-30, right:-30, width:200, height:200, borderRadius:'50%', background:'rgba(232,163,61,0.08)'}}/>
            <div className="eyebrow on-dark">Spécialité</div>
            <h2 style={{fontSize: 32, lineHeight: 1.1, letterSpacing:'-0.025em', fontWeight: 500, margin: '14px 0 14px', color: 'var(--white)'}}>
              France Carottage Routier : <em style={{fontStyle:'normal', color:'var(--saf)'}}>amiante &amp; HAP</em> sur enrobés.
            </h2>
            <p style={{fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', margin: '0 0 24px', maxWidth:'46ch'}}>
              Recherche d'amiante et de HAP dans les enrobés routiers par carottages, afin de répondre aux obligations du Code du Travail, du Code de la Santé et du Code de l'Environnement. Équipe dédiée, matériel spécialisé.
            </p>
            <div style={{display:'flex', gap: 10, flexWrap:'wrap', marginBottom: 28}}>
              {['Voiries', 'Parkings', 'Trottoirs', 'Chantiers publics'].map(t => (
                <span key={t} style={{fontSize: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)'}}>{t}</span>
              ))}
            </div>
            <a className="btn btn-primary">En savoir plus <Arrow/></a>
          </div>

          {/* Amiante chantier */}
          <div style={{background:'var(--white)', border:'1px solid var(--line)', borderRadius: 20, padding: 48, position:'relative'}}>
            <div className="eyebrow">Spécialité</div>
            <h2 style={{fontSize: 32, lineHeight: 1.1, letterSpacing:'-0.025em', fontWeight: 500, margin: '14px 0 14px', color: 'var(--ink)'}}>
              Amiante avant travaux, démolition &amp; <em style={{fontStyle:'normal', color:'var(--saf-dark)'}}>après chantier</em>.
            </h2>
            <p style={{fontSize: 15, lineHeight: 1.55, color: 'var(--muted-2)', margin: '0 0 24px', maxWidth:'46ch'}}>
              Repérages amiante avant travaux, avant démolition, mesures d'empoussièrement, constats visuels après travaux, recherche de plomb en zone préfectorale. Un interlocuteur unique pour sécuriser votre chantier.
            </p>
            <div style={{display:'flex', flexDirection:'column', gap: 10, marginBottom: 28}}>
              {[
                'Repérage amiante avant travaux (RAAT)',
                'Repérage amiante avant démolition (RAAD)',
                'Mesures d\'empoussièrement',
                'Constat visuel après travaux',
                'Recherche plomb en zone',
              ].map(t => (
                <div key={t} style={{fontSize: 14, color: 'var(--ink)', display:'flex', alignItems:'center', gap: 10}}>
                  <span style={{width: 5, height: 5, borderRadius: '50%', background: 'var(--saf)'}}/>
                  {t}
                </div>
              ))}
            </div>
            <a className="btn btn-ink">Consulter nos interventions <Arrow/></a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Actualités ═══════════ */
function Actualites() {
  const { Arrow } = Icons;
  const items = [
    {
      tag: 'DPE',
      date: { d: '27', m: 'Mars 2026' },
      title: 'DPE reconduction du bail, DPE travaux : bientôt de nouvelles obligations ?',
      excerpt: 'Vous reconduisez le contrat de location d\'un appartement, d\'une maison ou d\'un local professionnel ? Vous venez d\'engager des travaux…',
      color: 'var(--saf)',
    },
    {
      tag: 'Plomb',
      date: { d: '25', m: 'Fév. 2026' },
      title: 'Plomb avant travaux : le risque au cœur de onze affiches de prévention',
      excerpt: 'La lutte contre l\'exposition professionnelle au plomb sur les chantiers de bâtiments anciens est un combat de longue haleine qui…',
      color: 'var(--slate)',
    },
    {
      tag: 'Amiante',
      date: { d: '29', m: 'Janv. 2026' },
      title: 'Amiante et rénovation énergétique : attention aux risques dans les bâtiments anciens',
      excerpt: 'La nécessité de réduire les consommations d\'énergie des bâtiments pour faire des économies et protéger la planète…',
      color: 'var(--saf-dark)',
    },
  ];

  return (
    <section className="sec" style={{background:'var(--white)', borderTop:'1px solid var(--line)'}}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">Nos dernières actualités</div>
          <h2 className="section-title">L'évolution réglementaire, <em>expliquée</em>.</h2>
          <p className="section-sub">La réglementation du diagnostic immobilier bouge régulièrement. Nos articles vous aident à rester à jour sur vos obligations.</p>
        </div>
        <div className="testi-grid">
          {items.map((n, i) => (
            <article key={i} className="testi" style={{padding:0, overflow:'hidden'}}>
              <div style={{background:n.color, height: 140, position:'relative', display:'grid', placeItems:'center', color:'var(--white)'}}>
                <span style={{fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.1em', textTransform:'uppercase', opacity:0.8}}>{n.tag}</span>
                <div style={{position:'absolute', bottom:0, right:16, background:'var(--slate)', color:'var(--white)', padding:'10px 12px', textAlign:'center', transform:'translateY(50%)', boxShadow:'0 4px 14px rgba(0,0,0,0.15)'}}>
                  <div style={{fontSize:20, fontWeight:600, letterSpacing:'-0.02em', lineHeight:1}}>{n.date.d}</div>
                  <div style={{fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:3, fontFamily:'Geist Mono, monospace'}}>{n.date.m}</div>
                </div>
              </div>
              <div style={{padding:'28px 24px 24px'}}>
                <h3 style={{fontSize:16, fontWeight:600, letterSpacing:'-0.015em', margin:'0 0 10px', lineHeight:1.35}}>{n.title}</h3>
                <p style={{fontSize:13, lineHeight:1.55, color:'var(--muted-2)', margin:'0 0 16px'}}>{n.excerpt}</p>
                <a style={{fontSize: 13, color:'var(--saf-dark)', fontWeight:600, display:'inline-flex', alignItems:'center', gap:6}}>Lire l'article <Arrow/></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Zones ═══════════ */
function Zones() {
  const zonesDPE = [
    'DPE Tours', 'DPE Sainte-Maure-de-Touraine', 'DPE Chambray-lès-Tours', 'DPE Luynes',
    'DPE Saint-Pierre-des-Corps', 'DPE Chinon', 'DPE Bléré', 'DPE Joué-lès-Tours',
    'DPE Fondettes', 'DPE Saint-Cyr-sur-Loire', 'DPE Château-Renault', 'DPE Amboise',
    'DPE Azay-le-Rideau', 'DPE Langeais', 'DPE commerce Tours', 'DPE Montlouis-sur-Loire',
    'DPE Loches', 'DPE Montbazon',
  ];
  const zonesDiag = [
    'Diagnostic Château-Renault', 'Diagnostic Ligueil', 'Diagnostic Azay-le-Rideau',
    'Diagnostic Saint-Pierre-des-Corps', 'Diagnostic Langeais', 'Amiante avant travaux Tours',
    'Diagnostic Bléré', 'Diagnostic Amboise', 'Diagnostic Membrolle-sur-Choisille',
    'Diagnostic Sainte-Maure-de-Touraine', 'Diagnostic Joué-lès-Tours', 'Diagnostic Descartes',
    'Diagnostic Chambray-lès-Tours', 'Diagnostic Fondettes', 'Diagnostic avant démolition Tours',
    'Diagnostic Luynes', 'Diagnostic Montbazon', 'Diagnostic Loches', 'Diagnostic Saint-Cyr-sur-Loire',
  ];
  return (
    <section className="sec" style={{background:'var(--slate)', color:'var(--white)', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cpath d='M0 100 Q50 60 100 100 T200 100' fill='none' stroke='%23e8a33d' stroke-opacity='0.05' stroke-width='1'/%3E%3C/svg%3E\")"}}/>
      <div className="wrap" style={{position:'relative'}}>
        <div className="sec-head">
          <div className="eyebrow on-dark">Diagnostic immobilier proche de Tours</div>
          <h2 className="section-title" style={{color:'var(--white)'}}>Nos équipes couvrent <em>toute l'Indre-et-Loire</em>.</h2>
          <p className="section-sub" style={{color:'rgba(255,255,255,0.7)'}}>Nous intervenons à Tours et Fondettes ainsi que dans l'ensemble du département. Quelques-unes des communes où nous sommes régulièrement présents :</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 40}}>
          <div>
            <h3 style={{fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--saf)', marginBottom: 18}}>Diagnostic de performance énergétique</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap: 6}}>
              {zonesDPE.map(z => (
                <span key={z} style={{fontSize: 13, padding: '6px 12px', background:'rgba(255,255,255,0.06)', borderRadius: 20, color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.08)'}}>{z}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--saf)', marginBottom: 18}}>Diagnostics &amp; amiante</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap: 6}}>
              {zonesDiag.map(z => (
                <span key={z} style={{fontSize: 13, padding: '6px 12px', background:'rgba(255,255,255,0.06)', borderRadius: 20, color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.08)'}}>{z}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Final CTA ═══════════ */
function FinalCTA() {
  const { Arrow, Phone } = Icons;
  return (
    <section className="sec">
      <div className="wrap">
        <div className="final-cta">
          <div style={{position:'relative', zIndex:1}}>
            <div className="eyebrow" style={{color:'var(--slate)'}}>Vous vendez ou louez ?</div>
            <h2 className="final-cta-title">Demandez un devis gratuit.</h2>
            <p className="final-cta-sub">Notre équipe vous recontacte rapidement pour cadrer votre projet, identifier les diagnostics obligatoires et vous transmettre un chiffrage.</p>
            <div style={{display:'flex', gap: 12, flexWrap: 'wrap'}}>
              <a className="btn btn-ink">Je souhaite être recontacté(e) <Arrow/></a>
              <a className="btn" style={{background:'rgba(30,58,77,0.08)', color:'var(--slate)', padding:'13px 20px', borderRadius:6}}>Espace client</a>
            </div>
          </div>
          <div className="final-cta-card">
            <div className="final-cta-card-label">Pour toutes informations</div>
            <div className="final-cta-card-phone">02 47 47 0123</div>
            <div className="final-cta-card-hours">Lundi au vendredi</div>
            <a className="btn" style={{background:'var(--saf)', color:'var(--slate)', width:'100%', justifyContent:'center', padding:'12px', borderRadius:6, fontWeight:600}}>
              <Phone/> Nous appeler
            </a>
            <div className="final-cta-card-or">ou</div>
            <a className="btn" style={{background:'transparent', color:'var(--white)', width:'100%', justifyContent:'center', padding:'12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)'}}>
              info@servicimmo.fr
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Footer ═══════════ */
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <div className="footer-logo-row">
            <div className="logo-mark">S</div>
            <div className="footer-logo-text">Servicimmo</div>
          </div>
          <p className="footer-addr">
            58 Rue de la Chevalerie<br/>
            37100 TOURS<br/>
            02 47 47 0123<br/>
            info[at]servicimmo.fr<br/>
            Lundi au vendredi
          </p>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            {['Qualixpert','I.Cert','Allianz','FNAIM','Optimiz\u0027e'].map(t => (
              <span key={t} style={{fontSize:11, background:'rgba(232,163,61,0.12)', color:'var(--saf)', padding:'4px 10px', borderRadius:20, fontFamily:'Geist Mono, monospace'}}>{t}</span>
            ))}
          </div>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <a>Actualités</a>
          <a>Promotion du moment</a>
          <a>Paiement en ligne</a>
          <a>Secteur d'intervention</a>
          <a>Témoignages clients</a>
          <a>Demande de devis</a>
        </div>
        <div className="footer-col">
          <h4>Professionnels</h4>
          <a>Attestation RT 2012</a>
          <a>DPE Neuf</a>
          <a>DPE collectif</a>
          <a>DPE mention tertiaire</a>
          <a>État des lieux</a>
        </div>
        <div className="footer-col">
          <h4>Amiante</h4>
          <a>DTA · Diagnostic Technique Amiante</a>
          <a>Diagnostics av. travaux / démol.</a>
          <a>Amiante et HAP enrobés</a>
          <a>Constat visuel après travaux</a>
          <a>Mesures d'empoussièrement</a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 Servicimmo · Diagnostics immobiliers &amp; Carottages routiers</span>
        <span>Mentions légales · Politique de confidentialité</span>
      </div>
    </footer>
  );
}

window.Specialties = Specialties;
window.Actualites = Actualites;
window.Zones = Zones;
window.FinalCTA = FinalCTA;
window.Footer = Footer;
// legacy names used by Home.html
window.Pros = Specialties;
window.Testimonials = Actualites;
window.FAQ = Zones;
