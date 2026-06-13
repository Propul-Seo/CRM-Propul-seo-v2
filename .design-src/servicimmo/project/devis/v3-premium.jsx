// ═══════════════════════════════════════════════════════════════
// VARIANT 3 — Éditorial premium (2 pages)
//   Page 1: Votre bien (toutes les questions produit)
//   Page 2: Contact + récap (email, coordonnées, diagnostics calculés)
//   Gradient subtil, shine sur hover, counter animé, typo à tracking travaillé
// ═══════════════════════════════════════════════════════════════

const V3 = {
  ink:     '#0a0f1c',
  ink2:    '#1d2437',
  muted:   '#5a6378',
  muted2:  '#8891a4',
  line:    'rgba(10,15,28,.08)',
  lineStr: 'rgba(10,15,28,.14)',
  paper:   '#ffffff',
  bgTop:   '#f4f6fb',
  bgBot:   '#eef1f8',
  accent:  '#1E6B6E',   // teal
  accentLite:'#2a8a8e',
  accentBg:'rgba(30,107,110,.06)',
  gold:    '#c79339',
  goldSoft:'rgba(199,147,57,.14)',
};

// ── Atoms ──
function V3Kicker({ children, dark }) {
  return <div style={{
    fontFamily:'Geist Mono, monospace', fontSize: 10.5, letterSpacing:'0.22em',
    textTransform:'uppercase', color: dark ? 'rgba(255,255,255,.55)' : V3.muted, fontWeight: 500,
  }}>{children}</div>;
}

function V3Field({ label, hint, children, optional, help }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: V3.ink, letterSpacing:'0.02em' }}>
          {label}{optional && <span style={{ color: V3.muted2, fontWeight: 400, marginLeft: 8 }}>(facultatif)</span>}
        </label>
        {help && <span style={{ fontSize: 11, color: V3.muted2, fontFamily:'Geist Mono, monospace', letterSpacing:'.05em' }}>{help}</span>}
      </div>
      {hint && <div style={{ fontSize: 12.5, color: V3.muted, lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  );
}

function V3Input({ value, placeholder, suffix, monospace, icon: Icon }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 10,
      background: V3.paper, border: `1px solid ${V3.line}`, borderRadius: 8,
      padding: '13px 16px', fontSize: 14.5,
      boxShadow: '0 1px 0 rgba(10,15,28,.02), inset 0 0 0 1px rgba(255,255,255,.5)',
    }}>
      {Icon && <Icon width={15} height={15} style={{ color: V3.muted2 }}/>}
      <input value={value||''} placeholder={placeholder} readOnly
        style={{ border:'none', outline:'none', flex: 1, background:'transparent', fontSize: 14.5,
                 color: V3.ink, fontFamily: monospace?'Geist Mono, monospace':'inherit', letterSpacing: monospace?'0.01em':'0' }}/>
      {suffix && <span style={{ color: V3.muted, fontSize: 13, fontFamily:'Geist Mono, monospace' }}>{suffix}</span>}
    </div>
  );
}

function V3Chip({ selected, children, onClick, compact }) {
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap: 8, cursor:'pointer',
      background: selected ? V3.ink : V3.paper,
      color: selected ? '#fff' : V3.ink,
      border:`1px solid ${selected ? V3.ink : V3.lineStr}`,
      borderRadius: 100, padding: compact ? '7px 14px' : '10px 18px',
      fontSize: 13, fontWeight: 500, letterSpacing:'0.01em',
      transition:'all .15s', fontFamily:'inherit',
    }}>{children}</button>
  );
}

// ── Branch card with premium shine ──
function V3BranchCard({ b, selected, onClick }) {
  const Icon = I[b.icon];
  return (
    <button onClick={onClick} style={{
      position:'relative', textAlign:'left', cursor:'pointer', overflow:'hidden',
      background: selected
        ? `linear-gradient(135deg, ${V3.ink} 0%, ${V3.ink2} 100%)`
        : V3.paper,
      color: selected ? '#fff' : V3.ink,
      border: `1px solid ${selected ? V3.ink : V3.line}`,
      borderRadius: 14, padding: '24px 24px 22px',
      display:'flex', flexDirection:'column', gap: 14,
      transition: 'all .25s', fontFamily:'inherit',
      boxShadow: selected
        ? '0 14px 40px -8px rgba(10,15,28,.28), 0 2px 8px rgba(10,15,28,.12)'
        : '0 1px 0 rgba(10,15,28,.04), 0 1px 2px rgba(10,15,28,.03)',
    }}>
      {/* shine overlay */}
      {selected && <div style={{
        position:'absolute', inset: 0, pointerEvents:'none',
        background:'linear-gradient(135deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 40%, rgba(30,107,110,.18) 100%)',
      }}/>}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: selected ? 'rgba(255,255,255,.1)' : V3.accentBg,
          color: selected ? V3.gold : V3.accent,
          border: selected ? '1px solid rgba(255,255,255,.12)' : '1px solid rgba(30,107,110,.14)',
        }}><Icon width={20} height={20}/></div>
        <div style={{
          fontFamily:'Geist Mono, monospace', fontSize: 10, letterSpacing:'.18em',
          color: selected ? V3.gold : V3.muted2, fontWeight: 500,
        }}>{String(b.pct).padStart(2,'0')} / 100</div>
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing:'-0.005em', marginBottom: 6 }}>{b.label}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: selected ? 'rgba(255,255,255,.7)' : V3.muted, minHeight: 38 }}>
          {b.tagline}
        </div>
      </div>
      <div style={{
        position:'relative', paddingTop: 12,
        borderTop: `1px solid ${selected ? 'rgba(255,255,255,.08)' : V3.line}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ fontSize: 11.5, color: selected ? 'rgba(255,255,255,.6)' : V3.muted2,
                      fontFamily:'Geist Mono, monospace', letterSpacing:'.04em' }}>{b.avg}</div>
        <div style={{ color: selected ? V3.gold : V3.muted2 }}>
          <I.arrow width={14} height={14}/>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN A — Entry + page 1 combined (premium scroll)
// ═══════════════════════════════════════════════════════════════
function V3ScreenEntry({ mobile, selected='sale', onPick }) {
  return (
    <div style={{
      minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V3.ink,
      background: `linear-gradient(180deg, ${V3.bgTop} 0%, ${V3.bgBot} 100%)`,
    }}>
      {/* Premium header w/ gradient ink bar */}
      <div style={{
        padding: mobile?'14px 20px':'20px 56px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: 'linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.3))',
        backdropFilter: 'blur(12px)', borderBottom:`1px solid ${V3.line}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7,
                        background: `linear-gradient(135deg, ${V3.ink} 0%, ${V3.accent} 140%)`,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
                        fontSize: 14, fontWeight: 700, letterSpacing:'-0.02em' }}>S</div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing:'-0.02em' }}>Servicimmo</div>
            <div style={{ fontSize: 11, color: V3.muted, letterSpacing:'.04em' }}>Diagnostic immobilier · Tours</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: mobile?10:20, fontSize: 12.5, color: V3.muted }}>
          <span style={{ display:'flex', alignItems:'center', gap: 6 }}><I.clock width={13} height={13}/> 2 min</span>
          {!mobile && <span style={{ fontFamily:'Geist Mono, monospace', letterSpacing:'.04em' }}>02 47 47 01 23</span>}
          {!mobile && <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'.14em',
                                    color: V3.accent, padding:'5px 10px',
                                    border:`1px solid rgba(30,107,110,.25)`, borderRadius: 100 }}>01 / 02</div>}
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin:'0 auto', padding: mobile?'36px 20px 48px':'80px 56px 60px' }}>
        <V3Kicker>Étape 01 · Votre projet</V3Kicker>
        <h1 style={{
          fontSize: mobile?36:68, lineHeight: 1.02, letterSpacing:'-0.04em', fontWeight: 600,
          margin:'18px 0 18px', color: V3.ink, textWrap:'pretty', fontFamily:'Geist, sans-serif',
        }}>
          Quel est votre projet<span style={{ color: V3.accent }}>.</span>
        </h1>
        <p style={{ fontSize: mobile?16:19, lineHeight: 1.55, color: V3.muted, maxWidth: 640, margin: 0 }}>
          En deux minutes, identifiez les diagnostics obligatoires et recevez une estimation tarifaire. Sans engagement,
          sans création de compte — nos experts vous rappellent sous 2 h ouvrées.
        </p>

        <div style={{ marginTop: mobile?32:56,
                      display:'grid', gridTemplateColumns: mobile?'1fr':'repeat(3, 1fr)', gap: 14 }}>
          {BRANCHES.map(b => (
            <V3BranchCard key={b.key} b={b} selected={selected===b.key} onClick={()=>onPick && onPick(b.key)}/>
          ))}
        </div>
      </div>

      {/* Gradient break */}
      <div style={{ borderTop:`1px solid ${V3.line}`,
                    background: `linear-gradient(180deg, ${V3.bgBot} 0%, #e6ebf5 100%)`,
                    padding: mobile?'40px 20px 80px':'72px 56px 120px' }}>
        <div style={{ maxWidth: 1120, margin:'0 auto' }}>
          <V3Kicker>Votre bien</V3Kicker>
          <h2 style={{ fontSize: mobile?26:40, fontWeight: 600, letterSpacing:'-0.028em',
                       margin:'12px 0 32px', lineHeight: 1.1 }}>
            Maintenant, parlez-nous du bien.
          </h2>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 28 }}>
            <div style={{ display:'flex', flexDirection:'column', gap: 22 }}>
              <V3Field label="Type de bien">
                <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
                  {[['maison','Maison'],['appartement','Appartement'],['local','Local'],['immeuble','Immeuble'],['autre','Autre']].map(([k,l])=>
                    <V3Chip key={k} compact selected={k==='maison'}>{l}</V3Chip>)}
                </div>
              </V3Field>
              <V3Field label="Adresse" hint="Saisie assistée via base officielle (BAN)">
                <V3Input placeholder="Saisissez votre adresse" icon={I.map}/>
              </V3Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
                <V3Field label="Code postal">
                  <V3Input placeholder="37000" monospace/>
                </V3Field>
                <V3Field label="Ville">
                  <V3Input placeholder="Tours"/>
                </V3Field>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: 22 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
                <V3Field label="Surface">
                  <V3Input placeholder="—" suffix="m²" monospace icon={I.ruler}/>
                </V3Field>
                <V3Field label="Nombre de pièces">
                  <V3Input placeholder="—" monospace/>
                </V3Field>
              </div>
              <V3Field label="En copropriété ?" hint="Déclenche le mesurage Loi Carrez si oui">
                <div style={{ display:'flex', gap: 8 }}>
                  {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                    <V3Chip key={k} compact>{l}</V3Chip>)}
                </div>
              </V3Field>
              <V3Field label="Urgence">
                <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
                  {[['asap','< 48 h'],['week','1 sem.'],['two_weeks','2 sem.'],['month','Mois']].map(([k,l])=>
                    <V3Chip key={k} compact>{l}</V3Chip>)}
                </div>
              </V3Field>
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop:`1px solid ${V3.line}`,
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        flexDirection: mobile?'column':'row', gap: 16 }}>
            <div style={{ fontSize: 12.5, color: V3.muted, display:'flex', alignItems:'center', gap: 8 }}>
              <I.lock width={13} height={13}/> Données sauvegardées automatiquement · RGPD
            </div>
            <button style={{
              width: mobile?'100%':'auto',
              background: `linear-gradient(180deg, ${V3.ink2} 0%, ${V3.ink} 100%)`,
              color:'#fff', border:`1px solid ${V3.ink}`, borderRadius: 10,
              padding:'14px 28px', fontSize: 14, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
              letterSpacing:'0.01em',
              boxShadow:'0 10px 24px -8px rgba(10,15,28,.3), inset 0 1px 0 rgba(255,255,255,.1)',
              display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
            }}>Page suivante <I.arrow width={15} height={15}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN B — Page 1 "Votre bien" fully filled (advanced state)
// ═══════════════════════════════════════════════════════════════
function V3ScreenFilled({ mobile }) {
  const s = DEMO_STATE;
  return (
    <div style={{
      minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V3.ink,
      background: `linear-gradient(180deg, ${V3.bgTop} 0%, ${V3.bgBot} 100%)`,
    }}>
      <div style={{
        padding: mobile?'14px 20px':'20px 56px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: 'linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.3))',
        backdropFilter: 'blur(12px)', borderBottom:`1px solid ${V3.line}`, position:'sticky', top:0, zIndex: 5,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7,
                        background: `linear-gradient(135deg, ${V3.ink} 0%, ${V3.accent} 140%)`,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
                        fontSize: 14, fontWeight: 700 }}>S</div>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing:'-0.02em' }}>Servicimmo</span>
        </div>
        {/* Premium progress */}
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'.14em',
                        color: V3.accent, padding:'5px 10px',
                        border:`1px solid rgba(30,107,110,.25)`, borderRadius: 100 }}>01 / 02</div>
          {!mobile && <div style={{ display:'flex', gap: 4 }}>
            {[1,1,1,0,0].map((f,i) =>
              <div key={i} style={{ width: 18, height: 3,
                background: f ? V3.accent : V3.lineStr, borderRadius: 2 }}/>)}
          </div>}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin:'0 auto', padding: mobile?'28px 20px 48px':'48px 56px 80px' }}>
        {/* Branch banner */}
        <div style={{
          display:'flex', alignItems:'center', gap: 14, marginBottom: 32,
          background: V3.paper, border:`1px solid ${V3.line}`, borderRadius: 12,
          padding: mobile?'14px 16px':'16px 22px',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: V3.accentBg, color: V3.accent,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
            <I.home width={20} height={20}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: V3.muted, letterSpacing:'.1em', textTransform:'uppercase', fontWeight: 500 }}>Projet sélectionné</div>
            <div style={{ fontSize: 15.5, fontWeight: 600 }}>Vente · Maison individuelle</div>
          </div>
          <button style={{ background:'none', border:`1px solid ${V3.lineStr}`, borderRadius: 8,
                          padding:'8px 14px', fontSize: 12.5, color: V3.ink, cursor:'pointer',
                          display:'inline-flex', alignItems:'center', gap: 6, fontFamily:'inherit' }}>
            <I.edit width={12} height={12}/> Changer
          </button>
        </div>

        <V3Kicker>Page 01 · Votre bien</V3Kicker>
        <h1 style={{ fontSize: mobile?28:42, fontWeight: 600, letterSpacing:'-0.03em',
                     margin:'10px 0 32px', lineHeight: 1.1 }}>
          Votre bien est bientôt documenté.
        </h1>

        {/* The form — dense, premium grid */}
        <div style={{ background: V3.paper, borderRadius: 16, border:`1px solid ${V3.line}`,
                      padding: mobile?'22px 20px':'32px 36px',
                      boxShadow:'0 1px 0 rgba(10,15,28,.02), 0 24px 40px -20px rgba(10,15,28,.08)' }}>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: mobile?20:28 }}>
            <V3Field label="Type de bien">
              <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
                {[['maison','Maison'],['appartement','Appart.'],['local','Local'],['immeuble','Immeuble']].map(([k,l])=>
                  <V3Chip key={k} compact selected={s.property_type===k}>{l}</V3Chip>)}
              </div>
            </V3Field>
            <V3Field label="Surface · pièces">
              <div style={{ display:'flex', gap: 10 }}>
                <V3Input value={s.surface} suffix="m²" monospace/>
                <div style={{ width: 100 }}><V3Input value={s.rooms_count} suffix="p" monospace/></div>
              </div>
            </V3Field>
          </div>

          <div style={{ marginTop: 22 }}>
            <V3Field label="Adresse" help="vérifiée · BAN">
              <V3Input value={`${s.address}, ${s.postal_code} ${s.city}`} icon={I.map}/>
            </V3Field>
          </div>

          <div style={{ marginTop: 22 }}>
            <V3Field label="En copropriété ?">
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                  <V3Chip key={k} compact selected={s.is_coownership===k}>{l}</V3Chip>)}
              </div>
            </V3Field>
          </div>

          <div style={{ margin:'28px 0', height: 1, background: V3.line }}/>

          <V3Kicker>Caractéristiques techniques</V3Kicker>
          <div style={{ marginTop: 14, display:'flex', flexDirection:'column', gap: 22 }}>
            <V3Field label="Date du permis de construire"
              hint="Détermine les risques plomb (avant 1949) et amiante (avant 1997).">
              <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['before_1949','Avant 1949'],
                  ['1949_1997','1949 — 07/1997'],
                  ['after_1997','Après 07/1997'],
                  ['dk','Je ne sais pas'],
                ].map(([k,l])=>
                  <V3Chip key={k} compact selected={s.permit_date_range===k}>{l}</V3Chip>)}
              </div>
            </V3Field>

            <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: mobile?20:28 }}>
              <V3Field label="Chauffage principal">
                <V3Input value="Gaz" icon={I.flame}/>
              </V3Field>
              <V3Field label="Installation gaz présente">
                <V3Input value="Gaz de ville"/>
              </V3Field>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: mobile?20:28 }}>
              <V3Field label="Gaz > 15 ans ?">
                <div style={{ display:'flex', gap: 8 }}>
                  {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                    <V3Chip key={k} compact selected={s.gas_over_15_years===k}>{l}</V3Chip>)}
                </div>
              </V3Field>
              <V3Field label="Électricité > 15 ans ?">
                <div style={{ display:'flex', gap: 8 }}>
                  {[['yes','Oui'],['no','Non'],['dk','Je ne sais pas']].map(([k,l])=>
                    <V3Chip key={k} compact selected={s.electric_over_15_years===k}>{l}</V3Chip>)}
                </div>
              </V3Field>
            </div>
          </div>

          <div style={{ margin:'28px 0', height: 1, background: V3.line }}/>

          <V3Field label="Urgence">
            <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(5, 1fr)', gap: 8 }}>
              {[
                ['asap','< 48 h'],['week','1 semaine'],['two_weeks','2 semaines'],
                ['month','Dans le mois'],['flex','Pas pressé'],
              ].map(([k,l])=>
                <V3Chip key={k} compact selected={s.urgency===k}>{l}</V3Chip>)}
            </div>
          </V3Field>
        </div>

        <div style={{ marginTop: 28, display:'flex', alignItems:'center', justifyContent:'space-between',
                      flexDirection: mobile?'column':'row', gap: 14 }}>
          <button style={{ background:'none', border:`1px solid ${V3.lineStr}`, borderRadius: 10,
                          padding:'13px 20px', fontSize: 14, fontFamily:'inherit', color: V3.ink, cursor:'pointer',
                          display:'inline-flex', alignItems:'center', gap: 8 }}>
            <I.arrowL width={14} height={14}/> Retour
          </button>
          <button style={{
            width: mobile?'100%':'auto',
            background: `linear-gradient(180deg, ${V3.ink2} 0%, ${V3.ink} 100%)`,
            color:'#fff', border:`1px solid ${V3.ink}`, borderRadius: 10,
            padding:'14px 28px', fontSize: 14, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
            letterSpacing:'0.01em',
            boxShadow:'0 10px 24px -8px rgba(10,15,28,.3), inset 0 1px 0 rgba(255,255,255,.1)',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
          }}>Continuer vers le récap <I.arrow width={15} height={15}/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN C — Page 2: récap + coordonnées (premium)
// ═══════════════════════════════════════════════════════════════
function V3ScreenRecap({ mobile }) {
  const diags = calcDiagnostics(DEMO_STATE);
  const pricing = calcPricing(DEMO_STATE, diags);

  return (
    <div style={{
      minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V3.ink,
      background: `linear-gradient(180deg, ${V3.bgTop} 0%, ${V3.bgBot} 100%)`,
    }}>
      <div style={{
        padding: mobile?'14px 20px':'20px 56px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: 'linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.3))',
        backdropFilter: 'blur(12px)', borderBottom:`1px solid ${V3.line}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7,
                        background: `linear-gradient(135deg, ${V3.ink} 0%, ${V3.accent} 140%)`,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
                        fontSize: 14, fontWeight: 700 }}>S</div>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing:'-0.02em' }}>Servicimmo</span>
        </div>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, letterSpacing:'.14em',
                      color: V3.accent, padding:'5px 10px',
                      border:`1px solid rgba(30,107,110,.25)`, borderRadius: 100 }}>02 / 02</div>
      </div>

      {/* Hero — dark deep navy pricing block */}
      <div style={{
        position:'relative', overflow:'hidden',
        background: `linear-gradient(135deg, ${V3.ink} 0%, #0f1727 35%, ${V3.ink2} 100%)`,
        color:'#fff', padding: mobile?'40px 20px 48px':'80px 56px 72px',
      }}>
        {/* decorative rings */}
        <div style={{ position:'absolute', top:-140, right:-140, width: 420, height: 420, borderRadius:'50%',
                      background: 'radial-gradient(circle, rgba(30,107,110,.22) 0%, transparent 60%)' }}/>
        <div style={{ position:'absolute', bottom:-100, left:-100, width: 320, height: 320, borderRadius:'50%',
                      background: 'radial-gradient(circle, rgba(199,147,57,.12) 0%, transparent 55%)' }}/>

        <div style={{ position:'relative', maxWidth: 1000, margin:'0 auto' }}>
          <V3Kicker dark>Votre récapitulatif personnalisé</V3Kicker>
          <h1 style={{
            fontSize: mobile?34:64, lineHeight: 1.02, letterSpacing:'-0.04em', fontWeight: 600,
            margin:'18px 0 18px', textWrap:'pretty',
          }}>
            Voici ce qu'il vous faut<span style={{ color: V3.gold }}>.</span>
          </h1>
          <p style={{ fontSize: mobile?15:18, lineHeight: 1.55, color: 'rgba(255,255,255,.72)', maxWidth: 620, margin: 0 }}>
            Nos experts ont identifié {diags.length} diagnostics obligatoires pour votre bien.
            Estimation indicative en vigueur au 01/01/2026.
          </p>

          <div style={{ marginTop: mobile?30:40, display:'grid',
                        gridTemplateColumns: mobile?'1fr':'auto 1fr', gap: mobile?20:48, alignItems:'end' }}>
            <div>
              <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10.5, letterSpacing:'.22em',
                            textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>Estimation TTC</div>
              <div style={{ marginTop: 10, display:'flex', alignItems:'baseline', gap: 8 }}>
                <span style={{ fontSize: mobile?56:88, letterSpacing:'-0.04em', fontWeight: 600, lineHeight: 1 }}>
                  {pricing.low}
                </span>
                <span style={{ fontSize: mobile?20:28, color:'rgba(255,255,255,.5)', fontWeight: 400 }}>€ —</span>
                <span style={{ fontSize: mobile?56:88, letterSpacing:'-0.04em', fontWeight: 600, lineHeight: 1 }}>
                  {pricing.high}
                </span>
                <span style={{ fontSize: mobile?20:28, color:'rgba(255,255,255,.5)', fontWeight: 400 }}>€</span>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 10, alignItems: mobile?'flex-start':'flex-end' }}>
              {pricing.modulators.map((m,i)=>
                <div key={i} style={{ display:'inline-flex', alignItems:'center', gap: 10,
                  background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)',
                  borderRadius: 100, padding:'7px 14px', fontSize: 12, color:'rgba(255,255,255,.88)', fontFamily:'Geist Mono, monospace' }}>
                  <span>{m.label}</span>
                  <span style={{ color: V3.gold, fontWeight: 600 }}>{m.delta}</span>
                </div>
              )}
              <div style={{ fontSize: 11, color:'rgba(255,255,255,.38)', fontFamily:'Geist Mono, monospace',
                            letterSpacing:'.04em', marginTop: 4 }}>
                devis définitif sous 2 h ouvrées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics list */}
      <div style={{ maxWidth: 1000, margin:'0 auto', padding: mobile?'32px 20px 20px':'56px 56px 24px' }}>
        <V3Kicker>{diags.length} diagnostics obligatoires</V3Kicker>
        <h2 style={{ fontSize: mobile?22:32, fontWeight: 600, letterSpacing:'-0.025em',
                     margin:'10px 0 24px' }}>
          Détail de votre pack.
        </h2>
        <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 12 }}>
          {diags.map((d,i) => (
            <div key={d.id} style={{
              background: V3.paper, border:`1px solid ${V3.line}`, borderRadius: 12,
              padding:'18px 22px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 16, alignItems:'center',
            }}>
              <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: V3.muted2, letterSpacing:'.08em' }}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing:'-0.005em', marginBottom: 3 }}>{d.name}</div>
                <div style={{ fontSize: 12.5, color: V3.muted, lineHeight: 1.5 }}>{d.why}</div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius:'50%', background: V3.accentBg, color: V3.accent,
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                <I.check width={12} height={12}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact block */}
      <div style={{ maxWidth: 1000, margin:'0 auto', padding: mobile?'32px 20px 80px':'48px 56px 120px' }}>
        <div style={{ background: V3.paper, borderRadius: 16, border:`1px solid ${V3.line}`,
                      padding: mobile?'24px 20px':'36px 40px',
                      boxShadow:'0 24px 40px -20px rgba(10,15,28,.08)' }}>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr',
                        gap: mobile?24:48, alignItems:'start' }}>
            <div>
              <V3Kicker>Dernière étape</V3Kicker>
              <h2 style={{ fontSize: mobile?24:30, fontWeight: 600, letterSpacing:'-0.025em',
                           margin:'10px 0 16px', lineHeight: 1.15 }}>
                Validez vos coordonnées.
              </h2>
              <p style={{ fontSize: 14, color: V3.muted, margin: 0, lineHeight: 1.55 }}>
                Notre équipe vous contacte sous 2 h ouvrées pour valider votre devis définitif
                et planifier l'intervention.
              </p>
              <div style={{ marginTop: 20, padding:'14px 16px', background: V3.accentBg, borderRadius: 10,
                            display:'flex', gap: 12, alignItems:'center' }}>
                <div style={{ width: 36, height: 36, borderRadius:'50%', background: V3.accent, color:'#fff',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize: 13, fontWeight: 600, fontFamily:'inherit', flexShrink: 0 }}>FM</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>M. Fabrice Martin</div>
                  <div style={{ fontSize: 12, color: V3.muted }}>Votre expert dédié · Tours</div>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
              <V3Field label="Civilité">
                <div style={{ display:'flex', gap: 8 }}>
                  {[['m','M.'],['mme','Mme'],['autre','Autre']].map(([k,l])=>
                    <V3Chip key={k} compact>{l}</V3Chip>)}
                </div>
              </V3Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
                <V3Field label="Prénom"><V3Input placeholder="Jean"/></V3Field>
                <V3Field label="Nom"><V3Input placeholder="Dupont"/></V3Field>
              </div>
              <V3Field label="Email"><V3Input placeholder="jean.dupont@email.fr" icon={I.mail}/></V3Field>
              <V3Field label="Téléphone" optional><V3Input placeholder="06 xx xx xx xx" icon={I.phone}/></V3Field>

              <label style={{ display:'flex', gap: 10, alignItems:'flex-start', cursor:'pointer',
                              fontSize: 12.5, color: V3.muted, lineHeight: 1.55 }}>
                <div style={{ width: 16, height: 16, border:`1.5px solid ${V3.muted2}`, borderRadius: 3,
                              flexShrink:0, marginTop:2 }}/>
                J'accepte que mes données soient utilisées pour le traitement de ma demande
                · <u>politique de confidentialité</u>.
              </label>

              <button style={{
                background: `linear-gradient(180deg, ${V3.ink2} 0%, ${V3.ink} 100%)`,
                color:'#fff', border:`1px solid ${V3.ink}`, borderRadius: 12,
                padding:'16px 24px', fontSize: 15, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
                letterSpacing:'0.01em', marginTop: 4,
                boxShadow:'0 14px 32px -10px rgba(10,15,28,.35), inset 0 1px 0 rgba(255,255,255,.1)',
                display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
              }}>Envoyer ma demande <I.send width={15} height={15}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN D — Thanks (premium)
// ═══════════════════════════════════════════════════════════════
function V3ScreenThanks({ mobile }) {
  return (
    <div style={{
      minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V3.ink,
      background: `linear-gradient(180deg, ${V3.bgTop} 0%, ${V3.bgBot} 100%)`,
    }}>
      <div style={{
        padding: mobile?'14px 20px':'20px 56px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: 'linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.3))',
        backdropFilter: 'blur(12px)', borderBottom:`1px solid ${V3.line}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7,
                        background: `linear-gradient(135deg, ${V3.ink} 0%, ${V3.accent} 140%)`,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
                        fontSize: 14, fontWeight: 700 }}>S</div>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing:'-0.02em' }}>Servicimmo</span>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin:'0 auto', padding: mobile?'48px 20px':'112px 56px' }}>
        {/* glowing check */}
        <div style={{ position:'relative', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${V3.ink} 0%, ${V3.accent} 150%)`,
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            boxShadow:'0 20px 40px -12px rgba(30,107,110,.4), 0 0 0 8px rgba(30,107,110,.06)',
          }}>
            <I.check width={32} height={32}/>
          </div>
        </div>

        <V3Kicker>Demande enregistrée · 12:34</V3Kicker>
        <h1 style={{
          fontSize: mobile?34:62, lineHeight: 1.02, letterSpacing:'-0.04em', fontWeight: 600,
          margin:'16px 0 20px', textWrap:'pretty',
        }}>
          Merci Jean<span style={{ color: V3.accent }}>,</span><br/>
          votre demande est bien reçue.
        </h1>
        <p style={{ fontSize: mobile?15:18, lineHeight: 1.6, color: V3.muted, margin: 0, maxWidth: 620 }}>
          Un récapitulatif vient d'être envoyé à <span style={{ color: V3.ink, fontFamily:'Geist Mono, monospace', fontSize: '0.95em' }}>jean.dupont@email.fr</span>.
          Notre équipe vous contactera sous 2 h ouvrées pour valider votre devis et planifier l'intervention.
        </p>

        <div style={{ marginTop: 48, background: V3.paper, border:`1px solid ${V3.line}`, borderRadius: 14,
                      padding: mobile?'20px 20px':'28px 32px',
                      boxShadow:'0 24px 40px -20px rgba(10,15,28,.08)' }}>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(4, 1fr)',
                        gap: mobile?16:28 }}>
            {[
              ['Référence', 'DEV-2026-04-0187', 'mono'],
              ['Estimation', '340 € — 520 €', ''],
              ['Rappel sous', '2 h ouvrées', ''],
              ['Votre expert', 'F. Martin', ''],
            ].map(([k,v,mono],i)=>
              <div key={i}>
                <div style={{ fontSize: 10.5, color: V3.muted, letterSpacing:'.14em',
                              textTransform:'uppercase', fontWeight: 500, fontFamily:'Geist Mono, monospace', marginBottom: 6 }}>{k}</div>
                <div style={{ fontSize: 14.5, fontWeight: 600,
                              fontFamily: mono?'Geist Mono, monospace':'inherit', letterSpacing:'-0.005em' }}>{v}</div>
              </div>)}
          </div>
        </div>

        <div style={{ marginTop: 28, display:'flex', gap: 12, flexWrap:'wrap' }}>
          <a href="#" style={{
            display:'inline-flex', alignItems:'center', gap: 8,
            background: `linear-gradient(180deg, ${V3.ink2} 0%, ${V3.ink} 100%)`,
            color:'#fff', padding:'13px 22px', borderRadius: 10,
            fontSize: 14, fontWeight: 500, textDecoration:'none', letterSpacing:'0.01em',
            boxShadow:'0 10px 24px -8px rgba(10,15,28,.3)',
          }}>
            <I.phone width={14} height={14}/> Nous appeler · 02 47 47 01 23
          </a>
          <a href="#" style={{
            display:'inline-flex', alignItems:'center', gap: 8,
            background: V3.paper, color: V3.ink, padding:'13px 22px', borderRadius: 10,
            fontSize: 14, fontWeight: 500, textDecoration:'none',
            border:`1px solid ${V3.lineStr}`,
          }}>Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { V3ScreenEntry, V3ScreenFilled, V3ScreenRecap, V3ScreenThanks, V3 });
