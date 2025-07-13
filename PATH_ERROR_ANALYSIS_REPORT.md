# Path 模块错误分析报告 - 主进程代码误置前端目录

## 错误概述

**错误信息：**
```
Uncaught Error: Dynamic require of "path" is not supported
```

**错误类型：** 浏览器环境中动态引用 Node.js path 模块

**影响范围：** QuickLauncher 插件及相关功能

## 问题根因分析

### 1. 主要问题
Node.js 专用的 `path` 模块被意外地引入到了前端代码构建中，导致 Vite 在构建时尝试将其打包到浏览器代码中。浏览器环境不支持 Node.js 的 `path` 模块，因此导致运行时错误。

### 2. 问题源头
通过代码分析发现，问题出现在：

**文件：** `d:\myPrograms\DailyUse\src\plugins\quickLauncher\electron\main.ts`
**第4行：** `import path from 'path';`

这个文件是 Electron 主进程插件代码，但错误地放置在了 `src` 目录下，导致被 Vite 识别为前端代码并尝试打包。

### 3. 架构问题分析

当前存在的架构问题：

1. **目录结构混乱：** 主进程代码放在了 `src` 目录下
   - `src/plugins/quickLauncher/electron/main.ts` - 这是主进程代码
   - 但在 `src` 目录下，会被 Vite 当作前端代码处理

2. **模块引用冲突：** 主进程专用的 Node.js 模块被前端构建工具处理
   - `import path from 'path'` - Node.js 模块
   - `import { exec, ExecOptions } from 'child_process'` - Node.js 模块
   - `import { app, globalShortcut, ipcMain, BrowserWindow, dialog, shell } from 'electron'` - Electron 模块

### 4. Vite 构建配置问题

Vite 配置中虽然排除了一些原生模块，但 `path` 和 `child_process` 未被正确排除：

```typescript
// vite.config.ts
const nativeModules = [
  'better-sqlite3',
  'bcrypt',
  'electron'
  // 缺少 'path', 'child_process' 等
]
```

## 解决方案

### 方案一：重新组织项目结构（推荐）

1. **移动主进程插件代码到正确位置**
   ```
   移动文件：
   从: src/plugins/quickLauncher/electron/main.ts
   到: electron/plugins/quickLauncher/main.ts
   ```

2. **更新插件加载机制**
   ```typescript
   // electron/main.ts 中更新插件加载路径
   const pluginPath = path.join(__dirname, 'plugins/quickLauncher/main.js');
   ```

3. **修正 Vite 构建配置**
   ```typescript
   // vite.config.ts
   const pluginsDir = path.resolve(__dirname, 'src/plugins')
   // 只包含前端渲染进程的插件，排除主进程代码
   const plugins = fs.readdirSync(pluginsDir)
     .filter(file => fs.statSync(path.join(pluginsDir, file)).isDirectory())
     .filter(dir => fs.existsSync(path.join(pluginsDir, dir, 'index.html')))
     .filter(dir => !fs.existsSync(path.join(pluginsDir, dir, 'electron/main.ts'))) // 排除包含主进程代码的目录
   ```

### 方案二：更新 Vite 配置排除 Node.js 模块

1. **扩展原生模块排除列表**
   ```typescript
   // vite.config.ts
   const nativeModules = [
     'better-sqlite3',
     'bcrypt',
     'electron',
     'path',          // 添加 path 模块
     'child_process', // 添加 child_process 模块
     'fs',
     'os',
     'crypto'
   ]
   ```

2. **配置 Vite 忽略主进程插件文件**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         external: [
           ...nativeModules,
           /^node:/, // 排除所有 node: 协议的模块
         ]
       }
     }
   })
   ```

### 方案三：使用前端兼容的路径操作

1. **在前端使用 preload 暴露的 path API**
   ```typescript
   // 在前端代码中使用
   const joinedPath = window.shared.path.join(folder, filename);
   const baseName = window.shared.path.basename(filePath);
   ```

2. **扩展 preload 中的 path API**
   ```typescript
   // electron/preload.ts
   contextBridge.exposeInMainWorld('shared', {
     path: {
       join(...args: Parameters<typeof path.join>) {
         return path.join(...args);
       },
       basename(...args: Parameters<typeof path.basename>) {
         return path.basename(...args);
       },
       dirname(...args: Parameters<typeof path.dirname>) {
         return path.dirname(...args);
       },
       extname(...args: Parameters<typeof path.extname>) {
         return path.extname(...args);
       },
       resolve(...args: Parameters<typeof path.resolve>) {
         return path.resolve(...args);
       },
       // 添加更多需要的 path 方法
       isAbsolute(p: string) {
         return path.isAbsolute(p);
       }
     }
   });
   ```

## 文件修改清单

### 需要修改的文件

1. **`src/plugins/quickLauncher/electron/main.ts`**
   - 移动到 `electron/plugins/quickLauncher/main.ts`
   - 或从 `src` 目录中排除

2. **`vite.config.ts`**
   - 添加 path、child_process 到排除列表
   - 修正插件发现和构建逻辑

3. **`electron/main.ts`**
   - 更新插件加载路径（如果采用方案一）

### 新建文件

1. **`electron/plugins/` 目录结构**
   ```
   electron/
     plugins/
       quickLauncher/
         main.ts
         preload.ts (如果需要)
   ```

### 检查清单

- [ ] 确认主进程代码不在 `src` 目录下
- [ ] 验证 Vite 构建配置正确排除 Node.js 模块
- [ ] 测试 QuickLauncher 插件功能正常
- [ ] 确保前端代码不直接引用 Node.js 模块
- [ ] 验证插件加载机制工作正常

## 当前代码使用情况分析

### 前端中正确使用 path API 的例子
```typescript
// src/shared/components/Explorer.vue
const getFolderName = computed(() => {
  if (!folderData.value?.folderPath || !window?.shared?.path) {
    return '';
  }
  return window.shared.path.basename(folderData.value.folderPath); // ✅ 正确使用
})
```

### 主进程中正确使用 path 的例子
```typescript
// electron/shared/ipc/filesystem.ts
import path from 'path'; // ✅ 主进程中可以直接使用

export function registerFileSystemHandlers() {
  ipcMain.handle('read-folder', async (_, folderPath) => {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    return files.map(file => ({
      path: path.join(folderPath, file.name), // ✅ 正确使用
    }));
  });
}
```

### 问题代码
```typescript
// src/plugins/quickLauncher/electron/main.ts (❌ 错误位置)
import path from 'path'; // ❌ 前端构建中引用 Node.js 模块

export class QuickLauncherMainPlugin implements ElectronPlugin {
  // 这是主进程代码，不应该在 src 目录下
}
```

## 预防措施

1. **明确目录职责**
   - `src/` 目录：仅用于前端渲染进程代码
   - `electron/` 目录：用于主进程和 preload 代码
   - 插件的主进程代码应放在 `electron/plugins/` 下

2. **改进构建配置**
   - 完善 nativeModules 列表，包含所有 Node.js 模块
   - 添加构建时检查，确保前端代码不包含 Node.js 模块引用

3. **建立开发规范**
   - 前端代码只能通过 preload 暴露的 API 访问 Node.js 功能
   - 主进程代码严格放在 electron 目录下
   - 插件结构应该明确分离主进程和渲染进程代码

4. **添加 ESLint 规则**
   ```json
   // .eslintrc.js
   {
     "rules": {
       "no-restricted-imports": [
         "error",
         {
           "paths": [
             {
               "name": "path",
               "message": "Use window.shared.path in renderer process"
             },
             {
               "name": "fs",
               "message": "Use IPC calls for file system operations in renderer process"
             }
           ]
         }
       ]
     }
   }
   ```

## 总结

这个 path 模块错误是典型的 Electron 项目中目录结构混乱导致的问题。主进程代码被错误地放置在前端 `src` 目录下，导致 Vite 尝试将 Node.js 模块打包到浏览器代码中。

建议优先采用方案一，重新组织项目结构，将主进程插件代码移动到正确的位置。这样不仅能解决当前错误，还能让项目结构更加清晰和可维护。

同时，应该建立明确的开发规范和构建检查，防止类似问题再次发生。
