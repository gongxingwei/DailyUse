#!/usr/bin/env pwsh
# DailyUse 项目 MCP 配置脚本 - 针对 pnpm 优化

Write-Host "🚀 配置 DailyUse 项目的 AI 辅助开发环境..." -ForegroundColor Green

# 检查 pnpm 配置
Write-Host "📦 检查 pnpm 配置..." -ForegroundColor Blue
$pnpmVersion = pnpm --version
Write-Host "✅ pnpm 版本: $pnpmVersion" -ForegroundColor Green

# 优化 pnpm 配置用于开发
Write-Host "⚙️ 优化 pnpm 配置..." -ForegroundColor Blue
pnpm config set store-dir "D:/pnpm-store"
pnpm config set virtual-store-dir-max-length 120
pnpm config set auto-install-peers true
pnpm config set dedupe-peer-dependents true

# 安装开发工具
Write-Host "🛠️ 安装 AI 辅助开发工具..." -ForegroundColor Blue

# 安装 TypeScript 语言服务器增强
pnpm add -D typescript-language-server
pnpm add -D @volar/vue-language-server

# 安装代码分析工具
pnpm add -D eslint-plugin-vue
pnpm add -D @typescript-eslint/eslint-plugin
pnpm add -D prettier

# 项目特定的开发依赖
Write-Host "📁 分析项目结构..." -ForegroundColor Blue
$projectStructure = @{
    "apps" = @("desktop", "web", "api")
    "packages" = @("contracts", "domain-client", "domain-core", "domain-server", "ui", "utils")
    "tech_stack" = @("electron", "vue3", "typescript", "prisma", "nx", "pnpm")
}

# 创建项目上下文文件供 AI 理解
$contextFile = @"
{
  "project": "DailyUse",
  "type": "monorepo",
  "packageManager": "pnpm",
  "buildTool": "nx",
  "structure": {
    "apps": {
      "desktop": {
        "framework": "electron",
        "frontend": "vue3",
        "ui": "vuetify",
        "language": "typescript"
      },
      "web": {
        "framework": "vue3",
        "ui": "vuetify", 
        "bundler": "vite",
        "language": "typescript"
      },
      "api": {
        "runtime": "node.js",
        "database": "sqlite",
        "orm": "prisma",
        "language": "typescript"
      }
    },
    "packages": {
      "contracts": "shared types and interfaces",
      "domain-client": "client-side business logic",
      "domain-core": "core business logic",
      "domain-server": "server-side business logic", 
      "ui": "shared UI components",
      "utils": "utility functions"
    }
  },
  "ai_context": {
    "primary_languages": ["typescript", "vue", "javascript"],
    "frameworks": ["electron", "vue3", "vuetify", "prisma"],
    "tools": ["nx", "pnpm", "vite", "eslint", "prettier"],
    "patterns": ["monorepo", "domain-driven-design", "component-based"]
  }
}
"@

$contextFile | Out-File -FilePath ".vscode/project-context.json" -Encoding UTF8

Write-Host "✅ AI 辅助开发环境配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 pnpm 的优势："
Write-Host "  • 💾 磁盘空间节省 (符号链接)"
Write-Host "  • 🚀 安装速度更快"
Write-Host "  • 🔒 严格的依赖管理"
Write-Host "  • 🏗️ 完美支持 monorepo"
Write-Host "  • 📦 与 Nx 深度集成"
Write-Host ""
Write-Host "📝 下一步："
Write-Host "1. 重启 VS Code"
Write-Host "2. pnpm 已优化，比 npm 有以下优势："
Write-Host "   - 节省磁盘空间（平均节省 50-70%）"
Write-Host "   - 安装速度提升 2-3倍"
Write-Host "   - 更好的 monorepo 支持"
Write-Host "   - 严格的依赖解析，避免幽灵依赖"
Write-Host "3. 在 Copilot Chat 中测试: '分析我的 pnpm monorepo 结构'"
