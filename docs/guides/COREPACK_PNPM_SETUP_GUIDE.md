# 使用 Corepack 管理 pnpm 完整指南

## 文档信息

- **创建日期**: 2025-10-18
- **适用场景**: 使用 NVM 管理 Node.js 版本，使用 Corepack 管理包管理器（pnpm）
- **目标**: 统一团队的包管理器版本，避免版本不一致导致的问题

---

## 📚 目录

1. [什么是 Corepack](#1-什么是-corepack)
2. [为什么使用 Corepack](#2-为什么使用-corepack)
3. [前置条件](#3-前置条件)
4. [安装配置步骤](#4-安装配置步骤)
5. [项目配置](#5-项目配置)
6. [常见问题与解决方案](#6-常见问题与解决方案)
7. [最佳实践](#7-最佳实践)
8. [命令速查表](#8-命令速查表)

---

## 1. 什么是 Corepack

**Corepack** 是 Node.js 官方提供的包管理器管理工具，从 **Node.js 16.9.0** 开始内置。

### 核心特性

- ✅ **零安装**：无需手动安装 pnpm/yarn，Corepack 自动下载和管理
- ✅ **版本锁定**：通过 `package.json` 锁定包管理器版本，确保团队一致性
- ✅ **自动切换**：根据项目配置自动使用正确的包管理器版本
- ✅ **官方支持**：Node.js 核心团队维护，与 Node.js 生命周期同步

### 支持的包管理器

- **pnpm** (推荐)
- **yarn** (classic 和 berry)
- ~~npm~~（不由 Corepack 管理，Node.js 自带）

---

## 2. 为什么使用 Corepack

### ✅ 优势

| 优势           | 说明                                                 |
| -------------- | ---------------------------------------------------- |
| **版本一致性** | 团队所有成员使用相同的 pnpm 版本，避免 lockfile 冲突 |
| **自动化管理** | 无需手动安装/更新 pnpm，Corepack 自动处理            |
| **项目隔离**   | 不同项目可以使用不同版本的 pnpm                      |
| **透明切换**   | 切换项目时自动使用对应版本的包管理器                 |
| **官方推荐**   | Node.js 官方推荐的包管理器管理方式                   |

### ❌ 传统方式的问题

```bash
# ❌ 传统方式：全局安装 pnpm
npm install -g pnpm@8.15.0

# 问题：
# 1. 团队成员可能安装不同版本
# 2. 需要手动更新版本
# 3. 多项目无法使用不同版本
# 4. 容易与项目配置不一致
```

---

## 3. 前置条件

### 3.1 检查 Node.js 版本

Corepack 需要 **Node.js >= 16.9.0**（推荐使用 LTS 版本）。

```powershell
# 检查当前 Node.js 版本
node -v
# 输出示例：v20.11.0 ✅

# 如果版本过低，使用 NVM 升级
nvm install lts
nvm use lts
```

### 3.2 验证 NVM 安装

```powershell
# 检查 NVM 是否正确安装
nvm version
# 输出示例：1.1.12 ✅

# 列出已安装的 Node.js 版本
nvm list
```

### 3.3 检查 Corepack 状态

```powershell
# 检查 Corepack 是否可用（Node.js 16.9+ 内置）
corepack -v
# 输出示例：0.24.0 ✅

# 如果提示 "corepack 不是内部或外部命令"
# 说明 Node.js 版本过低或 Corepack 被禁用
```

---

## 4. 安装配置步骤

### 步骤 1: 启用 Corepack

Corepack 虽然内置于 Node.js，但默认是 **禁用** 的，需要手动启用。

```powershell
# 启用 Corepack（全局配置）
corepack enable

# 验证启用成功
corepack -v
# 输出：0.24.0 或更高版本 ✅
```

**⚠️ 注意事项**:

- **NVM 用户**: 每次切换 Node.js 版本后，需要重新执行 `corepack enable`
- **原因**: Corepack 的启用状态是与 Node.js 版本绑定的

```powershell
# 示例：切换 Node.js 版本后重新启用
nvm use 20.11.0
corepack enable  # ⚠️ 必须重新启用
```

### 步骤 2: 准备 pnpm（可选）

Corepack 会根据 `package.json` 自动下载 pnpm，但也可以预先准备默认版本。

```powershell
# 方式 1: 准备最新版本的 pnpm
corepack prepare pnpm@latest --activate

# 方式 2: 准备指定版本的 pnpm（推荐）
corepack prepare pnpm@9.1.0 --activate

# 验证 pnpm 是否可用
pnpm -v
# 输出：9.1.0 ✅
```

**参数说明**:

- `prepare`: 下载并缓存指定版本的包管理器
- `--activate`: 将该版本设置为默认版本（全局）

### 步骤 3: 配置项目的 packageManager

在项目的 `package.json` 中指定 pnpm 版本，这是 **最重要的一步**。

```json
// package.json
{
  "name": "dailyuse",
  "version": "1.0.0",
  "packageManager": "pnpm@9.1.0",
  "scripts": {
    "dev": "pnpm run start"
  }
}
```

**关键字段**:

- `"packageManager": "pnpm@9.1.0"`: 指定项目使用 pnpm 9.1.0 版本
- 格式：`<包管理器名称>@<版本号>`

### 步骤 4: 验证配置

```powershell
# 进入项目目录
cd D:\myPrograms\DailyUse

# 检查 pnpm 版本（应与 package.json 中的版本一致）
pnpm -v
# 输出：9.1.0 ✅

# 安装依赖（Corepack 会自动使用正确版本的 pnpm）
pnpm install
```

---

## 5. 项目配置

### 5.1 为现有项目添加 packageManager

如果你的项目还没有 `packageManager` 字段，可以通过以下方式添加：

#### 方式 1: 手动添加

```json
// package.json
{
  "packageManager": "pnpm@9.1.0"
}
```

#### 方式 2: 使用 Corepack 自动检测并添加

```powershell
# 在项目根目录执行
corepack use pnpm@9.1.0

# 或者使用最新版本
corepack use pnpm@latest
```

该命令会：
1. 下载指定版本的 pnpm
2. 在 `package.json` 中自动添加 `packageManager` 字段

### 5.2 推荐的 package.json 配置

```json
{
  "name": "dailyuse",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.1.0",
  "engines": {
    "node": ">=20.11.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "dev": "nx serve api",
    "build": "nx build"
  }
}
```

**说明**:

- `packageManager`: 锁定 pnpm 版本
- `engines`: 指定 Node.js 和 pnpm 的最低版本要求
- `preinstall`: 防止使用错误的包管理器（如 npm/yarn）

### 5.3 添加 .npmrc 配置（可选）

创建 `.npmrc` 文件配置 pnpm 行为：

```ini
# .npmrc
# 使用严格的 peer dependencies 模式
strict-peer-dependencies=false

# 提升依赖到根目录（monorepo 推荐）
hoist=true

# 使用符号链接（节省磁盘空间）
symlink=true

# 指定包存储位置
store-dir=~/.pnpm-store

# 自动安装 peer dependencies
auto-install-peers=true

# 使用国内镜像加速（可选）
registry=https://registry.npmmirror.com
```

---

## 6. 常见问题与解决方案

### 问题 1: `corepack: command not found`

**原因**: Node.js 版本过低（< 16.9.0）

**解决方案**:

```powershell
# 升级 Node.js 到最新 LTS 版本
nvm install lts
nvm use lts

# 验证
corepack -v
```

---

### 问题 2: 切换 Node.js 版本后 pnpm 不可用

**原因**: Corepack 的启用状态与 Node.js 版本绑定

**解决方案**:

```powershell
# 每次切换 Node.js 版本后重新启用 Corepack
nvm use 20.11.0
corepack enable

# 验证
pnpm -v
```

**自动化解决方案** (推荐):

创建一个脚本 `scripts/setup-node.ps1`:

```powershell
# setup-node.ps1
param(
    [string]$version = "lts"
)

# 切换 Node.js 版本
nvm use $version

# 自动启用 Corepack
corepack enable

# 验证
Write-Host "Node.js version:" -ForegroundColor Green
node -v
Write-Host "pnpm version:" -ForegroundColor Green
pnpm -v
```

使用方式:

```powershell
# 切换到 LTS 版本并启用 Corepack
.\scripts\setup-node.ps1 -version lts

# 切换到指定版本
.\scripts\setup-node.ps1 -version 20.11.0
```

---

### 问题 3: `ERR_PNPM_UNSUPPORTED_ENGINE`

**错误信息**:

```
Your Node version is incompatible with "pnpm@9.1.0"
```

**原因**: Node.js 版本不满足 pnpm 的要求

**解决方案**:

```powershell
# 检查 pnpm 版本要求
pnpm -v

# 升级 Node.js
nvm install lts
nvm use lts
corepack enable
```

---

### 问题 4: 团队成员使用了错误的包管理器

**问题**: 有人使用 `npm install` 而非 `pnpm install`

**解决方案**: 添加 `preinstall` 钩子

```json
// package.json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

如果有人运行 `npm install`，会得到错误提示：

```
Use "pnpm install" for installation in this project
```

---

### 问题 5: Corepack 下载速度慢

**原因**: 默认从 GitHub/npm 下载，国内网络可能较慢

**解决方案 1**: 设置镜像（推荐）

```powershell
# 设置 npm 镜像（Corepack 会使用 npm 配置）
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

**解决方案 2**: 手动下载并缓存

```powershell
# 预先下载 pnpm（使用镜像）
corepack prepare pnpm@9.1.0 --activate
```

---

### 问题 6: `package.json` 中的 packageManager 版本过旧

**解决方案**: 更新到最新版本

```powershell
# 方式 1: 使用 corepack use 命令
corepack use pnpm@latest

# 方式 2: 手动编辑 package.json
# 将 "packageManager": "pnpm@8.0.0"
# 改为 "packageManager": "pnpm@9.1.0"

# 验证
pnpm -v
```

---

## 7. 最佳实践

### 7.1 团队协作规范

#### ✅ 推荐做法

1. **统一 Node.js 版本**

   ```json
   // package.json
   {
     "engines": {
       "node": ">=20.11.0 <21.0.0"
     }
   }
   ```

2. **锁定 pnpm 版本**

   ```json
   {
     "packageManager": "pnpm@9.1.0"
   }
   ```

3. **添加 `.nvmrc` 文件**

   ```
   # .nvmrc
   20.11.0
   ```

   团队成员可以直接运行：

   ```powershell
   nvm use  # 自动读取 .nvmrc 中的版本
   corepack enable
   ```

4. **提交 pnpm-lock.yaml**

   ```gitignore
   # .gitignore
   node_modules/
   # ❌ 不要忽略 lockfile
   # pnpm-lock.yaml
   ```

#### ❌ 避免的做法

- ❌ 不同成员使用不同版本的 pnpm
- ❌ 全局安装 pnpm（`npm i -g pnpm`）
- ❌ 忽略 `packageManager` 字段
- ❌ 不提交 lockfile 到版本控制

### 7.2 CI/CD 配置

#### GitHub Actions 示例

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

**关键点**:

- ✅ `corepack enable`: 启用 Corepack
- ✅ `--frozen-lockfile`: 确保使用精确的依赖版本
- ✅ 不需要手动安装 pnpm（Corepack 自动处理）

---

## 8. 命令速查表

### 8.1 Corepack 核心命令

| 命令                                          | 说明                       | 示例                                     |
| --------------------------------------------- | -------------------------- | ---------------------------------------- |
| `corepack enable`                             | 启用 Corepack              | `corepack enable`                        |
| `corepack disable`                            | 禁用 Corepack              | `corepack disable`                       |
| `corepack prepare <pkg>@<version>`            | 下载并缓存包管理器         | `corepack prepare pnpm@9.1.0`            |
| `corepack prepare <pkg>@<version> --activate` | 下载并设为默认版本         | `corepack prepare pnpm@9.1.0 --activate` |
| `corepack use <pkg>@<version>`                | 设置项目使用的包管理器版本 | `corepack use pnpm@latest`               |

### 8.2 pnpm 常用命令

| 命令                | 说明                                    |
| ------------------- | --------------------------------------- |
| `pnpm install`      | 安装依赖                                |
| `pnpm add <pkg>`    | 添加依赖                                |
| `pnpm remove <pkg>` | 删除依赖                                |
| `pnpm update`       | 更新依赖                                |
| `pnpm run <script>` | 运行脚本                                |
| `pnpm -r <command>` | 在所有 workspace 中运行命令（monorepo） |

### 8.3 NVM 常用命令

| 命令                          | 说明                      |
| ----------------------------- | ------------------------- |
| `nvm list`                    | 列出已安装的 Node.js 版本 |
| `nvm install <version>`       | 安装指定版本              |
| `nvm use <version>`           | 切换到指定版本            |
| `nvm alias default <version>` | 设置默认版本              |

---

## 9. 完整设置流程（新成员入职）

假设一个新团队成员加入项目，以下是完整的设置流程：

### Step 1: 安装 NVM

```powershell
# 下载安装 nvm-windows
# https://github.com/coreybutler/nvm-windows/releases
# 下载 nvm-setup.exe 并安装

# 验证安装
nvm version
```

### Step 2: 安装 Node.js

```powershell
# 安装最新 LTS 版本
nvm install lts

# 使用该版本
nvm use lts

# 设为默认版本
nvm alias default lts

# 验证
node -v  # 应输出 v20.11.0 或更高
```

### Step 3: 启用 Corepack

```powershell
# 启用 Corepack
corepack enable

# 验证
corepack -v
```

### Step 4: 克隆项目并安装依赖

```powershell
# 克隆项目
git clone https://github.com/YourOrg/DailyUse.git
cd DailyUse

# 检查 package.json 中的 packageManager 字段
# 应该看到 "packageManager": "pnpm@9.1.0"

# 安装依赖（Corepack 会自动下载正确版本的 pnpm）
pnpm install

# 验证 pnpm 版本
pnpm -v  # 应输出 9.1.0（与 package.json 中一致）
```

### Step 5: 运行项目

```powershell
# 启动开发服务器
pnpm dev

# 或运行其他脚本
pnpm build
pnpm test
```

---

## 10. 总结

### ✅ 使用 Corepack 的关键要点

1. **启用 Corepack**: `corepack enable`（切换 Node.js 版本后需重新启用）
2. **锁定版本**: 在 `package.json` 中添加 `"packageManager": "pnpm@9.1.0"`
3. **自动化**: Corepack 会根据 `packageManager` 字段自动使用正确版本
4. **团队协作**: 确保所有成员都启用了 Corepack 并使用相同的 Node.js 版本

### 📋 检查清单

在开始开发前，确保以下步骤都已完成：

- [ ] Node.js 版本 >= 16.9.0（推荐使用 LTS）
- [ ] 已执行 `corepack enable`
- [ ] `package.json` 中有 `packageManager` 字段
- [ ] 运行 `pnpm -v` 输出的版本与 `packageManager` 一致
- [ ] 能够成功运行 `pnpm install`

### 🚀 后续步骤

完成本指南后，你可以：

1. 继续使用 pnpm 进行日常开发
2. 参考项目的其他开发文档
3. 配置 IDE/编辑器以支持 pnpm（如 VSCode 的 Nx Console 插件）

---

## 附录

### A. 相关资源

- [Corepack 官方文档](https://nodejs.org/api/corepack.html)
- [pnpm 官方文档](https://pnpm.io/)
- [NVM for Windows](https://github.com/coreybutler/nvm-windows)
- [Node.js 下载](https://nodejs.org/)

### B. 版本兼容性表

| Node.js 版本  | Corepack 版本 | pnpm 推荐版本 |
| ------------- | ------------- | ------------- |
| 16.9.0 - 18.x | 内置          | 7.x - 8.x     |
| 18.x - 20.x   | 内置          | 8.x - 9.x     |
| 20.x+         | 内置          | 9.x+          |

### C. 故障排查命令

```powershell
# 检查环境
node -v
npm -v
corepack -v
pnpm -v

# 查看 Corepack 缓存
corepack cache list

# 清除 Corepack 缓存
corepack cache clean

# 查看 npm 配置
npm config list

# 查看 pnpm 配置
pnpm config list

# 查看项目的 packageManager 字段
Get-Content package.json | Select-String "packageManager"
```

---

**文档版本**: v1.0  
**最后更新**: 2025-10-18  
**维护者**: 开发团队
