// ═══════════════════════════════════════════════════════════════
// VARIANT 2 — Chaleureux illustré (accordion)
//   Single-page with progressive disclosure via accordion sections.
//   Warm cream + sage palette, larger type, bigger icons, more padding.
//   Target: 45-70 ans, maison individuelle.
// ═══════════════════════════════════════════════════════════════

const V2 = {
  ink:     '#2d2a24',
  ink2:    '#4a4438',
  muted:   '#7a7260',
  muted2:  '#9a9280',
  line:    '#e8dfcb',
  lineSoft:'#efe8d8',
  paper:   '#ffffff',
  cream:   '#fdf9f0',
  bg:      '#faf5e9',
  sage:    '#7a9b6e',
  sageDark:'#4e6b46',
  sageSoft:'#e6ecd8',
  brick:   '#c17453',
  brickSoft:'#f3ddcf',
  ochre:   '#d4a648',
  ochreSoft:'#f4e5bc',
  teal:    '#2d7a7d',
  tealSoft:'#d4e5e5',
  plum:    '#7a5a7a',
  plumSoft:'#e8dae8',
};

// ── Illustrated card for each branch ──
// Flat "stamp" compositions — rect + circle + simple shapes. No hand-drawn SVGs.
function V2BranchIllustration({ kind, selected }) {
  const base = {
    width: '100%', aspectRatio: '16/10', borderRadius: 8,
    position:'relative', overflow:'hidden',
    transition:'all .2s',
  };
  if (kind === 'sale') {
    return (
      <div style={{ ...base, background: selected ? V2.sage : V2.sageSoft }}>
        {/* house rooftop as triangle via border trick */}
        <div style={{ position:'absolute', left:'50%', top:'24%', transform:'translateX(-50%)',
          width: 0, height: 0, borderLeft:'32px solid transparent', borderRight:'32px solid transparent',
          borderBottom:`24px solid ${selected ? '#fff' : V2.sageDark}` }}/>
        <div style={{ position:'absolute', left:'50%', top:'46%', transform:'translateX(-50%)',
          width: 56, height: 34, background: selected ? '#fff' : V2.sageDark, borderRadius: 2 }}/>
        <div style={{ position:'absolute', left:'50%', bottom:'20%', transform:'translateX(-50%)',
          width: 14, height: 18, background: selected ? V2.sageSoft : V2.cream }}/>
        <div style={{ position:'absolute', top: 10, right: 12, width: 10, height: 10,
          borderRadius:'50%', background: selected ? V2.ochre : V2.ochre, opacity:.8 }}/>
      </div>
    );
  }
  if (kind === 'rental') {
    return (
      <div style={{ ...base, background: selected ? V2.ochre : V2.ochreSoft }}>
        <div style={{ position:'absolute', left:'44%', top:'28%',
          width: 22, height: 22, borderRadius:'50%',
          border:`4px solid ${selected ? '#fff' : V2.ink}` }}/>
        <div style={{ position:'absolute', left: '52%', top: '46%',
          width: 42, height: 4, background: selected ? '#fff' : V2.ink, borderRadius: 2 }}/>
        <div style={{ position:'absolute', left: '88%', top: '46%',
          width: 4, height: 10, background: selected ? '#fff' : V2.ink, transform:'translateX(-4px)', borderRadius: 1 }}/>
        <div style={{ position:'absolute', left: '82%', top: '50%',
          width: 4, height: 8, background: selected ? '#fff' : V2.ink, borderRadius: 1 }}/>
      </div>
    );
  }
  if (kind === 'works') {
    return (
      <div style={{ ...base, background: selected ? V2.brick : V2.brickSoft }}>
        {/* hammer: handle + head */}
        <div style={{ position:'absolute', left:'26%', top:'30%', width: 6, height: 42,
          background: selected ? '#fff' : V2.ink, transform:'rotate(35deg)', borderRadius: 2, transformOrigin:'top' }}/>
        <div style={{ position:'absolute', left:'56%', top:'30%', width: 28, height: 14,
          background: selected ? '#fff' : V2.ink, transform:'rotate(35deg)', borderRadius: 3 }}/>
        <div style={{ position:'absolute', bottom: 16, left: 14, right: 14, height: 2,
          background: selected ? 'rgba(255,255,255,.4)' : V2.muted2, borderRadius: 1 }}/>
      </div>
    );
  }
  if (kind === 'coownership') {
    return (
      <div style={{ ...base, background: selected ? V2.teal : V2.tealSoft }}>
        {[0,1,2].map(col =>
          <div key={col} style={{
            position:'absolute', left: `${22 + col*24}%`, bottom: '20%',
            width: '14%', height: `${30 + col*16}%`,
            background: selected ? '#fff' : V2.ink, borderRadius: '2px 2px 0 0',
          }}/>)}
        {/* windows as dots */}
        {[0,1,2].flatMap(col => [0,1,2].map(row =>
          <div key={`${col}-${row}`} style={{
            position:'absolute', left: `${26 + col*24}%`, bottom: `${26 + row*8}%`,
            width: 4, height: 4, background: selected ? V2.teal : V2.tealSoft, borderRadius:'50%',
          }}/>))}
      </div>
    );
  }
  // other
  return (
    <div style={{ ...base, background: selected ? V2.plum : V2.plumSoft }}>
      <div style={{
        position:'absolute', left:'50%', top:'48%', transform:'translate(-50%,-50%)',
        fontSize: 56, fontWeight: 700, fontFamily:'Fraunces, Georgia, serif',
        color: selected ? '#fff' : V2.ink, letterSpacing:'-.04em',
      }}>?</div>
    </div>
  );
}

function V2BranchCard({ b, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign:'left', cursor:'pointer', background: V2.paper, color: V2.ink,
      border: `2px solid ${selected ? V2.ink : V2.line}`,
      borderRadius: 16, padding: 16, display:'flex', flexDirection:'column', gap: 14,
      transition: 'all .18s', fontFamily:'inherit',
      boxShadow: selected ? '0 10px 24px rgba(45,42,36,.08)' : 'none',
    }}>
      <V2BranchIllustration kind={b.key} selected={selected}/>
      <div style={{ padding: '0 4px 4px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing:'-0.01em', marginBottom: 4,
                      fontFamily: 'Fraunces, Georgia, serif' }}>{b.label}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: V2.muted, marginBottom: 12 }}>{b.tagline}</div>
        <div style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12, color: V2.ink,
                      fontWeight: 500, borderTop:`1px dashed ${V2.line}`, paddingTop: 10 }}>
          <I.sparkles width={13} height={13} style={{ color: V2.sage }}/>
          {b.avg}
        </div>
      </div>
    </button>
  );
}

function V2Input({ value, placeholder, suffix, onChange, icon: Icon }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 10,
      border: `1.5px solid ${V2.line}`, borderRadius: 10, background: V2.paper,
      padding: '13px 16px', fontSize: 15.5,
    }}>
      {Icon && <Icon width={16} height={16} style={{ color: V2.muted }}/>}
      <input value={value||''} placeholder={placeholder} onChange={e=>onChange && onChange(e.target.value)}
        style={{ border:'none', outline:'none', flex: 1, background:'transparent', fontSize: 15.5, color: V2.ink, fontFamily:'inherit' }}/>
      {suffix && <span style={{ color: V2.muted, fontSize: 14, fontWeight: 500 }}>{suffix}</span>}
    </div>
  );
}

function V2Radio({ selected, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap: 10, cursor:'pointer',
      border: `1.5px solid ${selected ? V2.ink : V2.line}`,
      background: selected ? V2.cream : V2.paper, color: V2.ink,
      borderRadius: 10, padding: '11px 16px',
      fontSize: 14.5, fontWeight: 500, fontFamily:'inherit',
      transition: 'all .15s', textAlign:'left',
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: 7,
        border: `2px solid ${selected ? V2.ink : V2.muted2}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: 3, background: V2.ink }}/>}
      </div>
      {children}
    </button>
  );
}

// ── Accordion section (warm) ──
function V2Section({ idx, total, title, eyebrow, children, open, completed, summary, onToggle, mobile }) {
  return (
    <div style={{
      background: V2.paper, border: `1.5px solid ${completed ? V2.sageSoft : V2.line}`,
      borderRadius: 14, marginBottom: 14, overflow:'hidden',
      boxShadow: open ? '0 6px 20px rgba(45,42,36,.06)' : 'none',
      transition: 'all .2s',
    }}>
      <button onClick={onToggle} style={{
        width:'100%', padding: mobile? '18px 20px' : '22px 28px',
        display:'flex', alignItems:'center', gap: 18, background:'none', border:'none', cursor:'pointer',
        textAlign:'left', fontFamily:'inherit',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius:'50%',
          background: completed ? V2.sage : (open ? V2.ink : V2.cream),
          color: completed ? '#fff' : (open ? '#fff' : V2.ink),
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 14, fontWeight: 600, fontFamily:'Fraunces, Georgia, serif', flexShrink: 0,
        }}>
          {completed ? <I.check width={17} height={17}/> : idx}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && <div style={{ fontSize: 11.5, color: V2.muted, letterSpacing:'.06em',
                                    textTransform:'uppercase', fontWeight: 500, marginBottom: 3 }}>{eyebrow}</div>}
          <div style={{ fontSize: mobile?17:20, fontWeight: 600, letterSpacing:'-0.01em',
                        fontFamily:'Fraunces, Georgia, serif', color: V2.ink }}>{title}</div>
          {!open && summary &&
            <div style={{ fontSize: 13.5, color: V2.muted, marginTop: 4,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace: mobile?'normal':'nowrap' }}>{summary}</div>}
        </div>
        <div style={{ color: V2.muted, transform: open?'rotate(180deg)':'none', transition: 'transform .2s', flexShrink: 0 }}>
          <I.chevronDown width={18} height={18}/>
        </div>
      </button>
      {open && (
        <div style={{ padding: mobile ? '4px 20px 24px' : '8px 28px 32px', borderTop: `1px dashed ${V2.line}` }}>
          <div style={{ paddingTop: mobile?18:22 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN A — Entry
// ═══════════════════════════════════════════════════════════════
function V2ScreenEntry({ mobile, selected='sale', onPick }) {
  return (
    <div style={{ background: V2.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V2.ink }}>
      <div style={{ padding: mobile?'14px 20px':'18px 44px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background: V2.bg, borderBottom: `1px solid ${V2.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: V2.sage, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 600 }}>S</div>
          <span style={{ fontSize: 16, fontFamily:'Fraunces, Georgia, serif', fontWeight: 600 }}>Servicimmo</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: mobile?10:18, fontSize: 13, color: V2.muted2 }}>
          <span style={{ display:'flex', alignItems:'center', gap: 6 }}><I.clock width={14} height={14}/> 2 min</span>
          {!mobile && <span style={{ display:'flex', alignItems:'center', gap: 6 }}><I.phone width={14} height={14}/> 02 47 47 01 23</span>}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin:'0 auto', padding: mobile?'36px 20px 60px':'84px 44px 100px' }}>
        {/* decorative ribbon */}
        <div style={{ display:'inline-flex', alignItems:'center', gap: 8,
                      background: V2.cream, border:`1px solid ${V2.line}`, borderRadius: 100,
                      padding:'6px 14px', fontSize: 12.5, color: V2.ink2 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: V2.sage }}/>
          Diagnostic immobilier à Tours · 28 ans d'expérience
        </div>
        <h1 style={{
          fontSize: mobile?36:64, lineHeight: 1.02, letterSpacing:'-0.03em', fontWeight: 500,
          margin:'20px 0 20px', fontFamily:'Fraunces, Georgia, serif', color: V2.ink,
          textWrap:'pretty',
        }}>
          Quel est votre <em style={{ color: V2.brick, fontStyle:'italic' }}>projet</em>&nbsp;?
        </h1>
        <p style={{ fontSize: mobile?16:19, lineHeight: 1.55, color: V2.ink2, maxWidth: 640, margin: 0 }}>
          En 2 minutes, identifiez les diagnostics obligatoires pour votre bien et recevez une estimation tarifaire. <br/>
          <span style={{ color: V2.muted }}>Sans engagement, sans création de compte.</span>
        </p>

        <div style={{ marginTop: mobile?36:56,
                      display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(3, 1fr)', gap: 16 }}>
          {BRANCHES.map((b, i) => (
            <V2BranchCard key={b.key} b={b} selected={selected===b.key} onClick={()=>onPick && onPick(b.key)}/>
          ))}
        </div>

        <div style={{ marginTop: mobile?32:48, display:'flex', alignItems:'center',
                      justifyContent: mobile?'stretch':'space-between', gap: 16, flexDirection: mobile?'column':'row' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, fontSize: 13, color: V2.muted2 }}>
            <I.lock width={14} height={14}/> Vos données restent chez nous. Pas de spam.
          </div>
          <button style={{
            width: mobile?'100%':'auto',
            background: V2.ink, color: V2.cream, border:'none', borderRadius: 100,
            padding:'16px 28px', fontSize: 15, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
          }}>Continuer <I.arrow width={15} height={15}/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN B — Filled (accordion, 2nd section open)
// ═══════════════════════════════════════════════════════════════
function V2ScreenFilled({ mobile }) {
  const s = DEMO_STATE;
  return (
    <div style={{ background: V2.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V2.ink }}>
      {/* header */}
      <div style={{ padding: mobile?'14px 20px':'18px 44px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background: V2.bg, borderBottom: `1px solid ${V2.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: V2.sage, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 600 }}>S</div>
          <span style={{ fontSize: 16, fontFamily:'Fraunces, Georgia, serif', fontWeight: 600 }}>Servicimmo</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 12, fontSize: 13 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 6, color: V2.sageDark }}>
            <I.check width={14} height={14}/> Sauvegardé
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin:'0 auto', padding: mobile?'28px 16px 40px':'48px 44px 80px' }}>
        {/* Selected branch chip */}
        <div style={{ marginBottom: 24, display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap: 10,
                        background: V2.paper, border:`1.5px solid ${V2.line}`,
                        padding:'8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: V2.sageSoft, color: V2.sageDark,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
              <I.home width={12} height={12}/>
            </div>
            Projet : <strong>Vente</strong>
            <button style={{ background:'none', border:'none', color: V2.muted, fontSize: 12, cursor:'pointer',
                            textDecoration:'underline', fontFamily:'inherit', padding: 0 }}>modifier</button>
          </div>
        </div>

        <h1 style={{ fontSize: mobile?26:34, fontFamily:'Fraunces, Georgia, serif', fontWeight: 500,
                     letterSpacing:'-0.02em', lineHeight: 1.1, margin:'0 0 6px' }}>
          Remplissons le dossier ensemble.
        </h1>
        <p style={{ fontSize: 14.5, color: V2.muted, margin:'0 0 28px' }}>
          Chaque section se déplie l'une après l'autre. Plus que 2 minutes.
        </p>

        {/* Section 1 — complete */}
        <V2Section mobile={mobile} idx="1" total="3" eyebrow="Le bien"
          title="Maison de 112 m², à Tours"
          completed open={false}
          summary="Maison individuelle · 5 pièces · hors copropriété · 37000 Tours"
          onToggle={()=>{}}/>

        {/* Section 2 — open */}
        <V2Section mobile={mobile} idx="2" total="3" eyebrow="Caractéristiques techniques"
          title="Un peu d'histoire du bâti"
          open={true} onToggle={()=>{}}>
          <div style={{ background: V2.cream, border:`1px dashed ${V2.line}`, borderRadius: 10,
                        padding:'12px 16px', display:'flex', gap: 10, marginBottom: 22 }}>
            <I.info width={16} height={16} style={{ color: V2.sageDark, flexShrink: 0, marginTop: 2 }}/>
            <div style={{ fontSize: 13, color: V2.ink2, lineHeight: 1.5 }}>
              Ces dates déterminent les risques <strong>plomb</strong> (avant 1949) et <strong>amiante</strong> (avant juillet 1997).
              Si vous ne savez pas, cochez "Je ne sais pas" — nous vérifierons sur place.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10, color: V2.ink }}>
              Date du permis de construire
            </div>
            <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr 1fr':'repeat(2, 1fr)', gap: 10 }}>
              {[
                ['before_1949','Avant 1949','🏛️'],
                ['1949_1997','1949 — juillet 1997','🏘️'],
                ['after_1997','Après juillet 1997','🏡'],
                ['dk','Je ne sais pas','💭'],
              ].map(([k,l,emoji])=>
                <button key={k} style={{
                  padding:'14px 16px', borderRadius: 10, cursor:'pointer',
                  border:`1.5px solid ${s.permit_date_range===k ? V2.ink : V2.line}`,
                  background: s.permit_date_range===k ? V2.cream : V2.paper, color: V2.ink, fontFamily:'inherit',
                  display:'flex', flexDirection:'column', gap: 6, textAlign:'left', alignItems:'flex-start',
                }}>
                  <div style={{ fontSize: 20 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{l}</div>
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>
              Chauffage principal
            </div>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
              {[['gas','Gaz'],['elec','Électrique'],['wood','Bois'],['oil','Fioul'],['heat_pump','Pompe à chaleur'],['mix','Autre / mixte']].map(([k,l])=>
                <V2Radio key={k} selected={s.heating_type===k}>{l}</V2Radio>)}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Gaz &gt; 15 ans ?</div>
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','?']].map(([k,l])=>
                  <V2Radio key={k} selected={s.gas_over_15_years===k}>{l}</V2Radio>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Électricité &gt; 15 ans ?</div>
              <div style={{ display:'flex', gap: 8 }}>
                {[['yes','Oui'],['no','Non'],['dk','?']].map(([k,l])=>
                  <V2Radio key={k} selected={s.electric_over_15_years===k}>{l}</V2Radio>)}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 8, display:'flex', justifyContent:'flex-end' }}>
            <button style={{
              background: V2.ink, color: V2.cream, border:'none', borderRadius: 100,
              padding:'12px 22px', fontSize: 14, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap: 8,
            }}>Continuer vers le délai <I.arrow width={14} height={14}/></button>
          </div>
        </V2Section>

        {/* Section 3 — locked */}
        <V2Section mobile={mobile} idx="3" total="3" eyebrow="Votre délai"
          title="Quand souhaitez-vous intervenir ?" open={false} onToggle={()=>{}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN C — Recap
// ═══════════════════════════════════════════════════════════════
function V2ScreenRecap({ mobile }) {
  const diags = calcDiagnostics(DEMO_STATE);
  const pricing = calcPricing(DEMO_STATE, diags);

  return (
    <div style={{ background: V2.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V2.ink }}>
      <div style={{ padding: mobile?'14px 20px':'18px 44px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background: V2.bg, borderBottom: `1px solid ${V2.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: V2.sage, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 600 }}>S</div>
          <span style={{ fontSize: 16, fontFamily:'Fraunces, Georgia, serif', fontWeight: 600 }}>Servicimmo</span>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin:'0 auto', padding: mobile?'28px 20px 60px':'56px 44px 100px' }}>
        {/* Surprise ribbon */}
        <div style={{ display:'inline-flex', alignItems:'center', gap: 8,
                      background: V2.sageSoft, color: V2.sageDark, borderRadius: 100,
                      padding:'7px 14px', fontSize: 12.5, fontWeight: 500 }}>
          <I.sparkles width={13} height={13}/> Votre récapitulatif personnalisé
        </div>

        <h1 style={{
          fontSize: mobile?34:58, lineHeight: 1.02, letterSpacing:'-0.035em', fontWeight: 500,
          margin: '18px 0 16px', fontFamily:'Fraunces, Georgia, serif', color: V2.ink,
          textWrap:'pretty',
        }}>
          Voici ce qu'il vous <em style={{ color: V2.brick, fontStyle:'italic' }}>faut</em>.
        </h1>
        <p style={{ fontSize: mobile?15:17.5, lineHeight: 1.55, color: V2.ink2, maxWidth: 600, margin: 0 }}>
          Nos experts ont identifié {diags.length} diagnostics obligatoires pour votre maison.
          Validez vos coordonnées et nous vous rappelons sous 2 h ouvrées.
        </p>

        {/* Pricing — chaleureux sage card */}
        <div style={{ marginTop: mobile?28:40, background: V2.paper, border:`1.5px solid ${V2.line}`,
                      borderRadius: 18, padding: mobile?'24px 22px':'32px 36px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width: 140, height: 140, borderRadius:'50%',
                        background: V2.sageSoft, opacity: .6 }}/>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize: 12, color: V2.muted, letterSpacing:'.08em',
                          textTransform:'uppercase', fontWeight: 500 }}>Estimation TTC</div>
            <div style={{ marginTop: 10, fontSize: mobile?40:64, letterSpacing:'-0.035em',
                          fontWeight: 500, lineHeight: 1, fontFamily:'Fraunces, Georgia, serif', color: V2.ink }}>
              {pricing.low}&nbsp;€&nbsp;<span style={{ color: V2.muted2, fontWeight: 400 }}>à</span>&nbsp;{pricing.high}&nbsp;€
            </div>
            <div style={{ marginTop: 16, display:'flex', gap: 8, flexWrap:'wrap' }}>
              {pricing.modulators.map((m,i)=>
                <div key={i} style={{ display:'inline-flex', alignItems:'center', gap: 8,
                  background: i===0? V2.ochreSoft : V2.sageSoft,
                  color: i===0? '#8a6a1c' : V2.sageDark,
                  borderRadius: 100, padding:'6px 12px', fontSize: 12.5, fontWeight: 500 }}>
                  {m.label} · {m.delta}
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop:`1px dashed ${V2.line}`,
                          fontSize: 12.5, color: V2.muted, lineHeight: 1.55 }}>
              Estimation indicative basée sur les tarifs en vigueur au 01/01/2026.
              Devis définitif sous 2 h ouvrées après validation.
            </div>
          </div>
        </div>

        {/* Diagnostics as warm cards */}
        <div style={{ marginTop: mobile?28:40 }}>
          <div style={{ fontSize: 11.5, color: V2.muted, letterSpacing:'.1em',
                        textTransform:'uppercase', fontWeight: 500, marginBottom: 12 }}>
            {diags.length} diagnostics obligatoires
          </div>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 12 }}>
            {diags.map((d,i) => (
              <div key={d.id} style={{
                background: V2.paper, border:`1.5px solid ${V2.line}`, borderRadius: 14,
                padding:'18px 20px', display:'flex', gap: 14,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: [V2.sageSoft, V2.ochreSoft, V2.brickSoft, V2.tealSoft, V2.plumSoft][i%5],
                              color:   [V2.sageDark, '#8a6a1c', V2.brick, V2.teal, V2.plum][i%5],
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontFamily:'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 600 }}>
                  {i+1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4,
                                fontFamily:'Fraunces, Georgia, serif' }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: V2.muted, lineHeight: 1.5 }}>{d.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form — clean and warm */}
        <div style={{ marginTop: mobile?28:48, background: V2.paper, border:`1.5px solid ${V2.line}`,
                      borderRadius: 18, padding: mobile?'22px 20px':'32px 36px' }}>
          <div style={{ fontSize: 11.5, color: V2.muted, letterSpacing:'.1em',
                        textTransform:'uppercase', fontWeight: 500 }}>Dernière étape</div>
          <h2 style={{ fontSize: mobile?22:28, fontWeight: 500, fontFamily:'Fraunces, Georgia, serif',
                        margin:'6px 0 22px', letterSpacing:'-0.02em' }}>
            Vos coordonnées
          </h2>

          <div style={{ display:'flex', gap: 10, marginBottom: 16, flexWrap:'wrap' }}>
            {[['m','M.'],['mme','Mme'],['autre','Autre']].map(([k,l])=>
              <V2Radio key={k}>{l}</V2Radio>)}
          </div>

          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 14, marginBottom: 14 }}>
            <V2Input placeholder="Prénom"/>
            <V2Input placeholder="Nom"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 14, marginBottom: 14 }}>
            <V2Input placeholder="Email" icon={I.mail}/>
            <V2Input placeholder="06 xx xx xx xx" icon={I.phone}/>
          </div>

          <label style={{ display:'flex', gap: 12, alignItems:'flex-start', cursor:'pointer',
                          padding:'14px 0 18px', fontSize: 13, color: V2.ink2, lineHeight: 1.5 }}>
            <div style={{ width: 18, height: 18, border:`1.5px solid ${V2.muted2}`, borderRadius: 4,
                          flexShrink:0, marginTop:1 }}/>
            J'accepte que mes données soient utilisées pour traiter ma demande.
            Pas de spam — <u>politique de confidentialité</u>.
          </label>

          <button style={{
            width:'100%',
            background: V2.ink, color: V2.cream, border:'none', borderRadius: 100,
            padding:'18px 28px', fontSize: 16, fontWeight: 500, cursor:'pointer', fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 10,
          }}>Envoyer ma demande <I.send width={16} height={16}/></button>
          <div style={{ textAlign:'center', fontSize: 12, color: V2.muted, marginTop: 12 }}>
            Notre équipe vous contacte sous 2&nbsp;h ouvrées — du lundi au vendredi.
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN D — Thanks
// ═══════════════════════════════════════════════════════════════
function V2ScreenThanks({ mobile }) {
  return (
    <div style={{ background: V2.bg, minHeight:'100%', fontFamily:'Geist, system-ui, sans-serif', color: V2.ink }}>
      <div style={{ padding: mobile?'14px 20px':'18px 44px', background: V2.bg }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: V2.sage, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 600 }}>S</div>
          <span style={{ fontSize: 16, fontFamily:'Fraunces, Georgia, serif', fontWeight: 600 }}>Servicimmo</span>
        </div>
      </div>

      <div style={{ maxWidth: 620, margin:'0 auto', padding: mobile?'48px 20px':'96px 44px', textAlign:'center' }}>
        {/* celebratory circular crest */}
        <div style={{ width: 96, height: 96, margin:'0 auto 28px', borderRadius:'50%',
                      background: V2.sageSoft, display:'flex', alignItems:'center', justifyContent:'center',
                      position:'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius:'50%', background: V2.sage,
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <I.check width={30} height={30}/>
          </div>
          {/* petals */}
          {[0,60,120,180,240,300].map((deg,i)=>
            <div key={i} style={{ position:'absolute', left:'50%', top:'50%',
              width: 6, height: 6, borderRadius: 3, background: V2.ochre,
              transform:`rotate(${deg}deg) translateY(-56px)`, transformOrigin:'center' }}/>)}
        </div>

        <h1 style={{ fontSize: mobile?32:48, lineHeight: 1.05, letterSpacing:'-0.03em', fontWeight: 500,
                     margin:'0 0 18px', fontFamily:'Fraunces, Georgia, serif', textWrap:'pretty' }}>
          Merci&nbsp;<em style={{ fontStyle:'italic', color: V2.brick }}>Jean</em>,<br/>
          votre demande est bien reçue.
        </h1>
        <p style={{ fontSize: mobile?15:17, lineHeight: 1.6, color: V2.ink2, margin:'0 auto', maxWidth: 500 }}>
          Un récapitulatif a été envoyé à <strong>jean.dupont@email.fr</strong>.<br/>
          Notre équipe vous contacte sous <strong>2 h ouvrées</strong> pour valider votre devis
          et planifier l'intervention.
        </p>

        <div style={{ marginTop: 40, background: V2.paper, border:`1.5px solid ${V2.line}`, borderRadius: 16,
                      padding: 22, display:'flex', alignItems:'center', gap: 16, textAlign:'left' }}>
          <div style={{ width: 52, height: 52, borderRadius:'50%', background: V2.cream, flexShrink: 0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 600, color: V2.sageDark }}>
            FM
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: V2.muted, marginBottom: 2 }}>Votre expert dédié</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily:'Fraunces, Georgia, serif' }}>M. Fabrice Martin</div>
            <div style={{ fontSize: 12.5, color: V2.muted }}>Cabinet de Tours · Réf. DEV-2026-04-0187</div>
          </div>
          <a href="#" style={{ display:'inline-flex', alignItems:'center', gap: 6,
                                background: V2.ink, color: V2.cream, padding:'10px 16px', borderRadius: 100,
                                fontSize: 13, fontWeight: 500, textDecoration:'none', flexShrink: 0 }}>
            <I.phone width={13} height={13}/> Appeler
          </a>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { V2ScreenEntry, V2ScreenFilled, V2ScreenRecap, V2ScreenThanks, V2 });
