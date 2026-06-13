#!/usr/bin/env node

/**
 * Script pour remplacer tous les console.log par le logger
 * Usage: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');

// Patterns à remplacer
const replacements = [
  {
    // console.log('...')
    pattern: /console\.log\((.*?)\)/g,
    replacement: "logger.dev($1)"
  },
  {
    // console.error('...')
    pattern: /console\.error\((.*?)\)/g,
    replacement: "logger.error($1)"
  },
  {
    // console.warn('...')
    pattern: /console\.warn\((.*?)\)/g,
    replacement: "logger.warn($1)"
  },
  {
    // console.info('...')
    pattern: /console\.info\((.*?)\)/g,
    replacement: "logger.info($1)"
  },
  {
    // console.debug('...')
    pattern: /console\.debug\((.*?)\)/g,
    replacement: "logger.debug($1)"
  }
];

function getAllTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules et autres dossiers non pertinents
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllTSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si le fichier contient déjà l'import
  const needsImport = !content.includes("import { logger } from");
  let newContent = content;

  // Appliquer les remplacements
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      
      // Si on a fait des remplacements et qu'on a besoin de l'import
      if (needsImport && !newContent.includes("import { logger }")) {
        // Trouver la dernière ligne d'import
        const importLines = newContent.match(/^import .*$/gm);
        if (importLines && importLines.length > 0) {
          const lastImportLine = importLines[importLines.length - 1];
          const lastImportIndex = newContent.lastIndexOf(lastImportLine);
          const afterLastImport = lastImportIndex + lastImportLine.length;
          
          newContent = 
            newContent.substring(0, afterLastImport) + 
            '\nimport { logger } from \'../utils/logger\';' + 
            newContent.substring(afterLastImport);
        }
      }
    }
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }

  return false;
}

// Fonction principale
function main() {
  console.log('🔍 Scanning TypeScript files...\n');
  
  const files = getAllTSFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files\n`);

  let totalUpdated = 0;

  files.forEach(file => {
    if (replaceInFile(file)) {
      totalUpdated++;
    }
  });

  console.log(`\n✅ Total files updated: ${totalUpdated}/${files.length}`);
  
  if (totalUpdated > 0) {
    console.log('\n📝 Note: You may need to manually fix some imports');
    console.log('   Add: import { logger } from \'../utils/logger\'; at the top of files');
  }
}

main();

