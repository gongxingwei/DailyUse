# 📦 资源库迁移指南

## ✅ 已完成

### 1. 创建 `@dailyuse/assets` 资源库

```bash
packages/assets/
├── src/
│   ├── images/
│   │   ├── logos/           # ✅ 已迁移所有 Logo
│   │   ├── icons/           # ⏳ 待添加
│   │   └── avatars/         # ✅ 已迁移 profile1.png
│   ├── audio/
│   │   ├── notifications/   # ⏳ 待添加
│   │   └── effects/         # ⏳ 待添加
│   ├── index.ts            # ✅ 主导出文件
│   ├── images/index.ts     # ✅ 图片导出
│   └── audio/index.ts      # ✅ 音频导出
├── package.json            # ✅ 零打包配置
├── project.json            # ✅ Nx 项目配置
├── tsconfig.json           # ✅ TypeScript 配置
├── README.md               # ✅ 使用文档
└── USAGE_EXAMPLES.ts       # ✅ 使用示例
```

### 2. 已迁移的资源

- ✅ `DailyUse.svg`
- ✅ `DailyUse.ico`
- ✅ `DailyUse-16.png`
- ✅ `DailyUse-24.png`
- ✅ `DailyUse-32.png`
- ✅ `DailyUse-48.png`
- ✅ `DailyUse-128.png`
- ✅ `DailyUse-256.png`
- ✅ `profile1.png`

---

## 🚀 如何在项目中使用

### 在 `apps/web` 中使用

#### 之前（从 public 目录引用）

```vue
<template>
  <!-- ❌ 旧方式：硬编码路径 -->
  <img src="/DailyUse-128.png" alt="Logo" />
</template>
```

#### 现在（从资源库导入）

```vue
<template>
  <!-- ✅ 新方式：类型安全的导入 -->
  <img :src="logo128" alt="Logo" />
</template>

<script setup lang="ts">
import { logo128 } from '@dailyuse/assets/images';
</script>
```

### 在 `apps/desktop` (Electron) 中使用

```typescript
// src/main/main.ts
import { logoIco, logo256 } from '@dailyuse/assets/images';
import { BrowserWindow } from 'electron';

const win = new BrowserWindow({
  icon: process.platform === 'win32' ? logoIco : logo256,
  // ...
});
```

### 在 `apps/api` 中使用

```typescript
// 例如：生成带 Logo 的 PDF
import { logo } from '@dailyuse/assets/images';

function generateReport() {
  return {
    logo: logo,
    // ...
  };
}
```

---

## 📝 下一步操作

### 1. 更新现有代码中的资源引用

搜索项目中的硬编码路径并替换：

```bash
# 搜索需要更新的文件
git grep -l "DailyUse-128.png"
git grep -l "/DailyUse.svg"
git grep -l "profile1.png"
```

### 2. 添加更多资源

#### 添加图标

```bash
# 将图标放入
packages/assets/src/images/icons/
```

然后在 `src/images/index.ts` 中导出：

```typescript
export const addIcon = new URL('./icons/add.svg', import.meta.url).href;
export const deleteIcon = new URL('./icons/delete.svg', import.meta.url).href;
```

#### 添加音频

```bash
# 将音频放入
packages/assets/src/audio/notifications/
packages/assets/src/audio/effects/
```

然后在 `src/audio/index.ts` 中取消注释并导出。

### 3. 配置 Vite（如果需要）

如果遇到资源加载问题，在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  // ...
});
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **集中管理**：所有新资源都放入 `@dailyuse/assets`
2. **语义化命名**：使用描述性的导出名称
3. **分类组织**：按类型（logos/icons/avatars）分目录
4. **类型安全**：利用 TypeScript 导出获得自动补全

### ❌ 避免做法

1. ❌ 不要在各个应用中重复放置相同资源
2. ❌ 不要使用硬编码的路径字符串
3. ❌ 不要在 `assets` 库中进行构建（零打包即可）

---

## 🔧 技术细节

### 为什么选择零打包？

1. **Vite 自动处理**：
   - 开发环境：直接引用源文件
   - 生产环境：自动优化、压缩、生成 hash

2. **性能优势**：
   - 无需构建步骤
   - Tree-shaking 友好
   - 减少 CI/CD 时间

3. **开发体验**：
   - 热更新支持
   - 类型安全
   - IDE 自动补全

### 资源路径解析

使用 `new URL(..., import.meta.url).href` 的原因：

```typescript
// ✅ 正确：Vite 会正确解析
export const logo = new URL('./logos/DailyUse.svg', import.meta.url).href;

// ❌ 错误：在 ESM 中不可靠
export const logo = './logos/DailyUse.svg';
```

---

## 📊 对比：迁移前后

| 方面         | 迁移前           | 迁移后                    |
| ------------ | ---------------- | ------------------------- |
| **资源位置** | 分散在各个项目   | 统一在 `@dailyuse/assets` |
| **引用方式** | 硬编码路径字符串 | TypeScript 导入           |
| **类型安全** | ❌ 无            | ✅ 有                     |
| **重复资源** | ⚠️ 可能存在      | ✅ 完全消除               |
| **维护成本** | 高               | 低                        |
| **IDE 支持** | 无自动补全       | 完整自动补全              |

---

## 🎯 验证清单

- [x] 创建 `@dailyuse/assets` 包
- [x] 迁移现有资源文件
- [x] 配置 TypeScript 路径映射
- [x] 创建类型声明文件
- [x] 编写使用文档
- [ ] 更新 `apps/web` 中的引用
- [ ] 更新 `apps/desktop` 中的引用
- [ ] 添加更多图标资源
- [ ] 添加音频资源

---

## 📚 参考资料

- [Vite 静态资源处理](https://vitejs.dev/guide/assets.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Nx Library Guide](https://nx.dev/concepts/more-concepts/creating-libraries)

---

**Created**: {{ date }}  
**Author**: BakerSean168  
**Status**: ✅ Ready to Use
