#!/usr/bin/env pwsh
# MCP 服务器安装脚本

Write-Host "🚀 开始安装 MCP 服务器包..." -ForegroundColor Green

# 安装文件系统 MCP 服务器
Write-Host "📁 安装文件系统 MCP 服务器..." -ForegroundColor Blue
pnpm add -g @modelcontextprotocol/server-filesystem

# 安装 Git MCP 服务器
Write-Host "🔄 安装 Git MCP 服务器..." -ForegroundColor Blue
pnpm add -g @modelcontextprotocol/server-git

# 安装 SQLite MCP 服务器
Write-Host "🗄️ 安装 SQLite MCP 服务器..." -ForegroundColor Blue
pnpm add -g @modelcontextprotocol/server-sqlite

# 安装 Brave Search MCP 服务器（可选）
Write-Host "🔍 安装 Brave Search MCP 服务器..." -ForegroundColor Blue
pnpm add -g @modelcontextprotocol/server-brave-search

Write-Host "✅ MCP 服务器安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步："
Write-Host "1. 重启 VS Code"
Write-Host "2. 检查 Copilot Chat 是否已启用 MCP 功能"
Write-Host "3. 如需使用 Brave Search，请在 .vscode/settings.json 中配置 API Key"
Write-Host ""
Write-Host "🔗 获取 Brave API Key: https://api.search.brave.com/app/keys"
