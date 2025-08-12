# 🛠️ DDD项目模块导入问题解决方案文档

## 🚨 问题描述

在DDD架构的多包项目中，经常遇到以下问题：

1. `Cannot find module '@dailyuse/domain-client' or its corresponding type declarations.ts(2307)`
2. node_modules中的包既有dist又有src文件夹
3. 类型定义不匹配导致的编译错误

## 🔍 问题分析

### 1. 模块解析问题的根本原因

#### Package.json配置不匹配

```json
// ❌ 错误配置
{
  "main": "dist/index.js",        // 指向.js但实际是.mjs
  "types": "dist/index.d.ts"      // 指向.d.ts但实际是.d.mts
}

// ✅ 正确配置
{
  "type": "module",
  "main": "dist/index.mjs",
  "types": "dist/index.d.mts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.mts"
    }
  }
}
```

#### TypeScript配置问题

```json
// apps/web/tsconfig.json 缺少路径映射
{
  "compilerOptions": {
    "paths": {
      "@dailyuse/domain-client": ["../../packages/domain-client/src"],
      "@dailyuse/domain-client/*": ["../../packages/domain-client/src/*"]
    }
  }
}
```

### 2. Node_modules中包含源码的原因

在workspace（monorepo）项目中，使用`workspace:`协议安装的本地包会：

- 创建符号链接指向源码目录
- 包含完整的源码、配置文件和构建结果
- 这是**正常行为**，不是问题

```json
// package.json 中的依赖
"dependencies": {
  "@dailyuse/domain-client": "workspace:*"  // 符号链接到本地包
}
```

与外部NPM包的区别：

```
外部NPM包: node_modules/lodash/        (只有构建结果)
├── package.json
├── index.js
└── lib/

本地workspace包: node_modules/@dailyuse/domain-client/  (完整源码)
├── package.json
├── src/          (源码)
├── dist/         (构建结果)
├── tsconfig.json (配置文件)
└── node_modules/ (依赖)
```

### 3. 类型不匹配问题

由于重构后直接使用domain-client中的类，但应用层期望的是之前的接口：

```typescript
// 期望的接口 (旧的User模型)
interface User {
  id: string;
  username: string;
  email: string;
  canEditProfile(): boolean;
  userAggregate: UserAggregate;
}

// 实际的类 (domain-client中的User)
class User extends UserCore {
  uuid: string; // 不是id
  firstName: string;
  displayName: string;
  // 缺少 canEditProfile 方法
  // 缺少 userAggregate 属性
}
```

## 🔧 解决方案

### 方案1: 修复Package配置 (推荐)

#### 步骤1: 修复domain-client的package.json

```json
{
  "name": "@dailyuse/domain-client",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.mjs",
  "types": "dist/index.d.mts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.mts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm --target es2020"
  }
}
```

#### 步骤2: 添加TypeScript路径映射

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@dailyuse/domain-client": ["../../packages/domain-client/src/index.ts"],
      "@dailyuse/domain-client/*": ["../../packages/domain-client/src/*"]
    }
  }
}
```

#### 步骤3: 重新构建和安装

```bash
# 清理和重新构建
pnpm --filter @dailyuse/domain-client build
pnpm install

# 或者强制重新安装
rm -rf node_modules package-lock.json
pnpm install
```

### 方案2: 使用相对路径导入 (临时方案)

```typescript
// 替代包导入
import type { IUserRepository } from '@dailyuse/domain-client';

// 使用相对路径
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
```

### 方案3: 创建类型适配层 (推荐用于类型不匹配)

创建适配器将domain-client的User转换为应用层期望的格式：

```typescript
// apps/web/src/modules/account/application/adapters/UserAdapter.ts
import { User as DomainUser } from '@dailyuse/domain-client';

export class UserAdapter {
  static toDomainModel(domainUser: DomainUser): ApplicationUser {
    return {
      id: domainUser.uuid,
      username: domainUser.displayName || `${domainUser.firstName}_${domainUser.lastName}`,
      email: '', // 需要从其他地方获取
      displayName: domainUser.displayName,
      avatar: domainUser.avatar,
      status: 'active', // 默认状态

      // 方法适配
      canEditProfile: () => true, // 简单实现
      canDeactivate: () => true,
      get isProfileComplete() {
        return !!(domainUser.firstName && domainUser.lastName);
      },
      get avatarInitials() {
        return `${domainUser.firstName.charAt(0)}${domainUser.lastName.charAt(0)}`.toUpperCase();
      },
      get fullName() {
        return `${domainUser.firstName} ${domainUser.lastName}`;
      },
    };
  }
}
```

## 🎯 最佳实践和预防措施

### 1. Package.json配置检查清单

```json
{
  "name": "@scope/package-name",
  "version": "x.x.x",
  "type": "module", // ✅ 明确模块类型
  "main": "dist/index.mjs", // ✅ 匹配构建输出
  "types": "dist/index.d.mts", // ✅ 匹配类型文件
  "exports": {
    // ✅ 现代模块导出
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.mts"
    }
  }
}
```

### 2. TypeScript配置最佳实践

```json
// tsconfig.base.json (根配置)
{
  "compilerOptions": {
    "moduleResolution": "Bundler", // ✅ 现代模块解析
    "allowImportingTsExtensions": true, // ✅ 允许.ts导入
    "paths": {
      // ✅ 统一路径映射
      "@dailyuse/*": ["./packages/*/src"]
    }
  }
}
```

### 3. 构建脚本最佳实践

```json
// package.json scripts
{
  "scripts": {
    "clean": "rimraf dist",
    "build": "npm run clean && tsup src/index.ts --dts --format esm",
    "build:watch": "npm run build -- --watch",
    "type-check": "tsc --noEmit"
  }
}
```

### 4. 开发工作流程

```bash
# 1. 开发阶段
pnpm run dev          # 启动watch模式构建

# 2. 模块更改后
pnpm run build:domain # 构建domain包
pnpm install          # 刷新符号链接

# 3. 问题排查
pnpm run type-check   # 检查类型错误
```

## 🔍 问题诊断工具

### 快速诊断脚本

```bash
# 检查包是否正确安装
ls -la node_modules/@dailyuse/domain-client

# 检查包的exports
cat node_modules/@dailyuse/domain-client/package.json | grep -A 10 "exports"

# 检查类型文件是否存在
ls -la node_modules/@dailyuse/domain-client/dist/

# 验证TypeScript配置
npx tsc --showConfig | grep paths -A 5
```

### 常见错误和解决方法

| 错误信息                              | 可能原因                   | 解决方法                 |
| ------------------------------------- | -------------------------- | ------------------------ |
| `Cannot find module '@dailyuse/xxx'`  | 包未正确构建或路径映射错误 | 重新构建包，检查tsconfig |
| `Module has no exported member 'Xxx'` | 导出不匹配或构建过时       | 检查导出语句，重新构建   |
| `Cannot redeclare exported variable`  | 重复导出或命名冲突         | 检查import/export语句    |
| `.d.ts vs .d.mts` 不匹配              | package.json类型路径错误   | 修复types字段路径        |

## 📚 扩展阅读

1. [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
2. [Node.js Package.json Exports](https://nodejs.org/api/packages.html#exports)
3. [PNPM Workspace](https://pnpm.io/workspaces)
4. [TSUP Build Tool](https://tsup.egoist.dev/)

## 🎉 总结

通过以上解决方案，你应该能够：

1. ✅ **理解monorepo中包含源码的正常性**
2. ✅ **正确配置package.json以避免模块解析问题**
3. ✅ **使用TypeScript路径映射简化导入**
4. ✅ **创建适配器层处理类型不匹配**
5. ✅ **建立可靠的构建和诊断流程**

保存这份文档作为参考，遇到类似问题时可以快速定位和解决。
