# MCP (Model Context Protocol) 配置指南

## 🎯 概述

本文档介绍如何在 DailyUse 项目中配置和使用 MCP (Model Context Protocol)，以增强 GitHub Copilot 的上下文理解能力和开发效率。

## 📋 目录

- [什么是 MCP](#什么是-mcp)
- [为什么需要 MCP](#为什么需要-mcp)
- [已配置的 MCP 服务器](#已配置的-mcp-服务器)
- [安装和配置](#安装和配置)
- [使用指南](#使用指南)
- [故障排除](#故障排除)
- [高级配置](#高级配置)

## 什么是 MCP

Model Context Protocol (MCP) 是一个开放标准，允许 AI 助手（如 GitHub Copilot）连接到各种工具、服务和数据源，为 AI 提供更丰富的上下文信息。

### MCP 的优势

- 🧠 **智能上下文理解**：AI 可以理解项目结构、代码关系和历史变更
- 🔍 **深度代码分析**：基于实际项目结构提供精准建议
- 🚀 **开发效率提升**：减少手动查找和分析时间
- 🛠️ **工具集成**：无缝集成 Git、数据库、文件系统等工具

## 为什么需要 MCP

对于 DailyUse 项目的技术栈，MCP 提供以下特定帮助：

### Electron + TypeScript 开发
- 理解主进程/渲染进程架构
- 提供 IPC 通信最佳实践
- TypeScript 类型安全建议

### Vue 3 + Vuetify 开发
- 基于组件结构的代码生成
- Composition API 优化建议
- 状态管理 (Pinia) 最佳实践

### Nx Monorepo 管理
- 包依赖关系分析
- 构建优化建议
- 代码共享策略

### Prisma + SQLite 数据库
- Schema 分析和优化
- 查询生成和优化
- 数据模型设计建议

## 已配置的 MCP 服务器

### 1. 文件系统 MCP (`filesystem`)
**用途**：让 AI 理解项目文件结构和代码组织

**功能**：
- 📁 分析项目目录结构
- 📄 读取和分析源代码文件
- 🔗 理解模块导入关系
- 📦 分析包依赖结构

### 2. Git MCP (`git`)
**用途**：提供代码版本历史和变更上下文

**功能**：
- 📊 分析提交历史
- 🔄 理解代码演进过程
- 🌿 分支管理建议
- 📈 代码变更影响分析

### 3. SQLite MCP (`sqlite`)
**用途**：集成数据库结构理解，配合 Prisma 使用

**功能**：
- 🗄️ 分析数据库 Schema
- 📋 生成数据库查询
- 🔍 数据关系分析
- ⚡ 查询优化建议

### 4. Brave Search MCP (`brave-search`)
**用途**：获取最新技术信息和解决方案

**功能**：
- 🔍 实时技术文档搜索
- 💡 最新最佳实践获取
- 🐛 错误解决方案查找
- 📚 技术资料检索

## 安装和配置

### 步骤 1：安装 MCP 服务器包

运行安装脚本：

```powershell
# 进入项目根目录
cd d:\myPrograms\DailyUse

# 运行安装脚本
.\scripts\install-mcp.ps1
```

或手动安装：

```powershell
# 安装文件系统 MCP（已验证可用）
pnpm add -g @modelcontextprotocol/server-filesystem

# 注意：其他 MCP 服务器的包名可能不同，请参考官方文档
# 或者根据需要安装其他可用的 MCP 服务器
```

**重要提示**：如果遇到 `ERR_PNPM_UNEXPECTED_STORE` 错误，请参考 [故障排除](#故障排除) 部分的解决方案。

### 步骤 2：配置 Brave Search API Key（可选）

1. 访问 [Brave Search API](https://api.search.brave.com/app/keys)
2. 注册并获取免费 API Key
3. 在 `.vscode/settings.json` 中替换 `YOUR_BRAVE_API_KEY_HERE`

### 步骤 3：重启 VS Code

配置完成后，重启 VS Code 以加载 MCP 配置。

## 使用指南

### 基础使用

配置完成后，在 GitHub Copilot Chat 中，AI 将自动获得以下能力：

#### 项目结构理解
```
AI 现在可以理解：
- 📁 apps/desktop - Electron 桌面应用
- 📁 apps/web - Vue 3 Web 应用  
- 📁 apps/api - Node.js API 服务
- 📁 packages/* - 共享包和工具
- 📁 common/* - 共享业务逻辑
```

#### 代码生成示例

**Vue 组件生成**：
```
"为 web 应用创建一个任务管理组件，使用 Vuetify 和 TypeScript"
```

**Electron IPC 代码**：
```
"创建一个 Electron IPC 通道来处理文件操作"
```

**数据库查询**：
```
"基于 Prisma schema 生成用户统计查询"
```

#### 调试和优化

**性能分析**：
```
"分析 Electron 应用的性能瓶颈"
```

**代码重构**：
```
"重构这个 Vue 组件以使用 Composition API"
```

### 高级使用技巧

#### 1. 上下文相关查询
利用 MCP 的上下文理解，提出更精确的问题：

```
"基于当前的 Nx 工作区结构，如何优化构建性能？"
"这个 TypeScript 错误与项目中的哪些文件相关？"
"如何改进当前的 Pinia store 结构？"
```

#### 2. 跨项目分析
```
"分析 desktop 和 web 应用之间的代码重复"
"建议如何将共同逻辑提取到 common 模块"
```

#### 3. 技术栈集成
```
"如何在当前 Electron + Vue 架构中集成新的功能？"
"建议 API 和前端之间的数据传输优化方案"
```

## 故障排除

### 常见问题

#### 1. MCP 服务器无法启动
**症状**：VS Code 中看不到 MCP 功能

**解决方案**：
```powershell
# 检查 MCP 包是否正确安装
npx @modelcontextprotocol/server-filesystem "D:\myPrograms\DailyUse"

# 重新安装
pnpm add -g @modelcontextprotocol/server-filesystem --force
```

#### 1.1 pnpm Store 路径冲突
**症状**：`ERR_PNPM_UNEXPECTED_STORE` 错误

**解决方案**：
```powershell
# 删除旧的全局依赖目录
Remove-Item -Path "C:\Users\$env:USERNAME\AppData\Local\pnpm\global" -Recurse -Force -ErrorAction SilentlyContinue

# 设置正确的 store 路径
pnpm config set store-dir "D:\pnpm-store" --global

# 重新安装
pnpm add -g @modelcontextprotocol/server-filesystem
```

#### 2. 文件路径错误
**症状**：MCP 无法访问项目文件

**解决方案**：
检查 `.vscode/settings.json` 中的路径是否正确：
```json
"args": [
  "@modelcontextprotocol/server-filesystem",
  "d:\\myPrograms\\DailyUse"  // 确保路径正确
]
```

#### 3. SQLite 数据库文件未找到
**症状**：SQLite MCP 报错

**解决方案**：
```powershell
# 确保数据库文件存在
ls apps/api/prisma/dev.db

# 如果不存在，运行 Prisma 迁移
cd apps/api
npx prisma migrate dev
```

#### 4. Brave Search API 配额用完
**症状**：搜索功能不可用

**解决方案**：
- 检查 API Key 是否正确
- 查看 API 使用配额
- 考虑升级到付费计划

### 调试方法

#### 查看 MCP 日志
在 VS Code 开发者工具中查看 MCP 相关日志：

1. 按 `Ctrl+Shift+P`
2. 输入 "Developer: Toggle Developer Tools"
3. 查看 Console 中的 MCP 相关信息

#### 测试 MCP 连接
```powershell
# 测试文件系统 MCP
npx @modelcontextprotocol/server-filesystem d:\myPrograms\DailyUse

# 测试 Git MCP
npx @modelcontextprotocol/server-git --repository d:\myPrograms\DailyUse
```

## 高级配置

### 自定义 MCP 服务器

您可以为项目特定需求创建自定义 MCP 服务器：

#### 1. 创建项目特定的 MCP
```typescript
// tools/mcp/dailyuse-mcp.ts
export class DailyUseMCP {
  // 项目特定的上下文提供器
  async getProjectContext() {
    return {
      architecture: "electron-vue-monorepo",
      frameworks: ["vue3", "vuetify", "electron", "prisma"],
      buildTool: "nx",
      packageManager: "pnpm"
    };
  }
}
```

#### 2. 添加到 MCP 配置
```json
{
  "dailyuse": {
    "command": "node",
    "args": ["tools/mcp/dailyuse-mcp.js"],
    "env": {}
  }
}
```

### 性能优化

#### 1. 文件过滤配置
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "@modelcontextprotocol/server-filesystem",
      "d:\\myPrograms\\DailyUse",
      "--ignore", "node_modules,dist,coverage"
    ]
  }
}
```

#### 2. Git 历史限制
```json
{
  "git": {
    "command": "npx",
    "args": [
      "@modelcontextprotocol/server-git",
      "--repository", "d:\\myPrograms\\DailyUse",
      "--max-commits", "100"
    ]
  }
}
```

### 团队协作配置

#### 1. 共享配置
将 `.vscode/settings.json` 加入版本控制：

```json
{
  "github.copilot.chat.experimental.modelContextProtocol": {
    "enabled": true,
    "servers": {
      // 使用相对路径，便于团队成员使用
      "filesystem": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-filesystem",
          "${workspaceFolder}"
        ]
      }
    }
  }
}
```

#### 2. 环境变量配置
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "${env:BRAVE_API_KEY}"
    }
  }
}
```

## 📈 性能监控

### MCP 使用统计
您可以监控 MCP 的使用情况和性能：

```typescript
// 在开发者工具中运行
console.log('MCP Servers Status:', window.vscode?.MCP?.getServerStatus());
```

### 优化建议

1. **定期清理**：清理不需要的 MCP 服务器
2. **资源监控**：监控 MCP 服务器的内存使用
3. **缓存配置**：合理配置文件缓存策略

## 🔮 未来扩展

### 计划中的 MCP 集成

1. **Docker MCP**：容器化开发环境集成
2. **Testing MCP**：测试框架深度集成
3. **Deployment MCP**：部署流程自动化
4. **Monitoring MCP**：应用性能监控集成

### 贡献和反馈

如果您有 MCP 配置改进建议或遇到问题，请：

1. 在项目 Issues 中报告问题
2. 提交 Pull Request 改进配置
3. 分享使用经验和最佳实践

## 📚 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [GitHub Copilot MCP 指南](https://docs.github.com/en/copilot)
- [VS Code MCP 扩展](https://marketplace.visualstudio.com/search?term=MCP)
- [Nx 工作区最佳实践](https://nx.dev/getting-started/intro)

---

**更新日期**：2025年9月14日  
**版本**：1.0.0  
**维护者**：BakerSean168
