// ────── Illustration variants for V2 ──────
// 3 styles × 5 branches. All take { kind, selected, palette }.

function IllusA({ kind, selected, palette }) {
  const c = palette;
  const bg = selected ? c.fg : c.bg;
  const fg = selected ? '#fff' : c.dark;
  const base = { width:'100%', aspectRatio:'16/10', borderRadius: 10, position:'relative', overflow:'hidden', background: bg, transition:'background .2s' };
  if (kind==='sale') return (
    <div style={base}>
      <div style={{ position:'absolute', left:'50%', top:'18%', transform:'translateX(-50%)', width: 0, height: 0,
        borderLeft:'38px solid transparent', borderRight:'38px solid transparent', borderBottom:`28px solid ${fg}` }}/>
      <div style={{ position:'absolute', left:'50%', top:'42%', transform:'translateX(-50%)', width: 68, height: 40, background: fg, borderRadius: 2 }}/>
      <div style={{ position:'absolute', left:'50%', bottom:'18%', transform:'translateX(-50%)', width: 16, height: 22, background: bg }}/>
      <div style={{ position:'absolute', left:'calc(50% + 14px)', top:'52%', width: 8, height: 8, background: bg }}/>
    </div>
  );
  if (kind==='rental') return (
    <div style={base}>
      <div style={{ position:'absolute', left:'30%', top:'38%', width: 26, height: 26, borderRadius:'50%', border:`5px solid ${fg}` }}/>
      <div style={{ position:'absolute', left:'42%', top:'49%', width: 46, height: 5, background: fg, borderRadius: 3 }}/>
      <div style={{ position:'absolute', left:'73%', top:'49%', width: 5, height: 12, background: fg, borderRadius: 1 }}/>
      <div style={{ position:'absolute', left:'68%', top:'54%', width: 5, height: 8, background: fg, borderRadius: 1 }}/>
    </div>
  );
  if (kind==='works') return (
    <div style={base}>
      <div style={{ position:'absolute', left:'26%', top:'30%', width: 8, height: 46, background: fg, transform:'rotate(32deg)', borderRadius: 3, transformOrigin:'top center' }}/>
      <div style={{ position:'absolute', left:'52%', top:'24%', width: 34, height: 18, background: fg, transform:'rotate(32deg)', borderRadius: 4 }}/>
      <div style={{ position:'absolute', bottom: 16, left: 18, right: 18, height: 2, background: fg, opacity: .35, borderRadius: 1 }}/>
    </div>
  );
  if (kind==='coownership') return (
    <div style={base}>
      {[0,1,2].map(col => <div key={col} style={{ position:'absolute', left:`${20+col*22}%`, bottom:'18%', width:'16%', height:`${34+col*14}%`, background: fg, borderRadius:'3px 3px 0 0' }}/>)}
      {[0,1,2].flatMap(col => [0,1,2].map(row => <div key={`${col}-${row}`} style={{ position:'absolute', left:`${24+col*22}%`, bottom:`${24+row*9}%`, width: 5, height: 5, background: bg, borderRadius: 1 }}/>))}
    </div>
  );
  return (
    <div style={base}>
      <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', fontSize: 76, fontWeight: 400, fontFamily:'Fraunces, Georgia, serif', color: fg, letterSpacing:'-.04em', fontStyle:'italic', lineHeight:1 }}>?</div>
    </div>
  );
}

function IllusB({ kind, selected, palette }) {
  const c = palette;
  const Icon = { sale:I.home, rental:I.key, works:I.pencil, coownership:I.building, other:I.help }[kind];
  const bg = selected ? c.fg : c.bg;
  const fg = selected ? '#fff' : c.dark;
  const label = { sale:'VENTE', rental:'LOC.', works:'TRAVAUX', coownership:'SYNDIC', other:'AUTRE' }[kind];
  return (
    <div style={{ width:'100%', aspectRatio:'16/10', borderRadius: 10, background: bg,
                  display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <div style={{ position:'absolute', top: 12, right: 14, fontFamily:'Geist Mono, monospace', fontSize: 10, color: fg, opacity: .45, letterSpacing:'.12em' }}>{label}</div>
      <Icon width={58} height={58} style={{ color: fg, strokeWidth: 1.25 }}/>
    </div>
  );
}

function IllusC({ kind, selected, palette }) {
  const c = palette;
  const Icon = { sale:I.home, rental:I.key, works:I.hammer, coownership:I.building, other:I.help }[kind];
  const bg = selected ? c.fg : c.bg;
  const fg = selected ? '#fff' : c.dark;
  const label = { sale:'01 · vente', rental:'02 · location', works:'03 · travaux', coownership:'04 · syndic', other:'05 · autre' }[kind];
  return (
    <div style={{ width:'100%', aspectRatio:'16/10', borderRadius: 10, background: bg, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset: 0, color: fg, opacity: selected? .18 : .22,
                    backgroundImage:'radial-gradient(circle, currentColor 1px, transparent 1.5px)', backgroundSize:'10px 10px' }}/>
      <div style={{ position:'absolute', top: 13, left: 16, right: 16, height: 1, background: fg, opacity: .3 }}/>
      <div style={{ position:'absolute', top: 13, left: 22, fontSize: 10, color: fg, opacity: .6,
                    fontFamily:'Geist Mono, monospace', letterSpacing:'.14em', background: bg, padding:'0 6px', transform:'translateY(-50%)' }}>{label}</div>
      <div style={{ position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center', paddingTop: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: bg, border: `1.5px solid ${fg}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon width={28} height={28} style={{ color: fg, strokeWidth: 1.5 }}/>
        </div>
      </div>
    </div>
  );
}

// Style D — "découpe papier" : overlapping shape blocks with offset shadow
function IllusD({ kind, selected, palette }) {
  const c = palette;
  const Icon = { sale:I.home, rental:I.key, works:I.hammer, coownership:I.building, other:I.help }[kind];
  const bg = selected ? c.fg : c.bg;
  const fg = selected ? '#fff' : c.dark;
  const shadow = selected ? 'rgba(255,255,255,.2)' : c.fg;
  return (
    <div style={{ width:'100%', aspectRatio:'16/10', borderRadius: 10, background: bg, position:'relative', overflow:'hidden' }}>
      {/* big tinted shape */}
      <div style={{ position:'absolute', right:-20, bottom:-30, width: 140, height: 140, borderRadius:'50%', background: shadow, opacity: .18 }}/>
      <div style={{ position:'absolute', left:-14, top:-20, width: 70, height: 70, borderRadius: 14, background: shadow, opacity: .14, transform:'rotate(16deg)' }}/>
      <div style={{ position:'absolute', left: 18, top: 18, fontFamily:'Fraunces, Georgia, serif', fontStyle:'italic', fontSize: 13, color: fg, opacity:.7 }}>
        {{ sale:'à vendre', rental:'à louer', works:'chantier', coownership:'immeuble', other:'autre' }[kind]}
      </div>
      <div style={{ position:'absolute', right: 16, bottom: 14, width: 54, height: 54, borderRadius: 12, background: bg, border: `1.5px solid ${fg}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: `3px 3px 0 ${fg}` }}>
        <Icon width={26} height={26} style={{ color: fg, strokeWidth: 1.5 }}/>
      </div>
    </div>
  );
}

Object.assign(window, { IllusA, IllusB, IllusC, IllusD });
