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

- 用户管理  
  账户管理  
  数据管理 
- 知识仓库
  用于存储 markdown 文档  
  存储资源等的容器  
  可以创建 文档仓库、图片仓库  
  仓库的添加、修改、删除、展示
- 待办任务  
  任务的添加、修改、删除、展示  
  桌面弹窗提醒  
  任务留档  
- Markdown 编辑器  
  编辑功能  
  支持分屏、预览、窗口大小拖拽调整  
  实现可视化 git 功能  
- OKR目标管理  
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

把 todo 、文档编辑 作为组件，任由用户组合为 待办列表 或 goal 页面

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


## 语言切换

vue-i18n@next

## quicklaunch

使用了插件系统的方式添加该功能  

### 拖动添加快捷方式

#### 相关知识

##### 拖放事件处理事件

"vuedraggable": "^4.1.0"

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
