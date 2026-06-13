/**
 * audit-lines.mjs
 * Scans src/ for large files, categorizes them, and generates maintenance_audit.md
 * Usage: node scripts/audit-lines.mjs
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

const SRC_DIR = 'src';
const OUTPUT_FILE = 'maintenance_audit.md';
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage', 'supabase', 'public', 'generated']);
const TOP_N = 30;
const THRESHOLD = 250;

// --- File walking ---

async function walkDir(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath));
    } else if (EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// --- Line counting ---

function countLines(content) {
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Effective lines: strip blanks, single-line comments, block comments
  let effectiveLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed === '' || trimmed.startsWith('//')) {
      continue;
    }

    effectiveLines++;
  }

  return { totalLines, effectiveLines };
}

// --- Categorization ---

function categorize(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/modules/') || normalized.includes('/pages/')) return 'page';
  if (normalized.includes('/components/')) return 'component';
  if (
    normalized.includes('/hooks/') ||
    normalized.includes('/services/') ||
    normalized.includes('/store/') ||
    normalized.includes('/lib/') ||
    normalized.includes('/utils/') ||
    normalized.includes('/types/')
  ) return 'lib';
  return 'other';
}

// --- Suggestions ---

function suggest(category, effectiveLines) {
  if (category === 'page') {
    if (effectiveLines > 500) return 'Extraire les sections en sous-composants + hooks custom';
    if (effectiveLines > 250) return 'Extraire la logique dans des hooks custom';
  }
  if (category === 'component') {
    if (effectiveLines > 500) return 'Diviser en sous-composants atomiques';
    if (effectiveLines > 250) return 'Extraire hooks / sous-composants';
  }
  if (category === 'lib') {
    if (effectiveLines > 500) return 'Découper en modules plus petits (barrel export)';
    if (effectiveLines > 250) return 'Séparer les responsabilités dans des fichiers dédiés';
  }
  if (effectiveLines > 250) return 'Envisager un découpage en fichiers plus petits';
  return '';
}

// --- Report generation ---

function generateReport(results) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const total = results.length;
  const overThreshold = results.filter(r => r.effectiveLines > THRESHOLD);

  const byCategory = {};
  for (const r of overThreshold) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  }

  const sorted = [...results].sort((a, b) => b.effectiveLines - a.effectiveLines);
  const top = sorted.slice(0, TOP_N);

  const lines = [];

  lines.push(`# Audit de taille des fichiers`);
  lines.push('');
  lines.push(`> Généré le ${now} par \`scripts/audit-lines.mjs\``);
  lines.push('');

  // Summary
  lines.push('## Résumé');
  lines.push('');
  lines.push(`| Métrique | Valeur |`);
  lines.push(`|----------|--------|`);
  lines.push(`| Fichiers scannés | ${total} |`);
  lines.push(`| Fichiers > ${THRESHOLD} lignes effectives | ${overThreshold.length} |`);
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    lines.push(`| — ${cat} | ${count} |`);
  }
  lines.push('');

  // Top N
  lines.push(`## Top ${TOP_N} (par lignes effectives)`);
  lines.push('');
  lines.push(`| # | Fichier | Eff. | Total | Cat. | Suggestion |`);
  lines.push(`|---|---------|------|-------|------|------------|`);
  top.forEach((r, i) => {
    const suggestion = suggest(r.category, r.effectiveLines);
    lines.push(`| ${i + 1} | \`${r.path}\` | ${r.effectiveLines} | ${r.totalLines} | ${r.category} | ${suggestion} |`);
  });
  lines.push('');

  // Full list > threshold
  if (overThreshold.length > 0) {
    const sortedOver = [...overThreshold].sort((a, b) => b.effectiveLines - a.effectiveLines);
    lines.push(`## Tous les fichiers > ${THRESHOLD} lignes effectives`);
    lines.push('');
    lines.push(`| Fichier | Eff. | Total | Cat. | Suggestion |`);
    lines.push(`|---------|------|-------|------|------------|`);
    for (const r of sortedOver) {
      const suggestion = suggest(r.category, r.effectiveLines);
      lines.push(`| \`${r.path}\` | ${r.effectiveLines} | ${r.totalLines} | ${r.category} | ${suggestion} |`);
    }
    lines.push('');
  }

  // Methodology
  lines.push('## Méthodologie');
  lines.push('');
  lines.push('- **Lignes totales** : comptage brut des lignes du fichier');
  lines.push('- **Lignes effectives** : lignes non vides, hors commentaires (`//` et `/* ... */`)');
  lines.push('- Le calcul des commentaires bloc utilise une machine à états simple (flag in-comment). Les cas limites (commentaires dans des chaînes de caractères, template literals) ne sont pas gérés — suffisant pour un outil d\'audit.');
  lines.push(`- Extensions scannées : ${[...EXTENSIONS].join(', ')}`);
  lines.push(`- Répertoire scanné : \`${SRC_DIR}/\``);
  lines.push('');

  return lines.join('\n');
}

// --- Main ---

async function main() {
  console.log(`Scanning ${SRC_DIR}/...`);
  const files = await walkDir(SRC_DIR);
  console.log(`Found ${files.length} source files.`);

  const results = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const { totalLines, effectiveLines } = countLines(content);
    const relPath = relative('.', filePath).replace(/\\/g, '/');
    results.push({
      path: relPath,
      totalLines,
      effectiveLines,
      category: categorize(filePath),
    });
  }

  const report = generateReport(results);
  await writeFile(OUTPUT_FILE, report, 'utf-8');

  const overThreshold = results.filter(r => r.effectiveLines > THRESHOLD).length;
  console.log(`Report written to ${OUTPUT_FILE}`);
  console.log(`  ${results.length} files scanned, ${overThreshold} files > ${THRESHOLD} effective lines.`);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
