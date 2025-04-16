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

## 数据

目标数据  
任务数据  
知识库数据  

## 功能


- 知识仓库
  用于存储 markdown 文档  
  存储资源等的容器  
  可以创建 文档仓库、图片仓库  
  仓库的添加、修改、删除、展示
- 待办任务  
  todo 的添加、修改、删除、展示  
  桌面弹窗提醒  
  任务留档  
- Markdown 编辑器  
  编辑功能  
  支持分屏、预览、窗口大小拖拽调整  
  实现可视化 git 功能  
- 学习目标  
  管理目标  
- 提醒功能
  添加提醒事项  
  提醒事项管理  
  弹窗提醒  
- 快速启动器  
  alt + space 唤醒快速启动窗口，通过拖拽或文件选择的方式添加快捷方式  
  创建工具快捷方式  
  工具分类  
  工具删除  
- 应用设置  
  深色和浅色主题切换
  中英文切换  
  编辑器相关设置  
  开机自启动  
待实现
- 用户管理  
  账户管理  
  数据管理  
- 学习内容推荐
  关联目标  
  自定义推荐关键字  
  删除关联目标  
- b站等的订阅消息转发  
  在
- 收藏页面  
- RSS  
- 动作脚本  
- 知识分享平台  
  分享仓库文档  
  点赞  
  收藏  
  搜索知识  

# 具体实现

把 todo 、 文档编辑 作为组件，任由用户组合为 待办列表 或 goal 页面

用户可以单独编辑组件，在页面中组合

物理分割、逻辑组合

由事件驱动，把所有的 todo reminder 类型统一

## 任务

### 任务模板长什么样

title  
description？  
repeat
  不重复、重复（d、w、m）  
    不重复，只需要任务时间（有无具体HH：mm）
    重复，则需要  
      开始日期，结束日期  
      重复选择器（有无具体HH：mm）


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

利用 定时服务 和 弹窗服务 实现的一个自定义提醒组件


## 仓库

指定文件夹作为仓库来管理资源  

仓库用 路径 作为 id，

## todo

定义了 Todo 类型 和 TodoReminder 类



## goal

goals 和 文档编辑 切断，但保留联系，可以选择将 文档 与 goal 相绑定  
goal 属性

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

color: #c4c4c4;暗灰色
font: '#d4d4d4'
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
<!-- 面板区域	底部或右侧区域（终端、输出、问题面板等），支持拖拽调整高度/宽度 -->
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
│   ├── StatusBar.vue         # 底部状态栏
│   └── ResizeHandle.vue      # 拖拽分割条
├── stores/
│   └── layoutStore.ts        # 布局状态管理（侧边栏宽度、面板高度等）
└── styles/
    ├── themes/               # 主题变量
    └── layout.css            # 布局样式
```

每次打开时窗口大小不确定，调整区域使用 get
```ts
interface EditorLayoutState {
    activityBarWidth: number; //活动栏 固定
    sidebarWidth: number; //侧边栏 调整
    minSidebarWidth: number; //最小侧边栏 固定
    resizeHandleWidth: number; // resize条 固定
    minEditorWidth: number; //最小编辑器 固定
    editorTabWidth: number; //编辑器标签宽度 固定

    editorGroupsWidth: number; //编辑组区域 调整
}
```

每次打开编辑器时，初始化每个区域（editor-group）的长度  
然后监听窗口变化来修改每个区域的大小  

#### resize

```ts
import { debounce } from 'lodash-es'

// Debounced resize handler
const handleResize = debounce(() => {
    editorLayoutStore.updateTotalWidth(window.innerWidth)
}, 200) // 200ms delay
```

web 自带的 API 用于监听窗口
window.addEventListener('resize', handler)

### markdown 编辑器

#### 技术选择

- markdown-it  
    Markdown 解析  
- [Monaco](https://wf0.github.io/)  
    "monaco-editor": "^0.52.2" -monaco 编辑器核心  
    "monaco-editor-vue3": "^0.1.10" -组件化 monaco 编辑器，方便在 vue 中使用  
    "vite-plugin-monaco-editor": "^1.1.0" -方便 vite 配置 Monaco  
- DOMPurify  
    安全渲染，防止 XSS 攻击

#### monaco-editor-vue3 配置

// const editorOptions = {
//   minimap: { enabled: true },
//   wordWrap: 'on',
//   lineNumbers: 'on',
//   renderWhitespace: 'boundary',
//   scrollBeyondLastLine: false,
//   automaticLayout: true,
//   fontSize: 14,
//   padding: { top: 16 }
// }

#### Monaco Editor 实例的获取和使用

在组件中使用 @mounted 获取

```ts
// Monaco Editor 实例的常用方法和属性示例
const handleEditorDidMount = (instance: any) => {
  editor.value = instance;  // 保存编辑器实例
  
  // 常用方法示例
  instance.getValue();              // 获取编辑器内容
  instance.setValue('new content'); // 设置编辑器内容
  instance.getPosition();          // 获取当前光标位置
  instance.setPosition({           // 设置光标位置
    lineNumber: 1,
    column: 1
  });
  
  // 事件监听
  instance.onDidChangeModelContent(() => {
    // 内容变化时触发
  });
  
  instance.onDidChangeCursorPosition(() => {
    // 光标位置变化时触发
  });
  
  // 编辑操作
  instance.executeEdits('source', [{
    range: new monaco.Range(1, 1, 1, 1),
    text: 'inserted text'
  }]);
  
  // 获取选中内容
  const selection = instance.getSelection();
  const selectedText = instance.getModel()?.getValueInRange(selection);
}
```

### 粘贴图片 功能

- 直接将图片转化为 base64 嵌入代码中  
- 将图片保存到相应目录，通过链接显示  

#### 1.编辑器监听 paste 事件，当 paste 为图片时进行相应处理  
  `monacoEditor.value.onDidPaste` Monaco Editor 貌似有自带监听 paste 的方法  

##### 监听粘贴事件的方法

*使用 markRaw，告诉 Vue 不要将编辑器实例转换为响应式对象，否则执行 executeEdits 会卡住*

```ts
const handleEditorDidMount = (instance: any) => {
  editor.value = markRaw(instance)
  
  // 方法1: 使用 onDidPaste
  // Monaco Editor 的原生事件
  // 在粘贴完成后触发
  // 提供粘贴的文本内容
  // onDidPaste 返回的 e 对象好像没有粘贴的数据
  editor.value.onDidPaste((e: any) => {
    console.log('Paste event:', e)
    console.log('Pasted text:', e.text)
  })

  // 方法2: 使用 onKeyDown 监听粘贴快捷键
  // 可以捕获粘贴快捷键
  // 在粘贴发生前触发
  // 可以阻止默认行为
  editor.value.onKeyDown((e: any) => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 86) { // 86 是 'V' 键的keyCode
      console.log('Paste shortcut detected')
    }
  })

  // 方法3: 添加命令监听
  // 添加自定义命令
  // 可以绑定特定快捷键
  // 更灵活的控制
  editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
    console.log('Paste command triggered')
  })

  // 方法4: 使用事件监听器
  // DOM 原生事件
  // 可以访问完整的剪贴板数据
  // 可以处理多种格式（文本、HTML、图片等）
  const editorDomElement = editor.value.getDomNode()
  editorDomElement.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault() // 阻止默认粘贴行为
    
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    // 打印所有可用的格式
    console.log('Available formats:', clipboardData.types)

    // 获取文本内容
    if (clipboardData.types.includes('text/plain')) {
      const text = clipboardData.getData('text/plain')
      console.log('Plain text:', text)
    }

    // 获取HTML内容
    if (clipboardData.types.includes('text/html')) {
      const html = clipboardData.getData('text/html')
      console.log('HTML:', html)
    }

    // 处理图片
    const items = clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          console.log('Image:', {
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified)
          })
        }
      }
    }
  })
}
```

##### 控制台打印对象的方式

```ts
const handleEditorDidMount = (instance: any) => {
  editor.value = instance
  
  editor.value.onDidPaste(async (e: any) => {
    // 方法1: 使用 console.dir
    console.dir(e, { depth: null, colors: true })

    // 方法2: 使用 console.log 配合对象展开
    console.log('Paste event:', { ...e })

    // 方法3: 使用 JSON.stringify 美化输出
    console.log('Paste event:', JSON.stringify(e, null, 2))

    // 方法4: 使用对象解构来查看特定属性
    const { type, data, ...rest } = e
    console.log('Event details:', { type, data, rest })

    // 方法5: 使用 console.table 展示数组或对象数据
    console.table(e)
  })
}
```

### git 功能

child_rocess
git-essentials

#### simple-git

##### git.status

git.status() 返回的数据，来自 copilot
```ts
// Current branch information
  current: string             // Name of current branch (e.g., "main", "master")
  tracking: string           // Name of upstream branch being tracked (e.g., "origin/main")
  
  // Ahead/Behind information
  ahead: number             // Number of commits ahead of remote
  behind: number            // Number of commits behind remote
  
  // File status arrays
  staged: string[]          // Files staged for commit
  not_added: string[]       // Untracked files (files not yet added to git)
  created: string[]         // New files added to git but not committed
  modified: string[]        // Files that have been modified but not staged
  deleted: string[]         // Files that have been deleted but not staged
  renamed: string[]         // Files that have been renamed
  conflicted: string[]      // Files with merge conflicts
  
  // Detailed file status
  files: Array<{
    path: string           // File path
    index: string         // Status in index (staging area)
    working_dir: string   // Status in working directory
  }>
  
  // Helper methods
  isClean(): boolean      // Returns true if working directory is clean
  
  // Raw status data
  detached: boolean       // True if in detached HEAD state
  hash: string           // Current commit hash

files.index
' ' - Unmodified
'M' - Modified
'A' - Added
'D' - Deleted
'R' - Renamed
'C' - Copied
'U' - Updated but unmerged
'?' - Untracked
'!' - Ignored
```

##### git.log

把 git.log 里的参数都去除了，就能正常返回 log 记录  

```ts
// 使用示例
async getLog(): Promise<GitResponse> {
  if (!this.git) {
    return { success: false, error: 'Git not initialized' }
  }

  try {
    const logResult = await this.git.log([
      '--pretty=format:%H%n%an%n%ad%n%s%n%P',  // 添加父提交哈希
      '--date=iso',
      '--all',                                  // 显示所有分支
      '--graph',                                // 显示ASCII图形
      '-n',
      '50'
    ])

    const commits = logResult.all.map(commit => {
      const [hash, author_name, date, message, parents] = commit.hash.split('\n')
      return {
        hash,
        author_name,
        date,
        message,
        parents: parents ? parents.split(' ') : []  // 解析父提交
      }
    })

    return {
      success: true,
      data: { commits }
    }
  } catch (error) {
    console.error('Git log error:', error)
    return { 
      success: false, 
      error: 'Failed to get commit history' 
    }
  }
}
```
```
参数说明：  

--pretty=format:"%H|%an|%ad|%s"
%H: 完整的提交哈希值 (40个字符)
%an: 作者名字 (author name)
%ad: 作者提交日期 (author date)
%s: 提交信息的第一行 (subject)
|: 自定义分隔符，用于后续解析字符串

--date=iso
将日期格式化为 ISO 8601 格式
例如：2025-02-21 13:09:21 +0800
这种格式便于解析和处理

-n 50
限制返回的提交数量为最近的50条
这是为了性能考虑，避免在大型仓库中获取太多历史记录

其他：  
%h  - 简短的提交哈希值 (7个字符)
%cn - 提交者名字
%cd - 提交日期
%cr - 相对时间 (例如：2 days ago)
%d  - ref names (分支、标签等)
%b  - 提交信息主体
%e  - 编码
%P  - 父提交的哈希值
```

logResult 结果
```ts
Commits: {
  all: [
    {
      hash: '474c48c41373fb5252296380c34fb78af74a5f6f\n' +
        'BakerSean\n' +
        '2025-02-21 18:21:05 +0800\n' +
        '123\n' +
        '89c9cf7b15b18b3b9f9852927c356902fed07e96\n' +
        'BakerSean\n' +
        '2025-02-21 13:09:21 +0800\n' +
        '123',
      date: '',
      message: '',
      refs: '',
      body: '',
      author_name: '',
      author_email: ''
    }
  ],
  latest: {
    hash: '474c48c41373fb5252296380c34fb78af74a5f6f\n' +
      'BakerSean\n' +
      '2025-02-21 18:21:05 +0800\n' +
      '123\n' +
      '89c9cf7b15b18b3b9f9852927c356902fed07e96\n' +
      'BakerSean\n' +
      '2025-02-21 13:09:21 +0800\n' +
      '123',
    date: '',
    message: '',
    refs: '',
    body: '',
    author_name: '',
    author_email: ''
  },
  total: 1
}

Commits: {
  all: [
    {
      hash: '474c48c41373fb5252296380c34fb78af74a5f6f',
      date: '2025-02-21T18:21:05+08:00',
      message: '123',
      refs: 'HEAD -> master',
      body: '',
      author_name: 'BakerSean',
      author_email: 'bakersean@foxmail.com'
    },
    {
      hash: '89c9cf7b15b18b3b9f9852927c356902fed07e96',
      date: '2025-02-21T13:09:21+08:00',
      message: '123',
      refs: '',
      body: '',
      author_name: 'BakerSean',
      author_email: 'bakersean@foxmail.com'
    }
  ],
  latest: {
    hash: '474c48c41373fb5252296380c34fb78af74a5f6f',
    date: '2025-02-21T18:21:05+08:00',
    message: '123',
    refs: 'HEAD -> master',
    body: '',
    author_name: 'BakerSean',
    author_email: 'bakersean@foxmail.com'
  },
  total: 2
}
```

### Other

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

## quicklaunch

使用了插件系统的方式添加该功能  

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

// 使用时直接调用：
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

// 使用方式：
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

## API

### web API

#### clipboard API

##### 1.ClipboardEvent 接口

```ts
interface ClipboardEvent extends Event {
  readonly clipboardData: DataTransfer | null;
}
```

##### 2.DataTransfer 接口  

```ts
interface DataTransfer {
  // 获取剪贴板中的数据
  getData(format: string): string;
  
  // 设置数据到剪贴板
  setData(format: string, data: string): void;
  
  // 可用的数据格式列表
  readonly types: ReadonlyArray<string>;
  
  // 文件列表
  readonly files: FileList;
  
  // 剪贴板项目列表
  readonly items: DataTransferItemList;
}
```

##### 3.常见用法示例

基本文本操作
```ts
const handlePaste = (e: ClipboardEvent) => {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  // 获取纯文本
  const text = clipboardData.getData('text/plain');
  
  // 获取 HTML
  const html = clipboardData.getData('text/html');
  
  // 获取 URL
  const url = clipboardData.getData('text/uri-list');
}
```

处理图片
```ts
const handleImagePaste = (e: ClipboardEvent) => {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  for (const item of clipboardData.items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result as string;
          console.log('Image data:', imageDataUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  }
}
```

获取所有可用格式
```ts
const logClipboardFormats = (e: ClipboardEvent) => {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  console.group('Clipboard Content Types');
  clipboardData.types.forEach(type => {
    console.log(`${type}:`, clipboardData.getData(type));
  });
  console.groupEnd();
}
```

##### 4.现代 Clipboard API

```ts
// 异步 Clipboard API
const modernClipboardOps = {
  // 写入文本
  writeText: async (text: string) => {
    await navigator.clipboard.writeText(text);
  },
  
  // 读取文本
  readText: async () => {
    return await navigator.clipboard.readText();
  },
  
  // 读取所有内容（包括图片等）
  read: async () => {
    return await navigator.clipboard.read();
  }
};
```

##### 5.事件类型

```ts
// 剪贴板事件监听
element.addEventListener('copy', (e: ClipboardEvent) => {
  // 处理复制
});

element.addEventListener('cut', (e: ClipboardEvent) => {
  // 处理剪切
});

element.addEventListener('paste', (e: ClipboardEvent) => {
  // 处理粘贴
});
```

##### 6.安全注意事项

```ts
const secureClipboardAccess = async () => {
  try {
    // 检查权限
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName
    });

    if (permission.state === 'granted') {
      // 可以访问剪贴板
      const text = await navigator.clipboard.readText();
      return text;
    } else {
      throw new Error('No clipboard permission');
    }
  } catch (error) {
    console.error('Clipboard access error:', error);
    return null;
  }
};
```

## 语法

indexOf 数组方法，查找当前元素在数组中的下标  
splice(x, y, z) 下标，删除元素个数，添加的元素

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

不显示隐藏文件 && 为隐藏文件 跳过