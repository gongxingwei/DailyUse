#!/usr/bin/env node
/**
 * 自动为相对导入添加 .js 扩展名
 * 用于解决 Node.js ESM 需要显式扩展名的问题
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 递归获取所有 .ts 文件
function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && 
               !file.endsWith('.d.ts') && 
               !file.endsWith('.spec.ts') && 
               !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const apiSrcPath = path.resolve(__dirname, '../../apps/api/src');
const files = getAllTsFiles(apiSrcPath);

let totalChanges = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  const originalContent = content;
  
  // 匹配相对导入（不包含 .js 扩展名的）
  // from './xxx' 或 from '../xxx'
  const importRegex = /from\s+['"](\.\.[\/\\][^'"]*|\.\/[^'"]*)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    // 跳过已经有扩展名的
    if (importPath.endsWith('.js') || 
        importPath.endsWith('.json') || 
        importPath.endsWith('.mjs')) {
      return match;
    }
    
    // 添加 .js 扩展名
    return match.replace(importPath, importPath + '.js');
  });
  
  if (content !== originalContent) {
    writeFileSync(file, content, 'utf-8');
    totalChanges++;
    console.log(`✓ ${file}`);
  }
});

console.log(`\n完成！共修改 ${totalChanges} 个文件`);
