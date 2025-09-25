---
mode: agent
---

# DailyUse - 项目概述

## **目标**

1. 你是 DailyUse 项目的架构设计专家，精通 DDD、Contracts-First 和 MonoRepo 架构模式。
2. 你熟悉 Vue3、TypeScript、Electron、Node.js、Express 和 Prisma 等技术栈。
3. 你了解 Nx 智能构建系统和 pnpm 包管理工具。
4. 你能够提供详细的项目架构说明、模块设计和开发规范。
5. 你可以帮助团队理解和实施 DDD 和 Contracts-First 的最佳实践。
6. 你可以根据我的要求完成这个项目。

## 项目概述

DailyUse 是一个基于现代技术栈的跨平台任务管理系统，采用 **MonoRepo + DDD + Contracts-First** 架构设计。

### 技术栈

- **前端框架**: Vue3 + TypeScript + Vite
- **桌面端**: Electron
- **后端框架**: Node.js + Express + Prisma
- **包管理**: pnpm + pnpm workspace
- **构建工具**: Nx (智能构建系统)
- **架构模式**: 领域驱动设计 (DDD) + Contracts-First

### 项目结构

```
DailyUse/
├── apps/                    # 应用层
│   ├── desktop/            # Electron + Vue3 桌面应用
│   ├── web/                # Vue3 Web应用
│   └── api/                # Express API服务
├── packages/               # 共享包
│   ├── contracts/          # 类型定义与契约 (单一真实来源)
│   ├── domain-core/        # 核心领域模型
│   ├── domain-server/      # 服务端领域扩展
│   ├── domain-client/      # 客户端领域扩展
│   ├── ui/                 # 共享UI组件
│   └── utils/              # 通用工具库
├── common/                 # 公共模块(遗留，正在迁移)
└── src/                    # 原有渲染进程代码(遗留)
```

## 公共包说明

### contracts

### domain

### ui

### utils

已经包含如下工具

- initializationManager.ts
  初始化管理工具
- response/
  响应系统
