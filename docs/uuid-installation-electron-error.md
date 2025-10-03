# uuid 安装时报 electron 的错误

## 问题详情

在使用 pnpm monorepo 项目中，尝试为 api 项目安装 uuid 包时，遇到了看似与 uuid 无关的 electron-builder 依赖错误：

```bash
pnpm add uuid @types/uuid --filter=api

ERROR  Command failed with exit code 128: git -c core.longpaths=true fetch --depth 1 origin 06b29aafb7708acef8b3669835c8a7857ebc92d2
ssh: connect to host github.com port 22: Connection refused
fatal: Could not read from remote repository.

This error happened while installing the dependencies of electron-builder@26.0.12
 at app-builder-lib@26.0.12
 at @electron/rebuild@3.7.0
```

### 为什么 uuid 库会和 electron 扯上关系？

**关键原因：pnpm monorepo 的依赖解析机制**

1. **pnpm 的全局依赖解析**
   - 在 pnpm workspace 中，执行任何包的安装时，pnpm 都会重新解析**整个工作空间**的依赖树
   - 即使你只是为 `api` 项目安装 `uuid`，pnpm 也会检查并确保所有项目（包括 desktop）的依赖都能正确安装

2. **依赖链条追踪**
   ```
   workspace root
   ├── apps/api (你想安装 uuid 的地方)
   └── apps/desktop
       └── electron-builder@26.0.12 (devDependencies)
           └── app-builder-lib@26.0.12
               └── @electron/rebuild@3.7.0
                   └── @electron/node-gyp (git 依赖，使用 SSH)
   ```

3. **问题的真实原因**
   - uuid 本身完全没有问题，也不依赖 electron
   - 问题出在 desktop 项目的 `electron-builder@26.0.12` 
   - 它的嵌套依赖 `@electron/rebuild@3.7.0` 中有一个使用 **git SSH 协议**的依赖
   - 当 pnpm 尝试安装这个依赖时，因为无法通过 SSH（端口 22）连接 GitHub 而失败
   - 这个失败会阻止整个工作空间的依赖安装，包括你想安装的 uuid

4. **为什么看起来是 "uuid 被污染"**
   - 安装 uuid 时触发了完整的依赖树解析
   - electron-builder 的依赖安装失败
   - 错误信息显示的是 electron-builder 相关错误
   - 给人感觉是 uuid "污染"了 electron，但实际上是 electron 的问题阻止了 uuid 的安装

### 错误分析

- **直接原因**：`@electron/rebuild@3.7.0` 依赖的 `@electron/node-gyp` 使用 git SSH 协议
- **网络原因**：SSH 端口 22 被封锁或防火墙阻止
- **根本原因**：electron-builder 使用了包含 git 依赖的旧版本 `@electron/rebuild`

## 解决方案

### 方案一：使用 pnpm overrides（推荐）

在根目录的 `package.json` 中添加 pnpm overrides，强制使用新版本的 `@electron/rebuild`：

```json
{
  "pnpm": {
    "overrides": {
      "@electron/rebuild": "^4.0.1"
    }
  }
}
```

**原理**：
- `@electron/rebuild@4.0.1` 不再使用 git SSH 依赖
- pnpm overrides 会强制整个依赖树使用指定版本
- 覆盖 electron-builder 默认依赖的 3.7.0 版本

### 方案二：配置 Git URL 重写

虽然在这个案例中单独使用不够，但可以作为辅助配置：

```bash
# 将 git:// 协议重写为 https://
git config --global url."https://github.com/".insteadOf git://github.com/
git config --global url."https://".insteadOf git://
```

### 方案三：优化 .npmrc 配置

在项目根目录的 `.npmrc` 中添加：

```properties
# Git 配置 - 强制使用 HTTPS
git-shallow-hosts=github.com
git-depth=1
```

### 完整解决流程

```bash
# 1. 添加 pnpm overrides 到 package.json
# 见方案一

# 2. 配置 Git URL 重写
git config --global url."https://github.com/".insteadOf git://github.com/

# 3. 清理 pnpm 缓存（可选）
pnpm store prune

# 4. 重新安装依赖
pnpm install

# 5. 安装 uuid
pnpm add uuid @types/uuid --filter=api
```

## 实战经验

### 1. Monorepo 依赖隔离的误区

**错误认知**：
```bash
pnpm add uuid --filter=api  # 认为只会影响 api 项目
```

**实际情况**：
- pnpm 会解析整个 workspace 的依赖树
- 任何项目的依赖问题都会影响全局安装
- `--filter` 只是指定安装到哪个项目，不是隔离依赖解析

### 2. 依赖树调试技巧

```bash
# 查看某个包的依赖关系
pnpm why @electron/rebuild

# 查看完整依赖树
pnpm list --depth=10

# 查看特定项目的依赖
pnpm list --filter=desktop --depth=5
```

### 3. Git 依赖的常见问题

**问题特征**：
- 错误信息包含 `git fetch`、`ssh: connect to host`
- 错误发生在安装阶段，不是编译阶段
- 通常与 native 模块相关（如 node-gyp、electron-rebuild）

**排查方向**：
1. 检查是否有 git:// 或 git+ssh:// 协议的依赖
2. 确认网络环境是否允许 SSH 连接（端口 22）
3. 查看 package-lock.json 或 pnpm-lock.yaml 中的 resolved 字段

### 4. pnpm overrides vs npm overrides

**pnpm (package.json)**：
```json
{
  "pnpm": {
    "overrides": {
      "@electron/rebuild": "^4.0.1"
    }
  }
}
```

**npm/yarn (package.json)**：
```json
{
  "overrides": {
    "@electron/rebuild": "^4.0.1"
  }
}
```

**注意**：pnpm 需要在 `pnpm` 字段下，npm/yarn 直接在根级 `overrides`

### 5. 网络环境适配

**企业内网环境**：
```properties
# .npmrc
registry=https://registry.npmmirror.com/
git-shallow-hosts=github.com,gitlab.com
strict-ssl=false  # 仅在必要时使用
```

**GitHub 访问受限**：
```bash
# 使用镜像
git config --global url."https://mirror.ghproxy.com/https://github.com/".insteadOf https://github.com/
```

## 经验总结

### 核心要点

1. **依赖隔离是假象**
   - Monorepo 中的依赖是全局解析的
   - 一个项目的依赖问题会影响整个工作空间
   - 安装任何包都可能触发全量依赖检查

2. **错误信息的迷惑性**
   - 表面错误：uuid 安装失败
   - 实际错误：electron-builder 的嵌套依赖问题
   - 需要追踪完整的依赖链条才能找到根本原因

3. **版本管理的重要性**
   - 旧版本的包可能使用过时的依赖方式（如 git SSH）
   - 使用 overrides 统一管理有问题的依赖版本
   - 定期更新依赖，避免累积技术债

4. **网络环境的影响**
   - SSH (端口 22) vs HTTPS (端口 443)
   - 企业防火墙通常封锁 SSH
   - 配置 Git URL 重写是通用解决方案

### 预防措施

1. **项目初始化时的配置**
   ```properties
   # .npmrc
   auto-install-peers=true
   git-shallow-hosts=github.com
   strict-peer-dependencies=false
   ```

2. **依赖审计**
   ```bash
   # 检查是否有 git 依赖
   grep -r "git+" pnpm-lock.yaml
   grep -r "git://" pnpm-lock.yaml
   ```

3. **使用稳定版本**
   - 优先使用 LTS 版本的工具链
   - electron-builder 建议使用最新稳定版
   - 关注依赖的 deprecation 警告

4. **文档化特殊配置**
   - 记录 pnpm overrides 的原因
   - 说明网络环境的特殊要求
   - 为团队新成员提供环境配置指南

### 适用场景

这个解决方案适用于以下场景：

- ✅ pnpm monorepo 项目
- ✅ 包含 Electron 应用的项目
- ✅ 企业内网或网络受限环境
- ✅ SSH 端口被封锁的网络环境
- ✅ 需要安装任何 npm 包时遇到 electron 相关错误

## 信息参考

### 相关技术文档

1. **pnpm 官方文档**
   - [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)
   - [Workspace 依赖管理](https://pnpm.io/workspaces)
   - [.npmrc 配置](https://pnpm.io/npmrc)

2. **Electron Builder**
   - [electron-builder 文档](https://www.electron.build/)
   - [Multi Platform Build](https://www.electron.build/multi-platform-build)

3. **Git 配置**
   - [Git URL Rewriting](https://git-scm.com/docs/git-config#Documentation/git-config.txt-urlltbasegtinsteadOf)
   - [Git 配置最佳实践](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)

### 相关 Issue

- [electron-builder #7882](https://github.com/electron-userland/electron-builder/issues/7882) - Git SSH 依赖问题
- [@electron/rebuild #1089](https://github.com/electron/rebuild/issues/1089) - 4.0 版本移除 git 依赖
- [pnpm #5131](https://github.com/pnpm/pnpm/discussions/5131) - Monorepo 依赖解析机制

### 版本信息

本文档基于以下环境测试：

- **pnpm**: 10.13.0
- **electron-builder**: 26.0.12 → 使用 @electron/rebuild@3.7.0（有问题）
- **@electron/rebuild**: 4.0.1（推荐版本）
- **Node.js**: 建议 18+ 或 20+ LTS
- **操作系统**: Windows / macOS / Linux 通用

### 延伸阅读

- [Understanding npm dependency resolution](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies)
- [Monorepo 最佳实践](https://monorepo.tools/)
- [pnpm vs npm vs yarn 性能对比](https://pnpm.io/benchmarks)
- [Electron 应用打包最佳实践](https://www.electronjs.org/docs/latest/tutorial/application-distribution)

---

**最后更新**: 2025-10-03  
**作者**: GitHub Copilot  
**适用版本**: pnpm 10.x, electron-builder 26.x
