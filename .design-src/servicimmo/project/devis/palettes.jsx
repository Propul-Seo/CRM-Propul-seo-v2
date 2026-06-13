// ────────── Palette variants for V2 ──────────
// Each palette overrides the 5 branch colors + page chrome (cream/ink/line).
const PALETTES = {
  'cream-sage-brick': {
    label: 'Cream · Sage · Brick',
    note: 'Chaleureux éditorial — ton original.',
    chrome: { cream:'#fdf9f0', ink:'#2d2a24', line:'#e8dfcb', muted:'#847a6a' },
    branches: {
      sale:        { bg:'#e6ecd8', fg:'#7a9b6e', dark:'#4e6b46' },
      rental:      { bg:'#f4e5bc', fg:'#d4a648', dark:'#8a6a1c' },
      works:       { bg:'#f3ddcf', fg:'#c17453', dark:'#8a4a2c' },
      coownership: { bg:'#d4e5e5', fg:'#1E6B6E', dark:'#124a4c' },
      other:       { bg:'#e8dae8', fg:'#7a5a7a', dark:'#5a3a5a' },
    },
  },
  'cream-teal-ochre': {
    label: 'Cream · Teal · Ochre',
    note: 'Teal du site + ochre complémentaire.',
    chrome: { cream:'#fbf7ec', ink:'#1a1a1a', line:'#e4dfcd', muted:'#6a6a6a' },
    branches: {
      sale:        { bg:'#d4e5e5', fg:'#1E6B6E', dark:'#0f4e50' },
      rental:      { bg:'#f4e5bc', fg:'#c89a2a', dark:'#7a5c0f' },
      works:       { bg:'#f3ddcf', fg:'#c17453', dark:'#7a3e1e' },
      coownership: { bg:'#dfe5ee', fg:'#1A3A52', dark:'#0e263a' },
      other:       { bg:'#e6e0d0', fg:'#6a6252', dark:'#3e3828' },
    },
  },
  'cream-lime-sage': {
    label: 'Cream · Lime · Sage',
    note: 'Lime vif du site (CTA) + verts nature.',
    chrome: { cream:'#fcfaef', ink:'#1f2a14', line:'#dfe4c8', muted:'#606a50' },
    branches: {
      sale:        { bg:'#eaf5c7', fg:'#7a9b1c', dark:'#546b10' },
      rental:      { bg:'#d8e9d1', fg:'#5a8256', dark:'#365233' },
      works:       { bg:'#f0d9bf', fg:'#b36a3a', dark:'#733e1c' },
      coownership: { bg:'#d4e8e6', fg:'#2a7570', dark:'#104a48' },
      other:       { bg:'#e4e0cc', fg:'#6a6452', dark:'#3a3628' },
    },
  },
  'servicimmo-strict': {
    label: 'Servicimmo strict',
    note: 'Uniquement teal + lime + navy du site.',
    chrome: { cream:'#ffffff', ink:'#1a1a1a', line:'#e8e8e8', muted:'#6a6a6a' },
    branches: {
      sale:        { bg:'#d4e5e5', fg:'#1E6B6E', dark:'#0f4e50' },
      rental:      { bg:'#eaf5c7', fg:'#7a9b1c', dark:'#546b10' },
      works:       { bg:'#f3ddcf', fg:'#c17453', dark:'#7a3e1e' },
      coownership: { bg:'#dfe5ee', fg:'#1A3A52', dark:'#0e263a' },
      other:       { bg:'#ececec', fg:'#4a4a4a', dark:'#1a1a1a' },
    },
  },
};

Object.assign(window, { PALETTES });
