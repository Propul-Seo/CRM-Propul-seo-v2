// ═══════════════════════════════════════════════════════════════
// VARIANT 1 — Sobre éditorial
//   Single-page. Mono-neutral + teal accent. Geist forte,
//   beaucoup de blanc, grille géométrique discrète. Fade only.
// ═══════════════════════════════════════════════════════════════

const V1 = {
  ink:    '#0a0a0a',
  ink2:   '#2a2a2a',
  muted:  '#737373',
  muted2: '#a3a3a3',
  line:   '#e5e5e5',
  lineSoft:'#f0f0f0',
  paper:  '#ffffff',
  bg:     '#fafafa',
  accent: '#1E6B6E',   // teal
  accentSoft:'#e6f0ef',
  accentDark:'#164E50',
  ok:     '#0f7a4a',
  warn:   '#b45309',
};

// ── Shared atoms ──
function V1Eyebrow({ children }) {
  return <div style={{
    fontFamily:'Geist Mono, monospace', fontSize: 10.5, letterSpacing:'0.14em',
    textTransform:'uppercase', color: V1.muted, fontWeight: 500,
  }}>{children}</div>;
}

function V1Field({ label, hint, children, optional, help }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 12 }}>
        <label style={{ fontSize: 13.5, fontWeight: 500, color: V1.ink, letterSpacing:'-0.005em' }}>
          {label}{optional && <span style={{ color: V1.muted2, fontWeight: 400, marginLeft: 6 }}>· facultatif</span>}
        </label>
        {help && <span style={{ fontSize: 11.5, color: V1.muted, fontFamily:'Geist Mono, monospace' }}>{help}</span>}
      </div>
      {hint && <div style={{ fontSize: 12.5, color: V1.muted, lineHeight: 1.45 }}>{hint}</div>}
      {children}
    </div>
  );
}

function V1Input({ value, placeholder, suffix, onChange, compact, monospace }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 8,
      border: `1px solid ${V1.line}`, borderRadius: 6, background: V1.paper,
      padding: compact ? '8px 12px' : '11px 14px', fontSize: 14,
    }}>
      <input value={value||''} placeholder={placeholder} onChange={e=>onChange && onChange(e.target.value)}
        style={{ border:'none', outline:'none', flex: 1, background:'transparent', fontSize: 14,
                 fontFamily: monospace ? 'Geist Mono, monospace' : 'inherit', color: V1.ink }}/>
      {suffix && <span style={{ color: V1.muted, fontSize: 13, fontFamily:'Geist Mono, monospace' }}>{suffix}</span>}
    </div>
  );
}

function V1Radio({ selected, onClick, children, compact }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap: 10, cursor:'pointer',
      border: `1px solid ${selected ? V1.ink : V1.line}`,
      background: selected ? V1.ink : V1.paper, color: selected ? '#fff' : V1.ink,
      borderRadius: 6, padding: compact ? '8px 14px' : '11px 16px',
      fontSize: 13.5, fontWeight: 500, fontFamily:'inherit',
      transition: 'all .15s', textAlign:'left',
    }}>{children}</button>
  );
}

// ── BRANCH PICKER — 5 cards ──
function V1BranchCard({ b, selected, onClick, featured }) {
  const Icon = I[b.icon];
  return (
    <button onClick={onClick} style={{
      position:'relative', textAlign:'left', cursor:'pointer',
      border: `1px solid ${selected ? V1.ink : V1.line}`,
      background: selected ? V1.ink : V1.paper,
      color: selected ? '#fff' : V1.ink,
      borderRadius: 6, padding: '20px 22px',
      display:'flex', flexDirection:'column', gap: 14, minHeight: 138,
      gridColumn: featured ? 'span 2' : 'span 1',
      transition: 'all .18s', fontFamily:'inherit',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 6,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: selected ? 'rgba(255,255,255,.1)' : V1.lineSoft, color: selected ? '#fff' : V1.ink,
        }}><Icon width={18} height={18}/></div>
        <span style={{
          fontFamily:'Geist Mono, monospace', fontSize: 10.5, letterSpacing:'.1em',
          color: selected ? 'rgba(255,255,255,.55)' : V1.muted2,
        }}>{String(b.pct).padStart(2,'0')}%</span>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing:'-0.01em', marginBottom: 4 }}>{b.label}</div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: selected ? 'rgba(255,255,255,.65)' : V1.muted }}>{b.tagline}</div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN A — Entry (branch picker)
// ═══════════════════════════════════════════════════════════════
function V1ScreenEntry({ mobile, selected='sale', onPick }) {
  return (
    <div style={{ background: V1.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V1.ink }}>
      {/* Top bar */}
      <div style={{ borderBottom:`1px solid ${V1.line}`, background: V1.paper, padding: mobile ? '14px 20px' : '18px 48px',
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.02em' }}>
          <span style={{ color: V1.accent }}>◐</span>&nbsp;&nbsp;Servicimmo
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: mobile ? 10 : 18, fontSize: 12.5, color: V1.muted }}>
          <span style={{ display:'flex', alignItems:'center', gap: 6 }}><I.clock width={13} height={13}/> 2 min</span>
          {!mobile && <span style={{ display:'flex', alignItems:'center', gap: 6 }}><I.shield width={13} height={13}/> Sans inscription</span>}
          {!mobile && <span style={{ fontFamily:'Geist Mono, monospace' }}>02 47 47 01 23</span>}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin:'0 auto', padding: mobile ? '28px 20px 60px' : '72px 48px 100px' }}>
        <V1Eyebrow>Étape 01 / 02 · Votre projet</V1Eyebrow>
        <h1 style={{
          fontSize: mobile ? 32 : 52, lineHeight: 1.05, letterSpacing:'-0.035em', fontWeight: 600,
          margin: '14px 0 16px', color: V1.ink, textWrap:'pretty',
        }}>
          Quel est votre projet&nbsp;?
        </h1>
        <p style={{ fontSize: mobile ? 15 : 17, lineHeight: 1.55, color: V1.muted, maxWidth: 620, margin: 0 }}>
          En 2 minutes, identifiez les diagnostics obligatoires pour votre bien et recevez une estimation
          tarifaire. Sans engagement, sans création de compte.
        </p>

        <div style={{ marginTop: mobile ? 32 : 48,
                      display:'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {BRANCHES.map((b, i) => (
            <V1BranchCard key={b.key} b={b} selected={selected===b.key} onClick={()=>onPick && onPick(b.key)}
              featured={!mobile && i === 4}/>
          ))}
        </div>

        <div style={{ marginTop: mobile ? 28 : 40, display:'flex', alignItems:'center',
                      justifyContent: mobile ? 'stretch' : 'space-between', flexDirection: mobile?'column':'row', gap: 14 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, fontSize: 12.5, color: V1.muted }}>
            <div style={{ display:'flex', gap:-8 }}>
              {['#1E6B6E','#A8D91C','#E67E22'].map((c,i)=>
                <div key={i} style={{ width: 22, height: 22, borderRadius:'50%', background: c,
                  marginLeft: i>0?-8:0, border:'2px solid #fff' }}/>)}
            </div>
            Cabinet indépendant à Tours · 28 ans d'existence
          </div>
          <button style={{
            width: mobile?'100%':'auto',
            background: V1.ink, color:'#fff', border:'none', borderRadius: 6,
            padding:'13px 22px', fontSize: 14, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
          }}>Continuer <I.arrow width={15} height={15}/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN B — Filled (advanced state, sale branch)
// ═══════════════════════════════════════════════════════════════
function V1ScreenFilled({ mobile }) {
  const s = DEMO_STATE;
  return (
    <div style={{ background: V1.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V1.ink }}>
      <div style={{ borderBottom:`1px solid ${V1.line}`, background: V1.paper, padding: mobile ? '14px 20px' : '18px 48px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.02em' }}>
          <span style={{ color: V1.accent }}>◐</span>&nbsp;&nbsp;Servicimmo
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 14, fontSize: 12.5, color: V1.muted }}>
          <div style={{ width: mobile?80:140, height: 3, background: V1.line, borderRadius: 2, overflow:'hidden' }}>
            <div style={{ width: '78%', height: '100%', background: V1.ink }}/>
          </div>
          <span style={{ fontFamily:'Geist Mono, monospace' }}>78%</span>
        </div>
      </div>

      <div style={{ maxWidth: 840, margin:'0 auto', padding: mobile ? '24px 20px 40px' : '48px 48px 80px' }}>
        {/* Selected branch chip */}
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 8,
                        border:`1px solid ${V1.ink}`, background: V1.ink, color:'#fff',
                        padding:'6px 12px', borderRadius: 4, fontSize: 12.5, fontWeight: 500 }}>
            <I.home width={13} height={13}/> Vente
          </div>
          <button style={{ background:'none', border:'none', color: V1.muted, fontSize: 12.5, cursor:'pointer',
                          display:'inline-flex', alignItems:'center', gap: 4, fontFamily:'inherit' }}>
            <I.edit width={12} height={12}/> Changer
          </button>
        </div>

        {/* Section 1 — Le bien */}
        <div style={{ marginBottom: 44 }}>
          <V1Eyebrow>Bloc 01 · Le bien</V1Eyebrow>
          <h2 style={{ fontSize: mobile?22:28, fontWeight: 600, letterSpacing:'-0.02em', margin:'8px 0 24px' }}>
            Parlons de votre bien.
          </h2>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 20, marginBottom: 20 }}>
            <V1Field label="Type de bien">
              <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
                {[['maison','Maison'],['appartement','Apt.'],['local','Local'],['terrain','Terrain'],['autre','Autre']].map(([k,l])=>
                  <V1Radio key={k} compact selected={s.property_type===k}>{l}</V1Radio>)}
              </div>
            </V1Field>
            <V1Field label="Surface habitable">
              <V1Input value={s.surface} suffix="m²" monospace/>
            </V1Field>
          </div>

          <V1Field label="Adresse du bien" hint="Saisie assistée — code postal et ville remplis automatiquement">
            <V1Input value={`${s.address}, ${s.postal_code} ${s.city}`} />
          </V1Field>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 20, marginTop: 20 }}>
            <V1Field label="Nombre de pièces">
              <div style={{ display:'flex', alignItems:'center', gap: 0, border:`1px solid ${V1.line}`,
                            borderRadius: 6, width:'fit-content', background: V1.paper }}>
                <button style={{ width: 40, height: 40, border:'none', background:'transparent', cursor:'pointer', color: V1.muted }}><I.minus width={14} height={14}/></button>
                <span style={{ width: 40, textAlign:'center', fontFamily:'Geist Mono, monospace', fontSize: 14, fontWeight: 500 }}>{s.rooms_count}</span>
                <button style={{ width: 40, height: 40, border:'none', background:'transparent', cursor:'pointer' }}><I.plus width={14} height={14}/></button>
              </div>
            </V1Field>
            <V1Field label="En copropriété ?">
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                  <V1Radio key={k} compact selected={s.is_coownership===k}>{l}</V1Radio>)}
              </div>
            </V1Field>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop:`1px solid ${V1.line}`, margin:'0 0 44px' }}/>

        {/* Section 2 — Caractéristiques techniques */}
        <div style={{ marginBottom: 44 }}>
          <V1Eyebrow>Bloc 02 · Caractéristiques techniques</V1Eyebrow>
          <h2 style={{ fontSize: mobile?22:28, fontWeight: 600, letterSpacing:'-0.02em', margin:'8px 0 8px' }}>
            Un peu d'histoire du bâti.
          </h2>
          <p style={{ fontSize: 13.5, color: V1.muted, margin:'0 0 24px', maxWidth: 520 }}>
            Ces dates déterminent les risques plomb et amiante — aucune inquiétude si vous ne savez pas, nous vérifierons sur place.
          </p>

          <V1Field label="Date du permis de construire">
            <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['before_1949','Avant 1949'],
                ['1949_1997','1949 — juillet 1997'],
                ['after_1997','Après juillet 1997'],
                ['dk','Je ne sais pas'],
              ].map(([k,l])=>
                <V1Radio key={k} compact selected={s.permit_date_range===k}>{l}</V1Radio>)}
            </div>
          </V1Field>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 20, marginTop: 20 }}>
            <V1Field label="Chauffage principal">
              <div style={{ position:'relative' }}>
                <div style={{ border:`1px solid ${V1.line}`, borderRadius: 6, padding:'11px 14px',
                              fontSize: 14, background: V1.paper, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span><I.flame width={14} height={14} style={{verticalAlign:'-2px', marginRight:6}}/>Gaz</span>
                  <I.chevronDown width={14} height={14}/>
                </div>
              </div>
            </V1Field>
            <V1Field label="Installation gaz présente ?">
              <div style={{ border:`1px solid ${V1.line}`, borderRadius: 6, padding:'11px 14px',
                            fontSize: 14, background: V1.paper, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span>Gaz de ville</span><I.chevronDown width={14} height={14}/>
              </div>
            </V1Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 20, marginTop: 20 }}>
            <V1Field label="Installation gaz > 15 ans ?">
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                  <V1Radio key={k} compact selected={s.gas_over_15_years===k}>{l}</V1Radio>)}
              </div>
            </V1Field>
            <V1Field label="Installation électrique > 15 ans ?">
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                  <V1Radio key={k} compact selected={s.electric_over_15_years===k}>{l}</V1Radio>)}
              </div>
            </V1Field>
          </div>
        </div>

        <div style={{ borderTop:`1px solid ${V1.line}`, margin:'0 0 44px' }}/>

        {/* Section 3 — Délai + notes */}
        <div style={{ marginBottom: 44 }}>
          <V1Eyebrow>Bloc 03 · Votre délai</V1Eyebrow>
          <h2 style={{ fontSize: mobile?22:28, fontWeight: 600, letterSpacing:'-0.02em', margin:'8px 0 24px' }}>
            Quand souhaitez-vous intervenir ?
          </h2>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              ['asap','< 48 h'],['week','1 semaine'],['two_weeks','2 semaines'],['month','Dans le mois'],['flex','Pas pressé'],
            ].map(([k,l])=>
              <V1Radio key={k} compact selected={s.urgency===k}>{l}</V1Radio>)}
          </div>
          <V1Field label="Précisions complémentaires" optional help="0 / 2000">
            <textarea placeholder="Ascenseur, code, créneaux horaires..." style={{
              border:`1px solid ${V1.line}`, borderRadius: 6, padding:'11px 14px', fontSize: 14,
              fontFamily:'inherit', minHeight: 72, resize:'vertical', background: V1.paper, outline:'none',
            }}/>
          </V1Field>
        </div>

        {/* CTA bottom */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16,
                      flexDirection: mobile?'column-reverse':'row',
                      padding:'24px 0 0', borderTop:`1px solid ${V1.line}` }}>
          <button style={{ background:'none', border:'none', color: V1.muted, fontSize: 13.5, cursor:'pointer',
                          display:'inline-flex', alignItems:'center', gap: 6, fontFamily:'inherit' }}>
            <I.arrowL width={14} height={14}/> Retour
          </button>
          <button style={{
            width: mobile?'100%':'auto',
            background: V1.ink, color:'#fff', border:'none', borderRadius: 6,
            padding:'14px 28px', fontSize: 14, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
          }}>Voir mon récapitulatif <I.arrow width={15} height={15}/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN C — Recap (surprise reveal)
// ═══════════════════════════════════════════════════════════════
function V1ScreenRecap({ mobile }) {
  const diags = calcDiagnostics(DEMO_STATE);
  const pricing = calcPricing(DEMO_STATE, diags);

  return (
    <div style={{ background: V1.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V1.ink }}>
      <div style={{ borderBottom:`1px solid ${V1.line}`, background: V1.paper, padding: mobile ? '14px 20px' : '18px 48px',
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.02em' }}>
          <span style={{ color: V1.accent }}>◐</span>&nbsp;&nbsp;Servicimmo
        </div>
        <span style={{ fontSize: 12.5, color: V1.muted, fontFamily:'Geist Mono, monospace' }}>02 / 02</span>
      </div>

      <div style={{ maxWidth: 840, margin:'0 auto', padding: mobile ? '24px 20px 40px' : '56px 48px 80px' }}>
        <V1Eyebrow>Votre récapitulatif</V1Eyebrow>
        <h1 style={{ fontSize: mobile?30:46, lineHeight: 1.08, letterSpacing:'-0.035em', fontWeight: 600,
                     margin: '14px 0 14px', textWrap:'pretty' }}>
          Voici ce qu'il vous faut.
        </h1>
        <p style={{ fontSize: mobile?15:16.5, lineHeight: 1.55, color: V1.muted, maxWidth: 560, margin: 0 }}>
          Nos experts ont identifié {diags.length} diagnostics obligatoires pour votre bien.
          Validez vos coordonnées et nous vous rappelons sous 2 h ouvrées.
        </p>

        {/* Pricing block */}
        <div style={{ marginTop: mobile?28:40, padding: mobile?'24px 22px':'32px 36px',
                      background: V1.ink, color:'#fff', borderRadius: 8, position:'relative', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between',
                        flexDirection: mobile?'column':'row', gap: 12 }}>
            <div>
              <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'.14em',
                            textTransform:'uppercase', color: 'rgba(255,255,255,.5)' }}>Estimation TTC</div>
              <div style={{ marginTop: 8, fontSize: mobile?36:52, letterSpacing:'-0.03em',
                            fontWeight: 600, lineHeight: 1 }}>
                {pricing.low}&nbsp;€ <span style={{ color:'rgba(255,255,255,.45)' }}>—</span>&nbsp;{pricing.high}&nbsp;€
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems: mobile?'flex-start':'flex-end', gap: 8 }}>
              {pricing.modulators.map((m,i)=>
                <div key={i} style={{ display:'inline-flex', alignItems:'center', gap: 8,
                  border:'1px solid rgba(255,255,255,.18)', borderRadius: 4,
                  padding:'5px 10px', fontSize: 12, color:'rgba(255,255,255,.8)', fontFamily:'Geist Mono, monospace' }}>
                  {m.label} <span style={{ color: V1.accent, fontWeight: 600 }}>{m.delta}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)',
                        fontSize: 12, color:'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
            Estimation indicative basée sur les tarifs en vigueur au 01 / 01 / 2026. Devis définitif sous 2&nbsp;h ouvrées.
          </div>
        </div>

        {/* Diagnostics list */}
        <div style={{ marginTop: mobile?32:48 }}>
          <V1Eyebrow>{diags.length} diagnostics obligatoires</V1Eyebrow>
          <div style={{ marginTop: 16, border:`1px solid ${V1.line}`, borderRadius: 8, background: V1.paper, overflow:'hidden' }}>
            {diags.map((d,i) => (
              <div key={d.id} style={{
                padding: '16px 20px',
                borderBottom: i<diags.length-1 ? `1px solid ${V1.lineSoft}` : 'none',
                display:'grid', gridTemplateColumns: mobile? '28px 1fr' : '40px 1fr 20px', gap: 14, alignItems: mobile?'flex-start':'center',
              }}>
                <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: V1.muted, paddingTop: 3 }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing:'-0.01em', marginBottom: 3 }}>{d.name}</div>
                  <div style={{ fontSize: 12.5, color: V1.muted, lineHeight: 1.5 }}>{d.why}</div>
                </div>
                {!mobile && <I.check width={16} height={16} style={{ color: V1.accent }}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div style={{ marginTop: mobile?32:48 }}>
          <V1Eyebrow>Validez vos coordonnées</V1Eyebrow>
          <h2 style={{ fontSize: mobile?22:26, fontWeight: 600, letterSpacing:'-0.02em', margin:'8px 0 24px' }}>
            Nous vous rappelons sous 2 h ouvrées.
          </h2>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'auto 1fr 1fr', gap: 14, marginBottom: 16 }}>
            <V1Field label="Civilité">
              <div style={{ display:'flex', gap: 6 }}>
                {[['m','M.'],['mme','Mme'],['autre','Autre']].map(([k,l])=>
                  <V1Radio key={k} compact>{l}</V1Radio>)}
              </div>
            </V1Field>
            <V1Field label="Prénom"><V1Input placeholder="Jean"/></V1Field>
            <V1Field label="Nom"><V1Input placeholder="Dupont"/></V1Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 14, marginBottom: 16 }}>
            <V1Field label="Email"><V1Input placeholder="jean.dupont@email.fr"/></V1Field>
            <V1Field label="Téléphone" optional help="recommandé"><V1Input placeholder="06 xx xx xx xx"/></V1Field>
          </div>

          <label style={{ display:'flex', gap: 10, alignItems:'flex-start', cursor:'pointer',
                          padding:'12px 0', fontSize: 12.5, color: V1.muted, lineHeight: 1.5 }}>
            <div style={{ width: 16, height: 16, border:`1.5px solid ${V1.muted2}`, borderRadius: 3,
                          flexShrink:0, marginTop:2 }}/>
            J'accepte que mes données soient utilisées pour le traitement de ma demande.
            Consultez notre <u>politique de confidentialité</u>.
          </label>
        </div>

        <button style={{
          width:'100%', marginTop: 24,
          background: V1.ink, color:'#fff', border:'none', borderRadius: 6,
          padding:'16px 24px', fontSize: 15, fontWeight: 600, cursor:'pointer', fontFamily:'inherit',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
        }}>Envoyer ma demande <I.send width={16} height={16}/></button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN D — Thank-you
// ═══════════════════════════════════════════════════════════════
function V1ScreenThanks({ mobile }) {
  return (
    <div style={{ background: V1.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V1.ink }}>
      <div style={{ borderBottom:`1px solid ${V1.line}`, background: V1.paper, padding: mobile ? '14px 20px' : '18px 48px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.02em' }}>
          <span style={{ color: V1.accent }}>◐</span>&nbsp;&nbsp;Servicimmo
        </div>
      </div>

      <div style={{ maxWidth: 680, margin:'0 auto', padding: mobile ? '56px 20px' : '120px 48px', textAlign:'left' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: V1.ink, color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 28 }}>
          <I.check width={22} height={22}/>
        </div>
        <V1Eyebrow>Demande reçue · 12:34</V1Eyebrow>
        <h1 style={{ fontSize: mobile?30:48, lineHeight: 1.08, letterSpacing:'-0.035em', fontWeight: 600,
                     margin:'14px 0 20px', textWrap:'pretty' }}>
          Merci&nbsp;Jean,<br/>votre demande est bien reçue.
        </h1>
        <p style={{ fontSize: mobile?15:17, lineHeight: 1.6, color: V1.muted2, margin: 0, maxWidth: 540 }}>
          Un récapitulatif vient d'être envoyé à <span style={{ color: V1.ink, fontFamily:'Geist Mono, monospace' }}>jean.dupont@email.fr</span>.
          Notre équipe vous contactera sous 2 h ouvrées pour valider votre devis et planifier l'intervention.
        </p>

        <div style={{ marginTop: 36, display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 12 }}>
          <div style={{ border:`1px solid ${V1.line}`, borderRadius: 6, padding:'14px 16px', background: V1.paper }}>
            <div style={{ fontSize: 11.5, color: V1.muted, fontFamily:'Geist Mono, monospace', letterSpacing:'.1em',
                          textTransform:'uppercase', marginBottom: 4 }}>Référence</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily:'Geist Mono, monospace' }}>DEV-2026-04-0187</div>
          </div>
          <div style={{ border:`1px solid ${V1.line}`, borderRadius: 6, padding:'14px 16px', background: V1.paper }}>
            <div style={{ fontSize: 11.5, color: V1.muted, fontFamily:'Geist Mono, monospace', letterSpacing:'.1em',
                          textTransform:'uppercase', marginBottom: 4 }}>Votre expert</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>M. Fabrice Martin · Tours</div>
          </div>
        </div>

        <div style={{ marginTop: 28, display:'flex', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
          <a href="#" style={{ display:'inline-flex', alignItems:'center', gap: 8,
                              background: V1.ink, color:'#fff', padding:'11px 18px', borderRadius: 6,
                              fontSize: 13.5, fontWeight: 500, textDecoration:'none' }}>
            <I.phone width={14} height={14}/> 02 47 47 01 23
          </a>
          <a href="#" style={{ display:'inline-flex', alignItems:'center', gap: 8,
                              border:`1px solid ${V1.line}`, color: V1.ink, padding:'11px 18px', borderRadius: 6,
                              fontSize: 13.5, fontWeight: 500, textDecoration:'none', background: V1.paper }}>
            Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { V1ScreenEntry, V1ScreenFilled, V1ScreenRecap, V1ScreenThanks, V1 });
