// ═══════════════════════════════════════════════════════════════
// Servicimmo · Devis Questionnaire — Shared primitives
//   - Domain model + diagnostic calculator (mirror of backend)
//   - Lucide-style inline icons
//   - Brand palette (extracted from live site: teal + lime + navy)
// ═══════════════════════════════════════════════════════════════

// ── Brand palette (live site: servicimmo.fr) ──
const BRAND = {
  teal:       '#1E6B6E',   // header bar
  tealDark:   '#164E50',
  tealDeep:   '#0F3A3C',
  lime:       '#A8D91C',   // CTA block
  limeDark:   '#89B515',
  navy:       '#1A3A52',   // CTA button
  navyDeep:   '#0F2437',
  orange:     '#E67E22',   // amiante banner
  cream:      '#FAF8F3',
  paper:      '#F5F2EC',
};

// ── Icon primitives (thin-stroke, Lucide-like) ──
const I = {
  home: (p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/></svg>,
  key:  (p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2"/><path d="m16 6 3 3"/><path d="m14 8 2 2"/></svg>,
  hammer:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 12-8.5 8.5a1.5 1.5 0 0 1-2.12-2.12L12.88 9.87"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.4-1.4a3 3 0 0 1 0-4.24l.7-.7a3 3 0 0 1 4.24 0"/><path d="M13 7.01 16.99 3 22 8.01 17.99 12"/></svg>,
  building:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>,
  help: (p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  check:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  arrow:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  arrowL:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>,
  chevronDown:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>,
  clock:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  shield:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  phone:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>,
  map:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  sparkles:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 3 1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>,
  info:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>,
  alert:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
  edit:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>,
  plus:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5v14"/></svg>,
  minus:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/></svg>,
  upload:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></svg>,
  flame:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  bolt:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  ruler:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.3 8.7 8.7 21.3a2.4 2.4 0 0 1-3.4 0L2.7 18.7a2.4 2.4 0 0 1 0-3.4L15.3 2.7a2.4 2.4 0 0 1 3.4 0l2.6 2.6a2.4 2.4 0 0 1 0 3.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2M16.5 16.5l-9-9"/></svg>,
  file:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  lock:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  zap:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  send:(p={}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>,
};

// ── The 5 project branches ──
const BRANCHES = [
  { key: 'sale',        label: 'Vente',              tagline: 'Mise en vente d\u2019une maison, d\u2019un appartement ou d\u2019un local.',               avg: '6 diagnostics en moyenne', icon: 'home',    pct: 60 },
  { key: 'rental',      label: 'Location',           tagline: 'Nouveau bail ou renouvellement des diagnostics obligatoires.',             avg: '5 diagnostics en moyenne', icon: 'key',     pct: 20 },
  { key: 'works',       label: 'Travaux / R\u00e9novation', tagline: 'Rep\u00e9rage amiante et plomb avant chantier, d\u00e9molition ou voirie.', avg: '2 diagnostics en moyenne', icon: 'hammer',  pct: 5  },
  { key: 'coownership', label: 'Gestion copropri\u00e9t\u00e9', tagline: 'DTA parties communes, DPE collectif pour syndic ou bailleur.',             avg: '2 diagnostics en moyenne', icon: 'building',pct: 5  },
  { key: 'other',       label: 'Autre projet',       tagline: 'D\u00e9crivez votre besoin, nous vous recontactons.',                      avg: 'Traitement humain',         icon: 'help',    pct: 10 },
];

// ── Diagnostic calculator (mirrors backend logic from brief) ──
function calcDiagnostics(state) {
  const { project_type, permit_date_range, is_coownership, gas_over_15_years, electric_over_15_years, rental_furnished } = state;
  const diags = [];
  const push = (id, name, why) => diags.push({ id, name, why });

  if (project_type === 'sale') {
    push('dpe',    'DPE',                 'Obligatoire pour toute vente. Classe le bien de A \u00e0 G.');
    if (permit_date_range === 'before_1949')               push('plomb',   'Plomb (CREP)',        'Permis de construire ant\u00e9rieur \u00e0 1949.');
    if (permit_date_range !== 'after_1997')                push('amiante', 'Amiante',             'Permis de construire ant\u00e9rieur \u00e0 juillet 1997.');
    push('termites','Termites',           'Zone Indre-et-Loire : arr\u00eat\u00e9 pr\u00e9fectoral en vigueur.');
    if (gas_over_15_years === 'yes')                       push('gaz',     'Gaz',                 'Installation int\u00e9rieure de gaz de plus de 15 ans.');
    if (electric_over_15_years === 'yes')                  push('elec',    '\u00c9lectricit\u00e9',            'Installation \u00e9lectrique de plus de 15 ans.');
    if (is_coownership === 'yes')                          push('carrez',  'Loi Carrez',          'Bien en copropri\u00e9t\u00e9 : mesurage obligatoire.');
    push('erp',    'ERP',                 '\u00c9tat des risques et pollutions \u2014 obligatoire partout.');
  } else if (project_type === 'rental') {
    push('dpe',    'DPE',                 'Obligatoire pour toute mise en location.');
    if (permit_date_range !== 'after_1997')                push('dapp',    'DAPP',                'Ancien b\u00e2ti \u2014 Diagnostic amiante des parties privatives.');
    if (gas_over_15_years === 'yes')                       push('gaz',     'Gaz',                 'Installation gaz de plus de 15 ans.');
    if (electric_over_15_years === 'yes')                  push('elec',    '\u00c9lectricit\u00e9',            'Installation \u00e9lectrique de plus de 15 ans.');
    if (rental_furnished === 'empty')                      push('boutin',  'Loi Boutin',          'Location vide \u2014 mesurage surface habitable.');
    push('erp',    'ERP',                 '\u00c9tat des risques et pollutions.');
  } else if (project_type === 'works') {
    if (permit_date_range !== 'after_1997')                push('rat',     'Amiante avant travaux','Rep\u00e9rage RAT \u2014 avant tout chantier sur b\u00e2ti ant\u00e9rieur \u00e0 1997.');
    if (permit_date_range === 'before_1949')               push('plomb_at','Plomb avant travaux', 'B\u00e2timent ant\u00e9rieur \u00e0 1949.');
  } else if (project_type === 'coownership') {
    push('dta',    'DTA parties communes','Dossier technique amiante \u2014 obligatoire avec parties communes.');
    push('dpe_c',  'DPE collectif',       'Immeuble d\u2019habitation en copropri\u00e9t\u00e9.');
  }
  return diags;
}

function calcPricing(state, diags) {
  // Pricing stub — matches the "340 € - 520 € TTC" ballpark from brief
  if (state.project_type === 'other' || diags.length === 0) return null;
  const base = 220 + diags.length * 60;
  let low  = base, high = base;
  const modulators = [];
  const s = parseInt(state.surface || '0', 10);
  if (s >= 80 && s < 150)  { low += 15; high += 55; modulators.push({ label: `Surface ${s} m²`, delta: '+10 %' }); }
  if (s >= 150)            { low += 50; high += 120; modulators.push({ label: `Surface ${s} m²`, delta: '+25 %' }); }
  if (diags.length >= 3)   { low -= 45; high -= 60;  modulators.push({ label: `Pack \u2265 3 diags`, delta: '\u221215 %' }); }
  return { low: Math.round(low/10)*10, high: Math.round(high/10)*10, modulators };
}

// ── Default demo state for the "filled" screenshot ──
const DEMO_STATE = {
  project_type:          'sale',
  property_type:         'maison',
  address:               '12 rue Nationale',
  postal_code:           '37000',
  city:                  'Tours',
  surface:               '112',
  rooms_count:           '5',
  is_coownership:        'no',
  permit_date_range:     '1949_1997',
  heating_type:          'gas',
  gas_installation:      'gaz_ville',
  gas_over_15_years:     'yes',
  electric_over_15_years:'yes',
  urgency:               'two_weeks',
  notes:                 '',
  email:                 '',
};

const EMPTY_STATE = {
  project_type: null,
  property_type: null, address: '', postal_code: '', city: '', surface: '', rooms_count: '', is_coownership: null,
  permit_date_range: null, heating_type: null, gas_installation: null, gas_over_15_years: null, electric_over_15_years: null,
  rental_furnished: null, works_type: null, urgency: null, notes: '',
  email: '', civility: null, first_name: '', last_name: '', phone: '', consent_rgpd: false,
};

// Placeholder stripey SVG for when we'd want imagery
function StripedPh({ w=120, h=80, label='' }) {
  const bg = `repeating-linear-gradient(45deg, #e8e3d8 0 8px, #ddd6c5 8px 16px)`;
  return (
    <div style={{ width: w, height: h, background: bg, display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Geist Mono, monospace', fontSize: 10, color:'#7a6f5c', letterSpacing:'.05em' }}>
      {label}
    </div>
  );
}

Object.assign(window, { I, BRANCHES, BRAND, calcDiagnostics, calcPricing, DEMO_STATE, EMPTY_STATE, StripedPh });
