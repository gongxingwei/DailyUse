#!/usr/bin/env node

/**
 * Remove .js extensions from TypeScript imports
 * This script reverses the add-js-extensions.mjs script
 *
 * Usage: node tools/scripts/remove-js-extensions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../..');
const TARGET_DIR = path.join(ROOT_DIR, 'apps/api/src');

// Statistics
let filesModified = 0;
let totalChanges = 0;

/**
 * Process a single TypeScript file to remove .js extensions
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let changeCount = 0;

  // Pattern to match imports with .js extension from relative paths
  // Matches:
  // - from './something.js'
  // - import x from '../something.js'
  // - export ... from '../../something.js'
  // Support both single and double quotes
  const importRegex = /(from|import)\s+(['"])(\.\/?[^'"]+)\.js\2/g;

  const newContent = content.replace(importRegex, (match, keyword, quote, importPath) => {
    modified = true;
    changeCount++;
    // Remove the .js extension, preserve keyword and quote style
    return `${keyword} ${quote}${importPath}${quote}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    filesModified++;
    totalChanges += changeCount;
    console.log(`✅ ${filePath}`);
  }

  return modified;
}

/**
 * Recursively find all .ts files in a directory
 */
function findTypeScriptFiles(dir) {
  const files = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
          traverse(fullPath);
        }
      } else if (stat.isFile() && item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Searching for TypeScript files...\n');

  const tsFiles = findTypeScriptFiles(TARGET_DIR);

  console.log(`Found ${tsFiles.length} TypeScript files\n`);
  console.log('📝 Removing .js extensions from imports...\n');

  for (const file of tsFiles) {
    processFile(file);
  }

  console.log(`\n✨ 完成！共修改 ${filesModified} 个文件，移除 ${totalChanges} 个 .js 扩展名`);

  if (filesModified > 0) {
    console.log('\n⚠️  请使用 git diff 检查修改是否正确');
  }
}

main();
