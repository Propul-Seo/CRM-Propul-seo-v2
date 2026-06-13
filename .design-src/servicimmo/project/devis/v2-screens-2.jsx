// ────────── V2 screens 2 — recap + thanks ──────────

function RecapScreen({ palette, device }) {
  const c = palette;
  const chrome = c.chrome;
  const branchColor = c.branches.sale;
  const mobile = device === 'mobile';

  const answers = { permit:'1949_1997', coownership:'no', gas_old:'yes', elec_old:'yes', postal:'37000' };
  const diagnostics = computeDiagnostics('sale', answers);
  const pricing = computePricing(diagnostics, 92);
  const toValidate = diagnostics.filter(d => d.code === 'AMIANTE'); // mock one "à valider"

  return (
    <div style={{ background: chrome.cream, minHeight:'100%', padding: mobile ? '24px 16px 40px' : '40px 40px 56px' }}>
      {/* Kicker */}
      <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 10 }}>
        VOTRE RÉCAPITULATIF
      </div>
      <h1 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: mobile?30:44, fontWeight: 400, letterSpacing:'-.025em', color: chrome.ink, lineHeight: 1.08 }}>
        Voici <em style={{ fontStyle:'italic', fontWeight: 500 }}>ce qu'il vous faut</em>.
      </h1>
      <p style={{ margin:'14px 0 28px', color: chrome.muted, fontSize: mobile?15:16, lineHeight: 1.55, maxWidth: 580 }}>
        Nos experts ont identifié les diagnostics obligatoires pour votre bien. Validez vos coordonnées et nous vous rappelons sous 2 h.
      </p>

      {/* Pricing hero */}
      <div style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 18, padding: mobile?20:28, marginBottom: 18, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-40, top:-40, width: 140, height: 140, borderRadius:'50%', background: branchColor.bg, opacity: .5 }}/>
        <div style={{ position:'relative', display:'flex', alignItems: mobile?'flex-start':'flex-end', flexDirection: mobile?'column':'row', gap: mobile?10:24, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth: 220 }}>
            <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.12em' }}>ESTIMATION TTC</div>
            <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: mobile?44:58, fontWeight: 400, color: chrome.ink, letterSpacing:'-.03em', lineHeight: 1, marginTop: 6 }}>
              {pricing.low} <span style={{ color: chrome.muted, fontSize: mobile?22:28 }}>—</span> {pricing.high} <span style={{ fontSize: mobile?28:36, color: chrome.ink }}>€</span>
            </div>
            <div style={{ marginTop: 10, display:'flex', flexWrap:'wrap', gap: 6 }}>
              {pricing.modifiers.map((m, i) => (
                <span key={i} style={{ padding:'4px 10px', borderRadius: 999, background: branchColor.bg, color: branchColor.dark, fontSize: 11, fontWeight: 500, fontFamily:'Geist Mono, monospace' }}>
                  {m.sign} · {m.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: mobile?'left':'right', color: chrome.muted, fontSize: 12, maxWidth: 220, lineHeight: 1.5 }}>
            Tarifs au 01/01/2026. Devis définitif sous <strong style={{ color: chrome.ink, fontWeight: 500 }}>2 h ouvrées</strong>.
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr': '1.4fr 1fr', gap: 16 }}>
        {/* Diagnostics list */}
        <div style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 19, fontWeight: 500, color: chrome.ink }}>Vos diagnostics obligatoires</div>
            <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 12, color: chrome.muted }}>{diagnostics.length} identifiés</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {diagnostics.map((d, i) => (
              <div key={d.code} style={{ display:'flex', gap: 14, padding:'14px 0', borderTop: i?`1px solid ${chrome.line}`:'none' }}>
                <div style={{ flex:'0 0 auto', width: 36, height: 36, borderRadius: 10, background: branchColor.bg, color: branchColor.dark, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Geist Mono, monospace', fontSize: 10, fontWeight: 600 }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize: 15, color: chrome.ink, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: chrome.muted, marginTop: 2, lineHeight: 1.45 }}>{d.reason}</div>
                </div>
                <div style={{ color: branchColor.fg, flex:'0 0 auto', marginTop: 8 }}><I.check width={16} height={16}/></div>
              </div>
            ))}
          </div>

          {toValidate.length > 0 && (
            <div style={{ marginTop: 18, padding: 14, background: c.chrome.cream, borderRadius: 12, border: `1px dashed ${chrome.line}` }}>
              <div style={{ fontSize: 12, fontFamily:'Geist Mono, monospace', color: chrome.muted, letterSpacing:'.1em', marginBottom: 6 }}>À VALIDER SUR PLACE</div>
              <div style={{ fontSize: 13, color: chrome.ink, lineHeight: 1.5 }}>
                Vous avez répondu « je ne sais pas » à certaines questions : l'expert confirme ces diagnostics lors de la visite.
              </div>
            </div>
          )}
        </div>

        {/* Contact form */}
        <div style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 18, padding: 22 }}>
          <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 19, fontWeight: 500, color: chrome.ink, marginBottom: 4 }}>Vos coordonnées</div>
          <div style={{ fontSize: 13, color: chrome.muted, marginBottom: 16 }}>On vous rappelle sous 2 h ouvrées.</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            <div>
              <Label chrome={chrome}>Civilité</Label>
              <RadioRow value="m" branchColor={branchColor} chrome={chrome}
                        options={[{v:'m',l:'M.'},{v:'mme',l:'Mme'},{v:'o',l:'Autre'}]}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              <div><Label chrome={chrome}>Prénom</Label><Field chrome={chrome} value="Claire"/></div>
              <div><Label chrome={chrome}>Nom</Label><Field chrome={chrome} value="Dubois"/></div>
            </div>
            <div>
              <Label chrome={chrome} help="Recommandé pour accélérer la prise de RDV.">Téléphone</Label>
              <Field chrome={chrome} value="06 12 34 56 78"/>
            </div>
            <label style={{ display:'flex', alignItems:'flex-start', gap: 10, fontSize: 12, color: chrome.muted, lineHeight: 1.5, cursor:'pointer', marginTop: 4 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border:`1.5px solid ${branchColor.fg}`, background: branchColor.fg, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto', marginTop: 2 }}>
                <I.check width={11} height={11}/>
              </span>
              <span>J'accepte que mes données soient utilisées pour ma demande de devis. Pas de spam, vos données restent chez nous.</span>
            </label>
            <button style={{ marginTop: 6, padding:'16px 18px', background: branchColor.fg, color:'#fff', border:'none', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8, fontFamily:'Geist, sans-serif' }}>
              Envoyer ma demande <I.arrow width={16} height={16}/>
            </button>
            <div style={{ fontSize: 11, color: chrome.muted, textAlign:'center', fontFamily:'Geist Mono, monospace', letterSpacing:'.08em' }}>
              <I.lock width={11} height={11} style={{ display:'inline', verticalAlign:'middle', marginRight: 5 }}/>
              données chiffrées · rgpd
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThanksScreen({ palette, device }) {
  const c = palette;
  const chrome = c.chrome;
  const branchColor = c.branches.sale;
  const mobile = device === 'mobile';
  return (
    <div style={{ background: chrome.cream, minHeight:'100%', padding: mobile ? '60px 22px' : '90px 56px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ maxWidth: 560, width:'100%' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: branchColor.bg, color: branchColor.dark, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 22 }}>
          <I.check width={28} height={28}/>
        </div>
        <h1 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: mobile?30:40, fontWeight: 400, letterSpacing:'-.025em', color: chrome.ink, lineHeight: 1.1 }}>
          Merci <em style={{ fontStyle:'italic', fontWeight: 500 }}>Claire</em>, votre demande est bien reçue.
        </h1>
        <p style={{ margin: '18px 0 28px', color: chrome.muted, fontSize: mobile?15:17, lineHeight: 1.55 }}>
          Un récapitulatif a été envoyé à <strong style={{ color: chrome.ink, fontWeight: 500 }}>claire.dubois@email.fr</strong>. Notre équipe vous contactera sous <strong style={{ color: chrome.ink, fontWeight: 500 }}>2 h ouvrées</strong> pour valider votre devis et planifier l'intervention.
        </p>
        <div style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 16, padding: 22, display:'flex', flexDirection:'column', gap: 14 }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.14em' }}>PROCHAINES ÉTAPES</div>
          {[
            { n:'01', t:'Appel téléphonique', d:'Dans les 2 h ouvrées — vérification rapide et confirmation du devis.' },
            { n:'02', t:'Planification', d:'On choisit ensemble un créneau d\'intervention qui vous arrange.' },
            { n:'03', t:'Intervention', d:'Notre technicien se présente sur place, diagnostics en 1 à 2 h selon le bien.' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', gap: 14, paddingTop: 6, borderTop: s.n!=='01'?`1px solid ${chrome.line}`:'none', paddingBottom: 2 }}>
              <div style={{ flex:'0 0 auto', fontFamily:'Geist Mono, monospace', fontSize: 11, color: branchColor.fg, fontWeight: 600, marginTop: 4 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 15, color: chrome.ink, fontWeight: 500 }}>{s.t}</div>
                <div style={{ fontSize: 13, color: chrome.muted, marginTop: 2, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display:'flex', flexWrap:'wrap', gap: 10 }}>
          <button style={{ padding:'12px 18px', background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 10, fontSize: 13, color: chrome.ink, cursor:'pointer', display:'inline-flex', alignItems:'center', gap: 8 }}>
            <I.phone width={14} height={14}/> 02 47 47 01 23
          </button>
          <button style={{ padding:'12px 18px', background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 10, fontSize: 13, color: chrome.ink, cursor:'pointer', display:'inline-flex', alignItems:'center', gap: 8 }}>
            <I.mail width={14} height={14}/> contact@servicimmo.fr
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RecapScreen, ThanksScreen });
