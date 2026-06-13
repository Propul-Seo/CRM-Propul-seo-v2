// ────────── Branch config + rules (FR) ──────────
const BRANCHES = {
  sale: {
    key:'sale', num:'01', label:'Vente', icon:'home',
    tagline:"Mise en vente d'une maison, appartement ou local.",
    stat: '6 diagnostics en moyenne',
  },
  rental: {
    key:'rental', num:'02', label:'Location', icon:'key',
    tagline:"Nouveau bail ou renouvellement de vos diagnostics.",
    stat: '5 diagnostics en moyenne',
  },
  works: {
    key:'works', num:'03', label:'Travaux / Rénovation', icon:'hammer',
    tagline:"Repérage amiante et plomb avant chantier.",
    stat: '2 diagnostics ciblés',
  },
  coownership: {
    key:'coownership', num:'04', label:'Gestion copropriété', icon:'building',
    tagline:"DTA, DPE collectif, parties communes.",
    stat: '2 diagnostics collectifs',
  },
  other: {
    key:'other', num:'05', label:'Autre projet', icon:'help',
    tagline:"Décrivez votre besoin, on vous recontacte.",
    stat: 'Étude personnalisée',
  },
};

// Mock of /api/calculate — mirror of lib/diagnostics/rules.ts
function computeDiagnostics(project, answers = {}) {
  const year = answers.permit;
  const pre1949 = year === 'pre1949';
  const pre1997 = year === 'pre1949' || year === '1949_1997';
  const coownership = answers.coownership === 'yes';
  const elecOld = answers.elec_old === 'yes';
  const gasOld = answers.gas_old === 'yes';
  const inDept37 = (answers.postal || '37000').startsWith('37');
  const items = [];
  if (project === 'sale') {
    items.push({ code:'DPE', name:'DPE', reason:'Obligatoire pour toute vente.' });
    if (pre1949) items.push({ code:'PLOMB', name:'CREP Plomb', reason:'Bien construit avant 1949.' });
    if (pre1997) items.push({ code:'AMIANTE', name:'Amiante', reason:'Permis avant juillet 1997.' });
    if (inDept37) items.push({ code:'TERMITES', name:'Termites', reason:'Indre-et-Loire (37) en zone d\'arrêté préfectoral.' });
    if (gasOld) items.push({ code:'GAZ', name:'État du gaz', reason:'Installation de plus de 15 ans.' });
    if (elecOld) items.push({ code:'ELEC', name:'État de l\'électricité', reason:'Installation de plus de 15 ans.' });
    if (coownership) items.push({ code:'CARREZ', name:'Loi Carrez', reason:'Bien en copropriété.' });
    items.push({ code:'ERP', name:'ERP', reason:'État des risques et pollutions systématique.' });
  } else if (project === 'rental') {
    items.push({ code:'DPE', name:'DPE', reason:'Obligatoire pour toute location.' });
    if (pre1997) items.push({ code:'DAPP', name:'DAPP Amiante', reason:'Permis avant juillet 1997 (remplace l\'Amiante vente).' });
    if (gasOld) items.push({ code:'GAZ', name:'État du gaz', reason:'Installation de plus de 15 ans.' });
    if (elecOld) items.push({ code:'ELEC', name:'État de l\'électricité', reason:'Installation de plus de 15 ans.' });
    if (answers.furnished === 'empty') items.push({ code:'BOUTIN', name:'Loi Boutin', reason:'Logement loué vide.' });
    items.push({ code:'ERP', name:'ERP', reason:'État des risques et pollutions systématique.' });
    items.push({ code:'EDL', name:'État des lieux', reason:'Entrant et sortant, chiffré séparément.' });
  } else if (project === 'works') {
    if (pre1997) items.push({ code:'RAT', name:'Amiante avant travaux (RAT)', reason:'Permis avant juillet 1997.' });
    if (pre1949) items.push({ code:'PLOMB_RAT', name:'Plomb avant travaux', reason:'Bien construit avant 1949.' });
  } else if (project === 'coownership') {
    items.push({ code:'DTA', name:'DTA parties communes', reason:'Dossier technique amiante obligatoire.' });
    items.push({ code:'DPE_C', name:'DPE collectif', reason:'Obligatoire depuis 2024 pour les copropriétés.' });
  }
  return items;
}

// Pricing
function computePricing(items, surface = 90) {
  if (!items.length) return null;
  const base = { DPE: 110, PLOMB: 90, AMIANTE: 100, TERMITES: 90, GAZ: 80, ELEC: 80, CARREZ: 60, ERP: 20,
                 DAPP: 85, BOUTIN: 55, EDL: 120, RAT: 180, PLOMB_RAT: 140, DTA: 240, DPE_C: 320 };
  let low = items.reduce((s, it) => s + (base[it.code] || 50), 0);
  let high = Math.round(low * 1.25);
  const modifiers = [];
  if (surface > 150) { const f = 1.25; low = Math.round(low*f); high = Math.round(high*f); modifiers.push({ label:`Surface >150 m²`, sign:'+25 %' }); }
  else if (surface >= 80) { const f = 1.1; low = Math.round(low*f); high = Math.round(high*f); modifiers.push({ label:`Surface 80–150 m²`, sign:'+10 %' }); }
  if (items.length >= 3) { const f = 0.85; low = Math.round(low*f); high = Math.round(high*f); modifiers.push({ label:`Pack ≥3 diagnostics`, sign:'−15 %' }); }
  return { low, high, modifiers };
}

Object.assign(window, { BRANCHES, computeDiagnostics, computePricing });
