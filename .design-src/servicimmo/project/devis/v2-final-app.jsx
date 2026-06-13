// ────────── V2 final — one combination: Lucide XL × Cream·Lime·Sage ──────────

function DeviceFrame({ device, children }) {
  if (device === 'mobile') {
    return (
      <div style={{ width: 390, height: 800, border: `10px solid #1a1a1a`, borderRadius: 44, background:'#000', overflow:'hidden', boxShadow:'0 20px 60px -20px rgba(0,0,0,.3)', display:'flex', flexDirection:'column' }}>
        <div style={{ height: 34, background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flex:'0 0 auto' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color:'#000' }}>9:41</span>
          <div style={{ width: 18, height: 11, border:'1px solid #000', borderRadius: 2, position:'relative' }}><div style={{ position:'absolute', inset: 1, background:'#000', width:'75%' }}/></div>
        </div>
        <div style={{ flex: 1, overflowY:'auto', overflowX:'hidden', background:'#fff' }}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ width: 1240, height: 820, border:`1px solid #e8e8e8`, borderRadius: 12, overflow:'hidden', background:'#fff', boxShadow:'0 20px 60px -20px rgba(0,0,0,.2)' }}>
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
  const items = [ { v:'entry', l:'Entrée' }, { v:'filling', l:'Rempli' }, { v:'recap', l:'Récap' }, { v:'thanks', l:'Merci' } ];
  return (
    <div style={{ display:'inline-flex', padding: 4, background:'#fff', border:`1px solid ${chrome.line}`, borderRadius: 999, gap: 2 }}>
      {items.map(it => (
        <button key={it.v} onClick={() => onChange(it.v)}
          style={{ padding:'6px 14px', fontSize: 12, fontFamily:'Geist Mono, monospace', letterSpacing:'.06em',
                   border:'none', borderRadius: 999, background: value===it.v? chrome.ink : 'transparent',
                   color: value===it.v?'#fff':chrome.muted, cursor:'pointer' }}>{it.l}</button>
      ))}
    </div>
  );
}

function FinalDemo() {
  const palette = PALETTES['cream-lime-sage'];
  const chrome = palette.chrome;
  const illusStyle = 'B';
  const [screen, setScreen] = React.useState('entry');
  const [branch, setBranch] = React.useState(null);

  const handleSelect = (k) => { setBranch(k); if (k === 'sale') setScreen('filling'); };

  const renderScreen = (device) => {
    const args = { palette, illusStyle, branch, onSelectBranch: handleSelect, device };
    if (screen === 'entry') return <EntryScreen {...args}/>;
    if (screen === 'filling') return <FillingScreen {...args}/>;
    if (screen === 'recap') return <RecapScreen {...args}/>;
    return <ThanksScreen {...args}/>;
  };

  return (
    <section style={{ padding:'48px 48px', background: chrome.cream, borderBottom:`1px solid ${chrome.line}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 24, marginBottom: 28, flexWrap:'wrap' }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
            PROTOTYPE INTERACTIF · DESKTOP + MOBILE
          </div>
          <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
            Clique sur une carte pour lancer le parcours.
          </h2>
          <div style={{ marginTop: 10, fontSize: 13, color: chrome.muted }}>
            Switch d'écrans via la pill à droite · ou clique une carte Vente sur l'écran d'entrée.
          </div>
        </div>
        <ScreenPicker value={screen} onChange={setScreen} chrome={chrome}/>
      </div>
      <div style={{ display:'flex', gap: 36, alignItems:'flex-start', overflowX:'auto', paddingBottom: 12 }}>
        <div style={{ flex:'0 0 auto' }}>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.12em', marginBottom: 10 }}>DESKTOP · 1240 px</div>
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

function BranchesShowcase() {
  const palette = PALETTES['cream-lime-sage'];
  const chrome = palette.chrome;
  return (
    <section style={{ padding:'56px 48px', background:'#fff', borderBottom:`1px solid ${chrome.line}` }}>
      <div style={{ marginBottom: 32, maxWidth: 780 }}>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.16em', marginBottom: 8 }}>
          LES 5 BRANCHES · ÉTAT SÉLECTIONNÉ
        </div>
        <h2 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
          Icônes Lucide XL · couleurs verts nature + lime + sage.
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 14 }}>
        {['sale','rental','works','coownership','other'].map(k => (
          <EntryCard key={k} branch={BRANCHES[k]} palette={palette} illusStyle="B" selected={true} onClick={()=>{}}/>
        ))}
      </div>
      <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.12em', margin:'28px 0 12px' }}>ÉTAT REPOS</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 14 }}>
        {['sale','rental','works','coownership','other'].map(k => (
          <EntryCard key={k} branch={BRANCHES[k]} palette={palette} illusStyle="B" selected={false} onClick={()=>{}}/>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <div style={{ fontFamily:'Geist, sans-serif', background:'#ece7d9', minHeight:'100vh' }}>
      <header style={{ padding:'40px 48px 32px', background:'#ece7d9' }}>
        <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color:'#606a50', letterSpacing:'.16em', marginBottom: 8 }}>
          SERVICIMMO · DEVIS V2 — FINAL
        </div>
        <h1 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: 48, fontWeight: 400, letterSpacing:'-.025em', color:'#1f2a14', maxWidth: 900, lineHeight: 1.05 }}>
          Lucide XL × <em style={{ fontStyle:'italic', fontWeight: 500 }}>Cream · Lime · Sage</em>.
        </h1>
        <p style={{ margin:'16px 0 0', color:'#606a50', fontSize: 16, lineHeight: 1.55, maxWidth: 680 }}>
          Combinaison retenue : icônes fines grand format (home, clé, crayon pour travaux, building, help) sur blocs colorés chauds. 4 écrans déclinés en desktop et mobile.
        </p>
      </header>

      <BranchesShowcase/>
      <FinalDemo/>

      <footer style={{ padding:'40px 48px 60px', background:'#ece7d9', color:'#606a50', fontSize: 13, fontFamily:'Geist Mono, monospace', letterSpacing:'.08em' }}>
        V2 final · prêt pour itérations ciblées ou export JSX par bloc pour Claude Code.
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
