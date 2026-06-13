// ────────── V2 canvas main ──────────
// Device frames + interactive state + canvas layout

function DeviceFrame({ device, children, label, chromeColor }) {
  if (device === 'mobile') {
    return (
      <div style={{ width: 390, height: 780, border: `10px solid #1a1a1a`, borderRadius: 44, background:'#000', padding: 0, overflow:'hidden', boxShadow:'0 20px 60px -20px rgba(0,0,0,.3)', display:'flex', flexDirection:'column' }}>
        <div style={{ height: 34, background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flex:'0 0 auto' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color:'#000', fontFamily:'SF Pro, Geist, sans-serif' }}>9:41</span>
          <div style={{ display:'flex', gap: 4, alignItems:'center' }}>
            <div style={{ width: 18, height: 11, border:'1px solid #000', borderRadius: 2, position:'relative' }}><div style={{ position:'absolute', inset: 1, background:'#000', width:'75%' }}/></div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY:'auto', overflowX:'hidden', background:'#fff' }}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: 1200, height: 780, border:`1px solid #e8e8e8`, borderRadius: 12, overflow:'hidden', background:'#fff', boxShadow:'0 20px 60px -20px rgba(0,0,0,.2)' }}>
      <div style={{ height: 34, background:'#f5f2ea', borderBottom:`1px solid #e8e8e8`, display:'flex', alignItems:'center', padding:'0 14px', gap: 8 }}>
        <div style={{ display:'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius:'50%', background:'#ff5f57' }}/>
          <div style={{ width: 10, height: 10, borderRadius:'50%', background:'#febc2e' }}/>
          <div style={{ width: 10, height: 10, borderRadius:'50%', background:'#28c840' }}/>
        </div>
        <div style={{ fontSize: 11, color:'#888', marginLeft: 18, fontFamily:'Geist Mono, monospace' }}>servicimmo.fr/devis</div>
      </div>
      <div style={{ height:'calc(100% - 34px)', overflowY:'auto' }}>{children}</div>
    </div>
  );
}

function ScreenPicker({ value, onChange, chrome }) {
  const items = [
    { v:'entry', l:'Entrée' },
    { v:'filling', l:'Rempli' },
    { v:'recap', l:'Récap' },
    { v:'thanks', l:'Merci' },
  ];
  return (
    <div style={{ display:'inline-flex', padding: 4, background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 999, gap: 2 }}>
      {items.map(it => (
        <button key={it.v} onClick={() => onChange(it.v)}
          style={{ padding:'6px 14px', fontSize: 12, fontFamily:'Geist Mono, monospace', letterSpacing:'.06em',
                   border:'none', borderRadius: 999, background: value===it.v? chrome.ink : 'transparent',
                   color: value===it.v?'#fff':chrome.muted, cursor:'pointer' }}>
          {it.l}
        </button>
      ))}
    </div>
  );
}

function VariantDemo({ illusStyle, paletteKey, title, subtitle }) {
  const palette = PALETTES[paletteKey];
  const chrome = palette.chrome;
  const [screen, setScreen] = React.useState('entry');
  const [branch, setBranch] = React.useState(null);

  const handleSelect = (k) => {
    setBranch(k);
    if (k === 'sale') setScreen('filling');
  };

  const renderScreen = (device) => {
    const args = { palette, illusStyle, branch, onSelectBranch: handleSelect, device };
    if (screen === 'entry') return <EntryScreen {...args}/>;
    if (screen === 'filling') return <FillingScreen {...args}/>;
    if (screen === 'recap') return <RecapScreen {...args}/>;
    return <ThanksScreen {...args}/>;
  };

  return (
    <section style={{ padding:'56px 48px', borderBottom:`1px solid ${chrome.line}`, background:'#f6f2e8' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 24, marginBottom: 32, flexWrap:'wrap' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
            {title}
          </div>
          <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
            {subtitle}
          </h2>
          <div style={{ marginTop: 12, display:'flex', gap: 16, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Geist Mono, monospace', fontSize: 12, color: chrome.muted }}>
              Palette : <strong style={{ color: chrome.ink, fontWeight: 500 }}>{palette.label}</strong>
            </span>
            <span style={{ fontFamily:'Geist Mono, monospace', fontSize: 12, color: chrome.muted }}>
              Illustrations : <strong style={{ color: chrome.ink, fontWeight: 500 }}>
                {{ A:'A — Géométriques plates', B:'B — Lucide XL + bloc', C:'C — Éditorial pointillés', D:'D — Découpe papier' }[illusStyle]}
              </strong>
            </span>
          </div>
        </div>
        <ScreenPicker value={screen} onChange={setScreen} chrome={chrome}/>
      </div>

      <div style={{ display:'flex', gap: 36, alignItems:'flex-start', overflowX:'auto', paddingBottom: 12 }}>
        <div style={{ flex:'0 0 auto' }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.12em', marginBottom: 10 }}>DESKTOP · 1200 px</div>
          <DeviceFrame device="desktop">{renderScreen('desktop')}</DeviceFrame>
        </div>
        <div style={{ flex:'0 0 auto' }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.12em', marginBottom: 10 }}>MOBILE · iPhone</div>
          <DeviceFrame device="mobile">{renderScreen('mobile')}</DeviceFrame>
        </div>
      </div>
    </section>
  );
}

// 5-branches showcase on mobile — to show differentiation
function BranchesShowcase({ illusStyle, paletteKey }) {
  const palette = PALETTES[paletteKey];
  const chrome = palette.chrome;
  return (
    <section style={{ padding:'56px 48px', borderBottom:`1px solid ${chrome.line}`, background: chrome.cream }}>
      <div style={{ marginBottom: 32, maxWidth: 780 }}>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
          LES 5 BRANCHES — RENDU MOBILE
        </div>
        <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
          La bifurcation visuelle <em style={{ fontStyle:'italic', fontWeight: 500 }}>selon le projet</em>.
        </h2>
        <p style={{ margin:'12px 0 0', color: chrome.muted, fontSize: 15, lineHeight: 1.55 }}>
          Chaque branche a sa couleur et son illustration. Aperçu des états de sélection, toutes branches confondues.
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {['sale','rental','works','coownership','other'].map(k => (
          <EntryCard key={k} branch={BRANCHES[k]} palette={palette} illusStyle={illusStyle} selected={false} onClick={()=>{}}/>
        ))}
      </div>
      <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.12em', marginBottom: 12 }}>ÉTAT SÉLECTIONNÉ</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 14 }}>
        {['sale','rental','works','coownership','other'].map(k => (
          <EntryCard key={k} branch={BRANCHES[k]} palette={palette} illusStyle={illusStyle} selected={true} onClick={()=>{}}/>
        ))}
      </div>
    </section>
  );
}

function IllusMatrix() {
  const palette = PALETTES['cream-sage-brick'];
  const chrome = palette.chrome;
  const styles = [
    { k:'A', label:'A — Géométriques plates', note:'Formes brutes, couleur dominante. Le plus chaleureux-naïf.' },
    { k:'B', label:'B — Lucide XL + bloc', note:'Icône fine grand format, label mono en coin. Plus lisible.' },
    { k:'C', label:'C — Éditorial pointillés', note:'Motif de points, cadre fin, icône cadrée. Plus premium.' },
    { k:'D', label:'D — Découpe papier', note:'Formes en fond, ombre portée, italique décoratif.' },
  ];
  return (
    <section style={{ padding:'56px 48px', borderBottom:`1px solid ${chrome.line}`, background:'#fff' }}>
      <div style={{ marginBottom: 32, maxWidth: 780 }}>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
          MATRICE · STYLES D'ILLUSTRATION × BRANCHES
        </div>
        <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
          4 pistes d'illustration à <em style={{ fontStyle:'italic', fontWeight: 500 }}>comparer</em>.
        </h2>
        <p style={{ margin:'12px 0 0', color: chrome.muted, fontSize: 15, lineHeight: 1.55 }}>
          Palette <strong style={{ color: chrome.ink, fontWeight: 500 }}>{palette.label}</strong>. Choisissez un style : je décline ensuite avec la palette de ton choix.
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'150px repeat(5, 1fr)', gap: 10, alignItems:'center' }}>
        <div/>
        {['sale','rental','works','coownership','other'].map(k => (
          <div key={k} style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.1em', textAlign:'center' }}>
            {BRANCHES[k].num} · {BRANCHES[k].label.toUpperCase()}
          </div>
        ))}
        {styles.map(st => (
          <React.Fragment key={st.k}>
            <div style={{ paddingRight: 10 }}>
              <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 500, color: chrome.ink }}>{st.label}</div>
              <div style={{ fontSize: 12, color: chrome.muted, marginTop: 4, lineHeight: 1.4 }}>{st.note}</div>
            </div>
            {['sale','rental','works','coownership','other'].map(k => {
              const IllusComp = { A:IllusA, B:IllusB, C:IllusC, D:IllusD }[st.k];
              return (
                <div key={k} style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 12, padding: 10 }}>
                  <IllusComp kind={k} selected={false} palette={palette.branches[k]}/>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function PaletteMatrix() {
  const base = PALETTES['cream-sage-brick'];
  const chrome = base.chrome;
  return (
    <section style={{ padding:'56px 48px', borderBottom:`1px solid ${chrome.line}`, background:'#f6f2e8' }}>
      <div style={{ marginBottom: 32, maxWidth: 780 }}>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
          PALETTES · 4 PISTES
        </div>
        <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
          Ajuster la <em style={{ fontStyle:'italic', fontWeight: 500 }}>chaleur</em>.
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
        {Object.keys(PALETTES).map(key => {
          const p = PALETTES[key];
          return (
            <div key={key} style={{ background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 500, color: chrome.ink }}>{p.label}</div>
                <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted }}>{key}</div>
              </div>
              <div style={{ fontSize: 12, color: chrome.muted, marginBottom: 14 }}>{p.note}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 8 }}>
                {['sale','rental','works','coownership','other'].map(k => (
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                    <div style={{ aspectRatio:'1', borderRadius: 10, background: p.branches[k].bg, border:`1px solid ${chrome.line}`, position:'relative' }}>
                      <div style={{ position:'absolute', inset: 8, borderRadius: 6, background: p.branches[k].fg }}/>
                    </div>
                    <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 9, color: chrome.muted, letterSpacing:'.08em', textAlign:'center' }}>
                      {BRANCHES[k].num}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ──────── App ────────
function App() {
  return (
    <div style={{ fontFamily:'Geist, -apple-system, BlinkMacSystemFont, sans-serif', background:'#ece7d9', minHeight:'100vh' }}>
      {/* Header */}
      <header style={{ padding:'40px 48px 0', background:'#ece7d9' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 14, marginBottom: 8 }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color:'#847a6a', letterSpacing:'.16em' }}>
            SERVICIMMO — DEVIS · V2 · CHALEUREUX ILLUSTRÉ
          </div>
        </div>
        <h1 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 48, fontWeight: 400, letterSpacing:'-.025em', color:'#2d2a24', maxWidth: 900, lineHeight: 1.05 }}>
          Itérations <em style={{ fontStyle:'italic', fontWeight: 500 }}>V2</em> — illustrations, palette, 5 branches, récap retravaillé.
        </h1>
        <p style={{ margin:'18px 0 32px', color:'#847a6a', fontSize: 16, lineHeight: 1.55, maxWidth: 720 }}>
          4 styles d'illustration × 4 palettes à comparer. 3 combinaisons interactives déclinées en desktop + mobile, pour les 4 écrans clés. Clique sur une carte de projet pour passer à l'écran rempli.
        </p>
      </header>

      <IllusMatrix/>
      <PaletteMatrix/>

      <VariantDemo
        illusStyle="A" paletteKey="cream-sage-brick"
        title="COMBINAISON 01"
        subtitle="Géométriques plates × Cream · Sage · Brick"/>

      <VariantDemo
        illusStyle="B" paletteKey="cream-teal-ochre"
        title="COMBINAISON 02"
        subtitle="Lucide XL × Cream · Teal · Ochre"/>

      <VariantDemo
        illusStyle="C" paletteKey="cream-lime-sage"
        title="COMBINAISON 03"
        subtitle="Éditorial pointillés × Cream · Lime · Sage"/>

      <VariantDemo
        illusStyle="D" paletteKey="servicimmo-strict"
        title="COMBINAISON 04"
        subtitle="Découpe papier × Servicimmo strict"/>

      <BranchesShowcase illusStyle="B" paletteKey="cream-sage-brick"/>

      <footer style={{ padding:'40px 48px 60px', background:'#ece7d9', color:'#847a6a', fontSize: 13, fontFamily:'Geist Mono, monospace', letterSpacing:'.08em' }}>
        Servicimmo · V2 itérations · {Object.keys(PALETTES).length} palettes × 4 illustrations × 5 branches × 4 écrans.
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
