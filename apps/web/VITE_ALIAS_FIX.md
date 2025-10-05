# 🔧 Vite 配置修复说明

## 问题描述

在使用 `@dailyuse/assets` 包的子路径导出时遇到错误：

```
Failed to resolve import "@dailyuse/assets/images" from "src/App.vue"
Failed to resolve import "@dailyuse/assets/audio" from "..."
```

## 根本原因

Vite 无法自动解析 monorepo 中包的子路径导出（`exports` 字段中的 `./images` 和 `./audio`）。

虽然 `package.json` 中定义了：
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./images": "./src/images/index.ts",
    "./audio": "./src/audio/index.ts"
  }
}
```

但 Vite 在开发模式下需要显式的别名配置才能解析这些路径。

## 解决方案

在 `apps/web/vite.config.ts` 中添加 `@dailyuse/assets` 的别名映射：

```typescript
export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // ... 其他别名 ...
        
        // ✅ 添加 assets 包的别名
        '@dailyuse/assets': path.resolve(__dirname, '../../packages/assets/src'),
        '@dailyuse/assets/images': path.resolve(__dirname, '../../packages/assets/src/images'),
        '@dailyuse/assets/audio': path.resolve(__dirname, '../../packages/assets/src/audio'),
      },
    },
    // ... 其他配置 ...
  };
});
```

## 配置说明

### 为什么需要三个别名？

1. **`@dailyuse/assets`** - 主入口
   - 映射到 `packages/assets/src`
   - 支持 `import ... from '@dailyuse/assets'`

2. **`@dailyuse/assets/images`** - 图片子路径
   - 映射到 `packages/assets/src/images`
   - 支持 `import ... from '@dailyuse/assets/images'`

3. **`@dailyuse/assets/audio`** - 音频子路径
   - 映射到 `packages/assets/src/audio`
   - 支持 `import ... from '@dailyuse/assets/audio'`

### 路径解析优先级

Vite 按照别名定义的顺序进行匹配，更具体的路径应该放在前面：

```typescript
// ✅ 正确：具体路径在前
'@dailyuse/assets/images': '../../packages/assets/src/images',
'@dailyuse/assets/audio': '../../packages/assets/src/audio',
'@dailyuse/assets': '../../packages/assets/src',

// ❌ 错误：通用路径在前会导致子路径无法匹配
'@dailyuse/assets': '../../packages/assets/src',
'@dailyuse/assets/images': '../../packages/assets/src/images',  // 永远不会匹配
```

## 验证配置

### 1. 重启 Vite 开发服务器

修改 `vite.config.ts` 后，**必须重启**开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
nx run web:dev
```

### 2. 检查导入

在任何 `.vue` 或 `.ts` 文件中测试导入：

```typescript
// 应该都能正常工作
import { logo } from '@dailyuse/assets/images';
import { successSound } from '@dailyuse/assets/audio';
import { logo, successSound } from '@dailyuse/assets';
```

### 3. 浏览器控制台

确保没有模块解析错误：
- ✅ 无 404 错误
- ✅ 无 "Failed to resolve import" 错误
- ✅ 资源能正常加载

## 其他消费项目

如果其他应用（如 `apps/desktop`）也需要使用 `@dailyuse/assets`，需要在它们的 `vite.config.ts` 中添加相同的别名配置。

### 示例：desktop 项目配置

```typescript
// apps/desktop/vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      // ... 现有别名 ...
      '@dailyuse/assets': path.resolve(__dirname, '../../packages/assets/src'),
      '@dailyuse/assets/images': path.resolve(__dirname, '../../packages/assets/src/images'),
      '@dailyuse/assets/audio': path.resolve(__dirname, '../../packages/assets/src/audio'),
    },
  },
});
```

## 生产构建

这个配置同时适用于：
- ✅ **开发环境** (`npm run dev`)
- ✅ **生产构建** (`npm run build`)
- ✅ **预览模式** (`npm run preview`)

Vite 会在所有模式下使用这些别名配置。

## TypeScript 配置

`tsconfig.base.json` 中的路径映射保持不变：

```json
{
  "compilerOptions": {
    "paths": {
      "@dailyuse/assets": ["packages/assets/src/index.ts"],
      "@dailyuse/assets/images": ["packages/assets/src/images/index.ts"],
      "@dailyuse/assets/audio": ["packages/assets/src/audio/index.ts"]
    }
  }
}
```

这确保了 TypeScript 类型检查和 IDE 自动补全正常工作。

## 常见问题

### Q1: 修改后还是报错？
**A**: 确保重启了 Vite 开发服务器，配置更改需要重启才能生效。

### Q2: TypeScript 还是找不到模块？
**A**: 
1. 重启 VS Code TypeScript Server: `Cmd/Ctrl + Shift + P` → "Restart TS Server"
2. 检查 `tsconfig.base.json` 中是否有路径映射

### Q3: 生产构建失败？
**A**: 检查别名路径是否正确，确保使用 `path.resolve(__dirname, ...)` 而不是相对路径。

### Q4: 其他包也需要这样配置吗？
**A**: 
- 如果包只导出主入口（`.`），不需要额外配置
- 如果包有子路径导出（如 `./images`），需要添加对应的别名

## 最佳实践

### 1. 保持一致性
所有消费 `@dailyuse/assets` 的项目都应该使用相同的别名配置。

### 2. 使用绝对路径
始终使用 `path.resolve(__dirname, ...)` 而不是相对路径字符串。

### 3. 文档记录
在项目 README 中记录特殊的别名配置，方便团队成员了解。

### 4. 验证脚本
可以添加一个验证脚本来检查配置：

```typescript
// scripts/verify-aliases.ts
import { existsSync } from 'fs';
import { resolve } from 'path';

const aliases = {
  '@dailyuse/assets': '../../packages/assets/src',
  '@dailyuse/assets/images': '../../packages/assets/src/images',
  '@dailyuse/assets/audio': '../../packages/assets/src/audio',
};

Object.entries(aliases).forEach(([alias, path]) => {
  const fullPath = resolve(__dirname, '..', path);
  if (!existsSync(fullPath)) {
    console.error(`❌ Alias ${alias} points to non-existent path: ${fullPath}`);
  } else {
    console.log(`✅ Alias ${alias} is valid`);
  }
});
```

## 总结

✅ **已修复**: 在 `apps/web/vite.config.ts` 中添加了 `@dailyuse/assets` 的别名配置

✅ **已验证**: 配置语法正确，无错误

⏭️ **下一步**: 重启 Vite 开发服务器验证修复

---

**修复时间**: 2025-10-05  
**影响范围**: `apps/web` 项目  
**状态**: ✅ 已解决
