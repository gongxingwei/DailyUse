# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

# 概述

挡住进步的不一定是懒惰或躺平，也可能是频繁的遗忘和被碎片化娱乐占据时间。  

## 功能

- 仓库
  用于存储文档、资源等的容器  
  可以创建 文档仓库、图片仓库
- 文档编辑器  
  对仓库中的文档进行编辑  
- goal  
  点击添加 goal  
- todo  
  把部分完成的 todo 保存起来，作为战绩  
  多种类型  
    task：time
    day：tasks
- 健康提醒
- quicklaunch  
- b站等的订阅消息转发  
- 收藏页面  
- RSS  
- 动作脚本  

- 主题切换

## 结构




# 具体实现

把 todo 、 文档编辑 作为组件，任由用户组合为 待办列表 或 goal 页面

用户可以单独编辑组件，在页面中组合

物理分割、逻辑组合

由事件驱动，把所有的 todo reminder 类型统一

## 弹窗服务notification  

```
electron
  modules
    notification
      ipc.ts
      notification.ts
        弹窗功能实现
src
  shared
    utils
      notification
        notification.ts
          前端弹窗功能接口
```

弹窗属性
```ts
id: string
title: string
body: string
icon?: string
urgency?: 'normal' | 'critical' | 'low'
actions?: Array<{ text: string, type: 'confirm' | 'cancel' | 'action' }>
```

## 定时服务taskSchedule  

那年 那天 那一刻  接收一个具体时间，只触发一次  
每年 每天 那一刻  接收一个时间，每天/月/年，都触发  
  可以交给 vue 去处理成前者，electron 只处理 前者

```
electron
  modules
    taskSchedule
      ipc.ts
      main.ts
        定时功能实现  
        使用 nodeSchedule 来实现定时  
        定义了增删改查任务的函数
        任务定义  
        options: {
          id: string;
          cron: string;
          task: {
          type: string;
          payload: any;
          };
         lastRun: string;
       }
src
  shared
    utils
      schedule
        main.ts
          前端定时功能接口
          定义了相应的增删改查的前端接口和 schedule 类型

```

## Reminder

```
components
Reminder.vue
```

## goal

```
components
  GoalCard.vue
    只负责显示 goal，将事件信号（编辑、删除、相关仓库）传递给主组件  
  RelativeRepo.vue  
    在 GoalCard.vue 中调用，选择 相关仓库  
  RelativeTodo.vue
    在 GoalCard.vue 中调用，选择 相关待办  
Goal.vue
goalStore.ts
```

## 主题切换

### 四种实现方法

#### 在 :root 中定义主题变量，通过修改 document 控制生效的变量（CSS 变量 + data-theme 属性）

  ```
  //style.css
  :root[data-theme="dark"] {
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --surface-color: #1e1e1e;
  --border-color: rgba(255, 255, 255, 0.12);
  }

  //
  document.documentElement.setAttribute('data-theme', theme)

  优点：
  更好的性能，只需切换一个属性值
  更清晰的主题定义，所有样式集中在CSS文件中
  更容易调试和维护
  浏览器原生支持的主题切换方式
  支持热重载

  缺点：
  不能动态添加新的主题变量
  主题配置不够灵活
  不能在运行时修改具体的颜色值
  ```

#### 在 store.ts 中存储主题及其样式，在用函数将所有样式应用到 document 中（JavaScript 动态设置样式变量）  
 
  ```
  Object.entries(themeStyle).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value)
  })
  
  完全动态，可以在运行时修改任何颜色值
  可以动态添加新的主题
  主题配置更灵活
  可以保存用户自定义主题

  性能较差，需要设置多个样式属性
  可能造成样式闪烁
  调试相对困难
  主题定义分散在JS中
  ```

#### 直接在每个 vue 组件下面用变量使用 css（组件级别的样式变量）  

  ```
  组件级别的精细控制
  可以针对特定组件做特殊处理
  更容易实现组件级别的主题切换

  样式定义分散，难以统一管理
  代码重复，每个组件都需要定义主题相关样式
  维护成本高
  不利于全局主题统一
  ```

#### 使用 组件

#### 补充

可以结合第二种和第一种

```css
:root {
  /* 默认主题变量 */
  --bg-color: #ffffff;
  --text-color: #000000;
}

/* 预定义主题 */
:root[data-theme="dark"] {
  --bg-color: #121212;
  --text-color: #e0e0e0;
}
```

```ts
export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'system',
    customThemes: {} as Record<string, ThemeStyle>
  }),

  actions: {
    setTheme(theme: string) {
      // 设置预定义主题
      if (['light', 'dark', 'system'].includes(theme)) {
        document.documentElement.setAttribute('data-theme', theme);
      } 
      // 应用自定义主题
      else if (this.customThemes[theme]) {
        Object.entries(this.customThemes[theme]).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value);
        });
      }
      this.currentTheme = theme;
    },

    applyThemeSystem() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeMode = prefersDark ? 'dark' : 'light'
      this.applyTheme()
    },


  }
});
```

#### 本次实现方法

结合第三种和第四种

使用 vuetify 控制组件主题  
对于自定义的组件，在 组件中使用 vuetify 的变量方式接入 vuetify 中

##### vuetify theme 的属性


```
// dark
{
    "background": "#121212",
    "surface": "#212121",
    "surface-bright": "#ccbfd6",
    "surface-light": "#424242",
    "surface-variant": "#a3a3a3",
    "on-surface-variant": "#424242",
    "primary": "#2196F3",
    "primary-darken-1": "#277CC1",
    "secondary": "#424242",
    "secondary-darken-1": "#48A9A6",
    "error": "#FF5252",
    "info": "#2196F3",
    "success": "#4CAF50",
    "warning": "#FB8C00",
    "accent": "#FF4081",
    "custom-color": "#BB86FC",
    "sidebar-bg": "#1E1E1E",
    "toolbar-bg": "#2D2D2D",
    "on-background": "#fff",
    "on-surface": "#fff",
    "on-surface-bright": "#000",
    "on-surface-light": "#fff",
    "on-primary": "#fff",
    "on-primary-darken-1": "#fff",
    "on-secondary": "#fff",
    "on-secondary-darken-1": "#fff",
    "on-error": "#fff",
    "on-info": "#fff",
    "on-success": "#fff",
    "on-warning": "#fff",
    "on-accent": "#fff",
    "on-custom-color": "#fff",
    "on-sidebar-bg": "#fff",
    "on-toolbar-bg": "#fff"
}
    color-scheme: dark;
    --v-theme-background: 18,18,18;
    --v-theme-background-overlay-multiplier: 1;
    --v-theme-surface: 33,33,33;
    --v-theme-surface-overlay-multiplier: 1;
    --v-theme-surface-bright: 204,191,214;
    --v-theme-surface-bright-overlay-multiplier: 2;
    --v-theme-surface-light: 66,66,66;
    --v-theme-surface-light-overlay-multiplier: 1;
    --v-theme-surface-variant: 255,255,255;
    --v-theme-surface-variant-overlay-multiplier: 2;
    --v-theme-on-surface-variant: 255,255,255;
    --v-theme-primary: 33,150,243;
    --v-theme-primary-overlay-multiplier: 2;
    --v-theme-primary-darken-1: 39,124,193;
    --v-theme-primary-darken-1-overlay-multiplier: 2;
    --v-theme-secondary: 66,66,66;
    --v-theme-secondary-overlay-multiplier: 1;
    --v-theme-secondary-darken-1: 72,169,166;
    --v-theme-secondary-darken-1-overlay-multiplier: 2;
    --v-theme-error: 255,82,82;
    --v-theme-error-overlay-multiplier: 2;
    --v-theme-info: 33,150,243;
    --v-theme-info-overlay-multiplier: 2;
    --v-theme-success: 76,175,80;
    --v-theme-success-overlay-multiplier: 2;
    --v-theme-warning: 251,140,0;
    --v-theme-warning-overlay-multiplier: 2;
    --v-theme-accent: 255,64,129;
    --v-theme-accent-overlay-multiplier: 2;
    --v-theme-scrollbar-track: 204,191,214;
    --v-theme-scrollbar-track-overlay-multiplier: 2;
    --v-theme-scrollbar-thumb: 255,255,255;
    --v-theme-scrollbar-thumb-overlay-multiplier: 2;
    --v-theme-scrollbar-thumb-hover: 255,255,255;
    --v-theme-scrollbar-thumb-hover-overlay-multiplier: 2;
    --v-theme-on-background: 255,255,255;
    --v-theme-on-surface: 255,255,255;
    --v-theme-on-surface-bright: 0,0,0;
    --v-theme-on-surface-light: 255,255,255;
    --v-theme-on-primary: 255,255,255;
    --v-theme-on-primary-darken-1: 255,255,255;
    --v-theme-on-secondary: 255,255,255;
    --v-theme-on-secondary-darken-1: 255,255,255;
    --v-theme-on-error: 255,255,255;
    --v-theme-on-info: 255,255,255;
    --v-theme-on-success: 255,255,255;
    --v-theme-on-warning: 255,255,255;
    --v-theme-on-accent: 255,255,255;
    --v-theme-on-scrollbar-track: 0,0,0;
    --v-theme-on-scrollbar-thumb: 0,0,0;
    --v-theme-on-scrollbar-thumb-hover: 0,0,0;
    --v-border-color: 255, 255, 255;
    --v-border-opacity: 0.12;
    --v-high-emphasis-opacity: 1;
    --v-medium-emphasis-opacity: 0.7;
    --v-disabled-opacity: 0.5;
    --v-idle-opacity: 0.1;
    --v-hover-opacity: 0.04;
    --v-focus-opacity: 0.12;
    --v-selected-opacity: 0.08;
    --v-activated-opacity: 0.12;
    --v-pressed-opacity: 0.16;
    --v-dragged-opacity: 0.08;
    --v-theme-kbd: 33, 37, 41;
    --v-theme-on-kbd: 255, 255, 255;
    --v-theme-code: 52, 52, 52;
    --v-theme-on-code: 204, 204, 204;
// light
{
    "background": "#FFFFFF",
    "surface": "#FFFFFF",
    "surface-bright": "#FFFFFF",
    "surface-light": "#EEEEEE",
    "surface-variant": "#424242",
    "on-surface-variant": "#EEEEEE",
    "primary": "#1867C0",
    "primary-darken-1": "#1F5592",
    "secondary": "#5CBBF6",
    "secondary-darken-1": "#018786",
    "error": "#FF5252",
    "info": "#2196F3",
    "success": "#4CAF50",
    "warning": "#FFC107",
    "accent": "#4CAF50",
    "custom-color": "#FF00FF",
    "sidebar-bg": "#f5f5f5",
    "toolbar-bg": "#ffffff",
    "on-background": "#000",
    "on-surface": "#000",
    "on-surface-bright": "#000",
    "on-surface-light": "#000",
    "on-primary": "#fff",
    "on-primary-darken-1": "#fff",
    "on-secondary": "#000",
    "on-secondary-darken-1": "#fff",
    "on-error": "#fff",
    "on-info": "#fff",
    "on-success": "#fff",
    "on-warning": "#000",
    "on-accent": "#fff",
    "on-custom-color": "#fff",
    "on-sidebar-bg": "#000",
    "on-toolbar-bg": "#000"
}
```


### 主题设置模块

通过设置组件得到用户设置的 themeMode：string  
再使用 themeStore 来处理   

## 语言切换

vue-i18n@next



## 编辑器

### 布局

类似 vscode 布局

```
一、VS Code 布局结构解析

区域	功能描述
活动栏	左侧垂直图标栏（文件、搜索、Git、调试等入口），点击切换侧边栏内容
侧边栏	动态内容区（资源管理器、搜索、插件管理等），可折叠
编辑器区域	多标签页编辑器 + 主内容区
面板区域	底部或右侧区域（终端、输出、问题面板等），支持拖拽调整高度/宽度
状态栏	底部状态信息（Git 分支、编码格式、光标位置等）

二、技术选型

功能	推荐工具/库
布局框架	CSS Grid + Flexbox（原生实现）或 Splitpanes（拖拽分割）
状态管理	Pinia（Vue 3 官方推荐）
图标	Material Design Icons 或 Iconify
多标签页	自定义实现或 Vue Tabs
主题系统	CSS 变量 + 动态类名

三、项目结构与组件设计

src/
├── layouts/
│   └── VSCodeLayout.vue      # 整体布局容器
├── components/
│   ├── ActivityBar.vue       # 左侧活动栏（图标按钮）
│   ├── Sidebar.vue           # 侧边栏（动态内容）
│   ├── EditorTabs.vue        # 多标签页
│   ├── EditorArea.vue        # 编辑器主区域
│   ├── PanelTabs.vue         # 面板标签页（终端/输出）
│   ├── StatusBar.vue         # 底部状态栏
│   └── ResizeHandle.vue      # 拖拽分割条
├── stores/
│   └── layoutStore.ts        # 布局状态管理（侧边栏宽度、面板高度等）
└── styles/
    ├── themes/               # 主题变量
    └── layout.css            # 布局样式
```

### markdown 编辑器

- markdown-it  
    Markdown 解析  
- Monaco  
    编辑器核心  
- DOMPurify  
    安全渲染，防止 XSS 攻击

#### Monaco

https://wf0.github.io/

##### "monaco-editor": "^0.52.2"  

monaco 编辑器核心

##### "monaco-editor-vue3": "^0.1.10",

组件化 monaco 编辑器，方便在 vue 中使用  

##### "vite-plugin-monaco-editor": "^1.1.0",

方便 vite 配置 Monaco  

## 仓库

指定文件夹作为仓库来管理资源  

仓库用 路径 作为 id，

## 编辑器

### 布局

### 文件管理器

#### 如何将选中的仓库的路径传给文件管理器 

在 RepositoryStore 中添加获取方法  
利用 URL 与 title 有关来获取  
```ts
currentRepositoryPath: (state) => {
            const currentRepo = state.repositories.find(
                repo => repo.title === window.location.hash.split('/').pop()
            );
            return currentRepo?.path || '';
        }
```

### markdown 解析

### 

## goals

goals 和 文档编辑 切断，但保留联系，可以选择将 文档 与 goal 相绑定  
goal 属性

## quicklaunch

### 拖动添加快捷方式

#### 相关知识

##### 拖放事件处理事件

```
dragstart: 开始拖动
dragend: 拖动结束
dragover: 拖动经过
dragenter: 进入可放置区域
dragleave: 离开可放置区域
drop: 放置
```

## other

### 时间条组件

初始状态：
进度条宽度为100%
开始3秒倒计时

动画过程：
每50毫秒更新一次宽度
每次减少约1.67%的宽度
CSS transition 使变化平滑

结束条件：
宽度达到0%
或用户手动关闭通知

清理工作：
组件卸载时清理定时器
通知关闭时清理定时器

### confirm 组件

#### 实现方法

在事件中显示对话框，对话框按钮事件中处理对应事件  

在事件中显示对话框，根据对话框返回布尔值，事件中根据返回的布尔值处理事件

直接传入一个事件，根据对话框选项决定是否执行这个事件  

#### deepseek 最佳实践建议


1. 全局注册确认对话框
在 main.ts 中创建全局实例：
```ts
// 创建Vue插件
const ConfirmPlugin = {
  install(app) {
    app.component('GlobalConfirm', Confirm)
  }
}
app.use(ConfirmPlugin)

使用时直接调用：
<GlobalConfirm v-model:model-value="showConfirm" />
```

2. 组合式API封装
创建 useConfirmDialog 组合函数：

```ts
export function useConfirmDialog() {
  const isOpen = ref(false)
  const resolvePromise = ref<Function>()

  const open = () => {
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise.value = resolve
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    resolvePromise.value?.(true)
  }

  const handleCancel = () => {
    isOpen.value = false
    resolvePromise.value?.(false)
  }

  return { isOpen, open, handleConfirm, handleCancel }
}

使用方式：
<script setup>
const { isOpen, open, handleConfirm, handleCancel } = useConfirmDialog()

const deleteItem = async () => {
  const confirmed = await open()
  if (confirmed) {
    // 执行删除
  }
}
</script>
```

### Electron App 性能与稳定性开关说明

```ts
// 基础安全性和稳定性设置
app.commandLine.appendSwitch('no-sandbox');      // 禁用沙箱模式，不建议在生产环境使用
app.disableHardwareAcceleration();               // 禁用硬件加速，可能影响性能

// GPU相关设置
app.commandLine.appendSwitch('disable-gpu');     // 完全禁用GPU
app.commandLine.appendSwitch('disable-gpu-compositing');     // 禁用GPU合成
app.commandLine.appendSwitch('disable-gpu-rasterization');   // 禁用GPU光栅化
app.commandLine.appendSwitch('disable-software-rasterizer'); // 禁用软件光栅化

// 重复或不必要的设置
// app.commandLine.appendSwitch('--no-sandbox');    // 与 'no-sandbox' 重复
// app.commandLine.appendSwitch('disable-gpu-sandbox'); // 通常不需要
```

# 知识

## 监听器

```ts
export class ScheduleService {
    private listeners: Set<(data: { id: string, task: ScheduleTask }) => void> = new Set();

    constructor() {
        window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: { id: string, task: ScheduleTask }) => {
            this.notifyListeners(data);
        });
    }
    private notifyListeners(data: { id: string, task: ScheduleTask }) {
        this.listeners.forEach(listener => listener(data));
    }

    public onScheduleTriggered(callback: (data: { id: string, task: ScheduleTask }) => void) {
        this.listeners.add(callback);
        
        // 返回清理函数
        return () => {
            this.listeners.delete(callback);
        };
    }
    // // 监听定时任务触发
    // public onScheduleTriggered(callback: (data: { id: string, task: ScheduleTask }) => void) {
    //     window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: { id: string, task: ScheduleTask }) => callback(data));
    // }
}
```

## 项目结构

### 按文件类型分组（Type-Based）

```
结构示例：

src/
├── components/
├── views/
├── utils/
├── api/
├── store/
├── router/
└── assets/
优点：
简单直观：适合新手和小型项目，快速上手。

一致性高：所有组件、工具函数等按类型集中存放。

缺点：
耦合度高：功能相关的代码分散在不同目录，修改时需要跨目录操作。

难以扩展：随着项目规模增大，目录会变得臃肿。

适用场景：
小型项目（如个人博客、静态页面）。

快速原型开发。
```

### 按功能模块分组（Feature-Based）

```
结构示例：

src/
├── modules/
│   ├── User/
│   │   ├── components/
│   │   ├── store/
│   │   └── api/
│   ├── Product/
│   └── Order/
├── core/          # 全局共享代码
└── App.vue
优点：
高内聚低耦合：功能模块自包含所有代码（UI、状态、API）。

可维护性强：模块可独立开发、测试和复用。

适合团队协作：不同团队负责不同模块。

缺点：
初期复杂度高：需要设计模块边界和通信机制。

可能重复代码：不同模块间共享逻辑需抽离到 core/。

适用场景：
中大型应用（如 SaaS、ERP）。

长期迭代、多人协作项目。
```

### 领域驱动设计（DDD）

```
结构示例：

src/
├── domains/              # 领域层
│   ├── User/
│   │   ├── entities/     # 领域实体
│   │   ├── services/     # 领域服务
│   │   └── repositories/ # 数据仓库
│   └── Product/
├── infrastructure/       # 基础设施（API、数据库）
├── application/          # 应用服务（协调领域层）
└── presentation/         # UI 层（Vue 组件）
优点：
业务逻辑清晰：严格分层，核心业务与 UI/基础设施解耦。

高度可测试：领域层不依赖外部框架。

缺点：
过度设计：对简单项目来说过于复杂。

学习成本高：需理解 DDD 概念（实体、值对象、聚合根）。

适用场景：
复杂业务系统（如金融、电商平台）。

需要长期维护和演进的业务核心项目。
```

### Atomic Design（原子设计）

```
结构示例：
Copy
src/
├── atoms/        # 基础原子组件（按钮、输入框）
├── molecules/    # 分子组件（搜索框 = 输入框 + 按钮）
├── organisms/    # 有机体组件（导航栏、表单）
├── templates/    # 页面骨架
└── pages/        # 完整页面
优点：
UI 高度复用：从原子到页面逐级组合，减少重复代码。

设计一致性：强制遵循统一的 UI 规范。

缺点：
灵活性低：复杂业务组件可能难以归类。

不适合业务逻辑：仅解决 UI 分层，需结合其他结构管理状态和 API。

适用场景：
UI 密集型应用（如设计工具、门户网站）。

需要与设计团队紧密协作的项目。
```

### Monorepo（多包管理）

```
结构示例：
Copy
project/
├── apps/
│   ├── web/           # 主应用
│   └── electron/      # Electron 壳
├── packages/
│   ├── shared/        # 通用工具和类型
│   └── ui-kit/        # 独立 UI 组件库
└── package.json       # Workspace 配置
优点：
代码共享便捷：多个应用共享公共包。

依赖统一管理：避免版本冲突。

缺点：
构建复杂：需配置 Turborepo、Nx 等工具。

仓库体积大：所有代码集中在一个仓库。

适用场景：
多端应用（Web + Electron + Mobile）。

需要维护多个独立组件库或微前端模块。
```

### Electron 专属结构

```
结构示例：

src/
├── main/              # Electron 主进程
│   ├── ipc/
│   └── windows/
├── renderer/          # Vue 渲染进程
│   ├── modules/
│   └── core/
├── shared/            # 共享代码（类型、工具）
└── resources/         # 静态资源（图标、配置文件）
关键点：
进程隔离：严格分离主进程（Node.js）和渲染进程（Vue）。

IPC 规范化：通过预加载脚本安全通信。

适用场景：
跨平台桌面应用（如 IDE、数据管理工具）。
```

### 微前端架构

```
结构示例：
Copy
project/
├── app-shell/         # 基座应用（路由、全局状态）
├── app-dashboard/     # 子应用（独立仓库或模块）
└── app-admin/         # 子应用（可独立部署）
优点：
独立部署：子应用可单独开发、测试和上线。

技术栈无关：不同子应用可用不同框架。

缺点：
通信复杂：需处理跨应用状态共享和路由同步。

性能开销：资源重复加载。

适用场景：
巨型企业级应用（如阿里云控制台）。
ss
整合遗留系统。
```

## 接口导入方式

- 按需导入  
- 全部导入  

对于小型项目，两种方式差异不大。大型项目建议使用按需导入，有利于代码分割和tree-shaking。   

## 包

- 'fs/promises'
- path  
    Node.js 的一个核心模块，用于处理和转换文件路径。它提供了一组实用函数，帮助开发者在不同操作系统上处理文件路径时保持一致性。  
- shell

# 小问题

## 让 app （body） 右侧滚动条消失

在 html 中添加
```css
<style>
  body {
    /* Remove explicit overflow setting */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  
  /* 只添加下方代码正确生效，添加上方代码就仍会有滚动条 */
  body::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
</style>
```