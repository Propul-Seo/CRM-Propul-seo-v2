// ────────── V2 screens (entry / filling / recap / thanks) ──────────
// All screens accept { palette, illusStyle, branch, onSelectBranch, device }.

function EntryScreen({ palette, illusStyle, branch, onSelectBranch, device }) {
  const c = palette;
  const chrome = c.chrome;
  const mobile = device === 'mobile';
  return (
    <div style={{ background: chrome.cream, minHeight: '100%', padding: mobile ? '28px 18px 40px' : '44px 40px 60px' }}>
      {/* Duration pill */}
      <div style={{ display:'inline-flex', alignItems:'center', gap: 7, padding:'6px 12px', borderRadius: 999, background:'#fff', border:`1px solid ${chrome.line}`, fontSize: 12, color: chrome.muted, marginBottom: 20 }}>
        <I.clock width={13} height={13}/> <strong style={{ color: chrome.ink, fontWeight: 500 }}>2 minutes</strong> · sans engagement · sans compte
      </div>
      <h1 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontSize: mobile ? 30 : 40, fontWeight: 400, letterSpacing:'-.025em', color: chrome.ink, lineHeight: 1.08 }}>
        Quel est <em style={{ fontStyle:'italic', fontWeight: 500 }}>votre projet</em> ?
      </h1>
      <p style={{ margin: '14px 0 28px', color: chrome.muted, fontSize: mobile ? 15 : 16, lineHeight: 1.55, maxWidth: 560 }}>
        En 2 minutes, identifiez les diagnostics obligatoires pour votre bien et recevez une estimation tarifaire. Rappel sous 2 h ouvrées.
      </p>
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: mobile ? 12 : 16 }}>
        {['sale','rental','works','coownership','other'].map(k => (
          <EntryCard key={k} branch={BRANCHES[k]} palette={c} illusStyle={illusStyle}
                     selected={branch === k} onClick={() => onSelectBranch && onSelectBranch(k)}
                     compact={mobile}/>
        ))}
      </div>
      <div style={{ marginTop: 30, display:'flex', flexWrap:'wrap', gap: 18, color: chrome.muted, fontSize: 12 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}><I.shield width={13} height={13}/> Données chiffrées — RGPD</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}><I.star width={13} height={13}/> 28 ans à Tours</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}><I.phone width={13} height={13}/> 02 47 47 01 23</span>
      </div>
    </div>
  );
}

// ---- FillingScreen: Bloc B + C expanded, others collapsed ----
function FillingScreen({ palette, device }) {
  const c = palette;
  const chrome = c.chrome;
  const branchColor = c.branches.sale;
  const mobile = device === 'mobile';
  const [open, setOpen] = React.useState('tech');

  return (
    <div style={{ background: chrome.cream, minHeight:'100%', padding: mobile ? '20px 14px 40px' : '32px 36px 56px' }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 20 }}>
        <button style={{ padding:'6px 10px', borderRadius: 999, border:`1px solid ${chrome.line}`, background:'#fff', fontSize: 12, color: chrome.ink, cursor:'pointer', display:'inline-flex', alignItems:'center', gap: 5 }}>
          ← Retour
        </button>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', background: branchColor.bg, borderRadius: 999, fontSize: 12, color: branchColor.dark, fontWeight: 500 }}>
          <I.home width={13} height={13}/> Vente
        </div>
        <div style={{ marginLeft:'auto', fontSize: 12, color: chrome.muted }}>Sauvegardé <span style={{ color: branchColor.fg }}>●</span></div>
      </div>

      <h1 style={{ margin: '0 0 6px', fontFamily:'Fraunces, Georgia, serif', fontSize: mobile ? 26 : 32, fontWeight: 400, letterSpacing:'-.02em', color: chrome.ink }}>
        Parlez-nous de <em style={{ fontStyle:'italic', fontWeight: 500 }}>votre bien</em>
      </h1>
      <p style={{ margin: '0 0 22px', color: chrome.muted, fontSize: 14 }}>4 questions rapides. On calcule le reste.</p>

      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {/* Bloc B — open by default */}
        <Accordion step={1} open={open==='prop'} onToggle={() => setOpen(open==='prop'?null:'prop')}
                   done={open!=='prop'} title="Le bien"
                   summary="Maison · Tours 37000 · 92 m² · 4 pièces"
                   branchColor={branchColor} chrome={chrome}>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 16, paddingTop: 12 }}>
            <div style={{ gridColumn: mobile?'auto':'1 / -1' }}>
              <Label chrome={chrome}>Type de bien</Label>
              <Chips value="house" branchColor={branchColor} chrome={chrome}
                     options={[{v:'house',l:'Maison'},{v:'flat',l:'Appartement'},{v:'building',l:'Immeuble'},{v:'commerce',l:'Local commercial'},{v:'parts',l:'Parties communes'},{v:'land',l:'Terrain'},{v:'other',l:'Autre'}]}/>
            </div>
            <div style={{ gridColumn: mobile?'auto':'1 / -1' }}>
              <Label chrome={chrome} help="Nous trouvons automatiquement votre code postal et votre ville.">Adresse du bien</Label>
              <Field chrome={chrome} value="12 rue du Commerce, 37000 Tours"/>
            </div>
            <div>
              <Label chrome={chrome}>Surface</Label>
              <Field chrome={chrome} value="92" suffix="m²"/>
            </div>
            <div>
              <Label chrome={chrome}>Nombre de pièces</Label>
              <Field chrome={chrome} value="4"/>
            </div>
            <div style={{ gridColumn: mobile?'auto':'1 / -1' }}>
              <Label chrome={chrome}>Est-ce une copropriété ?</Label>
              <RadioRow value="no" branchColor={branchColor} chrome={chrome}
                        options={[{v:'yes',l:'Oui'},{v:'no',l:'Non'},{v:'dk',l:'Je ne sais pas'}]}/>
            </div>
          </div>
        </Accordion>

        {/* Bloc C — expanded */}
        <Accordion step={2} open={open==='tech'} onToggle={() => setOpen(open==='tech'?null:'tech')}
                   title="Caractéristiques techniques" branchColor={branchColor} chrome={chrome}>
          <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'1fr 1fr', gap: 16, paddingTop: 12 }}>
            <div style={{ gridColumn: mobile?'auto':'1 / -1' }}>
              <Label chrome={chrome} help="Cette date détermine les risques plomb et amiante.">
                Date du permis de construire
              </Label>
              <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'repeat(4,1fr)', gap: 8 }}>
                {[
                  { v:'pre1949', l:'Avant 1949' },
                  { v:'1949_1997', l:'1949 – juillet 1997' },
                  { v:'post1997', l:'Après juillet 1997' },
                  { v:'dk', l:'Je ne sais pas' },
                ].map(o => {
                  const sel = o.v === '1949_1997';
                  return (
                    <div key={o.v} style={{ padding:'14px 12px', border:`1px solid ${sel?branchColor.fg:chrome.line}`, background: sel?branchColor.bg:'#fff', borderRadius: 10, textAlign:'center', fontSize: 13, color: sel?branchColor.dark:chrome.ink, cursor:'pointer', fontWeight: sel?500:400 }}>
                      {o.l}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <Label chrome={chrome}>Chauffage</Label>
              <Field chrome={chrome} value="Gaz"/>
            </div>
            <div>
              <Label chrome={chrome}>Installation gaz</Label>
              <Field chrome={chrome} value="Gaz de ville"/>
            </div>
            <div>
              <Label chrome={chrome}>Installation gaz +15 ans ?</Label>
              <RadioRow value="yes" branchColor={branchColor} chrome={chrome}
                        options={[{v:'yes',l:'Oui'},{v:'no',l:'Non'},{v:'dk',l:'?'}]}/>
            </div>
            <div>
              <Label chrome={chrome}>Installation élec +15 ans ?</Label>
              <RadioRow value="yes" branchColor={branchColor} chrome={chrome}
                        options={[{v:'yes',l:'Oui'},{v:'no',l:'Non'},{v:'dk',l:'?'}]}/>
            </div>
          </div>
        </Accordion>

        <Accordion step={3} open={open==='time'} onToggle={() => setOpen(open==='time'?null:'time')}
                   title="Délai et notes" branchColor={branchColor} chrome={chrome}
                   summary="Sous une semaine">
        </Accordion>
        <Accordion step={4} open={open==='email'} onToggle={() => setOpen(open==='email'?null:'email')}
                   title="Votre email" branchColor={branchColor} chrome={chrome}>
        </Accordion>
      </div>

      <button style={{ marginTop: 24, width:'100%', padding:'16px 20px', background: branchColor.fg, color:'#fff', border:'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8, fontFamily:'Geist, sans-serif' }}>
        Continuer <I.arrow width={18} height={18}/>
      </button>
    </div>
  );
}

Object.assign(window, { EntryScreen, FillingScreen });
