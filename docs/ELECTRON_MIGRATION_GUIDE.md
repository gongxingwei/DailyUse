# Electron 迁移到 apps/desktop 指南

## 当前结构分析

### 现有 Electron 项目结构
```
DailyUse/
├── electron/                    # 主进程代码
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # 主预加载脚本
│   ├── preload/                # 其他预加载脚本
│   ├── modules/                # 业务模块
│   ├── shared/                 # 共享功能
│   └── windows/                # 窗口管理
├── src/                        # 渲染进程代码 (Vue3)
│   ├── main.ts                 # Vue应用入口
│   ├── App.vue                 # 根组件
│   ├── modules/                # 业务模块
│   ├── shared/                 # 共享功能
│   ├── views/                  # 页面视图
│   └── plugins/                # 插件系统
├── electron-builder.json5      # Electron Builder 配置
├── vite.config.ts              # Vite 配置 (包含 Electron 插件)
└── index.html                  # HTML 入口
```

### 问题识别
1. **目录重复**: `src/` 和 `apps/web/src/` 存在冲突
2. **配置分散**: Electron 配置混合在根目录的 Vite 配置中
3. **构建复杂**: 需要重新组织构建流程
4. **依赖混乱**: 渲染进程和主进程依赖混合

## 推荐的迁移后结构

### 目标结构
```
DailyUse/
├── apps/
│   ├── web/                    # Web应用 (独立的Vue3应用)
│   ├── api/                    # API服务
│   └── desktop/                # 桌面应用
│       ├── src/
│       │   ├── main/           # 主进程代码
│       │   │   ├── main.ts     # 主进程入口
│       │   │   ├── modules/    # 主进程业务模块
│       │   │   ├── shared/     # 主进程共享功能
│       │   │   └── windows/    # 窗口管理
│       │   ├── preload/        # 预加载脚本
│       │   │   ├── main.ts     # 主预加载脚本
│       │   │   └── login.ts    # 登录预加载脚本
│       │   └── renderer/       # 渲染进程代码
│       │       ├── main.ts     # Vue应用入口
│       │       ├── App.vue     # 根组件
│       │       ├── modules/    # 渲染进程业务模块
│       │       ├── shared/     # 渲染进程共享功能
│       │       ├── views/      # 页面视图
│       │       └── plugins/    # 插件系统
│       ├── assets/             # 静态资源
│       ├── build/              # 构建资源
│       ├── electron-builder.json5  # Electron Builder 配置
│       ├── vite.config.ts      # Desktop 专用 Vite 配置
│       ├── package.json        # Desktop 应用 package.json
│       ├── project.json        # Nx 项目配置
│       ├── tsconfig.json       # TypeScript 配置
│       └── index.html          # HTML 入口
└── libs/                       # 共享库
    ├── desktop/                # 桌面端专用库
    │   ├── ipc/               # IPC 通信库
    │   ├── native/            # 原生功能库
    │   └── windows/           # 窗口管理库
    └── shared/                # 跨平台共享库
```

## 迁移步骤详解

### 第一阶段：目录结构创建

#### 1. 创建 apps/desktop 目录结构
```bash
apps/desktop/
├── src/
│   ├── main/                   # 主进程
│   ├── preload/               # 预加载脚本
│   └── renderer/              # 渲染进程
├── assets/                    # 静态资源
├── build/                     # 构建资源
└── 配置文件
```

#### 2. 创建专用库
```bash
libs/desktop/
├── ipc/                       # IPC 通信
├── native/                    # 原生功能
└── windows/                   # 窗口管理
```

### 第二阶段：代码迁移

#### 1. 主进程代码迁移
```bash
# 迁移路径
electron/ → apps/desktop/src/main/

# 文件映射
electron/main.ts → apps/desktop/src/main/main.ts
electron/modules/ → apps/desktop/src/main/modules/
electron/shared/ → apps/desktop/src/main/shared/
electron/windows/ → apps/desktop/src/main/windows/
```

#### 2. 预加载脚本迁移
```bash
# 迁移路径
electron/preload.ts → apps/desktop/src/preload/main.ts
electron/preload/ → apps/desktop/src/preload/
```

#### 3. 渲染进程代码迁移
```bash
# 迁移路径（区分冲突的 src/）
src/ → apps/desktop/src/renderer/

# 文件映射
src/main.ts → apps/desktop/src/renderer/main.ts
src/App.vue → apps/desktop/src/renderer/App.vue
src/modules/ → apps/desktop/src/renderer/modules/
src/shared/ → apps/desktop/src/renderer/shared/
src/views/ → apps/desktop/src/renderer/views/
src/plugins/ → apps/desktop/src/renderer/plugins/
```

#### 4. 配置文件迁移
```bash
# 配置文件迁移
electron-builder.json5 → apps/desktop/electron-builder.json5
index.html → apps/desktop/index.html

# 提取 Electron 相关的 Vite 配置
vite.config.ts (electron部分) → apps/desktop/vite.config.ts
```

### 第三阶段：配置更新

#### 1. 创建 apps/desktop/package.json
```json
{
  "name": "@dailyuse/desktop",
  "version": "0.1.10",
  "type": "module",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build && electron-builder",
    "build:dev": "vite build",
    "start": "electron dist/main/main.js",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "dependencies": {
    "@dailyuse/contracts": "workspace:*",
    "@dailyuse/domain-client": "workspace:*",
    "@dailyuse/shared/ui": "workspace:*",
    "@dailyuse/shared/utils": "workspace:*",
    "@dailyuse/desktop/ipc": "workspace:*",
    "@dailyuse/desktop/native": "workspace:*",
    "@dailyuse/desktop/windows": "workspace:*",
    "electron": "^32.0.0",
    "better-sqlite3": "^11.10.0",
    "electron-log": "^5.4.2"
  },
  "devDependencies": {
    "electron-builder": "^25.0.0",
    "vite-plugin-electron": "^0.28.0"
  }
}
```

#### 2. 创建 apps/desktop/project.json (Nx 配置)
```json
{
  "name": "desktop",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/desktop/src",
  "tags": ["scope:desktop", "type:app", "platform:electron"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vite build",
        "cwd": "apps/desktop"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vite",
        "cwd": "apps/desktop"
      }
    },
    "package": {
      "executor": "nx:run-commands",
      "options": {
        "command": "electron-builder --dir",
        "cwd": "apps/desktop"
      }
    },
    "dist": {
      "executor": "nx:run-commands",
      "options": {
        "command": "electron-builder",
        "cwd": "apps/desktop"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/desktop/**/*.{ts,tsx,js,jsx,vue}"]
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../coverage/apps/desktop"
      }
    }
  }
}
```

#### 3. 创建 apps/desktop/vite.config.ts
```typescript
import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'

// 自动发现插件目录
const pluginsDir = path.resolve(__dirname, 'src/renderer/plugins')
const plugins = fs.existsSync(pluginsDir) 
  ? fs.readdirSync(pluginsDir)
      .filter((file) => fs.statSync(path.join(pluginsDir, file)).isDirectory())
      .filter((dir) => fs.existsSync(path.join(pluginsDir, dir, 'index.html')))
  : []

// 构建入口配置
const buildInputs = {
  main: path.resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    plugins.map((plugin) => [
      plugin, 
      path.resolve(__dirname, `src/renderer/plugins/${plugin}/index.html`)
    ])
  ),
}

// 收集所有预加载脚本
const preloadInputs = {
  main: path.join(__dirname, 'src/preload/main.ts'),
  login: path.join(__dirname, 'src/preload/login.ts'),
  ...Object.fromEntries(
    plugins
      .filter((plugin) => 
        fs.existsSync(path.join(pluginsDir, plugin, 'preload.ts'))
      )
      .map((plugin) => [
        `${plugin}_preload`, 
        path.join(pluginsDir, plugin, 'preload.ts')
      ])
  ),
}

// 原生模块列表
const nativeModules = ['better-sqlite3', 'bcrypt', 'electron']

// 本地工作区包
const workspacePkgs = [
  '@dailyuse/contracts',
  '@dailyuse/domain-client',
  '@dailyuse/shared/ui',
  '@dailyuse/shared/utils',
  '@dailyuse/desktop/ipc',
  '@dailyuse/desktop/native',
  '@dailyuse/desktop/windows',
]

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@preload': path.resolve(__dirname, 'src/preload'),
      '@assets': path.resolve(__dirname, 'assets'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: buildInputs,
      external: nativeModules,
    },
  },
  optimizeDeps: {
    exclude: [...nativeModules, ...workspacePkgs],
  },
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          resolve: {
            alias: {
              '@main': path.resolve(__dirname, 'src/main'),
              '@preload': path.resolve(__dirname, 'src/preload'),
            },
          },
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: nativeModules,
              output: {
                format: 'es',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },
      preload: {
        input: preloadInputs,
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: nativeModules,
              output: {
                entryFileNames: '[name].mjs',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },
      renderer: {},
    }),
  ],
})
```

#### 4. 更新 apps/desktop/electron-builder.json5
```json5
{
  "$schema": "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  "appId": "com.dailyuse.desktop",
  "asar": true,
  "productName": "DailyUse",
  "directories": {
    "output": "../../dist/desktop",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "package.json"
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "artifactName": "${productName}-Mac-${version}-Installer.${ext}",
    "category": "public.app-category.productivity"
  },
  "win": {
    "icon": "../../public/DailyUse-256.png",
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "zip",
        "arch": ["x64"]
      }
    ],
    "artifactName": "${productName}-Windows-${version}-Setup.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "DailyUse",
    "uninstallDisplayName": "DailyUse",
    "deleteAppDataOnUninstall": false,
    "displayLanguageSelector": true,
    "installerLanguages": ["zh_CN", "en_US"]
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "artifactName": "${productName}-Linux-${version}.${ext}",
    "category": "Utility"
  },
  "publish": {
    "provider": "github",
    "releaseType": "release"
  }
}
```

### 第四阶段：导入路径更新

#### 更新导入路径规则
```typescript
// 主进程中的导入路径更新
// 旧路径
import { someModule } from '../shared/someModule'
import { windowManager } from './windows/windowManager'

// 新路径
import { someModule } from '@main/shared/someModule'
import { windowManager } from '@main/windows/windowManager'
import { ipcService } from '@dailyuse/desktop/ipc'

// 渲染进程中的导入路径更新
// 旧路径
import { authStore } from '@/stores/authStore'
import { ApiClient } from '@/shared/api/client'

// 新路径
import { authStore } from '@/stores/authStore'
import { ApiClient } from '@/shared/api/client'
import { uiComponents } from '@dailyuse/shared/ui'
```

### 第五阶段：根目录清理

#### 1. 更新根目录的 vite.config.ts
移除 Electron 相关配置，只保留纯 Web 构建配置。

#### 2. 更新根目录的 package.json
```json
{
  "scripts": {
    "dev:desktop": "nx serve desktop",
    "build:desktop": "nx build desktop",
    "package:desktop": "nx package desktop",
    "dist:desktop": "nx dist desktop"
  }
}
```

#### 3. 清理冲突的 src/ 目录
```bash
# 确保 src/ 内容已迁移到 apps/desktop/src/renderer/
# 然后删除根目录的 src/
rm -rf src/
rm index.html
```

## 迁移验证

### 验证步骤
1. **目录结构验证**: 确认所有文件已正确迁移
2. **配置验证**: 确认所有配置文件路径正确
3. **依赖验证**: 确认所有依赖正确解析
4. **构建验证**: 确认桌面应用可以正常构建
5. **功能验证**: 确认所有功能正常工作

### 测试命令
```bash
# 开发模式启动
nx serve desktop

# 构建测试
nx build desktop

# 打包测试
nx package desktop

# 完整构建
nx dist desktop
```

## 注意事项

1. **依赖分离**: 确保主进程和渲染进程的依赖正确分离
2. **路径映射**: 更新所有导入路径和别名配置
3. **资源路径**: 确认静态资源路径正确
4. **IPC 通信**: 确认 IPC 通信路径正确
5. **构建输出**: 确认构建输出路径符合预期

## 优势总结

迁移后的优势：
- ✅ **清晰的项目结构**: 桌面应用独立管理
- ✅ **减少配置冲突**: 每个应用有独立的配置
- ✅ **更好的依赖管理**: 明确的依赖边界
- ✅ **支持 Nx 优化**: 利用 Nx 的缓存和增量构建
- ✅ **便于维护**: 桌面应用和 Web 应用完全解耦
