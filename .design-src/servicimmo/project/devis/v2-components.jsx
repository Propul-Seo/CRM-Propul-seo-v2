// ────────── V2 — Components for canvas page ──────────
// Reusable bits + section renderers.

const cx = (...xs) => xs.filter(Boolean).join(' ');

// ---- Entry card ----
function EntryCard({ branch, illusStyle, palette, selected, onClick, compact }) {
  const c = palette;
  const IllusComp = { A: IllusA, B: IllusB, C: IllusC, D: IllusD }[illusStyle] || IllusA;
  const chrome = c.chrome;
  return (
    <button onClick={onClick}
      style={{ textAlign:'left', background: selected ? c.branches[branch.key].bg : '#fff',
               border: `1px solid ${selected ? c.branches[branch.key].fg : chrome.line}`,
               borderRadius: 14, padding: compact ? 12 : 16, cursor:'pointer',
               transition:'all .15s ease', width:'100%', display:'flex', flexDirection:'column', gap: compact ? 10 : 12,
               boxShadow: selected ? `0 8px 24px -12px ${c.branches[branch.key].fg}55` : 'none' }}>
      <IllusComp kind={branch.key} selected={selected} palette={c.branches[branch.key]}/>
      <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
        <span style={{ fontFamily:'Geist Mono, monospace', fontSize: 10, color: chrome.muted, letterSpacing:'.1em' }}>{branch.num}</span>
        <h3 style={{ margin: 0, fontFamily:'Fraunces, Georgia, serif', fontWeight: 500, fontSize: compact ? 17 : 19, letterSpacing:'-.01em', color: chrome.ink }}>{branch.label}</h3>
      </div>
      <p style={{ margin:0, fontSize: 13, color: chrome.muted, lineHeight: 1.45 }}>{branch.tagline}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop: 8, borderTop:`1px solid ${chrome.line}`, marginTop:'auto' }}>
        <span style={{ fontSize: 11, color: c.branches[branch.key].fg, fontWeight: 500, letterSpacing:'.02em' }}>{branch.stat}</span>
        <span style={{ color: c.branches[branch.key].fg }}><I.arrow width={16} height={16}/></span>
      </div>
    </button>
  );
}

// ---- Section header ----
function SectionTitle({ kicker, title, chrome }) {
  return (
    <div>
      {kicker && <div style={{ fontFamily:'Geist Mono, monospace', fontSize: 11, color: chrome.muted, letterSpacing:'.14em', marginBottom: 8 }}>{kicker}</div>}
      <h2 style={{ margin:0, fontFamily:'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 500, letterSpacing:'-.02em', color: chrome.ink }}>{title}</h2>
    </div>
  );
}

// ---- Accordion ----
function Accordion({ step, open, onToggle, done, title, branchColor, chrome, children, summary }) {
  const acc = branchColor;
  return (
    <div style={{ background:'#fff', border: `1px solid ${chrome.line}`, borderRadius: 14, overflow:'hidden',
                  boxShadow: open ? '0 2px 0 rgba(0,0,0,.02)' : 'none' }}>
      <button onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', gap: 12, padding: '16px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center',
                      background: done ? acc.fg : acc.bg, color: done ? '#fff' : acc.dark, fontFamily:'Geist Mono, monospace', fontSize: 11, fontWeight: 600 }}>
          {done ? <I.check width={14} height={14}/> : step}
        </div>
        <div style={{ flex: 1, display:'flex', flexDirection:'column', gap: 2 }}>
          <div style={{ fontFamily:'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 500, color: chrome.ink, letterSpacing:'-.01em' }}>{title}</div>
          {!open && summary && <div style={{ fontSize: 13, color: chrome.muted, fontFamily:'Geist Mono, monospace' }}>{summary}</div>}
        </div>
        <div style={{ color: chrome.muted, transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <I.chevron width={18} height={18}/>
        </div>
      </button>
      {open && (
        <div style={{ padding: '4px 20px 24px 20px', borderTop: `1px solid ${chrome.line}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---- Form primitives (chaleureux) ----
function Label({ children, help, chrome }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 3, marginBottom: 8 }}>
      <div style={{ fontSize: 14, color: chrome.ink, fontWeight: 500 }}>{children}</div>
      {help && <div style={{ fontSize: 12, color: chrome.muted, lineHeight: 1.4 }}>{help}</div>}
    </div>
  );
}
function Field({ placeholder, value, suffix, chrome }) {
  return (
    <div style={{ position:'relative' }}>
      <input defaultValue={value} placeholder={placeholder}
        style={{ width:'100%', background:'#fff', border: `1px solid ${chrome.line}`, borderRadius: 10, padding: '12px 14px', fontSize: 15, color: chrome.ink, fontFamily:'Geist, sans-serif', outline:'none', boxSizing:'border-box' }}/>
      {suffix && <span style={{ position:'absolute', right: 14, top:'50%', transform:'translateY(-50%)', color: chrome.muted, fontSize: 13 }}>{suffix}</span>}
    </div>
  );
}
function Chips({ options, value, onChange, chrome, branchColor }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
      {options.map(o => {
        const sel = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange && onChange(o.v)}
            style={{ padding:'9px 14px', borderRadius: 999,
                     border: `1px solid ${sel ? branchColor.fg : chrome.line}`,
                     background: sel ? branchColor.bg : '#fff',
                     color: sel ? branchColor.dark : chrome.ink,
                     fontSize: 13, cursor:'pointer', fontWeight: sel ? 500 : 400 }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}
function RadioRow({ options, value, chrome, branchColor }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 8 }}>
      {options.map(o => {
        const sel = value === o.v;
        return (
          <div key={o.v}
            style={{ padding:'12px 10px', border:`1px solid ${sel?branchColor.fg:chrome.line}`,
                     background: sel?branchColor.bg:'#fff', borderRadius: 10, textAlign:'center',
                     fontSize: 13, color: sel?branchColor.dark:chrome.ink, cursor:'pointer' }}>
            {o.l}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { EntryCard, SectionTitle, Accordion, Label, Field, Chips, RadioRow, cx });
